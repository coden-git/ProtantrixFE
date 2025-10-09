import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import Header from '../components/Header/header';
import { getDocumentAsync } from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../api/client';
import colors from '../styles/colorPallete';
import { FileUpload } from '../components';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import ActionModal from '../components/ActionModal/ActionModal';
import { MAX_FILE_SIZE, mimeTypes } from '../utils';


export default function ActivityDocs({ route }) {
  const { uploads = [], onActivityChange } = route.params
  const navigation = useNavigation();
  const auth = React.useContext(AuthContext);


  // keep track of selected files per upload item
  const [selected, setSelected] = useState({});
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    // reset selection when uploads change
    const data = {}
    uploads.forEach((ele, index)=> (data[index] = {...ele}))
    setSelected(data);
  }, [uploads]);



  const pickFor = async (item, index) => {
    try {
      const res = await getDocumentAsync({ type: item?.mimeTypes || mimeTypes, multiple: false, copyToCacheDirectory: true });
      if (res.canceled) return;
      const file = res.assets && res.assets[0];
      if (!file) return;
      let size = file.size;
      if (size == null) {
        try {
          const info = await FileSystem.getInfoAsync(file.uri);
            if (info?.exists && typeof info.size === 'number') size = info.size;
        } catch (e) {
          // silent fallback
        }
      }
      if (typeof size === 'number' && size > MAX_FILE_SIZE) {
        Alert.alert('File Too Large', 'Maximum allowed size is 10 MB. Please choose a smaller file.');
        return;
      }
      setSelected((s) => ({ ...s, [index]: file }));
    } catch (err) {
      console.warn('Document pick error', err);
      Alert.alert('Error', 'Could not pick document');
    }
  };

  const onDelete = (index) => {
    const result = [...uploads];
    if (result[index]) {
      result[index].value = null;
      setSelected((s) => ({ ...s, [index]: { ...result[index] } }));
      onActivityChange && onActivityChange(result);
    }
  }

  const renderItem = ({ item, index }) => (
    <View style={styles.row}>
      <FileUpload
        onPick={() => pickFor(item, index)}
        value={item.value}
        selected={item.value? '' : selected[index]}
        label={item.name}
        showDelete={true}
        onDeleted={()=> onDelete(index)}
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
        const file = selected[i];
        if (file?.value) {
          results.push({ ...file });
          continue;
        }
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || file.type || 'application/octet-stream',
          name: `file-${Date.now()}-${file.name}`,
        });
        formData.append('path', 'activities');
        try {
          const resp = await api.post('/project/upload-form', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
          });
          if (resp && resp.data && resp.data.ok) {
            results.push({ ...uploads[i], value: resp?.data?.result });
          }
        } catch (err) {
          console.warn('Upload error', err);
        }
      }
      onActivityChange && onActivityChange(results);
      navigation.goBack();
    } catch (err) {
      console.warn('uploadAll error', err);
      Alert.alert('Upload failed', 'Could not upload files');
    } finally {
      setUploading(false);
      setConfirmVisible(false);
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
          onPress={() => setConfirmVisible(true)}
          disabled={noFileSelected || uploading}
        >
          {uploading ? <Text style={styles.uploadAllText}>Preparing...</Text> : <Text style={styles.uploadAllText}>Update</Text>}
        </Pressable>
      </View>
      <ActionModal
        visible={confirmVisible}
        title="Upload Documents"
        message="Proceed with uploading all selected documents?"
        isCancel
        isConfirm
        confirmLabel="Upload"
        cancelLabel="Cancel"
        onClose={() => setConfirmVisible(false)}
        onAction={(type) => { if (type === 'confirm') uploadAll(); }}
      />
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
