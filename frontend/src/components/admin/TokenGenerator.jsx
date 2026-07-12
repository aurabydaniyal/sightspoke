import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLink, faCopy, faCheck, faSync, faPlus, faMinus, 
  faBolt, faLock, faUnlock, faClipboard
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import { useAlert } from '../common/CustomAlert';

const TokenGenerator = () => {
  const { id } = useParams();
  const quizId = id;
  const { success, error, warning, info } = useAlert();

  const [count, setCount] = useState(5);
  const [expiryDays, setExpiryDays] = useState(7);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    loadTokens();
  }, [quizId]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get(`/tokens/${quizId}`);
      const tokenData = response.data || [];
      // ✅ Only filter used tokens - NOT expired
      const available = tokenData.filter(t => !t.is_used);
      setTokens(available);
    } catch (err) {
      console.error('Failed to load tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!quizId || quizId === 'undefined' || quizId === 'create') {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-[#1A312C]/60">Please select a valid quiz first.</p>
        <button 
          onClick={() => window.location.href = '/admin/quizzes'} 
          className="btn-neon mt-4"
        >
          Go to Quizzes
        </button>
      </div>
    );
  }

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
      console.error('Token error:', err.response?.data || err.message);
    } finally {
      setGenerating(false);
    }
  };

  // ✅ FIX: Copy token WITHOUT marking as used
  const copyToken = async (token, index) => {
    try {
      await navigator.clipboard.writeText(token.url);
      setCopiedIndex(index);
      
      // ✅ Remove from queue (pop) but DON'T mark as used
      const updated = [...tokens];
      updated.splice(index, 1);
      setTokens(updated);
      
      // ❌ REMOVED: await adminApi.put(`/tokens/${token.token}/use`);
      
      success('Token copied and ready to use!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      error('Failed to copy token');
    }
  };

  const copyAllTokens = async () => {
    if (tokens.length === 0) {
      warning('No tokens to copy');
      return;
    }
    
    try {
      const allUrls = tokens.map(t => t.url).join('\n');
      await navigator.clipboard.writeText(allUrls);
      
      // ✅ Remove all from queue but DON'T mark as used
      setTokens([]);
      
      success(`Copied ${tokens.length} tokens!`);
    } catch (err) {
      error('Failed to copy all tokens');
    }
  };

  const handleCountChange = (delta) => {
    const newCount = count + delta;
    if (newCount >= 1 && newCount <= 100) {
      setCount(newCount);
    }
  };

  const handleExpiryChange = (delta) => {
    const newExpiry = expiryDays + delta;
    if (newExpiry >= 1 && newExpiry <= 30) {
      setExpiryDays(newExpiry);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1A312C]">Token Management</h2>
          <p className="text-[#1A312C]/40 text-sm">Quiz ID: {quizId}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#1A312C]/40">
            {tokens.length} available
          </span>
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`btn-glass !py-1.5 !px-3 text-sm flex items-center gap-2 ${
              isLocked ? 'text-[#428475]' : 'text-[#89D7B7]'
            }`}
          >
            <FontAwesomeIcon icon={isLocked ? faLock : faUnlock} />
            {isLocked ? ' Locked' : ' Unlocked'}
          </button>
        </div>
      </div>

      {/* Generator Section */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-[#1A312C] mb-4">Generate Tokens</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-[#1A312C]/60">Number of Tokens</label>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => handleCountChange(-1)}
                className="w-10 h-10 rounded-lg border border-[#428475]/20 hover:bg-[#428475]/10 flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faMinus} className="text-[#428475]" />
              </button>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="input-modern text-center w-20"
                min="1"
                max="100"
              />
              <button
                onClick={() => handleCountChange(1)}
                className="w-10 h-10 rounded-lg border border-[#428475]/20 hover:bg-[#428475]/10 flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="text-[#428475]" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#1A312C]/60">Expiry (Days)</label>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => handleExpiryChange(-1)}
                className="w-10 h-10 rounded-lg border border-[#428475]/20 hover:bg-[#428475]/10 flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faMinus} className="text-[#428475]" />
              </button>
              <input
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                className="input-modern text-center w-20"
                min="1"
                max="30"
              />
              <button
                onClick={() => handleExpiryChange(1)}
                className="w-10 h-10 rounded-lg border border-[#428475]/20 hover:bg-[#428475]/10 flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="text-[#428475]" />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={generateTokens}
          disabled={generating}
          className="btn-neon w-full justify-center mt-6 !py-3"
        >
          <FontAwesomeIcon icon={generating ? faSync : faBolt} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating...' : `Generate ${count} Tokens`}
        </button>
      </div>

      {/* Queue Box */}
      <AnimatePresence>
        {tokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 border-2 border-[#89D7B7]/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#428475]/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBolt} className="text-[#89D7B7]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A312C]">Token Queue</h3>
                  <p className="text-xs text-[#1A312C]/40">
                    {tokens.length} token{tokens.length > 1 ? 's' : ''} available
                  </p>
                </div>
              </div>
              
              <button
                onClick={copyAllTokens}
                disabled={isLocked || tokens.length === 0}
                className={`btn-glass !py-1.5 !px-3 text-sm flex items-center gap-2 ${
                  isLocked || tokens.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FontAwesomeIcon icon={faClipboard} />
                Copy All ({tokens.length})
              </button>
            </div>

            {isLocked ? (
              <div className="text-center py-8 text-[#1A312C]/40">
                <FontAwesomeIcon icon={faLock} className="text-4xl mb-3 block" />
                <p className="text-sm font-medium">Queue is Locked</p>
                <p className="text-xs">Click the lock button above to access tokens</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tokens.map((token, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#1A312C]/5 hover:bg-[#1A312C]/10 transition-colors border border-[#428475]/10"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#428475] text-white text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    <code className="flex-1 text-xs bg-[#FFF4E1] px-3 py-1.5 rounded font-mono truncate">
                      {token.url}
                    </code>
                    
                    <span className="text-xs text-[#1A312C]/40 whitespace-nowrap">
                      {new Date(token.expires_at).toLocaleDateString()}
                    </span>
                    
                    <button
                      onClick={() => copyToken(token, index)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        copiedIndex === index 
                          ? 'bg-[#89D7B7] text-[#1A312C]' 
                          : 'bg-[#428475] text-white hover:bg-[#89D7B7] hover:text-[#1A312C]'
                      }`}
                      title="Copy and remove from queue"
                    >
                      <FontAwesomeIcon icon={copiedIndex === index ? faCheck : faCopy} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[#428475]/10 flex items-center justify-between text-xs text-[#1A312C]/40">
              <span>
                {isLocked ? '🔒 Locked' : '🔓 Unlocked'} · {tokens.length} tokens
              </span>
              <span>First in, first out</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Tokens */}
      {tokens.length === 0 && !loading && (
        <div className="glass-card p-8 text-center border-2 border-dashed border-[#428475]/20">
          <FontAwesomeIcon icon={faLink} className="text-4xl text-[#428475]/30 mb-3" />
          <p className="text-[#1A312C]/50">No tokens available</p>
          <p className="text-xs text-[#1A312C]/30">Generate tokens to fill the queue</p>
        </div>
      )}
    </div>
  );
};

export default TokenGenerator;