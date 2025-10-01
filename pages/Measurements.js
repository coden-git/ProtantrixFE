import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import Header from '../components/Header/header';
import colors from '../styles/colorPallete';
import { useNavigation } from '@react-navigation/native';

export default function Measurements({ route }) {
    const {measurement, onMeasurementChange} = route?.params;
    console.log('Measurements data:', measurement);
    const navigation = useNavigation();

    // If measurement type is LOT, show UOM, Name and numeric input for value
    const isLot = measurement && (measurement.type || '').toUpperCase() === 'LOT';
    const [measurementVal, setMeasurement] = useState(measurement);

    const renderMeasurementDetails = () => {
        if (isLot) {
            const onChangeValue = (t) => {
                const cleaned = t.replace(/[^0-9.]/g, '');
                setMeasurement((m) => ({ ...m, value: cleaned }));
            }
            return (
                <View>
                    <Text style={styles.label}>Unit of measurement (UOM):</Text>
                    <Text style={styles.value}>{measurement.UOM}</Text>

                    <Text style={[styles.label, { marginTop: 12 }]}>Value:</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={String(measurementVal.value)}
                        onChangeText={onChangeValue}
                        placeholder="Enter numeric value"
                    />
                </View>
            )
        }
        return <Text style={styles.placeholder}>Measurement type not supported yet.</Text>

    }

    const onSave = () => {
        if (onMeasurementChange && typeof onMeasurementChange === 'function') {
            onMeasurementChange(measurementVal);
        }
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
                <Pressable style={styles.saveButton} onPress={onSave}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
            </View>
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
});
