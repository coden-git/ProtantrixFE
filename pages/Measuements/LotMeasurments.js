import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import colors from "../../styles/colorPallete";
const LotMeasurment = ({setMeasurement, measurement}) => {
        const onChangeValue = (t) => {
            const cleaned = t.replace(/[^0-9.]/g, '');
            setMeasurement((m) => ({ ...m, value: cleaned }));
        };
        return (
            <View>
                <Text style={styles.label}>Unit of measurement (UOM):</Text>
                <Text style={styles.value}>{measurement.UOM}</Text>

                <Text style={[styles.label, { marginTop: 12 }]}>Value:</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(measurement.value)}
                    onChangeText={onChangeValue}
                    placeholder="Enter numeric value"
                />
            </View>
        );
    };

const styles = StyleSheet.create({
    input: { borderBottomWidth: 1, borderBottomColor: colors.lightGrey, borderRadius: 8, padding: 8, marginTop: 4 },

})    

export default LotMeasurment