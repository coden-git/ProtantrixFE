import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../../styles/colorPallete';
import axios from 'axios'
import {BACKEND_URL} from '../../config.js'

export default function HomeScreen() {
  const navigation = useNavigation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = useCallback(async (opts = { page: 1, limit: 100 }) => {
    setError(null);
    if (!opts.skipLoading) setLoading(true);
    try {
      const resp = await axios.get(`${BACKEND_URL}/v1/projects/list`, {
        params: { page: opts.page, limit: opts.limit },
      });
      const json = resp.data;
      if (json && json.ok && Array.isArray(json.items)) {
        setProjects(json.items);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to fetch projects';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects({ page: 1, limit: 100, skipLoading: true });
  }, [fetchProjects]);

  const openActivities = (project) => {
    const parent = navigation.getParent();
    if (parent) parent.navigate('Activities', { projectId: project._id });
    else navigation.navigate('Activities', { projectId: project._id });
  };

  const renderProject = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openActivities(item)}>
      <View style={styles.cardLeft}>
        <View style={styles.iconPlaceholder} />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.description}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProject', { projectId: item._id })}>
        <Text style={styles.editText}>✎</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Projects</Text>
        <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('CreateProject')}>
          <Text style={styles.plus}>＋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>My Projects</Text>

        {loading && projects.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : error ? (
          <View style={{ padding: 12 }}>
            <Text style={{ color: 'red' }}>{error}</Text>
            <TouchableOpacity onPress={() => fetchProjects()} style={{ marginTop: 8 }}>
              <Text style={{ color: '#007AFF' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(i) => i._id}
            renderItem={renderProject}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.fullwhite, padding:16 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  headerSpacer: { width: 24 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerAction: { width: 32, alignItems: 'flex-end' },
  plus: { fontSize: 24, color: '#111' },
  listContainer: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  iconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {},
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: '#7e7e7e', marginTop: 2 },
  editButton: { padding: 8 },
  editText: { fontSize: 18, color: '#333' },
});
