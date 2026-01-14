import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardIcon, UsersIcon, AlertTriangleIcon, ActivityIcon, SettingsIcon, LogOutIcon, ShieldIcon, StoreIcon, ShareIcon, MenuIcon, XIcon } from '@/components/icons';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: DashboardIcon },
    { id: 'transactions', label: 'Transactions', icon: ActivityIcon },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangleIcon },
    { id: 'users', label: 'User Management', icon: UsersIcon },
    { id: 'stores', label: 'Stores', icon: StoreIcon },
    { id: 'social', label: 'Social Pages', icon: ShareIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Dark Navy Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-56 bg-[#1e293b] flex flex-col z-50 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <ShieldIcon className="text-white" size={18} />
            </div>
            <span className="text-white font-bold text-lg">SWIFTLINE</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-300 p-2 hover:bg-slate-700 rounded-lg">
            <XIcon size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as typeof activeTab);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout & Profile Footer */}
        <div className="mt-auto border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-6 py-4 text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOutIcon size={18} />
            <span>Logout</span>
          </button>
          <div className="p-4 bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name || 'Administrator'}</p>
                <p className="text-slate-400 text-xs truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-56 min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            >
              <MenuIcon size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 capitalize">
              {activeTab === 'users' ? 'User Management' : activeTab === 'social' ? 'Social Pages' : activeTab}
            </h1>
          </div>
          <AdminNotificationCenter />
        </header>

        {/* Content Area */}
        <main className="p-6">
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
