import React from 'react';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { useAuth } from '../auth/AuthContext';

export function AppNavigator() {
  const { user } = useAuth();
  return user ? <DashboardScreen /> : <LoginScreen />;
}
