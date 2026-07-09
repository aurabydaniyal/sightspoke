import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faHome, faRobot, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { participantApi } from '../../api/axiosConfig';
import TiltedCard from '../common/TiltedCard';
import ParticipantLayout from '../../pages/ParticipantLayout';

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
  const [quizInfo, setQuizInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizInfo = async () => {
      try {
        const response = await participantApi.get(`/validate/${token}`);
        setQuizInfo(response.data);
        console.log('✅ Completion quiz info:', response.data);
      } catch (err) {
        console.error('Failed to fetch quiz info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizInfo();
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => setShowFireworks(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const colors = ['#89D7B7', '#428475', '#F59E0B', '#EF4444', '#3B82F6', '#FF6B9D'];

  if (loading) {
    return (
      <ParticipantLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#89D7B7] border-t-transparent" />
        </div>
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout>
      {/* ✅ Fireworks Layer - Outside Content */}
      {showFireworks && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {Array.from({ length: 8 }, (_, i) => (
            <FireworkParticle
              key={i}
              delay={i * 0.15}
              x={20 + Math.random() * 60 + '%'}
              y={10 + Math.random() * 60 + '%'}
              color={colors[i % colors.length]}
            />
          ))}
        </div>
      )}

      {/* ✅ Content Layer - Above Fireworks */}
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md"
        >
          <TiltedCard
            imageSrc="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400"
            altText="Quiz Complete"
            captionText="🎉 Complete!"
            containerHeight="380px"
            containerWidth="100%"
            imageHeight="360px"
            imageWidth="100%"
            rotateAmplitude={10}
            scaleOnHover={1.03}
            showTooltip={true}
            displayOverlayContent={true}
            overlayContent={
              <div className="text-center p-6 w-full h-full flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-[#89D7B7] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#89D7B7]/30"
                >
                  <FontAwesomeIcon icon={faCheck} className="text-3xl text-[#1A312C]" />
                </motion.div>

                <h1 className="text-2xl font-bold text-[#FFF4E1] mb-2">🎉 Complete!</h1>
                <p className="text-[#FFF4E1]/60 text-sm mb-4">
                  Thank you for completing the quiz. Your responses have been recorded.
                </p>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full justify-center py-2.5 text-sm bg-[#428475] text-white font-medium rounded-lg hover:bg-[#89D7B7] hover:text-[#1A312C] transition-all duration-300 shadow-lg shadow-[#428475]/30 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faHome} className="mr-2" />
                  Take Another Quiz
                </button>
              </div>
            }
          />
        </motion.div>

        {/* Chat Button */}
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

        {/* Popup - Centered */}
        <AnimatePresence>
          {showPopup && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPopup(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
              />

              <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 30 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="pointer-events-auto w-[92%] max-w-sm"
                >
                  <div 
                    className="glass-card p-6 sm:p-8 text-center relative"
                    style={{
                      background: 'rgba(26, 49, 44, 0.95)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(137, 215, 183, 0.2)',
                      boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                    }}
                  >
                    <button
                      onClick={() => setShowPopup(false)}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[#FFF4E1]/40 hover:text-[#FFF4E1] transition-colors w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-base sm:text-lg" />
                    </button>

                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#89D7B7]/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FontAwesomeIcon icon={faCheck} className="text-2xl sm:text-3xl text-[#89D7B7]" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-[#FFF4E1] mb-2">✅ Response Submitted!</h3>
                    <p className="text-[#FFF4E1]/60 text-xs sm:text-sm leading-relaxed">
                      Thank you for completing the quiz. 
                      <br />
                      Your responses have been successfully recorded.
                    </p>
                    <p className="text-[#89D7B7] text-[10px] sm:text-xs mt-3">
                      💡 You can now close this popup.
                    </p>

                    <button
                      onClick={() => setShowPopup(false)}
                      className="btn-neon w-full justify-center mt-4 !py-2 sm:!py-2.5 text-xs sm:text-sm"
                    >
                      Got it!
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </ParticipantLayout>
  );
};

export default CompletionScreen;