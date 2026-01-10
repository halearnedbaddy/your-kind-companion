import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export interface DashboardMetrics {
  users: { total: number; buyers: number; sellers: number };
  transactions: { total: number; pending: number; completed: number };
  volume: { total: number; currency: string };
  disputes: { open: number };
}

export interface AdminTransaction {
  id: string;
  itemName: string;
  amount: number;
  status: string;
  seller: { name: string; phone: string };
  buyer?: { name: string; phone: string };
  createdAt: string;
}

export interface AdminDispute {
  id: string;
  transactionId: string;
  status: string;
  reason: string;
  transaction: {
    itemName: string;
    amount: number;
    seller: { name: string };
    buyer?: { name: string };
  };
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: string;
  signupMethod: 'PHONE_OTP' | 'EMAIL_PASSWORD' | 'ADMIN_CREATED';
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isVerified: boolean;
  isActive: boolean;
  memberSince: string;
  wallet?: { availableBalance: number; pendingBalance: number };
}

export function useAdminData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [metricsRes, transactionsRes, disputesRes, usersRes] = await Promise.all([
        api.request('/api/v1/admin/dashboard'),
        api.request('/api/v1/admin/transactions?page=1&limit=20'),
        api.request('/api/v1/admin/disputes?page=1&limit=20'),
        api.request('/api/v1/admin/users?page=1&limit=20'),
      ]);

      if (metricsRes.success && metricsRes.data) setMetrics(metricsRes.data as DashboardMetrics);
      if (transactionsRes.success && transactionsRes.data) setTransactions(transactionsRes.data as AdminTransaction[]);
      if (disputesRes.success && disputesRes.data) setDisputes(disputesRes.data as AdminDispute[]);
      if (usersRes.success && usersRes.data) setUsers(usersRes.data as AdminUser[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  return { metrics, transactions, disputes, users, loading, error, refetch: fetchAllData };
}
