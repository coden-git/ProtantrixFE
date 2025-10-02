import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import colors from "../../styles/colorPallete";
import { Dropdown } from "react-native-element-dropdown";

const TableMeasurment = ({ measurement, setMeasurement }) => {

    // Helpers for table type
    const isTable = (measurement && (measurement.type || '').toLowerCase() === 'table');
    const headers = isTable && Array.isArray(measurement.data) && measurement.data[0] ? measurement.data[0] : [];
    const templateRow = isTable && Array.isArray(measurement.data) && measurement.data[1] ? measurement.data[1] : [];

    // initialize rows: if measurement.data has more than 2 rows, use those (excluding header)
    const initialRows = isTable && Array.isArray(measurement.data) && measurement.data.length > 1
        ? measurement.data.slice(1).map((r) => r.map((c) => ({ ...c })))
        : [];

    const computeType = templateRow.find((c) => c.type === 'label' && c.formula === '*')?.computeType

    console.log('table=init', computeType)

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
            // update measurement data accordingly
            setMeasurement((m) => ({ ...m, data: [headers, ...next] }));
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
            // recompute computed cells in this row (if any)
            next[rowIndex] = computeRow(next[rowIndex]);
            // also update measurementVal.data representation
            setMeasurement((m) => ({ ...m, data: [headers, ...next] }));
            return next;
        });
    };

    const computeRow = (row) => {
        // look for any cell that is label with formula '*', treat as compute = product of numeric cells
        const numericValues = row.map((c) => {
            if (['dropdown', 'number'].includes(c.type) && c.value && !isNaN(Number(c.value))) {
                return Number(c.value);
            }
        });


        return row.map((c) => {
            if (c.type === 'label' && c.formula === '*') {
                const val = numericValues.filter((n) => !isNaN(n)).reduce((a, b) => a * b, 1);
                return { ...c, value: isFinite(val) ? String(val) : '' };
            }
            return c;
        });
    };

    // derived final total if measurement.finalTotal === 'total' then sum computed column values
    const finalTotal = useMemo(() => {
        if (measurement.finalTotal === 'total') {
            // sum last column values where label formula '*' or numeric
            return rows.reduce((acc, row) => {
                // try to find a computed cell
                const computed = row.find((c) => c.type === 'label' && c.formula === '*');
                if (computed && computed.value) return acc + Number(computed.value);
                // or last numeric
                const nums = row.filter((c) => c.type === 'number').map((c) => Number(c.value || 0));
                if (nums.length > 0) {
                    const val = nums.reduce((a, b) => a * b, 1);
                    return acc + val;
                }
                return acc;
            }, 0);
        }

        if (measurement.finalTotal === 'name') {
            // sum last column values where label formula '*' or numeric\
            console.log(JSON.stringify(rows[0]), 'here')
            return rows.reduce((acc, row) => {
                // try to find a computed cell
                const computed = row.find((c) => c.type === 'label' && c.formula === '*');
                
                if (acc[row[0]?.value]){
                    acc[row[0]?.value] = acc[row[0]?.value] + Number(computed.value)
                }else{
                    acc[row[0]?.value] = Number(computed.value)
                }
                return acc
            }, {});
        }
    }, [rows, measurement]);

    console.log('table=rows', JSON.stringify(finalTotal))
    return (
        <ScrollView style={{ height: '80%' }}>
            <Text style={styles.label}>Name: {measurement.name}</Text>
            <Text style={styles.label}>UOM: {measurement.UOM}</Text>

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
                                    onChange={(item) => updateCell(ri, ci, item.value)}
                                />
                            )}
                        </View>
                    ))}
                </View>
            ))}

            {measurement.isMulti && (
                <Pressable style={styles.addRow} onPress={addRow}><Text style={{ color: colors.primary }}>Add row</Text></Pressable>
            )}

            {measurement.finalTotal === 'total' && (
                <View style={{ marginTop: 12 }}><Text style={styles.label}>Final total: {finalTotal}</Text></View>
            )}
            {measurement.finalTotal === 'name' && (
                <View style={{ marginTop: 12 }}><Text style={styles.label}>Final total: {JSON.stringify(finalTotal)}</Text></View>
            )}
        </ScrollView>
    )
}

export default TableMeasurment;


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
