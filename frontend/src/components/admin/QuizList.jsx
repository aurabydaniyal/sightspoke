import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faLink, faDownload,
  faClock, faUsers, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import { useAlert } from '../common/CustomAlert';

const QuizList = () => {
  const { success, error, warning, confirm } = useAlert();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    is_published: false,
    ai_overview: ''
  });

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get('/quizzes');
      setQuizzes(response.data);
    } catch (err) {
      console.error('❌ Load quizzes error:', err);
      // ✅ Ensure error message is a string
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to load quizzes';
      error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    if (!newQuiz.title.trim()) {
      warning('Please enter a quiz title');
      return;
    }

    try {
      const response = await adminApi.post('/quizzes', newQuiz);
      success('Quiz created successfully!');
      setShowCreateModal(false);
      setNewQuiz({ title: '', description: '', is_published: false, ai_overview: '' });
      loadQuizzes();
      navigate(`/admin/quizzes/${response.data.id}/edit`);
    } catch (err) {
      console.error('❌ Create quiz error:', err);
      // ✅ Ensure error message is a string
      const errorMsg = typeof err === 'string' ? err : err?.response?.data?.detail || err?.message || 'Failed to create quiz';
      error(errorMsg);
    }
  };

  const deleteQuiz = async (id, title) => {
    const confirmed = await confirm(
      `Delete "${title}"? This cannot be undone.`,
      'Delete Quiz'
    );
    if (!confirmed) return;
    
    try {
      await adminApi.delete(`/quizzes/${id}`);
      success('Quiz deleted');
      loadQuizzes();
    } catch (err) {
      console.error('❌ Delete quiz error:', err);
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to delete quiz';
      error(errorMsg);
    }
  };

  const getStatusBadge = (isPublished) => {
    return isPublished 
      ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#89D7B7] text-[#1A312C]">Published</span>
      : <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#1A312C]/10 text-[#1A312C]/60">Draft</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#428475] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A312C]">Quizzes</h1>
          <p className="text-[#1A312C]/50 text-sm">
            {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'} total
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-neon"
        >
          <FontAwesomeIcon icon={faPlus} /> New Quiz
        </button>
      </div>

      {/* Quiz Grid */}
      {quizzes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-[#1A312C] mb-2">No Quizzes Yet</h3>
          <p className="text-[#1A312C]/50 mb-4">Create your first quiz to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-neon"
          >
            <FontAwesomeIcon icon={faPlus} /> Create Quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz, index) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-6 hover:border-[#428475]/30 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-[#1A312C] text-lg line-clamp-1">
                  {quiz.title}
                </h3>
                {getStatusBadge(quiz.is_published)}
              </div>
              
              <p className="text-[#1A312C]/50 text-sm line-clamp-2 mb-4">
                {quiz.description || 'No description'}
              </p>

              <div className="flex items-center gap-4 text-xs text-[#1A312C]/40 mb-4">
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} /> {quiz.pages?.length || 0} pages
                </span>
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faUsers} /> 0 participants
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/admin/quizzes/${quiz.id}/details`)}
                  className="btn-glass !py-1.5 !px-3 text-sm"
                >
                  <FontAwesomeIcon icon={faInfoCircle} /> Details
                </button>
                <button
                  onClick={() => navigate(`/admin/quizzes/${quiz.id}/edit`)}
                  className="btn-glass !py-1.5 !px-3 text-sm"
                >
                  <FontAwesomeIcon icon={faEdit} /> Edit
                </button>
                <button
                  onClick={() => navigate(`/admin/quizzes/${quiz.id}/tokens`)}
                  className="btn-glass !py-1.5 !px-3 text-sm"
                >
                  <FontAwesomeIcon icon={faLink} /> Tokens
                </button>
                <button
                  onClick={() => navigate(`/admin/quizzes/${quiz.id}/export`)}
                  className="btn-glass !py-1.5 !px-3 text-sm"
                >
                  <FontAwesomeIcon icon={faDownload} /> Export
                </button>
                <button
                  onClick={() => deleteQuiz(quiz.id, quiz.title)}
                  className="btn-glass !py-1.5 !px-3 text-sm text-red-500 hover:bg-red-500/10"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-[#1A312C] mb-4">Create New Quiz</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A312C]/60 mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter quiz title..."
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                  className="input-modern"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A312C]/60 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Enter quiz description..."
                  value={newQuiz.description}
                  onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                  className="input-modern resize-none"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A312C]/60 mb-1">
                  🤖 AI Overview (for participant chatbot)
                </label>
                <textarea
                  placeholder="Describe the quiz topic for AI to stay focused..."
                  value={newQuiz.ai_overview}
                  onChange={(e) => setNewQuiz({ ...newQuiz, ai_overview: e.target.value })}
                  className="input-modern resize-none"
                  rows="2"
                />
                <p className="text-xs text-[#1A312C]/30 mt-1">
                  This helps the AI chatbot stay on topic during participant conversations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={newQuiz.is_published}
                  onChange={(e) => setNewQuiz({ ...newQuiz, is_published: e.target.checked })}
                  className="w-4 h-4 accent-[#428475]"
                />
                <label htmlFor="isPublished" className="text-sm text-[#1A312C]/60">
                  Publish immediately
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#428475]/10">
                <button
                  onClick={createQuiz}
                  className="btn-neon flex-1 justify-center"
                >
                  Create Quiz
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-glass flex-1 justify-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default QuizList;