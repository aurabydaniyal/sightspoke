import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faInfoCircle, faChartBar, faBrain, faComments,
  faFileAlt, faUsers, faClock, faCheckCircle, faMessage,
  faUser, faRobot, faChevronDown, faChevronUp,
  faUserMd, faUserCheck
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import { analyzeParticipant, getParticipantChatLogs } from '../../api/aiApi';
import AIInsights from '../ai/AIInsights';
import AIChat from '../ai/AIChat';
import { useAlert } from '../common/CustomAlert';

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error, warning, info } = useAlert();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [participantAnalysis, setParticipantAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
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
      
      // Group by participant
      const grouped = {};
      data.forEach(r => {
        if (!grouped[r.participant_token]) {
          grouped[r.participant_token] = [];
        }
        grouped[r.participant_token].push(r);
      });
      
      // Get participant chat logs
      const participantsList = [];
      for (const [token, responses] of Object.entries(grouped)) {
        try {
          const chatRes = await getParticipantChatLogs(id, token);
          participantsList.push({
            token: token,
            responseCount: responses.length,
            chats: chatRes || []
          });
        } catch (e) {
          participantsList.push({
            token: token,
            responseCount: responses.length,
            chats: []
          });
        }
      }
      setParticipants(participantsList);
      
      // Stats
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
      console.error('Load quiz error:', err);
      error('Failed to load quiz details');
      navigate('/admin/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeParticipant = async (token) => {
    setAnalyzing(true);
    setSelectedParticipant(token);
    setParticipantAnalysis(null);
    
    try {
      const response = await analyzeParticipant(id, token);
      setParticipantAnalysis(response);
      success('Participant analysis complete!');
    } catch (err) {
      console.error('Participant analysis error:', err);
      error('Failed to analyze participant');
    } finally {
      setAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: faInfoCircle },
    { id: 'responses', label: 'Responses', icon: faChartBar },
    { id: 'ai-insights', label: 'AI Insights', icon: faBrain },
    { id: 'ai-chat', label: 'AI Chat', icon: faComments },
  ];

  const renderResponses = () => (
    <div className="space-y-6">
      {/* Stats */}
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

      {/* Participants List */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-[#1A312C] mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faUsers} className="text-[#89D7B7]" />
          Participants ({participants.length})
        </h3>
        
        {participants.length === 0 ? (
          <p className="text-[#1A312C]/40 text-center py-8">No participants yet.</p>
        ) : (
          <div className="space-y-4">
            {participants.map((p, index) => (
              <div key={index} className="border border-[#428475]/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => {
                    if (selectedParticipant === p.token) {
                      setSelectedParticipant(null);
                      setParticipantAnalysis(null);
                    } else {
                      handleAnalyzeParticipant(p.token);
                    }
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-[#428475]/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#428475] flex items-center justify-center text-white text-sm font-bold">
                      {p.token.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#1A312C]">
                        Participant {index + 1}
                      </p>
                      <p className="text-xs text-[#1A312C]/40">
                        {p.responseCount} responses · {p.chats.length} messages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedParticipant === p.token && analyzing && (
                      <span className="text-xs text-[#428475] animate-pulse">Analyzing...</span>
                    )}
                    <FontAwesomeIcon 
                      icon={selectedParticipant === p.token ? faChevronUp : faChevronDown} 
                      className="text-[#428475]"
                    />
                  </div>
                </button>
                
                {/* Participant Analysis */}
                {selectedParticipant === p.token && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 border-t border-[#428475]/10 bg-[#428475]/5"
                  >
                    {analyzing ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#428475] border-t-transparent mx-auto" />
                        <p className="text-sm text-[#1A312C]/60 mt-2">Analyzing participant...</p>
                      </div>
                    ) : participantAnalysis ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUserMd} className="text-[#89D7B7]" />
                          <h4 className="font-semibold text-[#1A312C]">Individual Psychological Profile</h4>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-[#1A312C]/80 text-sm leading-relaxed">
                            {participantAnalysis.analysis}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[#1A312C]/40 text-center py-4">Click to analyze this participant</p>
                    )}
                  </motion.div>
                )}
              </div>
            ))}
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