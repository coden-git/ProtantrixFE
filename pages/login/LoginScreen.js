import React, { useState, useRef } from 'react';
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/client';

import colors from '../../styles/colorPallete';
import { BACKEND_URL } from '../../config';
import { AuthContext } from '../../context/AuthContext';

const Login = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);
  const auth = React.useContext(AuthContext);

  async function handleLogin() {
    setError('');
    if (!phone.trim() || !password.trim()) {
      setError('Please enter both phone and password');
      return;
    }
    // basic phone normalization
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Phone must be 10 digits');
      return;
    }
    setLoading(true);
    try {
      const url = `${BACKEND_URL.replace(/\/$/, '')}/v1/user/login`;
  const res = await api.post('/user/login', { phone: cleanPhone, password });
      console.log('login response', res.data);
      if (!res.data || !res.data.ok) {
        throw new Error(res.data?.error || 'Login failed');
      }
      const { token, user, expiresIn } = res.data;
      await AsyncStorage.multiSet([
        ['auth.token', token],
        ['auth.user', JSON.stringify(user)],
        ['auth.expiresIn', expiresIn || ''],
      ]);
      // call context login to sync state
      auth?.login && auth.login(token, user, expiresIn);
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(user);
      }
    } catch (e) {
      setError(e.message || 'Login error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inner}>
              <Image
                source={require('../../assets/Pro Tantrix Logo.png')}
                style={styles.logo}
              />
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus?.()}
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={{ height: 140 }} />
            </View>
          </ScrollView>
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.fullwhite} />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  inner: { alignItems: 'center' },
  logo: { width: 250, height: 125, resizeMode: 'contain', marginBottom: 50 },
  label: {
    alignSelf: 'flex-start',
    width: '80%',
    fontSize: 16,
    color: colors.fullBlack,
    marginBottom: 5,
    paddingLeft: 40,
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
    alignSelf: 'center',
    width: '80%',
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.fullwhite, fontSize: 18 },
  error: { color: 'red', marginBottom: 10 },
});

export default Login;
