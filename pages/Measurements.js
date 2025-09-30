import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header/header';

export default function Measurements() {
  return (
    <View style={styles.container}>
      <Header title="Measurements" enableBackButton={true} />
      <View style={styles.body}>
        <Text style={styles.placeholder}>Measurements content goes here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  body: { padding: 16 },
  placeholder: { color: '#666' },
});
