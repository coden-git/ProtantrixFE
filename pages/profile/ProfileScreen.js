import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import colors from '../../styles/colorPallete';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.avatar}
        resizeMode="cover"
      />
      <Text style={styles.name}>Your Name</Text>
      <Text style={styles.bio}>This is your profile. Add details here.</Text>
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
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
  },
  bio: {
    marginTop: 8,
    color: colors.lightGrey,
    textAlign: 'center',
  },
});
