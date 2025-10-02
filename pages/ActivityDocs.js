import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import Header from '../components/Header/header';
import { getDocumentAsync } from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { Platform } from 'react-native';
import colors from '../styles/colorPallete';
import { FileUpload } from '../components';
import { useNavigation } from '@react-navigation/native';


export default function ActivityDocs({ route }) {
  const { uploads = [], onActivityChange } = route.params
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
      console.log(res, 'uploadres')
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

  const uploadAll = async () => {
    if (Object.keys(selected).length === 0) return;
    setUploading(true);
    const results = [];
    try {
      const keys = Object.keys(selected);

      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const file = selected[k];
        if (!file) continue;

        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || file.type || 'application/octet-stream',
          name: `file-${Date.now()}-${file.name}`,
        });
        formData.append('path', 'activities');

        try {
          const resp = await axios.post(`https://437bc430c7be.ngrok-free.app/api/v1/project/upload-form`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
          });
          if (resp && resp.data && resp.data.ok) {
            results.push({  file: file.name, result: resp.data?.result});
          } else {
            results.push({ file: file.name, error: (resp && resp.data && resp.data.error) || 'upload-failed' });
          }
        } catch (err) {
          console.warn('Upload error', err);
          results.push({ index: k, file: file.name, error: String(err && err.message ? err.message : err) });
        }
      }

      const toUpload = uploads.map((it, idx) => ({
      ...it,
      value: results[idx]?.result
    }))

      console.log(JSON.stringify(toUpload), 'api')

      // notify parent about upload results
      onActivityChange && onActivityChange(toUpload);
      navigation.goBack();
    } catch (err) {
      console.warn('uploadAll error', err);
      Alert.alert('Upload failed', 'Could not upload files');
    } finally {
      setUploading(false);
    }
  };

  const noFileSelected = Object.keys(selected).length === 0;
  const [uploading, setUploading] = useState(false);

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
          style={[styles.uploadAll, (noFileSelected || uploading) && styles.uploadAllDisabled]}
          onPress={uploadAll}
          disabled={noFileSelected || uploading}
        >
          {uploading ? <Text style={styles.uploadAllText}>Preparing...</Text> : <Text style={styles.uploadAllText}>Upload all</Text>}
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
