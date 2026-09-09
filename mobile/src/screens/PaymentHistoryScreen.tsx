import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { listPaymentHistory } from '../services/payments';
import { PaymentHistoryRecord, PaymentStatus } from '../types/payment';

export function PaymentHistoryScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const canFilter = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [records, setRecords] = useState<PaymentHistoryRecord[]>([]);
  const today = new Date();
  const [month, setMonth] = useState(String(today.getMonth() + 1)); const [year, setYear] = useState(today.getFullYear());
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setRecords(await listPaymentHistory({
        month: month ? Number(month) : undefined, year: year || undefined,
        status: status || undefined, limit: 100,
      }));
    } catch (e: any) { setError(e.response?.data?.error || 'Unable to load payment history.'); }
    finally { setLoading(false); }
  }, [month, year, status]);
  useEffect(() => { void load(); }, [load]);
  return <SafeAreaView style={styles.container}><ScrollView>
    <Pressable onPress={onBack}><Text style={styles.back}>‹ Dashboard</Text></Pressable>
    <Text style={styles.title}>Payment history</Text>
    {canFilter ? <View style={styles.filters}>
      <Text style={styles.filterLabel}>Period</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.months}>{Array.from({ length: 12 }, (_, index) => index + 1).map((item) => <Pressable key={item} onPress={() => setMonth(String(item))} style={Number(month) === item ? styles.selectedPill : styles.pill}><Text style={Number(month) === item ? styles.selectedPillText : styles.pillText}>{new Date(2000, item - 1, 1).toLocaleString(undefined, { month: 'short' })}</Text></Pressable>)}</ScrollView>
      <View style={styles.yearRow}><Pressable onPress={() => setYear(year - 1)}><Text style={styles.link}>‹</Text></Pressable><Text style={styles.year}>{year}</Text><Pressable onPress={() => setYear(year + 1)}><Text style={styles.link}>›</Text></Pressable><Pressable onPress={() => { setMonth(''); setYear(today.getFullYear()); setStatus(''); }}><Text style={styles.link}>All periods</Text></Pressable></View>
      <View style={styles.actions}><Pressable onPress={() => setStatus(status === 'PAID' ? '' : 'PAID')}><Text style={status === 'PAID' ? styles.selected : styles.link}>Paid</Text></Pressable><Pressable onPress={() => setStatus(status === 'PENDING' ? '' : 'PENDING')}><Text style={status === 'PENDING' ? styles.selected : styles.link}>Pending</Text></Pressable><Pressable onPress={() => void load()}><Text style={styles.link}>Refresh</Text></Pressable></View>
    </View> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {loading ? <ActivityIndicator /> : records.length === 0 ? <View style={styles.empty}><Text>No payment records found for this period.</Text><Pressable onPress={() => void load()}><Text style={styles.link}>Retry</Text></Pressable></View> : records.map((record) => <View style={styles.card} key={record.id}>
      <Text style={styles.number}>{record.apartmentNumber} · {record.month}/{record.year}</Text>
      {canFilter ? <Text>{record.residentName}</Text> : null}
      <Text>{Number(record.amount).toFixed(2)} · {record.status}</Text>
      {record.paidDate ? <Text>Paid {record.paidDate}{record.collectorName ? ` · ${record.collectorName}` : ''}</Text> : null}
    </View>)}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, backgroundColor: '#F8FAFC' }, back: { color: '#2563EB', marginBottom: 12 }, title: { fontSize: 26, fontWeight: '700', marginBottom: 16 }, filters: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 14 }, filterLabel: { fontWeight: '700', marginBottom: 8 }, months: { gap: 6 }, pill: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8 }, selectedPill: { backgroundColor: '#2563EB', borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8 }, pillText: { color: '#334155' }, selectedPillText: { color: '#fff', fontWeight: '700' }, yearRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginVertical: 12 }, year: { fontSize: 17, fontWeight: '700' }, actions: { flexDirection: 'row', gap: 18 }, link: { color: '#2563EB', fontWeight: '600' }, selected: { color: '#047857', fontWeight: '700' }, error: { color: '#B91C1C', marginBottom: 10 }, empty: { backgroundColor: '#fff', padding: 18, borderRadius: 10, gap: 10 }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 }, number: { fontWeight: '700', fontSize: 17 } });
