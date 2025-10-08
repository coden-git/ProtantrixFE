import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TouchableOpacity, TextInput, ActivityIndicator, Button, Alert as RNAlert } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import api from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components';
import colors from '../../styles/colorPallete';
import { BACKEND_URL } from '../../config';
import ActionModal from '../../components/ActionModal/ActionModal';

export default function ActivitiesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {projectId, projectName} = route.params;

  const [data, setData] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState(null);
  const [pendingUnlocks, setPendingUnlocks] = useState({}); // map activityId => true when request sent
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter((a) => (a && a.name && a.name.toLowerCase().includes(q)));
  }, [data, query]);

  const loadActivities = useCallback(async () => {
    let cancelled = false;
    if (!projectId) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects/${projectId}/activities`);
      if (cancelled) return;
      if (res && res.data && res.data.ok) {
        setData(res.data.activities || []);
      } else {
        setError((res && res.data && res.data.error) || 'Unexpected API response');
        setData([]);
      }
    } catch (err) {
      console.log(err);
      if (cancelled) return;
      setError(err.message || 'Network error');
      setData([]);
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => { loadActivities(); }, [loadActivities]);
  useFocusEffect(useCallback(() => { loadActivities(); }, [loadActivities]));

  const requestUnlock = (activity) => {
    console.log('Request unlock for activity', activity.id);
    setUnlockTarget(activity.id);
    setShowUnlockModal(true);
  };

  const sendUnlockRequest = useCallback(async (activityId) => {
    if (!activityId || !projectId) return;
    const activityObj = data.find(a => (a && (a.id === activityId || a.activityId === activityId)));
    const activityName = activityObj?.name || activityObj?.title || 'Activity';
    setUnlockLoading(true);
    setUnlockError(null);
    try {
      const payload = {
        activityId: String(activityId),
        activityName: String(activityName),
        projectId: String(projectId),
        projectName: (route.params?.projectName) || 'Project',
      };
      const res = await api.post('/alert/create/activity-unlock', payload);
      if (res?.data?.ok) {
        setPendingUnlocks(prev => ({ ...prev, [activityId]: true }));
        RNAlert.alert('Request Sent', 'Unlock request submitted successfully.');
      } else {
        setUnlockError(res?.data?.error || 'Unknown server response');
      }
    } catch (err) {
      setUnlockError(err?.response?.data?.error || err.message || 'Network error');
    } finally {
      setUnlockLoading(false);
    }
  }, [data, projectId, route.params]);

  const handleUnlockAction = (type) => {
    if (type === 'confirm' && unlockTarget) {
      sendUnlockRequest(unlockTarget);
    }
    setShowUnlockModal(false);
    setUnlockTarget(null);
  };

  const renderItem = ({ item, index }) => {
    const name = typeof item === 'string' ? item : (item && (item.name || item.title)) || 'Unnamed activity';
    const payload = typeof item === 'string' ? { name } : item;
    const disabled = !!(payload && payload.disabled === true);

    return (
      <View style={[styles.rowWrapper, disabled && styles.rowWrapperDisabled]}>
        <Pressable
          onPress={() => !disabled && navigation.navigate('ActivityDetail', { activity: payload, projectId, projectName })}
          disabled={disabled}
          style={({ pressed }) => [styles.row, pressed && !disabled && styles.rowPressed, disabled && styles.rowDisabled]}
        >
          <Text style={styles.rowText}>{index + 1}. {name}</Text>
          {item && item.isNewComment && (
            <Ionicons
              name="ellipse"
              size={12}
              color="#f5c400" /* yellow indicator for new comments */
              style={styles.newCommentIcon}
            />
          )}
          {!disabled && <Ionicons name="chevron-forward" size={20} color={colors.fullBlack} style={styles.icon} />}
        </Pressable>
        {disabled && (
          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={() => !(pendingUnlocks[(item && item.id) || item] || item.enableRequest) && requestUnlock(item)}
            disabled={!!(pendingUnlocks[(item && item.id) || item] || item.enableRequest)}
          >
            {pendingUnlocks[(item && item.id) || item] || item.enableRequest ? (
              <Ionicons name="time" size={20} color={colors.grey} />
            ) : (
              <Ionicons name="lock-closed" size={22} color={colors.red} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Activities" enableBackButton={true} />
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search activities..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
            <Ionicons name="search" size={20} color={colors.lightGrey} />
          </TouchableOpacity>
        )}
      </View>
      {loading && <ActivityIndicator size="large" />}
      {error && (
        <View style={{ padding: 12 }}>
          <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>
          <Button title="Retry" onPress={() => { setQuery((q) => q + ' '); setQuery((q) => q.trim()); }} />
        </View>
      )}
      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => String(item && (item.id || item.name) || idx)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
      {unlockError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{unlockError}</Text>
        </View>
      )}
      <ActionModal
        visible={showUnlockModal}
        title="Are you sure"
        message="Do you want admin to open this activity"
        isCancel
        isConfirm
        confirmLabel="Yes, Request"
        cancelLabel="No"
        onClose={() => { setShowUnlockModal(false); setUnlockTarget(null); }}
        onAction={handleUnlockAction}
        loading={unlockLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.fullwhite },
  rowWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  rowWrapperDisabled: { opacity: 0.85 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  rightPlaceholder: { width: 40 },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12 },
  rowPressed: { backgroundColor: colors.offWhite },
  rowDisabled: { opacity: 0.5 },
  icon: { marginLeft: 'auto' },
  rowText: { fontSize: 16, flex: 1 },
  newCommentIcon: { marginHorizontal: 6 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: colors.offWhite, padding: 8, borderRadius: 8 },
  clearBtn: { marginLeft: 8 },
  unlockBtn: { padding: 8 },
  errorBanner: { backgroundColor: '#ffe5e5', padding: 8, borderRadius: 6, marginHorizontal: 4, marginBottom: 8 },
  errorText: { color: colors.red, fontSize: 13 },
});
