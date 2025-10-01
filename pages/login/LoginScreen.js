
import React from 'react';
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';

import { useState } from 'react';
import colors from '../../styles/colorPallete';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin() {
    setError('');
    // simple local validation; replace with real auth as needed
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    // Here you'd call your backend/auth logic. For now assume success.
    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess();
    }
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/Pro Tantrix Logo.png')}
        style={styles.logo}
      />
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.fullwhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 125,
    resizeMode: 'contain',
    marginBottom: 50,
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: '10%',
    fontSize: 16,
    color: colors.fullBlack,
    marginBottom: 5,
  },
  input: {
    width: '80%',
    height: 50,
    backgroundColor: colors.offWhite,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    position: 'absolute',
    bottom: 40,
    width: '80%',
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.fullwhite,
    fontSize: 18,
  },
});

export default Login;
