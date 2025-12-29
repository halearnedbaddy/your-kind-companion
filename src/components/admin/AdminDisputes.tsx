import { MessageSquare, AlertTriangle, CheckCircle, XCircle, Loader, Download } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { useState } from 'react';
import { exportToCSV } from '@/utils/csvExport';

export function AdminDisputes() {
    const { disputes, loading, error, refetch } = useAdminData();
    const [resolving, setResolving] = useState<string | null>(null);

    const handleResolveDispute = async (disputeId: string, favoriteSide: 'buyer' | 'seller') => {
        setResolving(disputeId);
        try {
            await fetch(`/api/v1/admin/disputes/${disputeId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    resolution: `Dispute resolved in favor of ${favoriteSide}`,
                    favoriteSide
                })
            });
            await refetch();
        } catch (err) {
            console.error('Failed to resolve dispute:', err);
        } finally {
            setResolving(null);
        }
    };

    const handleExportCSV = () => {
        const exportData = disputes.map(dispute => ({
            id: dispute.id,
            transactionId: dispute.transactionId,
            reason: dispute.reason,
            status: dispute.status,
            itemName: dispute.transaction?.itemName || 'N/A',
            amount: dispute.transaction?.amount || 0,
            sellerName: dispute.transaction?.seller?.name || 'N/A',
            buyerName: dispute.transaction?.buyer?.name || 'N/A',
            createdAt: new Date(dispute.createdAt).toISOString(),
        }));

        const columns = [
            { key: 'id' as const, label: 'Dispute ID' },
            { key: 'transactionId' as const, label: 'Transaction ID' },
            { key: 'reason' as const, label: 'Reason' },
            { key: 'status' as const, label: 'Status' },
            { key: 'itemName' as const, label: 'Item' },
            { key: 'amount' as const, label: 'Amount (KES)' },
            { key: 'sellerName' as const, label: 'Seller' },
            { key: 'buyerName' as const, label: 'Buyer' },
            { key: 'createdAt' as const, label: 'Created At' },
        ];

        exportToCSV(exportData, `disputes_${new Date().toISOString().split('T')[0]}`, columns);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader size={32} className="animate-spin text-green-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
                <p className="font-bold">Failed to load disputes</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dispute Resolution Center</h2>
                    <p className="text-sm text-gray-500">Total disputes: {disputes.length}</p>
                </div>
                <button 
                    onClick={handleExportCSV}
                    disabled={disputes.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {disputes.length > 0 ? (
                    disputes.map((dispute) => (
                        <div key={dispute.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${dispute.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {dispute.status}
                                    </span>
                                    <span className="text-gray-400 text-sm">Case #{dispute.id}</span>
                                    <span className="text-gray-400 text-sm">• {new Date(dispute.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{dispute.reason}</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Transaction: <span className="font-mono text-blue-600">{dispute.transaction.itemName}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">{dispute.transaction.seller.name}</span>
                                        {dispute.transaction.buyer && ` ↔ ${dispute.transaction.buyer.name}`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm max-w-md">
                                    <AlertTriangle size={16} />
                                    <span className="font-bold">Amount at Risk: KES {dispute.transaction.amount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                                <button className="w-full py-2 px-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black transition flex items-center justify-center gap-2">
                                    <MessageSquare size={16} /> View Evidence
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleResolveDispute(dispute.id, 'seller')}
                                        disabled={resolving === dispute.id}
                                        className="py-2 px-3 border border-green-200 bg-green-50 text-green-700 rounded-lg font-semibold hover:bg-green-100 transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                                    >
                                        <CheckCircle size={14} /> Release
                                    </button>
                                    <button
                                        onClick={() => handleResolveDispute(dispute.id, 'buyer')}
                                        disabled={resolving === dispute.id}
                                        className="py-2 px-3 border border-red-200 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                                    >
                                        <XCircle size={14} /> Refund
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                        <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-gray-900">All Clear!</h3>
                        <p className="text-gray-500">There are no open disputes requiring attention.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
