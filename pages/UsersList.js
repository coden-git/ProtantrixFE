import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import Header from '../components/Header/header';
import colors from '../styles/colorPallete';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigation = useNavigation();
  const { role } = useContext(AuthContext);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { limit: 1000 } });
      if (!res?.data?.ok) throw new Error(res?.data?.error || 'Failed to load users');
      setUsers(res.data.users || []);
    } catch (e) {
      setError(e.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openUser = (u) => {
    navigation.navigate('AddUser', { user: { ...u, id: u._id } });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => openUser(item)} activeOpacity={0.75}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>{item.phone} • {item.role}</Text>
      </View>
      <View style={[styles.statusDot, item.isActive ? styles.active : styles.inactive]} />
    </TouchableOpacity>
  );

  const listEmpty = !loading ? (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyText}>No users found</Text>
    </View>
  ) : null;

  const filtered = search.trim()
    ? users.filter(u => (u.name || '').toLowerCase().includes(search.trim().toLowerCase()))
    : users;

  return (
    <View style={styles.root}>
      <Header title="Users" enableBackButton={true} />
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('AddUser')}
        activeOpacity={0.75}
        accessibilityLabel="Add new user"
      >
        <Ionicons name="add" size={26} color={colors.primary} />
      </TouchableOpacity>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.lightGrey} style={{ marginRight: 6 }} />
        <TextInput
          value={search}
            onChangeText={setSearch}
            placeholder="Search by name"
            placeholderTextColor={colors.lightGrey}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.lightGrey} />
          </TouchableOpacity>
        )}
      </View>
      {loading && !users.length ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={users.length ? styles.listContent : styles.emptyContainer}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={listEmpty}
        />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', paddingTop: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyContainer: { flexGrow: 1, padding: 32 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.offWhite, padding: 14, borderRadius: 12, marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  name: { fontSize: 16, fontWeight: '600', color: colors.fullBlack, marginBottom: 2 },
  meta: { fontSize: 13, color: colors.lightGrey },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  active: { backgroundColor: '#2ecc71' },
  inactive: { backgroundColor: '#e74c3c' },
  emptyText: { color: colors.lightGrey, fontSize: 15 },
  error: { color: 'red', textAlign: 'center', padding: 8 }
  ,addBtn: { position: 'absolute', top: 30, right: 16, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }
  ,searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.offWhite, marginHorizontal: 16, paddingHorizontal: 12, borderRadius: 10, height: 44, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 14, color: colors.fullBlack, paddingVertical: 0 },
  clearBtn: { paddingHorizontal: 4, height: 44, justifyContent: 'center', alignItems: 'center' }
});
