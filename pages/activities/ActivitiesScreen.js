import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ActivitiesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activities</Text>
      <Text style={styles.subtitle}>This is a placeholder for the Activities screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
  },
});
