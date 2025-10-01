import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import Header from '../components/Header/header';
import {getDocumentAsync} from 'expo-document-picker';
import colors from '../styles/colorPallete';
import { FileUpload } from '../components';
import { useNavigation } from '@react-navigation/native';


export default function ActivityDocs({ route }) {
  const {uploads=[], onActivityChange} = route.params
  const navigation = useNavigation();

  // keep track of selected files per upload item
  const [selected, setSelected] = useState({});

  useEffect(() => {
    // reset selection when uploads change
    setSelected({});
  }, [uploads]);


  const pickFor = async (item, index) => {

    try {
      console.log(item)  
      const res = await getDocumentAsync({ type: '*/*', multiple: false });
      if (res.canceled) return;
      setSelected((s) => ({ ...s, [index]: res.assets[0] }));
    } catch (err) {
      console.warn('Document pick error', err);
      Alert.alert('Error', 'Could not pick document');
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.row}>
      <FileUpload
        onPick={() => pickFor(item, index)}
        value={item.value}
        selected={selected[index]}
        label={item.name}
      />
    </View>
  );

  const uploadAll = () => {
    const toUpload = uploads.map((it, idx) => ({
      ...it,
      value: selected[idx]?.name || it.value,
    }))

    onActivityChange(toUpload);
    navigation.goBack();
  };

  const noFileSelected = Object.keys(selected).length === 0;

  return (
    <View style={styles.container}>
      <Header title="Documents" enableBackButton={true} />
      <View style={styles.body}>
        {uploads.length === 0 ? (
          <Text style={styles.placeholder}>No upload items provided.</Text>
        ) : (
          <FlatList
            data={uploads}
            keyExtractor={(it, idx) => String(it.name || it.label || idx)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.fullwhite, marginVertical: 8 }} />}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.uploadAll, noFileSelected && styles.uploadAllDisabled]}
          onPress={uploadAll}
          disabled={noFileSelected}
        >
          <Text style={styles.uploadAllText}>Upload all</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fullwhite, padding: 16 },
  body: { padding: 16 },
  placeholder: { color: colors.lightGrey },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  label: { fontSize: 16, fontWeight: '400' },
  hint: { color: colors.lightGrey, marginTop: 4 },
  selected: { marginTop: 6, color: colors.lightGrey },
  button: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  buttonText: { color: colors.fullwhite, fontWeight: '600' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: colors.fullwhite },
  uploadAll: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  uploadAllText: { color: colors.fullwhite, fontWeight: '700', fontSize: 16 },
  uploadAllDisabled: { backgroundColor: colors.lighterGrey },
});
