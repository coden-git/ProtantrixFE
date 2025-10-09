import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../styles/colorPallete';
import { getDocumentAsync } from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { MAX_FILE_SIZE, mimeTypes } from '../../utils';
import api from '../../api/client';
import { Linking } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

// Node shape:
// { name: string, type: 'folder'|'file', children?: Node[], value?: string }

export default function FolderTree({
  data,
  onChange,
  basePath = 'projects/general/docs',
  initialExpanded = true,
}) {
  const auth = React.useContext(AuthContext);
  const isAdmin = auth?.user?.role === 'admin';
  const [expanded, setExpanded] = useState(() => new Set(initialExpanded ? [''] : [])); // '' represents root
  const [creatingAt, setCreatingAt] = useState(null); // path string where we are creating a folder
  const [newFolderName, setNewFolderName] = useState('');
  const [busyPath, setBusyPath] = useState(null); // path busy for upload/view
  const [deleteBusy, setDeleteBusy] = useState(null); // file value busy for deletion

  // Helpers
  const joinPath = (parts) => parts.filter(Boolean).join('/');

  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  const ensureFolderChildren = (node) => {
    if (!Array.isArray(node.children)) node.children = [];
    return node;
  };

  const addFolderAt = (tree, pathArr, folderName) => {
    if (pathArr.length === 0) {
      const copy = clone(tree);
      copy.push({ name: folderName, type: 'folder', children: [] });
      return copy;
    }
    const copy = clone(tree);
    let ptr = copy;
    for (let i = 0; i < pathArr.length; i++) {
      const seg = pathArr[i];
      const idx = ptr.findIndex(n => n.type === 'folder' && n.name === seg);
      if (idx === -1) throw new Error('Path not found: ' + pathArr.join('/'));
      ptr[idx] = ensureFolderChildren(ptr[idx]);
      if (i === pathArr.length - 1) {
        ptr[idx].children.push({ name: folderName, type: 'folder', children: [] });
      } else {
        ptr = ptr[idx].children;
      }
    }
    return copy;
  };

  const addFilesAt = (tree, pathArr, files) => {
    const copy = clone(tree);
    if (pathArr.length === 0) {
      for (const f of files) copy.push({ name: f.name, type: 'file', value: f.value });
      return copy;
    }
    let ptr = copy;
    for (let i = 0; i < pathArr.length; i++) {
      const seg = pathArr[i];
      const idx = ptr.findIndex(n => n.type === 'folder' && n.name === seg);
      if (idx === -1) throw new Error('Path not found: ' + pathArr.join('/'));
      ptr[idx] = ensureFolderChildren(ptr[idx]);
      if (i === pathArr.length - 1) {
        for (const f of files) ptr[idx].children.push({ name: f.name, type: 'file', value: f.value });
      } else {
        ptr = ptr[idx].children;
      }
    }
    return copy;
  };

  const removeFileAt = (tree, pathArr) => {
    // pathArr includes file name at the end
    if (!Array.isArray(pathArr) || pathArr.length === 0) return tree;
    const copy = clone(tree);
    const fileName = pathArr[pathArr.length - 1];
    let ptr = copy;
    for (let i = 0; i < pathArr.length - 1; i++) {
      const seg = pathArr[i];
      const idx = ptr.findIndex(n => n.type === 'folder' && n.name === seg);
      if (idx === -1) return tree;
      ptr = ensureFolderChildren(ptr[idx]).children;
    }
    const idx = ptr.findIndex(n => n.type === 'file' && n.name === fileName);
    if (idx !== -1) ptr.splice(idx, 1);
    return copy;
  };

  const setFileHideAt = (tree, pathArr, flag) => {
    if (!Array.isArray(pathArr) || pathArr.length === 0) return tree;
    const copy = clone(tree);
    const fileName = pathArr[pathArr.length - 1];
    let ptr = copy;
    for (let i = 0; i < pathArr.length - 1; i++) {
      const seg = pathArr[i];
      const idx = ptr.findIndex(n => n.type === 'folder' && n.name === seg);
      if (idx === -1) return tree;
      ptr = ensureFolderChildren(ptr[idx]).children;
    }
    const idx = ptr.findIndex(n => n.type === 'file' && n.name === fileName);
    if (idx !== -1) {
      ptr[idx] = { ...ptr[idx], isHIdden: !!flag };
    }
    return copy;
  };

  const toggleExpand = (pathStr) => {
    const next = new Set(expanded);
    if (next.has(pathStr)) next.delete(pathStr); else next.add(pathStr);
    setExpanded(next);
  };

  const startCreateFolder = (pathStr) => {
    setCreatingAt(pathStr);
    setNewFolderName('');
  };

  const confirmCreateFolder = (pathStr) => {
    const trimmed = newFolderName.trim();
    if (!trimmed) { setCreatingAt(null); return; }
    try {
      const pathArr = pathStr ? pathStr.split('/') : [];
      const next = addFolderAt(data, pathArr, trimmed);
      onChange && onChange(next);
      setCreatingAt(null);
      setNewFolderName('');
      // auto expand parent
      const parent = pathArr.join('/');
      const e = new Set(expanded); e.add(parent); setExpanded(e);
    } catch (e) {
      Alert.alert('Error', e.message || String(e));
    }
  };

  const uploadAt = async (pathStr) => {
    try {
      setBusyPath(pathStr || '');
      const picked = await getDocumentAsync({ type: mimeTypes, multiple: true, copyToCacheDirectory: true });
      if (picked.canceled) return;
      const assets = picked.assets || [];
      const valid = [];
      for (const file of assets) {
        let size = file.size;
        if (size == null) {
          try {
            const info = await FileSystem.getInfoAsync(file.uri);
            if (info?.exists && typeof info.size === 'number') size = info.size;
          } catch { /* ignore */ }
        }
        if (typeof size === 'number' && size > MAX_FILE_SIZE) {
          Alert.alert('File Too Large', `${file.name} exceeds 10 MB, skipping.`);
          continue;
        }
        valid.push(file);
      }
      if (valid.length === 0) return;

      const uploaded = [];
      for (const file of valid) {
        const form = new FormData();
        form.append('file', {
          uri: file.uri,
          type: file.mimeType || file.type || 'application/octet-stream',
          name: file.name || `file-${Date.now()}`,
        });
        const s3Path = joinPath([basePath, pathStr]);
        form.append('path', s3Path);
        try {
          const resp = await api.post('/project/upload-form', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
          });
          if (resp?.data?.ok && resp?.data?.result) {
            uploaded.push({ name: file.name, value: resp.data.result });
          }
        } catch (err) {
          console.warn('upload error', err);
          Alert.alert('Upload failed', `${file.name} could not be uploaded.`);
        }
      }
      if (uploaded.length) {
        const pathArr = pathStr ? pathStr.split('/') : [];
        const next = addFilesAt(data, pathArr, uploaded);
        onChange && onChange(next);
      }
    } finally {
      setBusyPath(null);
    }
  };

  const viewFile = async (value) => {
    try {
      if (!value) return;
      setBusyPath(value);
      const encoded = encodeURIComponent(value);
      const resp = await api.get(`/project/download/${encoded}`);
      if (!resp?.data?.url) throw new Error('No download URL');
      const presigned = resp.data.url;
      const fileName = value.split('/').pop() || `download-${Date.now()}`;
      const dest = `${FileSystem.cacheDirectory}${fileName}`;
      const dl = await FileSystem.downloadAsync(presigned, dest);
      if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dl.uri);
      } else {
        await Linking.openURL(dl.uri);
      }
    } catch (e) {
      Alert.alert('Open failed', e.message || String(e));
    } finally {
      setBusyPath(null);
    }
  };

  const toggleHide = (pathArr, nextFlag) => {
    try {
      const next = setFileHideAt(data, pathArr, nextFlag);
      onChange && onChange(next);
    } catch (e) {
      Alert.alert('Error', e.message || String(e));
    }
  };

  const confirmAndDelete = (value, pathArr) => {
    if (!value) return;
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteFile(value, pathArr) },
      ]
    );
  };

  const deleteFile = async (value, pathArr) => {
    try {
      setDeleteBusy(value);
      const encoded = encodeURIComponent(value);
      const resp = await api.delete(`/project/delete/${encoded}`);
      if (!resp?.data?.ok) throw new Error(resp?.data?.error || 'Delete failed');
      const next = removeFileAt(data, pathArr);
      onChange && onChange(next);
    } catch (e) {
      console.warn('delete file error', e);
      Alert.alert('Delete failed', e.message || String(e));
    } finally {
      setDeleteBusy(null);
    }
  };

  const renderNode = (node, pathArr) => {
    const pathStr = joinPath(pathArr);
    if (node.type === 'folder') {
      const isOpen = expanded.has(pathStr);
      const isCreatingHere = creatingAt === pathStr;
      return (
        <View key={`folder-${pathStr}`}>
          <View style={styles.row}>
            <Pressable style={styles.left} onPress={() => toggleExpand(pathStr)}>
              <Ionicons name={isOpen ? 'folder-open' : 'folder'} size={18} color={colors.primary} />
              <Text style={styles.name}>{node.name}</Text>
            </Pressable>
          </View>
          <View style={styles.actionsRow}>
            {isAdmin && (
              <Pressable style={styles.iconBtn} onPress={() => uploadAt(pathStr)} disabled={busyPath != null}>
                {busyPath === pathStr ? (
                  <ActivityIndicator size={16} color={colors.fullwhite} />
                ) : (
                  <Ionicons name="cloud-upload" size={16} color={colors.fullwhite} />
                )}
              </Pressable>
            )}
            <Pressable style={styles.iconBtn} onPress={() => startCreateFolder(pathStr)}>
              <Ionicons name="add" size={16} color={colors.fullwhite} />
            </Pressable>
          </View>
          {isCreatingHere && (
            <View style={styles.createRow}>
              <TextInput
                style={styles.input}
                placeholder="New folder name"
                value={newFolderName}
                onChangeText={setNewFolderName}
                onSubmitEditing={() => confirmCreateFolder(pathStr)}
              />
              <Pressable style={[styles.smallBtn, styles.confirm]} onPress={() => confirmCreateFolder(pathStr)}>
                <Text style={styles.smallBtnText}>Create</Text>
              </Pressable>
              <Pressable style={[styles.smallBtn, styles.cancel]} onPress={() => setCreatingAt(null)}>
                <Text style={styles.smallBtnText}>Cancel</Text>
              </Pressable>
            </View>
          )}
          {isOpen && Array.isArray(node.children) && node.children.map((child, idx) => (
            <View key={`${pathStr}-${child.name}-${idx}`} style={styles.child}>
              {renderNode(child, [...pathArr, child.name])}
            </View>
          ))}
        </View>
      );
    }
    // file
    // For non-admin users, skip hidden files
    if (!isAdmin && node.isHIdden) {
      return null;
    }
    return (
      <View key={`file-${pathStr}`} style={styles.fileContainer}>
        <View style={styles.row}>
          <Pressable style={styles.left} onPress={() => viewFile(node.value)} disabled={busyPath === node.value}>
            <Ionicons name="document-text" size={18} color={colors.fullBlack} />
            <Text style={[styles.name, node.isHIdden ? styles.hiddenText : null]}>
              {node.name}
              {node.isHIdden && isAdmin ? ' (hidden)' : ''}
            </Text>
          </Pressable>
        </View>
        {isAdmin && (
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => toggleHide(pathArr, !node.isHIdden)}
              accessibilityLabel={node.isHIdden ? 'Unhide file' : 'Hide file'}
            >
              <Ionicons name={node.isHIdden ? 'eye' : 'eye-off'} size={16} color={colors.fullwhite} />
            </Pressable>
            <Pressable
              style={[styles.iconBtn, styles.iconBtnDanger]}
              onPress={() => confirmAndDelete(node.value, pathArr)}
              disabled={deleteBusy === node.value}
              accessibilityLabel="Delete file"
            >
              {deleteBusy === node.value ? (
                <ActivityIndicator size={16} color={colors.fullwhite} />
              ) : (
                <Ionicons name="trash" size={16} color={colors.red} />
              )}
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const root = useMemo(() => ({ name: 'root', type: 'folder', children: data || [] }), [data]);

  return (
    <View>
      {/* Root actions */}
      <View style={[styles.row, { marginBottom: 0 }]}>
        <Pressable style={styles.left} onPress={() => toggleExpand('')}>
          <Ionicons name={expanded.has('') ? 'folder-open' : 'folder'} size={18} color={colors.primary} />
          <Text style={styles.name}>Root</Text>
        </Pressable>
      </View>
      <View style={[styles.actionsRow, { marginBottom: 8 }]}>
        {isAdmin && (
          <Pressable style={styles.iconBtn} onPress={() => uploadAt('')} disabled={busyPath != null}>
            {busyPath === '' ? (
              <ActivityIndicator size={16} color={colors.fullwhite} />
            ) : (
              <Ionicons name="cloud-upload" size={16} color={colors.fullwhite} />
            )}
          </Pressable>
        )}
        <Pressable style={styles.iconBtn} onPress={() => startCreateFolder('')}>
          <Ionicons name="add" size={16} color={colors.fullwhite} />
        </Pressable>
      </View>
      {creatingAt === '' && (
        <View style={styles.createRow}>
          <TextInput
            style={styles.input}
            placeholder="New folder name"
            value={newFolderName}
            onChangeText={setNewFolderName}
            onSubmitEditing={() => confirmCreateFolder('')}
          />
          <Pressable style={[styles.smallBtn, styles.confirm]} onPress={() => confirmCreateFolder('')}>
            <Text style={styles.smallBtnText}>Create</Text>
          </Pressable>
          <Pressable style={[styles.smallBtn, styles.cancel]} onPress={() => setCreatingAt(null)}>
            <Text style={styles.smallBtnText}>Cancel</Text>
          </Pressable>
        </View>
      )}
      {expanded.has('') && root.children.map((child, idx) => (
        <View key={`root-${child.name}-${idx}`} style={styles.child}>
          {renderNode(child, [child.name])}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, color: colors.fullBlack },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 32, marginTop: 4 },
  fileContainer: { marginBottom: 6 },
  iconBtn: { backgroundColor: colors.primary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  child: { paddingLeft: 16 },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f8f8f8' },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6 },
  smallBtnText: { color: colors.fullwhite, fontWeight: '600' },
  confirm: { backgroundColor: colors.primary },
  cancel: { backgroundColor: colors.lighterGrey },
  iconBtnDanger: { backgroundColor: colors.fullwhite },
});
