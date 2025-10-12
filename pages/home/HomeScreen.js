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
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../styles/colorPallete';
import api from '../../api/client'
import { AuthContext } from '../../context/AuthContext';

export default function HomeScreen() {
  const navigation = useNavigation();
  const auth = React.useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = useCallback(async (opts = { page: 1, limit: 10000 }) => {
    setError(null);
    if (!opts.skipLoading) setLoading(true);
    try {
      if (!auth?.token) {
        setError('Not authenticated');
        return;
      }
      const resp = await api.get('/projects/list', {
        params: { page: opts.page, limit: opts.limit }
      });
      const json = resp.data;
      console.log('Fetched projects', opts?.skipLoading);
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
  }, [auth?.token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Refetch projects when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, [fetchProjects])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects({ page: 1, limit: 100, skipLoading: true });
  }, [fetchProjects]);

  // Filter projects based on search query
  const filteredProjects = React.useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(project => 
      project.name?.toLowerCase().includes(query) || 
      project.description?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const openActivities = (project) => {
    const parent = navigation.getParent();
    if (parent) parent.navigate('Activities', { projectId: project.uuid, projectName: project.name });
    else navigation.navigate('Activities', { projectId: project.uuid, projectName: project.name });
  };

  const renderProject = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openActivities(item)}>
      <View style={styles.cardLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name="briefcase-outline" size={20} color="black" />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>
            {item.description && item.description.length > 30 
              ? `${item.description.substring(0, 30)}... ${item.status}` 
              : `${item.description} ${item.status?.replaceAll('_', ' ')?.toLowerCase()}`}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('CreateProject', { project: item })}>
        {auth?.user?.role === 'admin' ? (
          <Ionicons name="create-outline" size={20} color="#333" />
        ) : (
          <Ionicons name="eye-outline" size={20} color="#333" />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Projects</Text>
        {auth?.user?.role === 'admin' ? (
          <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('CreateProject')}>
            <Text style={styles.plus}>＋</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>My Projects</Text>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

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
          <>
            {searchQuery.length > 0 && filteredProjects.length === 0 && projects.length > 0 && (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No projects found for "{searchQuery}"</Text>
              </View>
            )}
            <FlatList
              data={filteredProjects}
              keyExtractor={(i) => `${i._id} + ${i?.name} + ${i?.description}`}
              renderItem={renderProject}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </>
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
  iconContainer: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
});
