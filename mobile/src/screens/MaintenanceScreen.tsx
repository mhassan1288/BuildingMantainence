import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { createMaintenance, deleteMaintenance, listMaintenance, setMaintenancePaymentStatus, updateMaintenance } from '../services/maintenance';
import { listApartments } from '../services/apartments';
import { Apartment } from '../types/apartment';
import { MaintenanceInput, MaintenanceRecord } from '../types/maintenance';

const now = new Date();
const blank = (apartmentId = ''): MaintenanceInput => ({ apartmentId, month: now.getMonth() + 1, year: now.getFullYear(), amount: 0, status: 'PENDING' });
export function MaintenanceScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth(); const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [records, setRecords] = useState<MaintenanceRecord[]>([]); const [apartments, setApartments] = useState<Apartment[]>([]);
  const [form, setForm] = useState(blank(user?.apartmentId || ''));
  const [editing, setEditing] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setRecords(await listMaintenance()); } catch (e: any) { setError(e.response?.data?.error || 'Unable to load maintenance records.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (canManage) void listApartments().then(setApartments).catch(() => setError('Unable to load apartments for selection.')); }, [canManage]);
  const save = async () => {
    if (!form.apartmentId || form.month < 1 || form.month > 12 || form.year < 2000 || form.amount < 0) { setError('Enter a valid apartment, month, year, and amount.'); return; }
    setSaving(true); setError(''); try { if (editing) await updateMaintenance(editing, form); else await createMaintenance(form); setEditing(null); setForm(blank(user?.apartmentId || '')); await load(); } catch (e: any) { setError(e.response?.data?.error || 'Unable to save maintenance record.'); } finally { setSaving(false); }
  };
  const remove = (record: MaintenanceRecord) => Alert.alert('Delete maintenance record?', `${record.month}/${record.year}`, [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteMaintenance(record.id); await load(); } catch { setError('Unable to delete maintenance record.'); } } }]);
  const togglePaid = (record: MaintenanceRecord) => {
    const status = record.status === 'PAID' ? 'PENDING' : 'PAID';
    Alert.alert(status === 'PAID' ? 'Mark fee paid?' : 'Mark fee unpaid?', `${record.month}/${record.year}`, [
      { text: 'Cancel' },
      { text: 'Confirm', onPress: async () => { setSaving(true); setError(''); try { await setMaintenancePaymentStatus(record.id, status); await load(); } catch (e: any) { setError(e.response?.data?.error || 'Unable to update payment status.'); } finally { setSaving(false); } } },
    ]);
  };
  const field = (label: string, key: keyof MaintenanceInput, numeric = true) => <TextInput placeholder={label} value={String(form[key])} keyboardType={numeric ? 'numeric' : 'default'} onChangeText={(v) => setForm({ ...form, [key]: numeric ? Number(v) || 0 : v as any })} style={styles.input} />;
  return <SafeAreaView style={styles.container}><ScrollView><Pressable onPress={onBack}><Text style={styles.back}>‹ Dashboard</Text></Pressable><Text style={styles.title}>Maintenance records</Text>{error ? <Text style={styles.error}>{error}</Text> : null}
    {canManage ? <View style={styles.form}><Text style={styles.label}>Apartment</Text><View style={styles.apartmentChoices}>{apartments.map((apartment) => <Pressable key={apartment.id} onPress={() => setForm({ ...form, apartmentId: apartment.id })} style={form.apartmentId === apartment.id ? styles.choiceSelected : styles.choice}><Text style={form.apartmentId === apartment.id ? styles.choiceTextSelected : styles.choiceText}>{apartment.apartmentNumber}</Text></Pressable>)}</View>{field('Month (1-12)', 'month')}{field('Year', 'year')}{field('Amount', 'amount')}<View style={styles.actions}><Pressable onPress={save} disabled={saving} style={styles.primary}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{editing ? 'Update' : 'Add record'}</Text>}</Pressable>{editing ? <Pressable onPress={() => { setEditing(null); setForm(blank()); }}><Text>Cancel</Text></Pressable> : null}</View></View> : null}
    {loading ? <ActivityIndicator /> : records.length === 0 ? <View style={styles.empty}><Text>No maintenance records yet.</Text><Pressable onPress={() => void load()}><Text style={styles.link}>Retry</Text></Pressable></View> : records.map((record) => <View key={record.id} style={styles.card}><Text style={styles.number}>{record.apartmentNumber || 'Apartment'} · {record.month}/{record.year}</Text><Text>${Number(record.amount).toFixed(2)} · {record.status}</Text>{record.paidDate ? <Text>Paid {record.paidDate}</Text> : null}{canManage ? <View style={styles.actions}><Pressable onPress={() => togglePaid(record)} disabled={saving}>{saving ? <ActivityIndicator /> : <Text style={styles.link}>{record.status === 'PAID' ? 'Mark unpaid' : 'Mark paid'}</Text>}</Pressable><Pressable onPress={() => { setEditing(record.id); setForm({ apartmentId: record.apartmentId, month: record.month, year: record.year, amount: Number(record.amount), status: record.status }); }}><Text style={styles.link}>Edit</Text></Pressable><Pressable onPress={() => remove(record)}><Text style={styles.danger}>Delete</Text></Pressable></View> : null}</View>)}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, backgroundColor: '#F8FAFC' }, back: { color: '#2563EB', marginBottom: 12 }, title: { fontSize: 26, fontWeight: '700', marginBottom: 16 }, error: { color: '#B91C1C', marginBottom: 10 }, form: { backgroundColor: '#fff', padding: 14, borderRadius: 12, gap: 8, marginBottom: 16 }, label: { fontWeight: '600' }, apartmentChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10 }, choiceSelected: { backgroundColor: '#2563EB', borderRadius: 8, padding: 10 }, choiceText: { color: '#0F172A' }, choiceTextSelected: { color: '#fff', fontWeight: '700' }, input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10 }, actions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 8 }, primary: { backgroundColor: '#2563EB', borderRadius: 8, padding: 12 }, primaryText: { color: '#fff', fontWeight: '700' }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 }, number: { fontWeight: '700', fontSize: 18 }, link: { color: '#2563EB', fontWeight: '600' }, danger: { color: '#B91C1C', fontWeight: '600' }, empty: { backgroundColor: '#fff', padding: 18, borderRadius: 12, gap: 10 } });
