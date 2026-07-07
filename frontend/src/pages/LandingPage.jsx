import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faArrowRight } from '@fortawesome/free-solid-svg-icons';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1A312C] flex items-center justify-center relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full bg-[#89D7B7]/10 blur-3xl" />
      <div className="absolute bottom-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full bg-[#428475]/10 blur-3xl" />

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center z-10 px-6 max-w-4xl mx-auto"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <FontAwesomeIcon icon={faBolt} className="text-[#89D7B7] text-6xl md:text-7xl" />
          <span className="text-white font-extrabold text-5xl md:text-7xl tracking-tight">
            SightSpoke
          </span>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[#89D7B7] text-xl md:text-2xl font-light tracking-wide mb-6"
        >
          Visual Preference Testing Platform
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12"
        >
          Capture what users choose, how quickly they choose, and how consistently they choose — 
          <span className="text-[#89D7B7]"> without a single written word.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate('/admin/login')}
            className="btn-neon text-lg px-10 py-4 rounded-xl shadow-2xl"
          >
            Enter Admin Portal
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </button>
          <button
            onClick={() => navigate('/quiz')}
            className="btn-glass text-lg px-10 py-4 rounded-xl text-white border-white/20 hover:bg-white/10"
          >
            Take a Quiz
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 text-white/30 text-sm tracking-wider"
        >
          © 2025 SightSpoke · Privacy First · No Tracking
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingPage;