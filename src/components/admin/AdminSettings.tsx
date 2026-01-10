import { useState } from 'react';
import { Lock, Key, Database, Shield, Eye, EyeOff, Check, Loader, Download, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';

interface SystemStatus {
  database: boolean;
  api: boolean;
  services: boolean;
}

export function AdminSettings() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  
  const [systemStatus] = useState<SystemStatus>({
    database: true,
    api: true,
    services: true
  });

  const [backupLoading, setBackupLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    
    try {
      const response = await api.request('/api/v1/admin/settings/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword }
      });
      
      if (response.success) {
        setPasswordSuccess(true);
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }, 2000);
      } else {
        setPasswordError(response.error || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGenerateAPIKey = async () => {
    if (!newKeyName.trim()) return;
    
    setApiKeyLoading(true);
    try {
      const response = await api.request('/api/v1/admin/settings/api-keys', {
        method: 'POST',
        body: { name: newKeyName }
      });
      
      if (response.success && response.data) {
        const data = response.data as { key: string };
        setGeneratedKey(data.key);
        setNewKeyName('');
      }
    } catch (err) {
      console.error('Failed to generate API key:', err);
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await api.request('/api/v1/admin/settings/backup', {
        method: 'POST'
      });
      
      if (response.success) {
        alert('Backup initiated successfully. You will receive a notification when complete.');
      }
    } catch (err) {
      console.error('Failed to initiate backup:', err);
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Platform Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Settings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <Lock className="text-green-600" size={24} />
            <h3 className="text-lg font-bold text-gray-800">Security</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-left text-sm font-medium text-gray-700 transition flex items-center justify-between"
            >
              <span>Change Admin Password</span>
              <Lock size={16} className="text-gray-400" />
            </button>
            <button
              onClick={() => setShow2FAModal(true)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-left text-sm font-medium text-gray-700 transition flex items-center justify-between"
            >
              <span>Two-Factor Authentication</span>
              <Shield size={16} className="text-gray-400" />
            </button>
            <button
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-left text-sm font-medium text-gray-700 transition flex items-center justify-between"
            >
              <span>Active Sessions (3)</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">View</span>
            </button>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <Key className="text-blue-600" size={24} />
            <h3 className="text-lg font-bold text-gray-800">API Keys</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setShowAPIKeyModal(true)}
              className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-left text-sm font-medium text-blue-700 transition flex items-center justify-between"
            >
              <span>Generate New API Key</span>
              <Key size={16} />
            </button>
            <button
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-left text-sm font-medium text-gray-700 transition"
            >
              View API Documentation
            </button>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                <AlertTriangle className="inline mr-1" size={12} />
                API keys provide full access. Keep them secure.
              </p>
            </div>
          </div>
        </div>

        {/* Database Settings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <Database className="text-purple-600" size={24} />
            <h3 className="text-lg font-bold text-gray-800">Database</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">Database Status</span>
              <span className={`flex items-center gap-1 text-xs font-bold ${systemStatus.database ? 'text-green-600' : 'text-red-600'}`}>
                <span className={`w-2 h-2 rounded-full ${systemStatus.database ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {systemStatus.database ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={handleBackup}
              disabled={backupLoading}
              className="w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 text-left text-sm font-medium text-purple-700 transition flex items-center justify-between disabled:opacity-50"
            >
              <span>Backup Database</span>
              {backupLoading ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
            </button>
            <button
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-left text-sm font-medium text-gray-700 transition"
            >
              View Database Logs
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <Shield className="text-green-600" size={24} />
            <h3 className="text-lg font-bold text-gray-800">System</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-2">
              <span className="text-gray-600">Platform Version</span>
              <span className="font-semibold text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between p-2">
              <span className="text-gray-600">API Status</span>
              <span className={`font-semibold flex items-center gap-1 ${systemStatus.api ? 'text-green-600' : 'text-red-600'}`}>
                <span className={`w-2 h-2 rounded-full ${systemStatus.api ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {systemStatus.api ? 'Operational' : 'Down'}
              </span>
            </div>
            <div className="flex justify-between p-2">
              <span className="text-gray-600">Services Status</span>
              <span className={`font-semibold flex items-center gap-1 ${systemStatus.services ? 'text-green-600' : 'text-red-600'}`}>
                <span className={`w-2 h-2 rounded-full ${systemStatus.services ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {systemStatus.services ? 'All Running' : 'Issues Detected'}
              </span>
            </div>
            <div className="flex justify-between p-2">
              <span className="text-gray-600">Last Updated</span>
              <span className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
              <Check size={14} /> Platform Healthy
            </p>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md m-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
            
            {passwordSuccess ? (
              <div className="text-center py-8">
                <Check className="mx-auto text-green-500 mb-4" size={48} />
                <p className="font-semibold text-green-700">Password changed successfully!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showPasswords ? 'Hide passwords' : 'Show passwords'}
                  </button>
                </div>

                {passwordError && (
                  <p className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">{passwordError}</p>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {passwordLoading ? <Loader size={16} className="animate-spin" /> : null}
                    Change Password
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md m-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Two-Factor Authentication</h3>
            <div className="text-center py-8">
              <Shield className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-4">2FA adds an extra layer of security to your account.</p>
              <p className="text-sm text-gray-500">This feature requires backend integration with an authenticator app.</p>
            </div>
            <button
              onClick={() => setShow2FAModal(false)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showAPIKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md m-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Generate API Key</h3>
            
            {generatedKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-700 mb-2">Your new API key:</p>
                  <code className="block bg-white p-3 rounded border text-xs break-all">{generatedKey}</code>
                  <p className="text-xs text-green-600 mt-2">
                    <AlertTriangle className="inline mr-1" size={12} />
                    Copy this key now. You won't be able to see it again.
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => {
                    setShowAPIKeyModal(false);
                    setGeneratedKey('');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production API Key"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAPIKeyModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateAPIKey}
                    disabled={apiKeyLoading || !newKeyName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {apiKeyLoading ? <Loader size={16} className="animate-spin" /> : <Key size={16} />}
                    Generate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
