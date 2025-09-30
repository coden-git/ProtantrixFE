import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Checkbox({ label, value = false, onClick }) {
  return (
    <Pressable onPress={() => onClick && onClick(!value)} style={styles.row}>
      <View style={styles.box}>
        {value ? <Ionicons name="checkmark" size={14} color="#000000" /> : null}
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  box: { width: 15, height: 15, borderRadius: 4, borderColor: '#027aaaff', borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 1 },
  label: { marginLeft: 10, fontSize: 16 },
});
