import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createApartment, deleteApartment, listApartments, updateApartment } from '../services/apartments';
import { Apartment, ApartmentInput } from '../types/apartment';

const blank: ApartmentInput = { apartmentNumber: '', floor: 0, residentName: '', contactNumber: null, email: null, monthlyFee: 0, status: 'ACTIVE', notes: null };

export function ApartmentScreen({ onBack }: { onBack: () => void }) {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [form, setForm] = useState<ApartmentInput>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setApartments(await listApartments()); } catch { setError('Unable to load apartments.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const save = async () => {
    if (!form.apartmentNumber.trim() || !form.residentName.trim()) { setError('Apartment number and resident name are required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) await updateApartment(editing, form); else await createApartment(form);
      setForm(blank); setEditing(null); await load();
    } catch (e: any) { setError(e.response?.data?.error || 'Unable to save apartment.'); } finally { setSaving(false); }
  };
  const remove = (apartment: Apartment) => Alert.alert('Delete apartment?', apartment.apartmentNumber, [
    { text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteApartment(apartment.id); await load(); } catch { setError('Unable to delete apartment.'); } } },
  ]);
  const field = (label: string, key: keyof ApartmentInput, numeric = false) => <TextInput placeholder={label} value={String(form[key] ?? '')} keyboardType={numeric ? 'numeric' : 'default'} onChangeText={(value) => setForm({ ...form, [key]: numeric ? Number(value) || 0 : value })} style={styles.input} />;
  return <SafeAreaView style={styles.container}><ScrollView>
    <Pressable onPress={onBack}><Text style={styles.back}>‹ Dashboard</Text></Pressable>
    <Text style={styles.title}>Apartments</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.form}>{field('Apartment number', 'apartmentNumber')}{field('Floor', 'floor', true)}{field('Resident name', 'residentName')}{field('Contact number', 'contactNumber')}{field('Email', 'email')}{field('Monthly fee', 'monthlyFee', true)}
      <View style={styles.actions}><Pressable onPress={save} disabled={saving} style={styles.primary}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{editing ? 'Update' : 'Add apartment'}</Text>}</Pressable>{editing ? <Pressable onPress={() => { setEditing(null); setForm(blank); }}><Text>Cancel</Text></Pressable> : null}</View>
    </View>
    {loading ? <ActivityIndicator /> : apartments.length === 0 ? <View style={styles.empty}><Text>No apartments found.</Text><Pressable onPress={() => void load()}><Text style={styles.link}>Retry</Text></Pressable></View> : apartments.map((apartment) => <View key={apartment.id} style={styles.card}><Text style={styles.number}>{apartment.apartmentNumber}</Text><Text>{apartment.residentName} · Floor {apartment.floor}</Text><Text>${apartment.monthlyFee} · {apartment.status}</Text><View style={styles.actions}><Pressable onPress={() => { setEditing(apartment.id); setForm({ ...apartment, monthlyFee: Number(apartment.monthlyFee) }); }}><Text style={styles.link}>Edit</Text></Pressable><Pressable onPress={() => remove(apartment)}><Text style={styles.danger}>Delete</Text></Pressable></View></View>)}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, backgroundColor: '#F8FAFC' }, back: { color: '#2563EB', marginBottom: 12 }, title: { fontSize: 26, fontWeight: '700', marginBottom: 16 }, error: { color: '#B91C1C', marginBottom: 10 }, form: { backgroundColor: '#fff', padding: 14, borderRadius: 12, gap: 8, marginBottom: 16 }, input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10 }, actions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 8 }, primary: { backgroundColor: '#2563EB', borderRadius: 8, padding: 12 }, primaryText: { color: '#fff', fontWeight: '700' }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 }, empty: { backgroundColor: '#fff', padding: 18, borderRadius: 12, gap: 10 }, number: { fontWeight: '700', fontSize: 18 }, link: { color: '#2563EB', fontWeight: '600' }, danger: { color: '#B91C1C', fontWeight: '600' } });
