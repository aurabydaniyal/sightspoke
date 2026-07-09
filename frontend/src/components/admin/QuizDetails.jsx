import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faInfoCircle, faChartBar, faBrain, faComments,
  faFileAlt, faUsers, faClock, faCheckCircle, faMessage,
  faUser, faRobot, faChevronDown, faChevronUp, faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import AIInsights from '../ai/AIInsights';
import AIChat from '../ai/AIChat';
import { useAlert } from '../common/CustomAlert';
import toast from 'react-hot-toast';

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error, warning, info } = useAlert();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [chatSummary, setChatSummary] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [stats, setStats] = useState({
    totalResponses: 0,
    totalParticipants: 0,
    avgTime: 0,
    completionRate: 0
  });

  useEffect(() => {
    loadQuizDetails();
  }, [id]);

  const loadQuizDetails = async () => {
    setLoading(true);
    try {
      const quizRes = await adminApi.get(`/quizzes/${id}`);
      setQuiz(quizRes.data);

      const responsesRes = await adminApi.get(`/quizzes/${id}/responses`);
      const data = responsesRes.data;
      setResponses(data);
      
      // ✅ Load combined chat summary
      await loadChatSummary();
      
      // Calculate stats
      const uniqueTokens = new Set(data.map(r => r.participant_token));
      let totalTime = 0;
      data.forEach(r => {
        if (r.latency_ms) totalTime += r.latency_ms;
      });
      const avgTime = data.length > 0 ? (totalTime / data.length / 1000).toFixed(1) : 0;
      
      setStats({
        totalResponses: data.length,
        totalParticipants: uniqueTokens.size,
        avgTime: avgTime,
        completionRate: data.length > 0 ? Math.round((data.length / (uniqueTokens.size * 13)) * 100) : 0
      });
    } catch (err) {
      error('Failed to load quiz details');
      navigate('/admin/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const loadChatSummary = async () => {
    try {
      // ✅ Try to get combined summary from AI insights
      const insightsRes = await adminApi.get(`/ai/insights/${id}`);
      const insights = insightsRes.data || [];
      
      // Find combined chat summary insight
      const combinedInsight = insights.find(
        c => c.insight_type === 'combined_chat_summary'
      );
      
      if (combinedInsight) {
        setChatSummary(combinedInsight.content);
      } else {
        // Check if there are any chat logs
        const chatRes = await adminApi.get(`/ai/chat-logs/${id}`);
        const logs = chatRes.data || [];
        if (logs.length > 0) {
          setChatSummary({
            summary: 'Click "Generate Chat Summary" to analyze all participant conversations.',
            total_messages: logs.length,
            participants: new Set(logs.map(l => l.participant_token_id)).size
          });
        } else {
          setChatSummary(null);
        }
      }
    } catch (e) {
      console.log('No chat summary found');
      setChatSummary(null);
    }
  };

  const generateChatSummary = async () => {
    setGeneratingSummary(true);
    try {
      const response = await adminApi.post(`/ai/combined-chat-summary`, {
        quiz_id: id
      });
      setChatSummary(response.data);
      success('Chat summary generated!');
    } catch (err) {
      error('Failed to generate chat summary');
      console.error('Chat summary error:', err);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: faInfoCircle },
    { id: 'responses', label: 'Responses', icon: faChartBar },
    { id: 'ai-insights', label: 'AI Insights', icon: faBrain },
    { id: 'ai-chat', label: 'AI Chat', icon: faComments },
  ];

  // ✅ Render Responses Tab Content with Combined Chat Summary
  const renderResponses = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[#1A312C]">{stats.totalResponses}</p>
          <p className="text-xs text-[#1A312C]/50">Total Responses</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[#1A312C]">{stats.totalParticipants}</p>
          <p className="text-xs text-[#1A312C]/50">Participants</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[#1A312C]">{stats.avgTime}s</p>
          <p className="text-xs text-[#1A312C]/50">Avg Time</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[#1A312C]">{stats.completionRate}%</p>
          <p className="text-xs text-[#1A312C]/50">Completion</p>
        </div>
      </div>

      {/* ✅ Combined Chat Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1A312C] flex items-center gap-2">
            <FontAwesomeIcon icon={faMessage} className="text-[#89D7B7]" />
            Combined Chat Summary
          </h3>
          <button
            onClick={generateChatSummary}
            disabled={generatingSummary}
            className="btn-glass !py-1.5 !px-3 text-sm"
          >
            <FontAwesomeIcon icon={generatingSummary ? faRefresh : faRefresh} className={generatingSummary ? 'animate-spin' : ''} />
            {generatingSummary ? 'Generating...' : 'Generate Summary'}
          </button>
        </div>
        
        {!chatSummary ? (
          <p className="text-[#1A312C]/40 text-center py-8">
            No chat activity yet. Participants haven't used the AI chat.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-[#1A312C]/50">
              <span>💬 Total Messages: {chatSummary.total_messages || 0}</span>
              <span>👤 Participants: {chatSummary.participants || 0}</span>
            </div>
            <div className="p-4 bg-[#428475]/5 rounded-lg border border-[#428475]/10">
              <div className="whitespace-pre-wrap text-[#1A312C]/80 text-sm leading-relaxed">
                {chatSummary.summary || 'No summary available. Click "Generate Summary" to analyze chats.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#428475] border-t-transparent" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-[#1A312C]/60">Quiz not found</p>
        <button onClick={() => navigate('/admin/quizzes')} className="btn-neon mt-4">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="btn-glass !py-2 !px-4"
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1A312C]">{quiz.title}</h1>
            <p className="text-[#1A312C]/50 text-sm">
              {quiz.is_published ? '🟢 Published' : '🟡 Draft'} · {quiz.pages?.length || 0} pages
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/admin/quizzes/${id}/edit`)}
            className="btn-glass !py-2 !px-4"
          >
            Edit Quiz
          </button>
          <button
            onClick={() => navigate(`/admin/quizzes/${id}/tokens`)}
            className="btn-glass !py-2 !px-4"
          >
            Tokens
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#428475]/10">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all duration-300
                flex items-center gap-2
                ${activeTab === tab.id 
                  ? 'bg-[#428475] text-white shadow-lg' 
                  : 'text-[#1A312C]/60 hover:text-[#1A312C] hover:bg-[#428475]/5'
                }
              `}
            >
              <FontAwesomeIcon icon={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-semibold text-[#1A312C]">Quiz Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#1A312C]/50">Description</p>
                  <p className="text-[#1A312C]">{quiz.description || 'No description provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#1A312C]/50">AI Overview</p>
                  <p className="text-[#1A312C]">{quiz.ai_overview || 'No AI overview provided'}</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-[#1A312C]/50">
                <span>📄 {quiz.pages?.length || 0} pages</span>
                <span>📅 Created: {new Date(quiz.created_at).toLocaleDateString()}</span>
                <span>🔄 Version {quiz.version}</span>
              </div>
            </div>
          )}

          {activeTab === 'responses' && renderResponses()}

          {activeTab === 'ai-insights' && (
            <AIInsights quizId={id} quizTitle={quiz.title} />
          )}

          {activeTab === 'ai-chat' && (
            <AIChat quizId={id} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default QuizDetails;