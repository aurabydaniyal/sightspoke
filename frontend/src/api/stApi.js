import { adminApi } from './axiosConfig';

// ============================================================
// SETTINGS API
// ============================================================

/**
 * Get all statistics for settings dashboard
 */
export const getSettingsStats = async () => {
  const response = await adminApi.get('/settings/stats');
  return response.data;
};

/**
 * Delete all images
 */
export const deleteAllImages = async () => {
  const response = await adminApi.delete('/settings/delete-all-images');
  return response.data;
};

/**
 * Clear all chat logs
 */
export const clearAllChats = async () => {
  const response = await adminApi.delete('/settings/clear-all-chats');
  return response.data;
};

/**
 * Delete all responses
 */
export const deleteAllResponses = async () => {
  const response = await adminApi.delete('/settings/delete-all-responses');
  return response.data;
};

/**
 * Delete ALL data (Danger Zone)
 */
export const deleteAllData = async () => {
  const response = await adminApi.delete('/settings/delete-all-data');
  return response.data;
};

/**
 * Update admin password
 */
export const updatePassword = async (oldPassword, newPassword, confirmPassword) => {
  const response = await adminApi.post('/settings/update-password', {
    old_password: oldPassword,
    new_password: newPassword,
    confirm_password: confirmPassword
  });
  return response.data;
};