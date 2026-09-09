import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput } from 'react-native';
import { useAuth } from '../auth/AuthContext';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => { setLoading(true); try { await login(email.trim(), password); } finally { setLoading(false); } };
  return <SafeAreaView style={styles.container}><Text style={styles.title}>Building Maintenance</Text><TextInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input} /><TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} /><Pressable disabled={loading} onPress={submit} style={styles.button}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}</Pressable></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 }, title: { fontSize: 28, fontWeight: '700' }, input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 14 }, button: { backgroundColor: '#2563EB', borderRadius: 10, padding: 15, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '700' } });
