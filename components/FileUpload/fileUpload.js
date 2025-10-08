import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, ActivityIndicator, Alert, Platform } from "react-native";
import colors from "../../styles/colorPallete";
import { Ionicons } from '@expo/vector-icons';
import ActionModal from '../ActionModal/ActionModal';

// Native modules
// Use the legacy API because downloadAsync is deprecated in the new File/Directory API.
// See: https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api from '../../api/client';
import { Linking } from 'react-native';
import { BACKEND_URL } from "../../config";
import { AuthContext } from '../../context/AuthContext';


const FileUpload = ({onPick, value, selected, label, onDeleted, showDelete}) => {
  const [loading, setLoading] = useState(false);
  const auth = React.useContext(AuthContext);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const onViewFile = async () => {
    try {
      if (!value) return;
      setLoading(true);

      // `value` is expected to be a path within the bucket (e.g. 'protantrix/activities/myfile.pdf')
      // Build request to backend to get presigned URL.
      // Use app-specific base URL; fallback to localhost path used in development.
      const encodedPath = encodeURIComponent(value);
      const downloadUrl = `${BACKEND_URL}/v1/project/download/${encodedPath}`;

  const resp = await api.get(`/project/download/${encodedPath}`);
      if (!resp || !resp.data || !resp.data.url) {
        throw new Error('No download URL returned');
      }

      const presigned = resp.data.url;

      console.log(presigned, 'presigned url')

      // Download to cache
      const fileName = value.split('/').pop() || `downloaded_${Date.now()}`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      const downloadRes = await FileSystem.downloadAsync(presigned, fileUri);

      // Try to open with Sharing (supported on mobile)
      if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        // Fallback: open URL with Linking (may open in browser)
        await Linking.openURL(downloadRes.uri);
      }

    } catch (err) {
      console.error('onViewFile error', err);
      Alert.alert('Unable to open file', err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!value) { setShowDeleteModal(false); return; }
    try {
      setDeleteLoading(true);
      const encoded = encodeURIComponent(value);
      const resp = await api.delete(`/project/delete/${encoded}`);
      if (!resp?.data?.ok) {
        throw new Error(resp?.data?.error || 'Delete failed');
      }
      setShowDeleteModal(false);
      if (typeof onDeleted === 'function') {
        onDeleted(value);
      }
    } catch (err) {
      console.error('delete file error', err);
      Alert.alert('Delete Failed', err.message || String(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {selected && <Text style={styles.selected}>Selected: {selected.name || selected.uri}</Text>}
      </View>
      {!value && (
        <Pressable style={styles.button} onPress={onPick}>
          <Text style={styles.buttonText}>Choose file</Text>
        </Pressable>
      )}
      {value && (
        <View style={styles.actionsWrap}>
          <Pressable style={styles.button} onPress={onViewFile} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.fullwhite} /> : <Text style={styles.buttonText}>View file</Text>}
          </Pressable>
          {auth?.user?.role === 'admin' && showDelete && (
            <Pressable
              style={[styles.iconBtn, (loading || deleteLoading) && styles.iconBtnDisabled]}
              onPress={() => !(loading || deleteLoading) && setShowDeleteModal(true)}
              disabled={loading || deleteLoading}
              accessibilityLabel="Delete file"
            >
              {deleteLoading ? <ActivityIndicator size={16} color={colors.fullwhite} /> : <Ionicons name="trash" size={18} color={colors.fullwhite} />}
            </Pressable>
          )}
        </View>
      )}
      <ActionModal
        visible={showDeleteModal}
        title="Delete File"
        message={deleteLoading ? 'Deleting file...' : 'Are you sure you want to delete this file?'}
        isCancel
        isDelete
        deleteLabel={deleteLoading ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        onClose={() => { if (!deleteLoading) setShowDeleteModal(false); }}
        onAction={(type) => { if (type === 'delete' && !deleteLoading) handleDeleteConfirmed(); }}
      />
    </View>
  );
}

export default FileUpload;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '400' },
  hint: { color: colors.lightGrey, marginTop: 4 },  
  selected: { marginTop: 6, color: colors.lightGrey },
  button: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  buttonText: { color: colors.fullwhite, fontWeight: '600' },
  actionsWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { marginLeft: 8, backgroundColor: colors.red, padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  iconBtnDisabled: { opacity: 0.6 },
})


