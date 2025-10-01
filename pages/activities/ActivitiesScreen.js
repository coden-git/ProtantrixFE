import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TouchableOpacity } from 'react-native';
import mock from '../../mock.json';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components';
import colors from '../../styles/colorPallete';

export default function ActivitiesScreen() {
  const navigation = useNavigation();
  const data = mock.activities || [];

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.rowText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.fullBlack} style={styles.icon} />

    </Pressable>
  );

  return (
    <View style={styles.container}>
        <Header title="Activities" enableBackButton={true} />

      <FlatList
        data={data}
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
});
