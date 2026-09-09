import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { ApartmentScreen } from './ApartmentScreen';
import { MaintenanceScreen } from './MaintenanceScreen';
import { PaymentHistoryScreen } from './PaymentHistoryScreen';
import { ReportsScreen } from './ReportsScreen';
import { getDashboardSummary, getResidentDashboard } from '../services/dashboard';
import { DashboardSummary, ResidentDashboard } from '../types/dashboard';

const cards = { ADMIN: ['Total Apartments', 'Expected Collection', 'Collected', 'Pending'], MANAGER: ['Total Apartments', 'Expected Collection', 'Collected', 'Pending'], USER: ['My Apartment', 'Current Month', 'Payment Status', 'Total Paid', 'Total Pending'] } as const;
export function DashboardScreen() {
  const { user, logout } = useAuth();
  const [apartmentsOpen, setApartmentsOpen] = React.useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = React.useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = React.useState(false);
  const [reportsOpen, setReportsOpen] = React.useState(false);
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);
  const [residentDashboard, setResidentDashboard] = React.useState<ResidentDashboard | null>(null);
  const [residentLoading, setResidentLoading] = React.useState(false);
  const [residentError, setResidentError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!user || user.role === 'USER') return;
    let active = true;
    setSummaryLoading(true);
    setSummaryError(null);
    getDashboardSummary()
      .then((value) => { if (active) setSummary(value); })
      .catch((error: any) => {
        if (active) setSummaryError(error.response?.data?.error || 'Unable to load dashboard summary.');
      })
      .finally(() => { if (active) setSummaryLoading(false); });
    return () => { active = false; };
  }, [user]);
  React.useEffect(() => {
    if (!user || user.role !== 'USER') return;
    let active = true;
    setResidentLoading(true);
    setResidentError(null);
    getResidentDashboard()
      .then((value) => { if (active) setResidentDashboard(value); })
      .catch((error: any) => {
        if (active) setResidentError(error.response?.data?.error || 'Unable to load your dashboard.');
      })
      .finally(() => { if (active) setResidentLoading(false); });
    return () => { active = false; };
  }, [user]);
  if (!user) return null;
  if (apartmentsOpen) return <ApartmentScreen onBack={() => setApartmentsOpen(false)} />;
  if (maintenanceOpen) return <MaintenanceScreen onBack={() => setMaintenanceOpen(false)} />;
  if (paymentHistoryOpen) return <PaymentHistoryScreen onBack={() => setPaymentHistoryOpen(false)} />;
  if (reportsOpen) return <ReportsScreen onBack={() => setReportsOpen(false)} />;
  const values = user.role === 'USER'
    ? residentLoading ? ['...', '...', '...', '...', '...'] : residentError ? ['!', '!', '!', '!', '!'] : [residentDashboard?.apartment.apartmentNumber ?? '--', residentDashboard ? `${residentDashboard.month}/${residentDashboard.year}` : '--', residentDashboard?.currentMonth.status ?? '--', formatCurrency(residentDashboard?.totalPaid ?? 0), formatCurrency(residentDashboard?.totalPending ?? 0)]
    : summaryLoading ? ['...', '...', '...', '...'] : summaryError ? ['!', '!', '!', '!'] : [String(summary?.totalApartments ?? 0), formatCurrency(summary?.expectedCollection ?? 0), formatCurrency(summary?.collected ?? 0), formatCurrency(summary?.pending ?? 0)];
  return <SafeAreaView style={styles.container}><Text style={styles.title}>{user.role === 'USER' ? 'Resident Dashboard' : `${user.role === 'ADMIN' ? 'Admin' : 'Manager'} Dashboard`}</Text><Text style={styles.welcome}>Welcome, {user.name}</Text>{user.role === 'USER' && residentDashboard ? <View style={styles.apartmentInfo}><Text style={styles.infoTitle}>Apartment {residentDashboard.apartment.apartmentNumber}</Text><Text>Floor {residentDashboard.apartment.floor} · Monthly fee {formatCurrency(residentDashboard.apartment.monthlyFee)}</Text></View> : null}{summaryError || residentError ? <Text style={styles.error}>{summaryError || residentError}</Text> : null}<View style={styles.grid}>{cards[user.role].map((label, index) => <View key={label} style={styles.card}><Text style={styles.value}>{values[index]}</Text><Text>{label}</Text></View>)}</View>{user.role !== 'USER' ? <Pressable onPress={() => setApartmentsOpen(true)} style={styles.apartments}><Text style={styles.apartmentsText}>Manage apartments</Text></Pressable> : null}<Pressable onPress={() => setMaintenanceOpen(true)} style={styles.apartments}><Text style={styles.apartmentsText}>{user.role === 'USER' ? 'View maintenance records' : 'Manage maintenance records'}</Text></Pressable><Pressable onPress={() => setPaymentHistoryOpen(true)} style={styles.apartments}><Text style={styles.apartmentsText}>Payment history</Text></Pressable>{user.role !== 'USER' ? <Pressable onPress={() => setReportsOpen(true)} style={styles.apartments}><Text style={styles.apartmentsText}>Collection reports</Text></Pressable> : null}<Pressable onPress={logout} style={styles.logout}><Text style={styles.logoutText}>Logout</Text></Pressable></SafeAreaView>;
}
const formatCurrency = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, backgroundColor: '#F8FAFC' }, title: { fontSize: 26, fontWeight: '700' }, welcome: { color: '#64748B', marginVertical: 18 }, error: { color: '#B91C1C', marginBottom: 12 }, apartmentInfo: { backgroundColor: '#E0F2FE', borderRadius: 12, padding: 14, marginBottom: 14 }, infoTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '47%', minHeight: 90 }, value: { fontSize: 24, fontWeight: '700', marginBottom: 8 }, apartments: { marginTop: 20, backgroundColor: '#2563EB', padding: 15, borderRadius: 10, alignItems: 'center' }, apartmentsText: { color: '#fff', fontWeight: '700' }, logout: { marginTop: 'auto', backgroundColor: '#0F172A', padding: 15, borderRadius: 10, alignItems: 'center' }, logoutText: { color: '#fff', fontWeight: '700' } });
