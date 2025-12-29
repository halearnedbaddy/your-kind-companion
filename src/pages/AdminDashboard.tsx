import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, AlertTriangle, Activity, Settings, Menu, X, LogOut, Shield, Store, Share2 } from 'lucide-react';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminTransactions } from '@/components/admin/AdminTransactions';
import { AdminDisputes } from '@/components/admin/AdminDisputes';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminStores } from '@/components/admin/AdminStores';
import { AdminSocial } from '@/components/admin/AdminSocial';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminNotificationCenter } from '@/components/admin/AdminNotificationCenter';
import { useAuth } from '@/contexts/AuthContext';
export function AdminDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'disputes' | 'users' | 'settings' | 'stores' | 'social'>('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'transactions', label: 'Transactions', icon: Activity },
        { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'stores', label: 'Stores', icon: Store },
        { id: 'social', label: 'Social Pages', icon: Share2 },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 bg-gray-900 text-white w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 flex flex-col`}>
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-2 font-black text-xl tracking-tight">
                        <Shield className="text-green-500" />
                        SWIFTLINE
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded ml-1 font-normal">ADMIN</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id as any);
                                    if (window.innerWidth < 768) setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition duration-200 ${activeTab === item.id
                                    ? 'bg-green-600 text-white shadow-lg shadow-green-900/20'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition">
                        <LogOut size={20} />
                        Logout
                    </button>
                    <div className="mt-4 flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center font-bold text-xs">
                            {user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-bold">{user?.name}</p>
                            <p className="text-xs text-gray-500">Administrator</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-gray-900">
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-bold capitalize hidden md:block">{activeTab}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <AdminNotificationCenter />
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {activeTab === 'overview' && <AdminOverview />}
                        {activeTab === 'transactions' && <AdminTransactions />}
                        {activeTab === 'disputes' && <AdminDisputes />}
                        {activeTab === 'users' && <AdminUsers />}
                        {activeTab === 'stores' && <AdminStores />}
                        {activeTab === 'social' && <AdminSocial />}
                        {activeTab === 'settings' && <AdminSettings />}
                    </div>
                </main>
            </div>
        </div>
    );
}
