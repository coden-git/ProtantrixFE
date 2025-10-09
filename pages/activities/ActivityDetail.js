import React, { useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, Platform, ActivityIndicator, TextInput, KeyboardAvoidingView, ScrollView, LayoutAnimation, UIManager, Linking } from 'react-native';
import api from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox, DateRange, FileUpload, Header } from '../../components';
import { useNavigation } from '@react-navigation/native';
import colors from '../../styles/colorPallete';
import { MultiSelect } from "react-native-element-dropdown";
import { BACKEND_URL } from '../../config';
import { AuthContext } from '../../context/AuthContext';
import ActionModal from '../../components/ActionModal/ActionModal';
import { formatDateTime, MAX_FILE_SIZE } from '../../utils';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';


export default function ActivityDetail({ route }) {
    const { activity: initialActivity, projectId } = route.params || {};
    const navigation = useNavigation();
    const auth = React.useContext(AuthContext);
    // local editable copy
    const [activity, setActivity] = useState(() => ({
        ...(initialActivity || {}),
    }));
    const [saving, setSaving] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);


    const [commentText, setCommentText] = useState('');
    const [addingComment, setAddingComment] = useState(false);
    const [attachment, setAttachment] = useState(null); // { uri, name, size, mimeType }
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsLoaded, setCommentsLoaded] = useState(false);
    const [commentsError, setCommentsError] = useState(null);
    const fetchingRef = useRef(false);
    const [viewingFileUri, setViewingFileUri] = useState(null); // track which file is loading
    const { role, name: currentUserName } = useContext(AuthContext);

    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }



    const handleAddComment = async () => {
        if (!commentText.trim()) {
            Alert.alert('Empty Comment', 'Please enter a comment before adding.');
            return;
        }
        if (!projectId || !activity?.id) {
            Alert.alert('Missing context', 'Cannot add comment without project or activity id.');
            return;
        }
        try {
            setAddingComment(true);
            // Build multipart form data
            const form = new FormData();
            // Primary field (simple form field)
            const trimmed = commentText.trim();
            // Duplicate the comment inside a JSON payload (e.g. server can parse if expecting structured body too)
            const payload = { comment: trimmed, projectName: route.params?.projectName, activityName: activity.name };
            form.append('payload', JSON.stringify(payload));
            if (attachment) {
                form.append('file', {
                    uri: attachment.uri,
                    name: attachment.name || `attachment_${Date.now()}`,
                    type: attachment.mimeType || 'application/octet-stream'
                });
            }
            // File attachment support can be added later: form.append('file', { uri, name, type })

            const endpoint = `/comment/${encodeURIComponent(projectId)}/activity/${encodeURIComponent(activity.id)}`;
            const res = await api.post(endpoint, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 30000,
            });

            if (res?.data?.ok) {
                setCommentText('');
                // Optimistic prepend if list already loaded
                if (commentsLoaded) {
                    const newComment = res.data.comment || {
                        uuid: `temp-${Date.now()}`,
                        comment: trimmed,
                        commentedBy: { userName: auth?.user?.name || 'You' },
                        createdDate: new Date().toISOString(),
                        fileUri: null
                    };
                    setComments(prev => [newComment, ...prev]);
                }
                setAttachment(null);
            } else {
                throw new Error(res?.data?.error || 'Failed to add comment');
            }
        } catch (err) {
            console.warn('Add comment error', err);
            Alert.alert('Add Comment Failed', String(err?.message || err));
        } finally {
            setAddingComment(false);
        }
    };

    const pickAttachment = async () => {
        try {
            // Allow only images and PDFs
            const res = await DocumentPicker.getDocumentAsync({
                multiple: false,
                copyToCacheDirectory: true,
                type: ['image/*', 'application/pdf']
            });
            if (res.canceled) return;
            const file = res.assets && res.assets[0];
            if (!file) return;


            // Size check (fallback to FileSystem if missing)
            let size = file.size;
            if (size == null) {
                try {
                    const info = await FileSystem.getInfoAsync(file.uri);
                    if (info?.exists && typeof info.size === 'number') size = info.size;
                } catch (_) { /* ignore */ }
            }
            if (typeof size === 'number' && size > MAX_FILE_SIZE) {
                Alert.alert('File Too Large', 'Maximum allowed size is 10 MB.');
                return;
            }

            setAttachment({
                uri: file.uri,
                name: file.name,
                size: size,
                mimeType: mime,
            });
        } catch (e) {
            console.warn('pickAttachment error', e);
            Alert.alert('Attachment Error', e.message || String(e));
        }
    };

    const updateActivity = (index, newVal) => {
        setActivity((prev) => {
            const next = { ...prev };
            next.checkLists = prev.checkLists.map((it, i) => (i === index ? { ...it, value: newVal } : it));
            return next;
        });
    };

    const renderChecklist = ({ item, index }) => {
        if ((item.type || '').toLowerCase() === 'dropdown') {
            return (
                <View>
                    <Text style={styles.label}>{item.name}</Text>
                    <MultiSelect
                        style={styles.dropdown}
                        data={item?.options}
                        labelField="label"
                        valueField="value"
                        placeholder={`Select ${item.name}`}
                        value={item.value}
                        disabled={item.disabled === true}
                        onChange={(select) => item.disabled === true ? null : updateActivity(index, select)}
                        // style for selected items (chips/pills)
                        selectedStyle={styles.selectedItem}
                        selectedTextStyle={styles.selectedText}
                        chipStyle={styles.selectedItem}
                        chipTextStyle={styles.selectedText}
                        // custom render for dropdown rows to include meta
                        renderItem={(opt) => (
                            <View style={styles.itemContainer}>
                                <Text style={styles.itemLabel}>{opt.label}</Text>
                                {opt.meta ? <Text style={styles.itemMeta}>{opt.meta}</Text> : null}
                            </View>
                        )}
                    />
                </View>
            );
        }
        if ((item.type || '').toLowerCase() === 'checkbox') {
            return (
                <View style={styles.checkItem}>
                    <Checkbox
                        label={item.name}
                        value={Boolean(item.value)}
                        disabled={item.disabled === true}
                        onClick={(v) => item.disabled === true ? null : updateActivity(index, v)}
                    />
                </View>
            );
        }

        if ((item.type || '').toLowerCase() === 'table') {
            return (
                <Pressable style={styles.tableRow} onPress={() => navigation.navigate('ActionTable', { item, updateActivity: (updated) => updateActivity(index, updated) })}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>{item.name}</Text>
                        {item.meta ? <Text style={styles.itemMeta}>{item.meta}</Text> : null}
                    </View>
                </Pressable>
            );
        }

        if ((item?.type || '').toLowerCase() === 'daterange') {
            // value expected shape: { from: '', to: '' }
            return (
                <View>
                    <Text style={styles.label}>{item.name}</Text>
                    <DateRange
                        value={item.value || { from: '', to: '' }}
                        disabled={item.disabled === true}
                        onChange={(val) => item.disabled === true ? null : updateActivity(index, val)}
                    />
                </View>
            );
        }


    };

    const uploads = activity.checkLists?.filter(it => (it.type || '').toLowerCase() === 'fileupload') || [];


    const onActivityChange = async (updatedActivities = []) => {
        // updatedActivities is expected to be an array of objects that include an id matching the checklist item id
        console.log('Received uploaded items:', updatedActivities);
        setActivity((prev) => {
            const next = { ...prev };
            if (!Array.isArray(prev.checkLists)) return next;
            next.checkLists = prev.checkLists.map((it) => {
                if ((it.type || '').toLowerCase() !== 'fileupload') return it;
                const match = updatedActivities.find((u) => (u.id !== undefined && it.id !== undefined && String(u.id) === String(it.id)));
                if (match) {
                    // merge uploaded data onto the checklist item (e.g., set value or store file metadata)
                    return { ...it, ...match };
                }
                return it;
            });
            onSave({ goBack: false, activity: next });
            return next;
        });
    };


    const onMeasurementChange = async (updatedMeasurement) => {
        console.log('Received updated measurement:', updatedMeasurement);
        setActivity((prev) => {
            const next = { ...prev };
            next.measurement = updatedMeasurement;
            onSave({ goBack: false, activity: next });
            return next;
        });

    };

    const onPoChange = (updatedPo) => {
        console.log('Received updated PO:', JSON.stringify(updatedPo));
        setActivity((prev) => {
            const next = { ...prev };
            next.poValue = updatedPo;
            return next;
        });
    };

    const onMeasurment = () => {
        if (activity.measurement === 'SAME_AS_PO') {
            // updatePoToMeasurement(activity.poValue?.[0]?.value)
            if (JSON.stringify(activity.poValue?.[0]?.value) === JSON.stringify(initialActivity.poValue?.[0]?.value)) {
                Alert.alert('Admin has not added po yet', '', [
                    { text: 'OK' }
                ])
                return
            }
            navigation.navigate('Measurements', { measurement: updatePoToMeasurement(activity.poValue?.[0]?.value), onMeasurementChange })
            return
        }
        navigation.navigate('Measurements', { measurement: activity.measurement, onMeasurementChange })
    }

    const updatePoToMeasurement = (po) => {
        // Recursively walk the structure and remove `value` where `disabled` is false or not present
        console.log(JSON.stringify(po) === initialActivity.poValue?.[0]?.value, 'initial')

        const stripValues = (node) => {
            if (Array.isArray(node)) {
                return node.map((n) => stripValues(n));
            }
            if (node && typeof node === 'object') {
                const next = { ...node };

                // If this is a label cell, always keep its value (but still recurse)
                if (next.type === 'label') {
                    if (next.value !== undefined) next.value = stripValues(next.value);
                } else if ('disabled' in next) {
                    if (next.disabled === true) {
                        // keep value but still recurse into it
                        if (next.value !== undefined) next.value = stripValues(next.value);
                    } else {
                        // disabled is false -> remove value
                        if ('value' in next) delete next.value;
                    }
                } else {
                    // no disabled flag -> remove value per requirement
                    if ('value' in next) delete next.value;
                }

                // Recurse other keys (for nested structures like data, options, etc.)
                Object.keys(next).forEach((k) => {
                    if (k === 'value') return; // already handled
                    const v = next[k];
                    if (Array.isArray(v) || (v && typeof v === 'object')) {
                        next[k] = stripValues(v);
                    }
                });

                return next;
            }
            return node;
        };

        try {
            const cleaned = stripValues(po);
            console.log('updatePoToMeasurement cleaned:', JSON.stringify(cleaned));

            return { ...cleaned, isMulti: false };
        } catch (err) {
            console.warn('updatePoToMeasurement error', err);
            return po;
        }
    }

    const onSave = async ({ goBack = true, activity }) => {
        // Save handler: call backend to update activity
        try {
            if (!projectId) {
                Alert.alert('Missing project id', 'Cannot save activity because project id is not provided.', [{ text: 'OK' }]);
                return;
            }

            const activityId = activity.id
            if (!activityId) {
                Alert.alert('Missing activity id', 'Cannot save activity because activity id is not present.', [{ text: 'OK' }]);
                return;
            }

            setSaving(true);
            console.log('Saving activity', activityId);
            const res = await api.put(`/projects/${projectId}/activities/${activityId}`, activity, { timeout: 30000 });
            if (res && res.data && res.data.ok) {
                if (goBack) {
                    navigation.goBack();
                }
            } else {
                console.log('Save activity failed response', res && res.data);
                throw new Error((res && res.data && res.data.error) || 'Failed to save');
            }
        } catch (err) {
            console.warn('Save activity error', err);
            Alert.alert('Failed to save', String(err && err.message ? err.message : err), [{ text: 'OK' }]);
        } finally {
            setSaving(false);
            setConfirmVisible(false);
        }
    }

    const onCommentPress = async () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowComments(prev => !prev);
        if (!showComments && !commentsLoaded && !fetchingRef.current) {
            fetchingRef.current = true;
            setCommentsError(null);
            setCommentsLoading(true);
            try {
                const endpoint = `/comment/${encodeURIComponent(projectId)}/activity/${encodeURIComponent(activity.id)}/list`;
                const res = await api.get(endpoint, { timeout: 20000 });
                await api.post(`alert/${projectId}/activity/${activity.id}/seen`, {}, { timeout: 20000 });
                if (res?.data?.ok) {
                    setComments(res.data.comments || []);
                    setCommentsLoaded(true);
                } else {
                    throw new Error(res?.data?.error || 'Failed to load comments');
                }
            } catch (e) {
                setCommentsError(e.message || String(e));
            } finally {
                setCommentsLoading(false);
                fetchingRef.current = false;
            }
        }
    }

        const onViewFile = async (value) => {
        try {
          if (!value) return;
                    setViewingFileUri(value);
    
          // `value` is expected to be a path within the bucket (e.g. 'protantrix/activities/myfile.pdf')
          // Build request to backend to get presigned URL.
          // Use app-specific base URL; fallback to localhost path used in development.
          const encodedPath = encodeURIComponent(value);
    
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
                    setViewingFileUri(null);
                }
      }

    return (
        <View style={styles.flexOne}>
            <KeyboardAvoidingView
                style={styles.flexOne}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                <View style={styles.container}>
                    <Header title={activity?.name ?? 'Activity'} enableBackButton={true} />
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.subtitle}>Checklists</Text>
                        {activity.checkLists?.map((it, idx) => (
                            <View key={String(it.name || idx)}>
                                {renderChecklist({ item: it, index: idx })}
                                <View style={styles.sep} />
                            </View>
                        ))}
                        <View style={styles.pillRow}>
                            {uploads.length > 0 && (
                                <Pressable style={styles.pill} onPress={() => { navigation.navigate('ActivityDocs', { uploads, onActivityChange }) }}>
                                    <View style={styles.pillContent}>
                                        <Ionicons name="document-text-outline" size={16} color={colors.fullBlack} />
                                        <Text style={styles.pillText}>Docs</Text>
                                    </View>
                                </Pressable>
                            )}
                            <Pressable style={styles.pill} onPress={onMeasurment}>
                                <View style={styles.pillContent}>
                                    <Ionicons name="bar-chart" size={16} color={colors.fullBlack} />
                                    <Text style={styles.pillText}>Measurements</Text>
                                </View>
                            </Pressable>
                            {activity.poValue?.length > 0 && role==='admin' && (
                                <Pressable style={styles.pill} onPress={() => { navigation.navigate('AddPo', { poValue: activity.poValue, onPoChange }) }}>
                                    <View style={styles.pillContent}>
                                        <Ionicons name="receipt-outline" size={16} color={colors.fullBlack} />
                                        <Text style={styles.pillText}>PO</Text>
                                    </View>
                                </Pressable>
                            )}
                        </View>
                        {/* Collapsible Comment Section */}
                        <View style={styles.commentSectionWrapper}>
                            <Pressable
                                style={styles.commentToggleHeader}
                                onPress={onCommentPress}
                            >
                                <Text style={styles.commentTitle}>Comments</Text>
                                <Ionicons
                                    name={showComments ? 'chevron-up' : 'chevron-down'}
                                    size={18}
                                    color={colors.fullBlack}
                                />
                            </Pressable>
                            {showComments && (
                                <View style={styles.commentContent}>
                                    <Text style={styles.addCommentLabel}>Add Comment</Text>
                                    <View style={styles.attachmentRow}>
                                        <Pressable style={styles.attachmentBtn} onPress={pickAttachment} disabled={addingComment}>
                                            <Ionicons name="attach" size={18} color={colors.fullwhite} />
                                            <Text style={styles.attachmentBtnText}>{attachment ? 'Change File' : 'Attach'}</Text>
                                        </Pressable>
                                        {attachment && (
                                            <View style={styles.attachmentMeta}>
                                                <Ionicons name="document" size={16} color={colors.primary} />
                                                <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
                                                <Pressable onPress={() => setAttachment(null)} style={styles.clearAttachment}>
                                                    <Ionicons name="close-circle" size={16} color={colors.red} />
                                                </Pressable>
                                            </View>
                                        )}
                                    </View>
                                    <TextInput
                                        style={styles.commentInput}
                                        multiline
                                        placeholder="Type your comment..."
                                        value={commentText}
                                        onChangeText={setCommentText}
                                        placeholderTextColor={colors.lightGrey}
                                        returnKeyType="send"
                                        blurOnSubmit={true}
                                        onSubmitEditing={handleAddComment}
                                    />

                                    <Pressable
                                        style={[styles.addCommentInlineBtn, (!commentText.trim() || addingComment) && styles.disabledBtn]}
                                        onPress={handleAddComment}
                                        disabled={!commentText.trim() || addingComment}
                                    >
                                        {addingComment ? <ActivityIndicator color="#fff" /> : <Text style={styles.addCommentText}>Add Comment</Text>}

                                    </Pressable>
                                    
                                    {/* Comments List */}
                                    <View style={styles.commentsListWrapper}>
                                        {commentsLoading && (
                                            <View style={styles.commentsLoadingRow}>
                                                <ActivityIndicator size="small" color={colors.primary} />
                                                <Text style={styles.commentsLoadingText}>Loading comments...</Text>
                                            </View>
                                        )}
                                        {commentsError && !commentsLoading && (
                                            <View style={styles.commentsErrorRow}>
                                                <Text style={styles.commentsErrorText}>Failed: {commentsError}</Text>
                                                <Pressable
                                                    style={styles.retryBtn}
                                                    onPress={async () => {
                                                        setCommentsError(null);
                                                        setCommentsLoading(true);
                                                        try {
                                                            const endpoint = `/comment/${encodeURIComponent(projectId)}/activity/${encodeURIComponent(activity.id)}/list`;
                                                            const res = await api.get(endpoint, { timeout: 20000 });
                                                            if (res?.data?.ok) {
                                                                setComments(res.data.comments || []);
                                                                setCommentsLoaded(true);
                                                            } else {
                                                                throw new Error(res?.data?.error || 'Failed to load comments');
                                                            }
                                                        } catch (e) {
                                                            setCommentsError(e.message || String(e));
                                                        } finally {
                                                            setCommentsLoading(false);
                                                        }
                                                    }}
                                                >
                                                    <Text style={styles.retryText}>Retry</Text>
                                                </Pressable>
                                            </View>
                                        )}
                                        {!commentsLoading && !commentsError && commentsLoaded && comments.length === 0 && (
                                            <Text style={styles.emptyComments}>No comments yet.</Text>
                                        )}
                                        {!commentsLoading && !commentsError && comments.length > 0 && (
                                            <View style={styles.commentsContainer}>
                                                {comments.map(c => (
                                                    <View key={c.uuid || c._id} style={styles.commentItem}>
                                                        <View style={styles.commentItemHeader}>
                                                            <Text style={styles.commentAuthor}>{c.commentedBy?.userName || 'User'}</Text>
                                                            <Text style={styles.commentDate}>{formatDateTime(c.createdDate || c.createdAt)}</Text>
                                                        </View>
                                                        <Text style={styles.commentBody}>{c.comment}</Text>
                                                        {c.fileUri ? (
                                                            <Pressable onPress={() => viewingFileUri ? null : onViewFile(c.fileUri)} disabled={!!viewingFileUri}>
                                                                <View style={styles.commentFileRow}>
                                                                    <Text style={styles.commentFile} numberOfLines={1}>📎 {c.fileUri.split('/').slice(-1)[0]}</Text>
                                                                    {viewingFileUri === c.fileUri && (
                                                                        <ActivityIndicator size="small" color={colors.primary} style={styles.inlineLoader} />
                                                                    )}
                                                                </View>
                                                            </Pressable>
                                                        ) : null}
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                        <View style={styles.bottomSpacer} />
                    </ScrollView>
                </View>
                <View style={styles.footer}>
                    <Pressable
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={() => setConfirmVisible(true)}
                        disabled={saving}
                    >
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
                    </Pressable>
                </View>
                <ActionModal
                    visible={confirmVisible}
                    title="Save Changes"
                    message="Are you sure you want to save the updates to this activity?"
                    isCancel
                    isConfirm
                    confirmLabel="Save"
                    cancelLabel="Cancel"
                    onClose={() => setConfirmVisible(false)}
                    onAction={(type) => { if (type === 'confirm') onSave({ goBack: true, activity }); }}
                />
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, paddingTop: 30, backgroundColor: colors.fullwhite },
    title: { fontSize: 22, fontWeight: '700' },
    activityView: { paddingLeft: 0 },
    scroll: { flex: 1 },
    scrollContent: { paddingLeft: 0, paddingTop: 8, paddingBottom: 32 },
    subtitle: { fontSize: 16, fontWeight: '600', color: colors, marginTop: 6 },
    checkItem: { paddingVertical: 12, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    checkName: { fontSize: 16 },
    checkType: { color: colors.lightGrey },
    sep: { height: 1, backgroundColor: colors.offWhite },
    pillRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
    pill: { backgroundColor: colors.lighterGrey, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flex: 1, marginHorizontal: 6 },
    pillContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    pillText: { marginLeft: 8, fontSize: 14 },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.lighterGrey, backgroundColor: colors.fullwhite },
    saveButton: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: colors.fullwhite, fontWeight: '700', fontSize: 16 },
    dropdown: {
        height: 50,
        borderColor: "gray",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    label: { marginLeft: 10, fontSize: 16, paddingBottom: 7 },
    selectedItem: {
        backgroundColor: colors.fullwhite,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 6,
        margin: 4,
    },
    selectedText: {
        color: colors.fullBlack,
        fontSize: 14,
    },
    flexOne: { flex: 1 },
    commentSectionWrapper: { marginTop: 12, backgroundColor: colors.offWhite, borderRadius: 12, overflow: 'hidden' },
    commentToggleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 },
    commentTitle: { fontSize: 16, fontWeight: '600', color: colors.fullBlack },
    commentContent: { paddingHorizontal: 12, paddingBottom: 14 },
    addCommentLabel: { marginTop: 4, marginBottom: 6, fontSize: 13, fontWeight: '500', color: colors.lightGrey },
    commentInput: {
        minHeight: 90,
        borderColor: colors.lighterGrey,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        textAlignVertical: 'top',
        backgroundColor: colors.fullwhite,
        fontSize: 14,
        color: colors.fullBlack
    },
    addCommentInlineBtn: { marginTop: 10, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start', borderRadius: 8 },
    addCommentText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    disabledBtn: { opacity: 0.6 },
    itemContainer: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.offWhite },
    itemLabel: { fontSize: 16, color: colors.fullBlack },
    itemMeta: { fontSize: 12, color: colors.lightGrey, marginTop: 4 },
    selectedItemContent: { flexDirection: 'column' },
    selectedMetaText: { color: colors.fullwhite, fontSize: 12, marginTop: 2 },
    tableRow: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.fullwhite },
    bottomSpacer: { height: 40 }
    , commentsListWrapper: { marginTop: 16 },
    commentsLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    commentsLoadingText: { marginLeft: 8, fontSize: 13, color: colors.lightGrey },
    commentsErrorRow: { marginTop: 8, backgroundColor: '#fdecea', padding: 8, borderRadius: 6 },
    commentsErrorText: { color: '#b3261e', fontSize: 13, marginBottom: 4 },
    retryBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.primary, borderRadius: 6 },
    retryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    emptyComments: { marginTop: 10, fontSize: 13, color: colors.lightGrey },
    commentsContainer: { marginTop: 12, gap: 10 },
    commentItem: { backgroundColor: colors.fullwhite, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.offWhite },
    commentItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    commentAuthor: { fontSize: 13, fontWeight: '600', color: colors.fullBlack },
    commentDate: { fontSize: 11, color: colors.lightGrey },
    commentBody: { fontSize: 13, color: colors.fullBlack, lineHeight: 18 },
    commentFile: { marginTop: 6, fontSize: 12, color: colors.primary }
    , attachmentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 6, gap: 10, flexWrap: 'wrap' },
    attachmentBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 24, gap: 6 },
    attachmentBtnText: { color: colors.fullwhite, fontSize: 13, fontWeight: '600' },
    attachmentMeta: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.fullwhite, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.lighterGrey, maxWidth: '70%' },
    attachmentName: { marginLeft: 6, fontSize: 12, flexShrink: 1, color: colors.fullBlack },
    clearAttachment: { marginLeft: 4 },
    commentFileRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    inlineLoader: { marginLeft: 6 },

});


