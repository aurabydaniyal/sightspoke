import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faHome } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

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
  const [showFireworks, setShowFireworks] = useState(true);

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
        {/* Success Icon */}
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
    </div>
  );
};

export default CompletionScreen;