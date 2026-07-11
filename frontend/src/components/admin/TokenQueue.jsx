import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCopy, faCheck, faTimes, faSpinner,
  faLock, faUnlock, faChevronRight,
  faClipboard, faBolt
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import { useAlert } from '../common/CustomAlert';

const TokenQueue = ({ quizId }) => {
  const { success, error, warning, info } = useAlert();
  
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isLocked, setIsLocked] = useState(true);
  const [count, setCount] = useState(5);
  const [expiryDays, setExpiryDays] = useState(7);

  // Load tokens on mount
  useEffect(() => {
    loadTokens();
  }, [quizId]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get(`/tokens/${quizId}`);
      const tokenData = response.data || [];
      // ✅ Filter: only show unused, non-expired tokens
      const available = tokenData.filter(t => !t.is_used && !t.is_expired);
      setTokens(available);
    } catch (err) {
      console.error('Failed to load tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTokens = async () => {
    setGenerating(true);
    try {
      const response = await adminApi.post(`/quizzes/${quizId}/tokens`, null, {
        params: { count, expiry_days: expiryDays }
      });
      const newTokens = response.data.links || [];
      setTokens([...tokens, ...newTokens]);
      success(`${count} tokens generated!`);
    } catch (err) {
      error('Failed to generate tokens');
    } finally {
      setGenerating(false);
    }
  };

  const copyToken = async (token, index) => {
    try {
      await navigator.clipboard.writeText(token.url);
      setCopiedIndex(index);
      // ✅ Mark as used (pop from stack)
      const updated = [...tokens];
      updated.splice(index, 1);
      setTokens(updated);
      
      // ✅ Mark as used in database
      await adminApi.put(`/tokens/${token.token}/use`);
      
      success('Token copied and used!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      error('Failed to copy token');
    }
  };

  const copyAll = () => {
    const all = tokens.map(t => t.url).join('\n');
    navigator.clipboard.writeText(all);
    success('All tokens copied!');
  };

  const getTokenCount = () => {
    return tokens.length;
  };

  return (
    <div className="space-y-6">
      {/* Header with Lock Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-[#1A312C]">Token Queue</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isLocked ? 'bg-[#428475] text-white' : 'bg-[#89D7B7] text-[#1A312C]'
          }`}>
            {isLocked ? (
              <><FontAwesomeIcon icon={faLock} className="mr-1" /> Locked</>
            ) : (
              <><FontAwesomeIcon icon={faUnlock} className="mr-1" /> Unlocked</>
            )}
          </span>
        </div>
        <button
          onClick={() => setIsLocked(!isLocked)}
          className="btn-glass !py-1.5 !px-3 text-sm"
        >
          <FontAwesomeIcon icon={isLocked ? faUnlock : faLock} />
          {isLocked ? ' Unlock' : ' Lock'}
        </button>
      </div>

      {/* Token Queue Container - Like a locked box */}
      <div className={`glass-card p-6 transition-all duration-300 ${
        isLocked ? 'opacity-75' : 'opacity-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#428475]/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faBolt} className="text-[#89D7B7]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1A312C]">Token Stack</p>
              <p className="text-xs text-[#1A312C]/40">
                {getTokenCount()} tokens available
              </p>
            </div>
          </div>
          {!isLocked && (
            <button
              onClick={copyAll}
              className="btn-glass !py-1.5 !px-3 text-sm"
            >
              <FontAwesomeIcon icon={faClipboard} /> Copy All
            </button>
          )}
        </div>

        {/* Token Stack - Visual representation */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tokens.length === 0 ? (
            <div className="text-center py-8 text-[#1A312C]/40">
              <FontAwesomeIcon icon={faLock} className="text-3xl mb-2 block" />
              <p>No tokens available</p>
              <p className="text-xs">Generate new tokens to fill the queue</p>
            </div>
          ) : (
            tokens.map((token, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-[#1A312C]/5 hover:bg-[#1A312C]/10 transition-colors"
              >
                {/* Token Index */}
                <span className="text-xs font-bold text-[#428475] min-w-[24px]">
                  #{index + 1}
                </span>
                
                {/* Token URL */}
                <code className="flex-1 text-xs bg-[#FFF4E1] px-2 py-1 rounded font-mono truncate">
                  {token.url}
                </code>
                
                {/* Expiry */}
                <span className="text-xs text-[#1A312C]/40 whitespace-nowrap">
                  {new Date(token.expires_at).toLocaleDateString()}
                </span>
                
                {/* Copy Button */}
                {!isLocked && (
                  <button
                    onClick={() => copyToken(token, index)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      copiedIndex === index 
                        ? 'bg-[#89D7B7] text-[#1A312C]' 
                        : 'bg-[#428475] text-white hover:bg-[#89D7B7] hover:text-[#1A312C]'
                    }`}
                    title="Copy and use token"
                  >
                    <FontAwesomeIcon icon={copiedIndex === index ? faCheck : faCopy} />
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Generate Section - Only when unlocked */}
        {!isLocked && (
          <div className="mt-4 pt-4 border-t border-[#428475]/10">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs font-medium text-[#1A312C]/60">Count</label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="input-modern !py-1.5 !px-3 text-sm w-16"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#1A312C]/60">Expiry (Days)</label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="input-modern !py-1.5 !px-3 text-sm w-16"
                  min="1"
                  max="30"
                />
              </div>
              <button
                onClick={generateTokens}
                disabled={generating}
                className="btn-neon !py-1.5 !px-4 text-sm"
              >
                <FontAwesomeIcon icon={generating ? faSpinner : faBolt} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        )}

        {/* Locked message */}
        {isLocked && tokens.length > 0 && (
          <div className="mt-4 p-3 bg-[#428475]/10 rounded-lg text-center text-sm text-[#1A312C]/60">
            <FontAwesomeIcon icon={faLock} className="mr-2" />
            Locked - Click the lock button to access tokens
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenQueue;