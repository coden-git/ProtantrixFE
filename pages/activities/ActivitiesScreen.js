import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TouchableOpacity, TextInput } from 'react-native';
import mock from '../../mock.json';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components';
import colors from '../../styles/colorPallete';

export default function ActivitiesScreen() {
  const navigation = useNavigation();
  const data = mock.activities || [];
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter((a) => (a.name || '').toLowerCase().includes(q));
  }, [data, query]);

  const renderItem = ({ item, index }) => (
    <Pressable
      onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.rowText}>{index + 1}. {item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.fullBlack} style={styles.icon} />

    </Pressable>
  );

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

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id ?? item.name)}
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
