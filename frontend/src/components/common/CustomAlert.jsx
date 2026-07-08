import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationTriangle, 
  faInfoCircle, 
  faTimesCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  CONFIRM: 'confirm'
};

const ALERT_CONFIG = {
  [ALERT_TYPES.SUCCESS]: {
    icon: faCheckCircle,
    iconColor: '#89D7B7',
    bgColor: 'rgba(137, 215, 183, 0.15)',
    borderColor: '#89D7B7',
    titleColor: '#89D7B7',
  },
  [ALERT_TYPES.ERROR]: {
    icon: faTimesCircle,
    iconColor: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    titleColor: '#EF4444',
  },
  [ALERT_TYPES.WARNING]: {
    icon: faExclamationTriangle,
    iconColor: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    titleColor: '#F59E0B',
  },
  [ALERT_TYPES.INFO]: {
    icon: faInfoCircle,
    iconColor: '#428475',
    bgColor: 'rgba(66, 132, 117, 0.15)',
    borderColor: '#428475',
    titleColor: '#428475',
  },
  [ALERT_TYPES.CONFIRM]: {
    icon: faExclamationTriangle,
    iconColor: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    titleColor: '#F59E0B',
  }
};

const AlertContext = React.createContext();

export const useAlert = () => {
  const context = React.useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const showAlert = (type, message, title = '', duration = 4000) => {
    // ✅ Ensure message is a string
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    const id = Date.now() + Math.random();
    setAlerts(prev => [...prev, { id, type, message: messageStr, title, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
      }, duration);
    }
  };

  const showConfirm = (message, title = 'Confirm', onConfirm, onCancel) => {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    setConfirmState({
      message: messageStr,
      title,
      onConfirm: () => {
        setConfirmState(null);
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setConfirmState(null);
        if (onCancel) onCancel();
      }
    });
  };

  const success = (message, title = 'Success', duration = 4000) => {
    showAlert(ALERT_TYPES.SUCCESS, message, title, duration);
  };

  const error = (message, title = 'Error', duration = 5000) => {
    showAlert(ALERT_TYPES.ERROR, message, title, duration);
  };

  const warning = (message, title = 'Warning', duration = 4000) => {
    showAlert(ALERT_TYPES.WARNING, message, title, duration);
  };

  const info = (message, title = 'Info', duration = 3000) => {
    showAlert(ALERT_TYPES.INFO, message, title, duration);
  };

  const confirm = (message, title = 'Confirm', onConfirm, onCancel) => {
    return new Promise((resolve) => {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      setConfirmState({
        message: messageStr,
        title,
        onConfirm: () => {
          setConfirmState(null);
          resolve(true);
          if (onConfirm) onConfirm();
        },
        onCancel: () => {
          setConfirmState(null);
          resolve(false);
          if (onCancel) onCancel();
        }
      });
    });
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ showAlert, success, error, warning, info, confirm, removeAlert }}>
      {children}
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-md w-full">
        <AnimatePresence>
          {alerts.map((alert) => {
            const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.info;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                className="glass-card p-4 relative overflow-hidden"
                style={{
                  background: 'rgba(26, 49, 44, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${config.borderColor}30`,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 30px ${config.borderColor}10`,
                }}
              >
                {alert.duration > 0 && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5"
                    style={{ background: config.borderColor }}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: alert.duration / 1000, ease: 'linear' }}
                  />
                )}
                
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: config.bgColor }}
                  >
                    <FontAwesomeIcon icon={config.icon} style={{ color: config.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {alert.title && (
                      <h4 className="text-sm font-semibold" style={{ color: config.titleColor }}>
                        {alert.title}
                      </h4>
                    )}
                    <p className="text-sm text-[#FFF4E1]/80 mt-0.5 break-words">
                      {alert.message}
                    </p>
                  </div>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="text-[#FFF4E1]/30 hover:text-[#FFF4E1] transition-colors flex-shrink-0"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmState && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
              onClick={confirmState.onCancel}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md"
            >
              <div 
                className="glass-card p-6 relative"
                style={{
                  background: 'rgba(26, 49, 44, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(137, 215, 183, 0.15)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#F59E0B]/15 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-[#F59E0B] text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#FFF4E1]">
                      {confirmState.title}
                    </h3>
                    <p className="text-sm text-[#FFF4E1]/70 mt-1">
                      {confirmState.message}
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={confirmState.onConfirm}
                        className="btn-neon flex-1 justify-center py-2 text-sm"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={confirmState.onCancel}
                        className="btn-glass flex-1 justify-center py-2 text-sm text-[#FFF4E1]/70 hover:text-[#FFF4E1]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

export default AlertProvider;