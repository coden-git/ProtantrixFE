import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../styles/colorPallete';
import { Dropdown } from 'react-native-element-dropdown';

/**
 * PoTable - reusable table UI for PO items.
 * Props:
 *  - item: the PO item object (expects item.data similar to TableMeasurments)
 *  - onChange: function(updatedItem) called when data changes
 */
const PoTable = ({ item, onChange }) => {

    const isTable = true
    const tableData = item?.value
    const headers = isTable && Array.isArray(tableData.data) && tableData.data[0] ? tableData.data[0] : [];
    const templateRow = isTable && Array.isArray(tableData.data) && tableData.data[1] ? tableData.data[1] : [];

    const initialRows = isTable && Array.isArray(tableData.data) && tableData.data.length > 1
        ? tableData.data.slice(1).map((r) => r.map((c) => ({ ...c })))
        : [];

    const [rows, setRows] = useState(initialRows);


    const addRow = () => {
        if (!templateRow || !Array.isArray(templateRow)) return;
        const newRow = templateRow.map((cell) => ({ ...cell, value: cell.type === 'label' ? cell.value : '' }));
        const next = [...rows, newRow];
        setRows(next);
        onChange && onChange({ ...item, value: {...item.value, data:[headers, ...next]}});
    };

    const removeRow = (rowIndex) => {
        setRows((prev) => {
            const next = prev.map((r) => r.map((c) => ({ ...c }))).filter((_, i) => i !== rowIndex);
            onChange && onChange({ ...item, value: {...item.value, data:[headers, ...next]} });
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
            // next[rowIndex] = computeRow(next[rowIndex]);
            onChange && onChange({ ...item, value: {...item.value, data:[headers, ...next] }});
            return next;
        });
    };

    
    return (
        <View style={{ height: '100%' }}>
            <Text style={styles.label}>Name: {tableData.name}</Text>
            <Text style={styles.label}>UOM: {tableData.UOM}</Text>

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
                                    onChange={(item) => updateCell(ri, ci, item.value)}
                                />
                            )}
                        </View>
                    ))}
                </View>
            ))}

            {tableData.isMulti && (
                <Pressable style={styles.addRow} onPress={addRow}><Text style={{ color: colors.primary }}>Add row</Text></Pressable>
            )}
        </View>
    );
};

export default PoTable;

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
});
