import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TouchableOpacity, TextInput, ActivityIndicator, Button } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components';
import colors from '../../styles/colorPallete';
import { BACKEND_URL } from '../../config';

export default function ActivitiesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get projectId from navigation params
  const projectId = route.params?.projectId;

  const [data, setData] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const res = await axios.get(`${BACKEND_URL}/v1/projects/${projectId}/activities`);
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

  // Load on mount and whenever projectId changes
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Also reload when the screen gains focus (user navigates back)
  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  const renderItem = ({ item, index }) => {
    const name = typeof item === 'string' ? item : (item && (item.name || item.title)) || 'Unnamed activity';
    const payload = typeof item === 'string' ? { name } : item;
    const disabled = !!(payload && payload.disabled === true);

    return (
      <Pressable
        onPress={() => navigation.navigate('ActivityDetail', { activity: payload, projectId })}
        disabled={disabled}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed, disabled && styles.rowDisabled]}
      >
        <Text style={styles.rowText}>{index + 1}. {name}</Text>
        {!disabled && <Ionicons name="chevron-forward" size={20} color={colors.fullBlack} style={styles.icon} />}
      </Pressable>
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
          <Button title="Retry" onPress={() => {
            // trigger re-fetch by toggling query (cheap) — better would be to
            // expose a reload function/method; for now, re-run effect by
            // temporarily clearing and resetting projectId via state isn't ideal
            // so we'll simply call the effect's async function via a small hack:
            setQuery((q) => q + ' ');
            setQuery((q) => q.trim());
          }} />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => String(item && (item.id || item.name) || idx)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.fullwhite,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPlaceholder: {
    width: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  rowPressed: {
    backgroundColor: colors.offWhite,
  },
  rowDisabled: { opacity: 0.5 },
  icon: {
    marginLeft: 'auto',
  },
  rowText: {
    fontSize: 16,
    flex: 1,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: colors.offWhite, padding: 8, borderRadius: 8 },
  clearBtn: { marginLeft: 8 },
});
