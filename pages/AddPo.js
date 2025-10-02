import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import Header from '../components/Header/header';
import PoTable from '../components/PoTable/PoTable';
import colors from '../styles/colorPallete';
import { useNavigation } from '@react-navigation/native';

export default function AddPo({ route }) {
  const navigation = useNavigation();
  const {poValue, onPoChange} = route?.params || {};
  const [po, setPo] = useState(() => poValue.map((it) => ({ ...it })));

  const updateValue = (index, newVal) => {
    setPo((prev) => prev.map((it, i) => (i === index ? { ...it, value: Number(newVal) } : it)));
  };

  const save = () => {
    console.log('Saving PO values:', po);
    // if caller provided a callback, use it; otherwise goBack with data
    if (onPoChange) {
      onPoChange(po);
      navigation.goBack();
      return;
    }
    navigation.goBack();
  };

  const renderItem = ({ item, index }) => {
    if ((item?.value?.type || '').toLowerCase() === 'table') {
      return <PoTable item={item} onChange={(updated) => setPo((prev) => prev.map((p, i) => i === index ? updated : p))} />
    }

    return (
      <View style={styles.row}>
        <Text style={styles.label}>{item.label}</Text>
        <TextInput
          style={[styles.input, item.disabled && styles.inputDisabled]}
          keyboardType="numeric"
          value={String(item.value ?? '')}
          onChangeText={(t) => updateValue(index, t.replace(/[^0-9.]/g, ''))}
          editable={!item.disabled}
        />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Header title="Add PO" enableBackButton={true} />
      <View style={styles.body}>
        <FlatList
          data={po}
          keyExtractor={(it) => String(it.id ?? it.label)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.offWhite, marginVertical: 8 }} />}
        />
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.saveButton} onPress={save}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fullwhite, height:'100%' },
  body: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  label: { fontSize: 16, color: colors.fullBlack },
  input: { borderWidth: 1, borderColor: colors.lightGrey, padding: 8, borderRadius: 6, width: 120, textAlign: 'right' },
  inputDisabled: { backgroundColor: '#f5f5f5', borderColor: colors.offWhite, color: colors.lightGrey },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.offWhite, backgroundColor: colors.fullwhite },
  saveButton: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveText: { color: colors.fullwhite, fontWeight: '700' },
  placeholder: { color: colors.lightGrey },
});
