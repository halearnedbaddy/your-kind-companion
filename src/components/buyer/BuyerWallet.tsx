import { DollarSignIcon, TrendingUpIcon, ClockIcon, ArrowUpRightIcon, ArrowDownLeftIcon, LoaderIcon, RefreshCwIcon } from '@/components/icons';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

interface BuyerWalletProps {
  wallet: any;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

interface WalletTransaction {
  id: string;
  type: 'PURCHASE' | 'REFUND' | 'TOP_UP' | 'RELEASE';
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  transaction?: {
    itemName: string;
    seller?: { name: string };
  };
}

export function BuyerWallet({ wallet, loading, error, onRefresh }: BuyerWalletProps) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      // Use the buyer orders as transactions for now
      const response = await api.getBuyerOrders({ limit: 10 });
      if (response.success && response.data) {
        const ordersData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).data || [];
        
        // Transform orders to transaction-like format
        const txns = ordersData.map((order: any) => ({
          id: order.id,
          type: 'PURCHASE' as const,
          amount: order.amount,
          description: order.itemName,
          status: order.status,
          createdAt: order.createdAt,
          transaction: {
            itemName: order.itemName,
            seller: order.seller,
          },
        }));
        setTransactions(txns);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderIcon size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-bold">Failed to load wallet</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={onRefresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return <ArrowUpRightIcon className="text-red-500" size={20} />;
      case 'REFUND':
      case 'RELEASE':
        return <ArrowDownLeftIcon className="text-emerald-500" size={20} />;
      default:
        return <DollarSignIcon className="text-gray-500" size={20} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return 'text-red-600';
      case 'REFUND':
      case 'RELEASE':
        return 'text-emerald-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionSign = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return '-';
      case 'REFUND':
      case 'RELEASE':
        return '+';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <ArrowUpRightIcon className="text-white" size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">Available Balance</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            KES {(wallet?.availableBalance || wallet?.balance || 0).toLocaleString()}
          </h3>
          <div className="flex items-center gap-1 text-sm text-emerald-600">
            <TrendingUpIcon size={16} />
            <span>Ready to use</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Available for withdrawal</p>
        </div>

        {/* Pending Balance Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <ClockIcon className="text-white" size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">In Escrow</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            KES {(wallet?.pendingBalance || wallet?.escrowBalance || 0).toLocaleString()}
          </h3>
          <div className="flex items-center gap-1 text-sm text-orange-600">
            <ClockIcon size={16} />
            <span>Awaiting delivery</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Will be released after confirmation</p>
        </div>

        {/* Total Spent Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <TrendingUpIcon className="text-white" size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">Total Spent</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            KES {(wallet?.totalSpent || 0).toLocaleString()}
          </h3>
          <div className="flex items-center gap-1 text-sm text-blue-600">
            <TrendingUpIcon size={16} />
            <span>All time</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Across {wallet?.totalTransactions || transactions.length} purchases</p>
        </div>
      </div>

      {/* Transaction History Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
          <button
            onClick={fetchTransactions}
            disabled={transactionsLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCwIcon size={18} className={transactionsLoading ? 'animate-spin text-emerald-500' : 'text-gray-500'} />
          </button>
        </div>
        
        <div className="divide-y divide-gray-100">
          {transactionsLoading ? (
            <div className="p-8 text-center">
              <LoaderIcon size={24} className="animate-spin text-emerald-500 mx-auto" />
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    txn.type === 'PURCHASE' ? 'bg-red-100' : 'bg-emerald-100'
                  }`}>
                    {getTransactionIcon(txn.type)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{txn.description || 'Transaction'}</p>
                    <p className="text-xs text-gray-500">
                      {txn.transaction?.seller?.name && `${txn.transaction.seller.name} • `}
                      {new Date(txn.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${getTransactionColor(txn.type)}`}>
                    {getTransactionSign(txn.type)}KES {txn.amount.toLocaleString()}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      txn.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      txn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {txn.status}
                    </span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <DollarSignIcon size={32} className="mx-auto mb-2 opacity-50" />
              <p className="font-semibold">No transactions yet</p>
              <p className="text-sm">Your purchase history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}