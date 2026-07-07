import React, { useState } from 'react';
import { useParams } from 'react-router-dom'; // ✅ ADD THIS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faCopy, faCheck, faSync, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import toast from 'react-hot-toast';

const TokenGenerator = () => {
  // ✅ Get quizId from URL params
  const { id } = useParams();
  const quizId = id;

  const [count, setCount] = useState(5);
  const [expiryDays, setExpiryDays] = useState(7);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const generateTokens = async () => {
    if (!quizId || quizId === 'undefined') {
      toast.error('Invalid quiz ID. Please go back and try again.');
      return;
    }

    setLoading(true);
    try {
      const response = await adminApi.post(`/quizzes/${quizId}/tokens`, null, {
        params: { count, expiry_days: expiryDays }
      });
      setTokens(response.data.links);
      toast.success(`${count} tokens generated!`);
    } catch (error) {
      toast.error('Failed to generate tokens');
      console.error('Error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copied!');
  };

  const copyAll = () => {
    const all = tokens.map(t => t.url).join('\n');
    navigator.clipboard.writeText(all);
    toast.success('All links copied!');
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

  if (!quizId || quizId === 'undefined') {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-[#1A312C]">Generate Participant Tokens</h2>
        <span className="text-sm text-[#1A312C]/40">Quiz ID: {quizId}</span>
      </div>

      <div className="glass-card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Count */}
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

          {/* Expiry */}
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
          disabled={loading}
          className="btn-neon w-full justify-center mt-6 !py-3"
        >
          <FontAwesomeIcon icon={loading ? faSync : faLink} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Generating...' : `Generate ${count} Tokens`}
        </button>
      </div>

      {/* Tokens List */}
      {tokens.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A312C]">Generated Tokens ({tokens.length})</h3>
            <button onClick={copyAll} className="btn-glass !py-1.5 !px-3 text-sm">
              <FontAwesomeIcon icon={faCopy} /> Copy All
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tokens.map((token, index) => (
              <div key={index} className="glass-card p-3 flex items-center gap-3 hover:border-[#428475]/30 transition-colors">
                <span className="text-sm font-medium text-[#428475] min-w-[80px]">{token.admin_label}</span>
                <code className="flex-1 text-xs bg-[#1A312C]/5 px-3 py-1.5 rounded font-mono truncate">{token.url}</code>
                <span className="text-xs text-[#1A312C]/40 whitespace-nowrap">Expires: {new Date(token.expires_at).toLocaleDateString()}</span>
                <button
                  onClick={() => copyToClipboard(token.url, index)}
                  className="w-8 h-8 rounded-lg hover:bg-[#428475]/10 transition-colors flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={copiedIndex === index ? faCheck : faCopy} className={copiedIndex === index ? 'text-[#89D7B7]' : 'text-[#428475]'} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenGenerator;