import { useState } from 'react';
import authService from '../services/authService';

function Profile({ user }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await authService.updatePassword(currentPassword, newPassword);
      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Profile Settings</h2>

      {/* User Info Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Email</label>
            <p className="mt-1 text-sm text-white">{user.email}</p>
          </div>
          {user.name && (
            <div>
              <label className="block text-sm font-medium text-gray-300">Name</label>
              <p className="mt-1 text-sm text-white">{user.name}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300">User ID</label>
            <p className="mt-1 text-sm text-gray-400 font-mono">{user.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Account Created</label>
            <p className="mt-1 text-sm text-white">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
        
        {message && (
          <div className="mb-4 bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white placeholder-gray-500 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
              placeholder="Enter current password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white placeholder-gray-500 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
              placeholder="Enter new password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md bg-slate-900 border-slate-600 text-white placeholder-gray-500 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] hover:to-[#653a8b] text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 shadow-lg transition-all"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* App Info Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">About This Application</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>
            <strong className="text-white">Application:</strong> NeuroTune - EEG Neurofeedback System
          </p>
          <p>
            <strong className="text-white">Version:</strong> 1.0.0
          </p>
          <p>
            <strong className="text-white">Purpose:</strong> Real-time neurofeedback for cognitive enhancement using EEG brain signals
          </p>
          <p className="mt-4 text-xs text-gray-400">
            This application uses JWT authentication for secure user management and MongoDB for session data storage.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
