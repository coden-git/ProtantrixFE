import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import Header from '../../components/Header/header';
import colors from '../../styles/colorPallete';
import { useNavigation } from '@react-navigation/native';
import LotMeasurment from './LotMeasurments';
import TableMeasurment from './TableMeasurments';
import ActionModal from '../../components/ActionModal/ActionModal';

export default function Measurements({ route }) {
    const { measurement, onMeasurementChange } = route?.params;
    console.log('Measurements data:', JSON.stringify(measurement));
    const navigation = useNavigation();

    // If measurement type is LOT, show UOM, Name and numeric input for value
    const [measurementVal, setMeasurement] = useState(measurement);
    const [confirmVisible, setConfirmVisible] = useState(false);

    const renderMeasurementDetails = () => {
        if (!measurement) return null;
        if ((measurement.type || '').toUpperCase() === 'LOT') {
            return <LotMeasurment measurement={measurementVal} setMeasurement={setMeasurement}/>;
        }

        if ((measurement.type || '').toLowerCase() === 'table') {
           return <TableMeasurment measurement={measurementVal} setMeasurement={setMeasurement} />
        }
        return <Text style={styles.placeholder}>Measurement type not supported yet.</Text>

    }

    const onSave = () => {
        if (onMeasurementChange && typeof onMeasurementChange === 'function') {
            onMeasurementChange(measurementVal);
        }
        setConfirmVisible(false);
        navigation.goBack();
    }


    return (
        <View style={styles.container}>
            <Header title="Measurements" enableBackButton={true} />
            <View style={styles.body}>
                {!measurement && <Text style={styles.placeholder}>No measurement provided.</Text>}
                {measurement && renderMeasurementDetails()}
            </View>
            <View style={styles.footer}>
                <Pressable style={styles.saveButton} onPress={() => setConfirmVisible(true)}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
            </View>
            <ActionModal
                visible={confirmVisible}
                title="Save Measurement"
                message="Are you sure you want to save these measurement changes?"
                isCancel
                isConfirm
                confirmLabel="Save"
                cancelLabel="Cancel"
                onClose={() => setConfirmVisible(false)}
                onAction={(type) => { if (type === 'confirm') onSave(); }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.fullwhite, padding: 16 },
    body: { padding: 16 },
    placeholder: { color: colors.lightGrey },
    input: { borderBottomWidth: 1, borderBottomColor: colors.lightGrey, borderRadius: 8, padding: 8, marginTop: 4 },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.lighterGrey, backgroundColor: colors.fullwhite },
    saveButton: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: colors.fullwhite, fontWeight: '700', fontSize: 16 },
    tableRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
    tableCell: { minWidth: 120, paddingHorizontal: 8 },
    tableHeader: { fontWeight: '700' },
    inputSmall: { borderWidth: 1, borderColor: '#ddd', padding: 6, borderRadius: 6 },
    addRow: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: colors.primary, alignSelf: 'flex-start' },
});
