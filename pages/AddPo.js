import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header/header';
import colors from '../styles/colorPallete';

export default function AddPo() {
  return (
    <View style={styles.container}>
      <Header title="Add PO" enableBackButton={true} />
      <View style={styles.body}>
        <Text style={styles.placeholder}>Add PO screen content goes here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fullwhite },
  body: { padding: 16 },
  placeholder: { color: colors.lightGrey },
});
