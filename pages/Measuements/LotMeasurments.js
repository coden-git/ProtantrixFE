import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import colors from "../../styles/colorPallete";
const LotMeasurment = ({setMeasurement, measurement}) => {
        const onChangeValue = (t) => {
            const cleaned = t.replace(/[^0-9.]/g, '');
            setMeasurement((m) => ({ ...m, value: cleaned }));
        };
        const disabled = measurement && measurement.disabled === true;
        return (
            <View>
                <Text style={styles.label}>Unit of measurement (UOM):</Text>
                <Text style={styles.value}>{measurement.UOM}</Text>

                <Text style={[styles.label, { marginTop: 12 }]}>Value:</Text>
                <TextInput
                    style={[styles.input, disabled && styles.inputDisabled]}
                    keyboardType="numeric"
                    value={String(measurement.value)}
                    onChangeText={disabled ? null : onChangeValue}
                    placeholder="Enter numeric value"
                    editable={!disabled}
                />
            </View>
        );
    };

const styles = StyleSheet.create({
    input: { borderBottomWidth: 1, borderBottomColor: colors.lightGrey, borderRadius: 8, padding: 8, marginTop: 4 },
    inputDisabled: { backgroundColor: '#f5f5f5', color: colors.lightGrey },

})    

export default LotMeasurment