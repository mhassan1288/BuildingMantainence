import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getReport } from '../services/reports';
import { Report } from '../types/report';

export function ReportsScreen({ onBack }: { onBack: () => void }) {
  const date = new Date();
  const [month, setMonth] = useState(date.getMonth() + 1);
  const [year, setYear] = useState(date.getFullYear());
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const m = month; const y = year;
    if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2000 || y > 2100) {
      setError('Enter a valid month (1-12) and year.'); return;
    }
    setLoading(true); setError('');
    try { setReport(await getReport(m, y)); } catch (e: any) {
      setError(e.response?.data?.error || 'Unable to load reports.');
    } finally { setLoading(false); }
  }, [month, year]);
  useEffect(() => { void load(); }, [load]);
  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><Text style={styles.link}>‹ Dashboard</Text></Pressable>
    <Text style={styles.title}>Collection reports</Text>
    <View style={styles.filters}><Text style={styles.filterLabel}>Period</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.months}>{Array.from({ length: 12 }, (_, index) => index + 1).map((item) => <Pressable key={item} onPress={() => setMonth(item)} style={month === item ? styles.selectedPill : styles.pill}><Text style={month === item ? styles.selectedPillText : styles.pillText}>{new Date(2000, item - 1, 1).toLocaleString(undefined, { month: 'short' })}</Text></Pressable>)}</ScrollView><View style={styles.yearRow}><Pressable onPress={() => setYear(year - 1)}><Text style={styles.link}>‹</Text></Pressable><Text style={styles.year}>{year}</Text><Pressable onPress={() => setYear(year + 1)}><Text style={styles.link}>›</Text></Pressable><Pressable accessibilityRole="button" onPress={() => void load()} style={styles.apply}><Text style={styles.applyText}>Refresh</Text></Pressable></View></View>
    {loading ? <View style={styles.feedback}><ActivityIndicator /><Text>Loading report…</Text></View> : error ? <View style={styles.feedback}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.link}>Try again</Text></Pressable></View> : !report || report.apartmentBreakdown.length === 0 ? <Text style={styles.empty}>No collection records for this period.</Text> : <><View style={styles.grid}>{[['Expected', report.expectedCollection], ['Collected', report.collected], ['Pending', report.pending]].map(([label, value]) => <View style={styles.card} key={String(label)}><Text style={styles.value}>{Number(value).toFixed(2)}</Text><Text>{label}</Text></View>)}</View><Text style={styles.section}>Status breakdown</Text>{report.statusBreakdown.map((item) => <View style={styles.row} key={item.status}><Text>{item.status}</Text><Text>{item.count} records · {item.amount.toFixed(2)}</Text></View>)}<Text style={styles.section}>Apartments</Text>{report.apartmentBreakdown.map((item) => <View style={styles.row} key={item.id}><View><Text style={styles.bold}>{item.apartmentNumber}</Text><Text>{item.residentName}</Text></View><Text>{item.status} · {item.amount.toFixed(2)}</Text></View>)}</>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F8FAFC' }, content: { padding: 20, paddingBottom: 40 }, back: { minHeight: 44, justifyContent: 'center' }, link: { color: '#2563EB', fontWeight: '700' }, title: { fontSize: 26, fontWeight: '700', marginBottom: 16 }, filters: { backgroundColor: '#fff', padding: 12, borderRadius: 12, gap: 8, marginBottom: 16 }, filterLabel: { fontWeight: '700' }, months: { gap: 6 }, pill: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8 }, selectedPill: { backgroundColor: '#2563EB', borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8 }, pillText: { color: '#334155' }, selectedPillText: { color: '#fff', fontWeight: '700' }, yearRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 8 }, year: { fontWeight: '700', fontSize: 17 }, apply: { backgroundColor: '#2563EB', borderRadius: 8, minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }, applyText: { color: '#fff', fontWeight: '700' }, feedback: { alignItems: 'center', gap: 10, padding: 28 }, error: { color: '#B91C1C', textAlign: 'center' }, empty: { color: '#64748B', textAlign: 'center', padding: 28 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexGrow: 1, minWidth: '30%' }, value: { fontSize: 20, fontWeight: '700' }, section: { fontSize: 18, fontWeight: '700', marginTop: 22, marginBottom: 8 }, row: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, bold: { fontWeight: '700' } });
