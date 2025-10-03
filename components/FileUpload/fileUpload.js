import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, ActivityIndicator, Alert, Platform } from "react-native";
import colors from "../../styles/colorPallete";

// Native modules
// Use the legacy API because downloadAsync is deprecated in the new File/Directory API.
// See: https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import { Linking } from 'react-native';
import { BACKEND_URL } from "../../config";


const FileUpload = ({onPick, value, selected, label}) => {
  const [loading, setLoading] = useState(false);

  const onViewFile = async () => {
    try {
      if (!value) return;
      setLoading(true);

      // `value` is expected to be a path within the bucket (e.g. 'protantrix/activities/myfile.pdf')
      // Build request to backend to get presigned URL.
      // Use app-specific base URL; fallback to localhost path used in development.
      const encodedPath = encodeURIComponent(value);
      const downloadUrl = `${BACKEND_URL}/v1/project/download/${encodedPath}`;

      const resp = await axios.get(downloadUrl);
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
          <Pressable style={styles.button} onPress={onViewFile} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.fullwhite} /> : <Text style={styles.buttonText}>View file</Text>}
          </Pressable>
          )}
        </View>
  )
}

export default FileUpload;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '400' },
  hint: { color: colors.lightGrey, marginTop: 4 },  
  selected: { marginTop: 6, color: colors.lightGrey },
  button: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  buttonText: { color: colors.fullwhite, fontWeight: '600' },
})


