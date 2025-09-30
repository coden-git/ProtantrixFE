import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();

  const openActivities = () => {
    // Try to navigate on parent navigator (stack) so Activities is not a tab
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('Activities');
    } else {
      navigation.navigate('Activities');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text>Welcome to the Home screen.</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={openActivities}
      >
        <Text style={styles.buttonText}>Activities</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
