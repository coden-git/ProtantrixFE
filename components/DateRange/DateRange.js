import { useState } from "react";
import { Pressable, StyleSheet, View, Text, Platform } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from "../../styles/colorPallete";


/**
 * DateRangeInput: simple from/to date pickers.
 * Uses @react-native-community/datetimepicker.
 * value: { from: ISOstring | '', to: ISOstring | '' }
 * onChange: (newValue) => void
 */
const DateRange = ({ value, onChange, disabled = false }) => {
    const [showPicker, setShowPicker] = useState({ which: null });

    const show = (which) => setShowPicker({ which });
    const hide = () => setShowPicker({ which: null });

    const handleChange = (which, ev, selected) => {
        hide();
        if (ev.type === 'dismissed') return;
        const iso = selected ? selected.toISOString() : '';
        const next = { ...(value || { from: '', to: '' }) };
        if (which === 'from') next.from = iso;
        else next.to = iso;
        onChange && onChange(next);
    };

    const display = (iso) => {
        if (!iso) return 'Select';
        const d = new Date(iso);
        return d.toLocaleDateString();
    };

    return (
        <View style={{ flexDirection: 'row', paddingLeft: 10 }}>
                <Pressable style={[styles.dateBtn, disabled && styles.dateBtnDisabled]} onPress={() => !disabled && show('from')} disabled={disabled}>
                    <Text style={styles.dateBtnText}>From: {display(value?.from)}</Text>
                </Pressable>
                <Pressable style={[styles.dateBtn, disabled && styles.dateBtnDisabled]} onPress={() => !disabled && show('to')} disabled={disabled}>
                    <Text style={styles.dateBtnText}>To: {display(value?.to)}</Text>
                </Pressable>
            {showPicker.which && (
                <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                    onChange={(ev, selected) => handleChange(showPicker.which, ev, selected)}
                />
            )}
        </View>
    );
}

// date styles
const styles = StyleSheet.create({
    dateBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.offWhite },
    dateBtnText: { color: colors.fullBlack }
    ,dateBtnDisabled: { opacity: 0.5, borderColor: colors.lighterGrey }
});

export default DateRange;