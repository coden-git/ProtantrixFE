import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../styles/colorPallete';

export default function Checkbox({ label, value = false, onClick, disabled = false }) {
  return (
    <Pressable onPress={() => !disabled && onClick && onClick(!value)} style={[styles.row, disabled && styles.disabledRow]} disabled={disabled}>
      <View style={[styles.box, disabled && styles.disabledBox]}>
        {value ? <Ionicons name="checkmark" size={14} color={colors.b} /> : null}
      </View>
      {label ? <Text style={[styles.label, disabled && styles.disabledLabel]}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  box: { width: 15, height: 15, borderRadius: 4, borderColor: colors.primary, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 1 },
  label: { marginLeft: 10, fontSize: 16 },
  disabledRow: { opacity: 0.5 },
  disabledBox: { borderColor: colors.lighterGrey },
  disabledLabel: { color: colors.lightGrey },
});
