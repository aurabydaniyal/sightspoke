import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faHome, faRobot, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';

const FireworkParticle = ({ delay, x, y, color }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const count = 30;
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = 100 + Math.random() * 200;
      newParticles.push({
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        size: 4 + Math.random() * 8,
        color: color,
        delay: delay + Math.random() * 0.3
      });
    }
    setParticles(newParticles);
  }, [delay, color]);

  return (
    <div className="absolute" style={{ left: x, top: y }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
            left: 0,
            top: 0
          }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: p.tx,
            y: p.ty,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: 1.2,
            delay: p.delay,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
};

const CompletionScreen = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [showFireworks, setShowFireworks] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowFireworks(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const colors = ['#89D7B7', '#428475', '#F59E0B', '#EF4444', '#3B82F6', '#FF6B9D'];

  return (
    <div className="min-h-screen bg-[#1A312C] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fireworks */}
      {showFireworks && (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <FireworkParticle
              key={i}
              delay={i * 0.15}
              x={20 + Math.random() * 60 + '%'}
              y={10 + Math.random() * 60 + '%'}
              color={colors[i % colors.length]}
            />
          ))}
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-8 md:p-12 max-w-md w-full text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-[#89D7B7] flex items-center justify-center mx-auto mb-6"
        >
          <FontAwesomeIcon icon={faCheck} className="text-4xl text-[#1A312C]" />
        </motion.div>

        <h1 className="text-3xl font-bold text-[#1A312C] mb-2">🎉 Complete!</h1>
        <p className="text-[#1A312C]/60 mb-6">
          Thank you for completing the quiz. Your responses have been recorded.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="btn-glass justify-center"
          >
            Take Another Quiz
          </button>
        </div>
      </motion.div>

      {/* ✅ Custom Chat Button - Shows Popup Instead of Chat Window */}
      <button
        onClick={() => setShowPopup(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full 
                   bg-[#428475] text-[#FFF4E1] shadow-lg shadow-[#428475]/30 
                   flex items-center justify-center
                   hover:bg-[#89D7B7] hover:text-[#1A312C] transition-all duration-300"
      >
        <FontAwesomeIcon icon={faRobot} className="text-2xl" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#89D7B7] rounded-full animate-pulse" />
      </button>

      {/* ✅ Popup Message */}
      <AnimatePresence>
        {showPopup && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPopup(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            />

            {/* Popup Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-sm"
            >
              <div 
                className="glass-card p-8 text-center relative"
                style={{
                  background: 'rgba(26, 49, 44, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(137, 215, 183, 0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowPopup(false)}
                  className="absolute top-3 right-3 text-[#FFF4E1]/40 hover:text-[#FFF4E1] transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-lg" />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-[#89D7B7]/20 flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faCheck} className="text-3xl text-[#89D7B7]" />
                </div>

                {/* Message */}
                <h3 className="text-xl font-bold text-[#FFF4E1] mb-2">✅ Response Submitted!</h3>
                <p className="text-[#FFF4E1]/60 text-sm">
                  Thank you for completing the quiz. 
                  <br />
                  Your responses have been successfully recorded.
                  <br />
                  <span className="text-[#89D7B7] text-xs mt-2 block">
                    💡 You can now close this popup.
                  </span>
                </p>

                <button
                  onClick={() => setShowPopup(false)}
                  className="btn-neon w-full justify-center mt-4 !py-2.5"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompletionScreen;