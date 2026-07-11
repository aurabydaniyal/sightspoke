import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDatabase, faTrash, faExclamationTriangle, faCheckCircle, faRefresh,
  faTimes, faKey, faLock, faEye, faEyeSlash,
  faFileAlt, faComments, faUsers, faBrain, faImage
} from '@fortawesome/free-solid-svg-icons';
import { useAlert } from '../common/CustomAlert';
import { 
  getSettingsStats,
  deleteAllImages,
  clearAllChats,
  deleteAllResponses,
  deleteAllData,
  updatePassword
} from '../../api/stApi';

const Settings = () => {
  const { success, error, warning, info, confirm } = useAlert();
  
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_quizzes: 0,
    total_images: 0,
    total_responses: 0,
    total_chats: 0,
    total_participants: 0,
    total_insights: 0
  });
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getSettingsStats();
      setStats(data);
    } catch (err) {
      error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ACTION HANDLERS
  // ============================================================

  const handleDeleteAllImages = async () => {
    const confirmed = await confirm(
      'This will permanently delete ALL images from the database and disk. This action cannot be undone.',
      'Delete All Images'
    );
    if (!confirmed) return;
    try {
      const result = await deleteAllImages();
      success(`Deleted ${result.images_deleted} images`);
      loadStats();
    } catch (err) {
      error('Failed to delete images');
    }
  };

  const handleClearAllChats = async () => {
    const confirmed = await confirm(
      'This will permanently delete ALL chat logs. This action cannot be undone.',
      'Clear All Chats'
    );
    if (!confirmed) return;
    try {
      const result = await clearAllChats();
      success(`Cleared ${result.chats_deleted} chat messages`);
      loadStats();
    } catch (err) {
      error('Failed to clear chats');
    }
  };

  const handleDeleteAllResponses = async () => {
    const confirmed = await confirm(
      'This will permanently delete ALL responses. This action cannot be undone.',
      'Delete All Responses'
    );
    if (!confirmed) return;
    try {
      const result = await deleteAllResponses();
      success(`Deleted ${result.responses_deleted} responses`);
      loadStats();
    } catch (err) {
      error('Failed to delete responses');
    }
  };

  const handleDeleteAllData = async () => {
    const confirmed = await confirm(
      '⚠️ DANGER: This will permanently delete EVERYTHING. This action CANNOT be undone!',
      'Delete All Data'
    );
    if (!confirmed) return;
    try {
      const result = await deleteAllData();
      success('All data deleted successfully');
      loadStats();
    } catch (err) {
      error('Failed to delete all data');
    }
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword.trim()) {
      warning('Please enter your current password');
      return;
    }
    if (!newPassword.trim()) {
      warning('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      warning('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      warning('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword(oldPassword, newPassword, confirmPassword);
      success('Password updated successfully!');
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ============================================================
  // STATS CARDS
  // ============================================================

  const statsCards = [
    { label: 'Quizzes', value: stats.total_quizzes, icon: faFileAlt, color: '#428475' },
    { label: 'Images', value: stats.total_images, icon: faImage, color: '#89D7B7' },
    { label: 'Responses', value: stats.total_responses, icon: faCheckCircle, color: '#1A312C' },
    { label: 'Chats', value: stats.total_chats, icon: faComments, color: '#428475' },
    { label: 'Participants', value: stats.total_participants, icon: faUsers, color: '#89D7B7' },
    { label: 'AI Insights', value: stats.total_insights, icon: faBrain, color: '#1A312C' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A312C]">Settings</h1>
          <p className="text-[#1A312C]/50 text-sm">Manage your SightSpoke instance and data</p>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="btn-glass !py-2 !px-4 text-sm flex items-center gap-2 w-[120px] justify-center"
        >
          <FontAwesomeIcon icon={faRefresh} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="glass-card p-4 text-center">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: `${stat.color}20` }}
            >
              <FontAwesomeIcon icon={stat.icon} style={{ color: stat.color }} className="text-lg" />
            </div>
            <p className="text-2xl font-bold text-[#1A312C]">{stat.value}</p>
            <p className="text-xs text-[#1A312C]/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Data Management */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-[#1A312C] flex items-center gap-2 mb-4">
            <FontAwesomeIcon icon={faDatabase} className="text-[#428475]" />
            Data Management
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#428475]/5 rounded-lg">
              <div className="text-left">
                <p className="text-sm font-medium text-[#1A312C]">Delete All Images</p>
                <p className="text-xs text-[#1A312C]/40">Remove all images from database and disk</p>
              </div>
              <button
                onClick={handleDeleteAllImages}
                className="btn-glass !py-1.5 !px-3 text-sm text-red-500 hover:bg-red-500/10 w-[90px] justify-center flex items-center gap-1 flex-shrink-0"
              >
                <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#428475]/5 rounded-lg">
              <div className="text-left">
                <p className="text-sm font-medium text-[#1A312C]">Clear All Chat Logs</p>
                <p className="text-xs text-[#1A312C]/40">Remove all chat history</p>
              </div>
              <button
                onClick={handleClearAllChats}
                className="btn-glass !py-1.5 !px-3 text-sm text-red-500 hover:bg-red-500/10 w-[90px] justify-center flex items-center gap-1 flex-shrink-0"
              >
                <FontAwesomeIcon icon={faTrash} className="text-xs" /> Clear
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#428475]/5 rounded-lg">
              <div className="text-left">
                <p className="text-sm font-medium text-[#1A312C]">Delete All Responses</p>
                <p className="text-xs text-[#1A312C]/40">Remove all survey responses</p>
              </div>
              <button
                onClick={handleDeleteAllResponses}
                className="btn-glass !py-1.5 !px-3 text-sm text-red-500 hover:bg-red-500/10 w-[90px] justify-center flex items-center gap-1 flex-shrink-0"
              >
                <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone + Password */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-red-500/20">
            <h3 className="font-semibold text-red-500 flex items-center gap-2 mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              Danger Zone
            </h3>
            
            <div className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/10">
              <div className="text-left">
                <p className="text-sm font-medium text-[#1A312C]">Delete All Data</p>
                <p className="text-xs text-[#1A312C]/40">Permanently delete EVERYTHING</p>
              </div>
              <button
                onClick={handleDeleteAllData}
                className="btn-glass !py-1.5 !px-3 text-sm text-red-500 hover:bg-red-500/10 w-[90px] justify-center flex items-center gap-1 flex-shrink-0"
              >
                <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete All
              </button>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold text-[#1A312C] flex items-center gap-2 mb-4">
              <FontAwesomeIcon icon={faKey} className="text-[#428475]" />
              Security
            </h3>
            
            <div className="flex items-center justify-between p-3 bg-[#428475]/5 rounded-lg">
              <div className="text-left">
                <p className="text-sm font-medium text-[#1A312C]">Update Password</p>
                <p className="text-xs text-[#1A312C]/40">Change your admin password</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="btn-glass !py-1.5 !px-3 text-sm w-[90px] justify-center flex items-center gap-1 flex-shrink-0"
              >
                <FontAwesomeIcon icon={faLock} className="text-xs" /> Change
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
           PASSWORD MODAL - PERFECTLY CENTERED
      ============================================================ */}
      <AnimatePresence>
        {showPasswordModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
            />

            {/* Modal - Perfectly Centered */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-[92vw] max-w-md max-h-[90vh] overflow-y-auto"
              >
                <div 
                  className="glass-card p-6 sm:p-8 relative"
                  style={{
                    background: 'rgba(26, 49, 44, 0.96)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(137, 215, 183, 0.15)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[#FFF4E1]/40 hover:text-[#FFF4E1] transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                  </button>

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#428475]/20 flex items-center justify-center">
                      <FontAwesomeIcon icon={faKey} className="text-[#89D7B7] text-xl" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#FFF4E1]">Update Password</h2>
                      <p className="text-xs text-[#FFF4E1]/50">Change your admin password</p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    {/* Old Password */}
                    <div>
                      <label className="block text-sm font-medium text-[#FFF4E1]/70 mb-1">
                        Current Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? 'text' : 'password'}
                          placeholder="Enter current password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full bg-[#FFF4E1]/10 rounded-xl px-4 py-3 text-[#FFF4E1] placeholder-[#FFF4E1]/30 focus:outline-none focus:ring-2 focus:ring-[#428475] pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFF4E1]/40 hover:text-[#FFF4E1]"
                        >
                          <FontAwesomeIcon icon={showOldPassword ? faEyeSlash : faEye} />
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-[#FFF4E1]/70 mb-1">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Enter new password (min 6 chars)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-[#FFF4E1]/10 rounded-xl px-4 py-3 text-[#FFF4E1] placeholder-[#FFF4E1]/30 focus:outline-none focus:ring-2 focus:ring-[#428475] pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFF4E1]/40 hover:text-[#FFF4E1]"
                        >
                          <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-[#FFF4E1]/70 mb-1">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-[#FFF4E1]/10 rounded-xl px-4 py-3 text-[#FFF4E1] placeholder-[#FFF4E1]/30 focus:outline-none focus:ring-2 focus:ring-[#428475] pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFF4E1]/40 hover:text-[#FFF4E1]"
                        >
                          <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                        </button>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleUpdatePassword}
                        disabled={passwordLoading}
                        className="btn-neon flex-1 justify-center !py-3 disabled:opacity-50"
                      >
                        {passwordLoading ? (
                          <><span className="animate-spin mr-2">⏳</span> Updating...</>
                        ) : (
                          <><FontAwesomeIcon icon={faCheckCircle} className="mr-2" /> Update Password</>
                        )}
                      </button>
                      <button
                        onClick={() => setShowPasswordModal(false)}
                        className="btn-glass flex-1 justify-center !py-3 text-white hover:text-[#1A312C] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;