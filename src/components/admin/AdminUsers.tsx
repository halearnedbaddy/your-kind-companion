import { Search, MoreVertical, BadgeCheck, Loader, Download } from 'lucide-react';
import { useState } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { exportToCSV } from '@/utils/csvExport';

export function AdminUsers() {
    const [activeTab, setActiveTab] = useState<'SELLER' | 'BUYER'>('SELLER');
    const [searchTerm, setSearchTerm] = useState('');
    const { users, loading, error } = useAdminData();

    const filteredUsers = users.filter(u =>
        u.role === activeTab &&
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.phone.includes(searchTerm) ||
            u.id.includes(searchTerm))
    );

    const handleExportCSV = () => {
        const exportData = filteredUsers.map(user => ({
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive ? 'Yes' : 'No',
            isVerified: user.isVerified ? 'Yes' : 'No',
            availableBalance: user.wallet?.availableBalance || 0,
            pendingBalance: user.wallet?.pendingBalance || 0,
            joinedAt: new Date(user.memberSince).toISOString(),
        }));

        const columns = [
            { key: 'id' as const, label: 'User ID' },
            { key: 'name' as const, label: 'Name' },
            { key: 'phone' as const, label: 'Phone' },
            { key: 'role' as const, label: 'Role' },
            { key: 'isActive' as const, label: 'Active' },
            { key: 'isVerified' as const, label: 'Verified' },
            { key: 'availableBalance' as const, label: 'Available Balance (KES)' },
            { key: 'pendingBalance' as const, label: 'Pending Balance (KES)' },
            { key: 'joinedAt' as const, label: 'Joined At' },
        ];

        exportToCSV(exportData, `${activeTab.toLowerCase()}s_${new Date().toISOString().split('T')[0]}`, columns);
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
                <p className="font-bold">Failed to load users</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <button 
                    onClick={handleExportCSV}
                    disabled={filteredUsers.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={16} /> Export {activeTab === 'SELLER' ? 'Sellers' : 'Buyers'}
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex gap-6 px-6">
                        <button
                            onClick={() => setActiveTab('SELLER')}
                            className={`py-4 text-sm font-bold border-b-2 transition ${activeTab === 'SELLER' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Sellers ({users.filter(u => u.role === 'SELLER').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('BUYER')}
                            className={`py-4 text-sm font-bold border-b-2 transition ${activeTab === 'BUYER' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Buyers ({users.filter(u => u.role === 'BUYER').length})
                        </button>
                    </nav>
                </div>

                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-white text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">User Details</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Balance</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900">{user.name}</p>
                                                {user.isVerified && <BadgeCheck size={16} className="text-blue-500" />}
                                            </div>
                                            <p className="text-xs text-gray-500">{user.phone}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.isActive && user.isVerified ? 'bg-green-100 text-green-700' :
                                                user.isActive ? 'bg-blue-100 text-blue-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {user.isActive ? (user.isVerified ? 'Verified' : 'Active') : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <p className="font-semibold text-gray-900">KES {(user.wallet?.availableBalance || 0).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">Pending: {(user.wallet?.pendingBalance || 0).toLocaleString()}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(user.memberSince).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <MoreVertical size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No {activeTab.toLowerCase()}s found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
