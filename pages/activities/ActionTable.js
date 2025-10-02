import React, { use, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import colors from "../../styles/colorPallete";
import { Dropdown } from "react-native-element-dropdown";
import { FileUpload, Header } from "../../components";
import { getDocumentAsync } from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import axios from 'axios'

const ActionTable = ({ route }) => {
    const { item, updateActivity } = route.params || {};
    const [images, setImages] = useState([[]]);
    const navigation = useNavigation();

    // Helpers for table type
    const isTable = (item && (item.type || '').toLowerCase() === 'table');
    const headers = isTable && Array.isArray(item.value) && item.value[0] ? item.value[0] : [];
    const templateRow = isTable && Array.isArray(item.value) && item.value[1] ? item.value[1] : [];

    // initialize rows: if item.value has more than 2 rows, use those (excluding header)
    const initialRows = isTable && Array.isArray(item.value) && item.value.length > 1
        ? item.value.slice(1).map((r) => r.map((c) => ({ ...c })))
        : [];



    const [rows, setRows] = useState(initialRows);

    const addRow = () => {
        if (!templateRow || !Array.isArray(templateRow)) return;
        // create a fresh row based on template (clear values for inputs)
        const newRow = templateRow.map((cell) => ({ ...cell, value: cell.type === 'label' ? cell.value : '' }));
        setRows((r) => [...r, newRow]);
    };

    const removeRow = (rowIndex) => {
        setRows((prev) => {
            const next = prev.map((r) => r.map((c) => ({ ...c }))).filter((_, i) => i !== rowIndex);
            // update item data accordingly
            return next;
        });
    };

    const updateCell = (rowIndex, colIndex, newValue) => {
        setRows((prev) => {
            const next = prev.map((r) => r.map((c) => ({ ...c })));
            const cell = next[rowIndex][colIndex];
            if (!cell) return prev;
            if (cell.type === 'number') {
                cell.value = String(newValue).replace(/[^0-9.]/g, '');
            } else {
                cell.value = newValue;
            }
            return next;
        });
    };

    const pickFor = async (rowIndex, colIndex, item) => {

        try {
            const res = await getDocumentAsync({ type: '*/*', multiple: false });
            if (res.canceled) return;
            setImages((imgs) => {
                const next = imgs.map((r) => r.map((c) => c)).filter((_, i) => i !== rowIndex);
                if (!next[rowIndex]) next[rowIndex] = [];
                next[rowIndex][colIndex] = res.assets[0];
                return next;
            });
        } catch (err) {
            console.warn('Document pick error', err);
            Alert.alert('Error', 'Could not pick document');
        }
    };

    const [saving, setSaving] = useState(false);

    const onSave = async () => {
        // Merge images into rows: images is expected to be images[rowIndex][colIndex]
        setSaving(true);
        try {
            const next = rows.map((r) => r.map((c) => ({ ...c })));
            // iterate images and copy into corresponding cell.value
            for (let r = 0; r < images.length; r++) {
                const imgRow = images[r] || [];
                for (let c = 0; c < imgRow.length; c++) {
                    const img = imgRow[c];
                    if (!img) continue;

                    const formData = new FormData();
                    formData.append('file', {
                        uri: img.uri,
                        type: img.mimeType || 'application/octet-stream',
                        name: `file-${Date.now()}-${img.name}`,
                    });
                    formData.append('path', 'activities');
                    const resp = await axios.post(`https://437bc430c7be.ngrok-free.app/api/v1/project/upload-form`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        timeout: 60000,
                    });

                    next[r][c].value = resp?.data?.result

                }
            }


            console.log('Saving table data', next)
            updateActivity([headers, ...next]);
            navigation.goBack();
        } catch (err) {
            console.warn('onSave error', err);
            Alert.alert('Save failed', 'An error occurred while saving the table.');
        } finally {
            setSaving(false);
        }

    }



    console.log('rows=', JSON.stringify(rows))


    return (
        <View style={styles.container}>
            <Header title={item?.name} enableBackButton={true} />
            <ScrollView style={{ height: '80%' }}>

                {/* Card-style rows for better UX */}
                {rows.map((row, ri) => (
                    <View key={ri} style={styles.card}>
                        <Text style={styles.cardTitle}>Row {ri + 1}</Text>
                        {ri !== 0 && <Pressable onPress={() => removeRow(ri)} style={styles.deleteBtn}>
                            <Ionicons name="trash-outline" size={18} color={colors.red} />
                        </Pressable>}
                        {row.map((cell, ci) => (
                            <View key={ci} style={styles.cardRow}>
                                <Text style={styles.cardLabel}>{headers[ci]?.value || `Col ${ci + 1}`}</Text>
                                {cell.type === 'label' && <Text style={styles.cardValue}>{cell.value}</Text>}
                                {cell.type === 'text' && (
                                    <TextInput value={cell.value} onChangeText={(t) => updateCell(ri, ci, t)} style={styles.inputSmall} />
                                )}
                                {cell.type === 'number' && (
                                    <TextInput value={String(cell.value || '')} onChangeText={(t) => updateCell(ri, ci, t)} keyboardType="numeric" style={styles.inputSmall} />
                                )}
                                {cell.type === 'dropdown' && (
                                    <Dropdown
                                        style={styles.dropdown}
                                        data={cell?.options}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Select"
                                        value={cell.value}
                                        renderItem={(opt) => (
                                            <View style={styles.itemContainer}>
                                                <Text style={styles.itemLabel}>{opt.label}</Text>
                                                {opt.meta ? <Text style={styles.itemMeta}>{opt.meta}</Text> : null}
                                            </View>
                                        )}
                                        onChange={(item) => updateCell(ri, ci, item.value)}
                                    />
                                )}
                                {cell.type === 'image' && (
                                    <FileUpload
                                        onPick={() => pickFor(ri, ci, cell)}
                                        value={cell.value}
                                        selected={images[ri] ? images[ri][ci] : null}
                                    />
                                )}

                            </View>
                        ))}
                    </View>
                ))}

                {item.isMulti && (
                    <Pressable style={styles.addRow} onPress={addRow}><Text style={{ color: colors.primary }}>Add row</Text></Pressable>
                )}

            </ScrollView>
            <View style={styles.footer}>
                <Pressable style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={onSave} disabled={saving}>
                    {saving ? <ActivityIndicator color={colors.fullwhite} /> : <Text style={styles.saveButtonText}>Save</Text>}
                </Pressable>
            </View>
        </View>
    )
}

