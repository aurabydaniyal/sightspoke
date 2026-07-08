import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ width = '100%', height = '60px', borderRadius = '8px' }) => {
  return (
    <div 
      className="skeleton-loader" 
      style={{ 
        width, 
        height, 
        borderRadius 
      }}
    />
  );
};

// Loading message (shrink/grow with gradient)
export const LoadingMessage = ({ text = 'Thinking...' }) => {
  return (
    <div className="loading-message">
      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="loading-text">{text}</span>
    </div>
  );
};

export default SkeletonLoader;