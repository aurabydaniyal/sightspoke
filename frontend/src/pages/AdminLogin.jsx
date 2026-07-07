import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faLock, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(password);
    
    if (result.success) {
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard');
    } else {
      toast.error(result.error || 'Invalid credentials');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1A312C] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-30%] right-[-20%] w-[500px] h-[500px] rounded-full bg-[#89D7B7]/10 blur-3xl" />
      <div className="absolute bottom-[-30%] left-[-20%] w-[500px] h-[500px] rounded-full bg-[#428475]/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <FontAwesomeIcon icon={faBolt} className="text-[#89D7B7] text-4xl" />
            <span className="text-white font-bold text-3xl">SightSpoke</span>
          </motion.div>
          <p className="text-white/50 text-sm">Admin Portal</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 md:p-10">
          <h2 className="text-2xl font-bold text-[#1A312C] mb-2">Welcome Back</h2>
          <p className="text-[#1A312C]/60 text-sm mb-6">Enter your password to continue</p>

          <form onSubmit={handleSubmit}>
            <div className="relative mb-6">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#428475]">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-modern pl-12 pr-4 py-3.5"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-neon w-full justify-center text-lg py-3.5"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <FontAwesomeIcon icon={faArrowRight} />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-[#1A312C]/40 text-xs">          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;