export default ActionTable;


const styles = StyleSheet.create({
    tableRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
    tableCell: { minWidth: 120, paddingHorizontal: 8 },
    tableHeader: { fontWeight: '700' },
    inputSmall: { borderWidth: 1, borderColor: '#ddd', padding: 6, borderRadius: 6 },
    addRow: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: colors.primary, alignSelf: 'flex-start' },

    /* Card styles for row presentation */
    card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginVertical: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#eee' },
    cardTitle: { fontWeight: '700', marginBottom: 8 },
    cardRow: { marginBottom: 8 },
    cardLabel: { color: '#555', marginBottom: 4 },
    cardValue: { fontSize: 16, color: '#111' },
    deleteBtn: { position: 'absolute', right: 8, top: 8, padding: 6 },
    dropdown: {
        height: 50,
        borderColor: "gray",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.lighterGrey, backgroundColor: colors.fullwhite },

    itemContainer: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.offWhite },
    itemLabel: { fontSize: 16, color: colors.fullBlack },
    itemMeta: { fontSize: 12, color: colors.lightGrey, marginTop: 4 },
    container: { flex: 1, padding: 16, backgroundColor: colors.fullwhite },
    title: { fontSize: 22, fontWeight: '700' },
    saveButton: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: colors.fullwhite, fontWeight: '700', fontSize: 16 },
    saveButtonDisabled: { backgroundColor: colors.lighterGrey },
});
