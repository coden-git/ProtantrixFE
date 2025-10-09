import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../../api/client';
import { Header } from '../../components';
import colors from '../../styles/colorPallete';
import { AuthContext } from '../../context/AuthContext';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actioningUuid, setActioningUuid] = useState(null); // uuid currently being approved/rejected
  const [actioningStatus, setActioningStatus] = useState(null); // target status (COMPLETED/REJECTED)
  const pageSizeRef = useRef(100); // fixed page size from backend
  const { role, name: currentUserName } = useContext(AuthContext);

  const handleDecision = useCallback(async (uuid, status) => {
    if (!uuid || !status) return;
    setActioningUuid(uuid);
    setActioningStatus(status);
    try {
      const res = await api.post(`/alerts/approve-reject/${uuid}?status=${status}`);
      if (res?.data?.ok) {
        // Prefer server returned alert if provided
        const updated = res.data.alert || res.data.updated || null;
        setAlerts(prev => prev.map(a => {
          if (a.uuid === uuid) {
            if (updated) return { ...a, ...updated };
            return { 
              ...a, 
              status, 
              approvedOn: new Date().toISOString(),
              approvedBy: a.approvedBy || { name: currentUserName || 'Admin', userId: 'self' }
            };
          }
          return a;
        }));
      } else {
        // Optionally set error toast or message
        setError(res?.data?.error || 'Action failed');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Network error');
    } finally {
      setActioningUuid(null);
      setActioningStatus(null);
    }
  }, []);

  const fetchAlerts = useCallback(async (targetPage = 1, append = false) => {
    if (loading || loadingMore) return;
    if (targetPage > totalPages && append) return; // nothing more to load
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/alerts/list?page=${targetPage}`);
      if (res?.data?.ok) {
        const { alerts: newAlerts, totalPages: tp, page: returnedPage } = res.data;
        setTotalPages(tp || 1);
        setPage(returnedPage || targetPage);
        setAlerts(prev => {
          if (!append) return newAlerts || [];
          const seen = new Set();
          const merged = [...prev, ...(newAlerts || [])].filter(a => {
            if (!a || !a.uuid) return true; // keep if no uuid (unlikely)
            if (seen.has(a.uuid)) return false;
            seen.add(a.uuid); return true;
          });
          return merged;
        });
      } else {
        setError(res?.data?.error || 'Unexpected response');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Network error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [loading, loadingMore, totalPages]);

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    fetchAlerts(1, false);
  }, [fetchAlerts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAlerts(1, false);
  }, [fetchAlerts]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || refreshing) return;
    if (page >= totalPages) return;
    fetchAlerts(page + 1, true);
  }, [loading, loadingMore, refreshing, page, totalPages, fetchAlerts]);

  const renderItem = ({ item }) => {
    const pending = item.status === 'PENDING';
    const isActioning = actioningUuid === item.uuid;
    return (
      <View style={styles.alertItem}>
        <View style={styles.alertHeaderRow}>
          <Text style={styles.alertType}>{item.type?.replace('_', ' ')}</Text>
          <Text style={[styles.status, styles['status_' + (item.status || '').toLowerCase()]]}>{item.status}</Text>
        </View>
        <Text style={styles.alertText} numberOfLines={3}>{item.alertText}</Text>
        <Text style={styles.meta}>
          {(item.project && item.project.projectName) ? item.project.projectName : ''}
          {item.activity && item.activity.activityName ? ` · ${item.activity.activityName}` : ''}
        </Text>
        <Text style={styles.metaSmall}>{item.requestedOn ? new Date(item.requestedOn).toLocaleString() : ''}</Text>
        {item.approvedBy?.name && item.status === 'COMPLETED' && (
          <Text style={styles.metaSmall}>Approved by {item.approvedBy.name}</Text>
        )}
        {item.approvedBy?.name && item.status === 'REJECTED' && (
          <Text style={styles.metaSmall}>Rejected by {item.approvedBy.name}</Text>
        )}
        {role === 'admin' && pending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn, (isActioning && actioningStatus === 'REJECTED') && styles.actionBtnDisabled]}
              onPress={() => handleDecision(item.uuid, 'REJECTED')}
              disabled={isActioning}
            >
              {isActioning && actioningStatus === 'REJECTED' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionText}>Reject</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn, (isActioning && actioningStatus === 'COMPLETED') && styles.actionBtnDisabled]}
              onPress={() => handleDecision(item.uuid, 'COMPLETED')}
              disabled={isActioning}
            >
              {isActioning && actioningStatus === 'COMPLETED' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionText}>Approve</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const listFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ padding: 16 }}>
        <ActivityIndicator />
      </View>
    );
  };

  const emptyComponent = () => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAlerts(1, false)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>No alerts yet.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Alerts" enableBackButton={true} />
      {loading && alerts.length === 0 ? (
        <View style={styles.loadingWrap}><ActivityIndicator size="large" /></View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item, idx) => item?.uuid || String(idx)}
          renderItem={renderItem}
          contentContainerStyle={alerts.length === 0 ? { flexGrow: 1 } : { paddingBottom: 24 }}
          onEndReachedThreshold={0.5}
          onEndReached={loadMore}
          ListFooterComponent={listFooter}
          ListEmptyComponent={emptyComponent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fullwhite, paddingTop: 30 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  alertItem: { backgroundColor: colors.offWhite, marginHorizontal: 12, marginTop: 12, padding: 12, borderRadius: 10 },
  alertHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  alertType: { fontWeight: '600', fontSize: 12, color: colors.fullBlack, textTransform: 'uppercase' },
  alertText: { fontSize: 14, color: colors.fullBlack, marginBottom: 6 },
  meta: { fontSize: 12, color: colors.grey },
  metaSmall: { fontSize: 11, color: colors.lightGrey, marginTop: 2 },
  status: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, overflow: 'hidden' },
  status_pending: { backgroundColor: '#fff4cc', color: '#aa7a00' },
  status_completed: { backgroundColor: '#d8f5d2', color: '#2e7d32' },
  status_rejected: { backgroundColor: '#ffd9d9', color: '#b3261e' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: colors.grey },
  errorText: { fontSize: 14, color: '#b3261e', marginBottom: 12, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.fullBlack, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  actionRow: { flexDirection: 'row', marginTop: 10, gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  approveBtn: { backgroundColor: '#2e7d32' },
  rejectBtn: { backgroundColor: '#b3261e' },
  actionBtnDisabled: { opacity: 0.6 },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
