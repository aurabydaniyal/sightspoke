import React from 'react';
import Lightfall from '../components/common/Lightfall';

const ParticipantLayout = ({ children }) => {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Global Background */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0 
      }}>
        <Lightfall
          colors={['#428475', '#89D7B7', '#1A312C']}
          backgroundColor="#1A312C"
          speed={0.3}
          streakCount={3}
          streakWidth={1.2}
          streakLength={1.2}
          glow={0.8}
          density={0.5}
          twinkle={0.8}
          zoom={3}
          backgroundGlow={0.4}
          opacity={0.9}
          mouseInteraction={true}
          mouseStrength={0.4}
          mouseRadius={1.2}
        />
      </div>
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
};

export default ParticipantLayout;