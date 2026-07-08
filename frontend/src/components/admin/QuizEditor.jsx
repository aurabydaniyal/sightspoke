import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faTrash, faSave, faArrowLeft, 
  faImage, faClock, faTable,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import { useAlert } from '../common/CustomAlert';

const QuizEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error, warning, info, confirm } = useAlert();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);
  const [isNewQuiz, setIsNewQuiz] = useState(!id || id === 'create' || id === 'undefined');

  const [newQuizData, setNewQuizData] = useState({
    title: '',
    description: '',
    is_published: false
  });

  useEffect(() => {
    console.log('📌 Quiz ID from URL:', id);
    if (id && id !== 'create' && id !== 'undefined') {
      loadQuiz();
    } else {
      setIsNewQuiz(true);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const [quizRes, pagesRes, imagesRes] = await Promise.all([
        adminApi.get(`/quizzes/${id}`),
        adminApi.get(`/quizzes/${id}/pages`),
        adminApi.get('/images')
      ]);
      setQuiz(quizRes.data);
      setPages(pagesRes.data);
      setAllImages(imagesRes.data);
      setIsNewQuiz(false);
    } catch (err) {
      console.error('❌ Load quiz error:', err);
      error('Failed to load quiz');
      navigate('/admin/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const createNewQuiz = async () => {
    if (!newQuizData.title.trim()) {
      warning('Please enter a quiz title');
      return;
    }
    setSaving(true);
    try {
      const response = await adminApi.post('/quizzes', newQuizData);
      success('Quiz created!');
      navigate(`/admin/quizzes/${response.data.id}/edit`);
      window.location.reload();
    } catch (err) {
      console.error('❌ Create quiz error:', err);
      error('Failed to create quiz');
    } finally {
      setSaving(false);
    }
  };

  const addPage = async () => {
    if (!id || id === 'create' || id === 'undefined') {
      warning('Please save the quiz first before adding pages');
      return;
    }
    try {
      const response = await adminApi.post(`/quizzes/${id}/pages`, {
        page_number: pages.length + 1,
        time_limit_seconds: 10,
        layout_template_id: 1
      });
      setPages([...pages, response.data]);
      setCurrentPageIndex(pages.length);
      success('Page added!');
    } catch (err) {
      console.error('❌ Add page error:', err);
      error('Failed to add page');
    }
  };

  const deletePage = async (pageId) => {
    const confirmed = await confirm('Delete this page?', 'Delete Page');
    if (!confirmed) return;
    try {
      await adminApi.delete(`/quizzes/${id}/pages/${pageId}`);
      setPages(pages.filter(p => p.id !== pageId));
      success('Page deleted');
    } catch (err) {
      console.error('❌ Delete page error:', err);
      error('Failed to delete page');
    }
  };

  // ✅ FIXED: updatePage with proper NaN handling
  const updatePage = async (pageId, data) => {
    try {
      // ✅ Handle empty values properly - prevent NaN
      const pageNumber = data.page_number !== undefined && data.page_number !== '' 
        ? parseInt(data.page_number, 10) 
        : 1;
        
      const timeLimit = data.time_limit_seconds !== undefined && data.time_limit_seconds !== '' 
        ? parseInt(data.time_limit_seconds, 10) 
        : 10;
        
      const layoutId = data.layout_template_id !== undefined && data.layout_template_id !== '' 
        ? parseInt(data.layout_template_id, 10) 
        : null;
      
      // ✅ Validate numbers
      if (isNaN(pageNumber) || pageNumber < 1) {
        warning('Page number must be at least 1');
        return;
      }
      if (isNaN(timeLimit) || timeLimit < 3 || timeLimit > 60) {
        warning('Time limit must be between 3 and 60 seconds');
        return;
      }
      
      const payload = {
        page_number: pageNumber,
        time_limit_seconds: timeLimit,
        layout_template_id: layoutId
      };
      
      console.log('📤 Updating page with payload:', payload);
      
      const response = await adminApi.put(`/quizzes/${id}/pages/${pageId}`, payload);
      console.log('✅ Update response:', response.data);
      
      const updated = pages.map(p => p.id === pageId ? { ...p, ...data } : p);
      setPages(updated);
      success('Page updated!');
    } catch (err) {
      console.error('❌ Update error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update page';
      error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  const addImageToPage = async (pageId, imageId) => {
    try {
      await adminApi.post(`/pages/${pageId}/images/${imageId}`, {
        display_order: 0,
        position_index: 0
      });
      await loadQuiz();
      success('Image added to page!');
    } catch (err) {
      console.error('❌ Add image error:', err);
      error('Failed to add image');
    }
  };

  const removeImageFromPage = async (pageId, imageId) => {
    try {
      await adminApi.delete(`/pages/${pageId}/images/${imageId}`);
      await loadQuiz();
      success('Image removed');
    } catch (err) {
      console.error('❌ Remove image error:', err);
      error('Failed to remove image');
    }
  };

  const layoutOptions = [
    { id: 1, name: '2x2 Grid', icon: '⊞' },
    { id: 2, name: '3x2 Grid', icon: '⊞' },
    { id: 3, name: 'Vertical Stack', icon: '⊟' },
    { id: 4, name: 'Horizontal Row', icon: '⊞' },
  ];

  if (isNewQuiz) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/admin/quizzes')} className="btn-glass !py-2 !px-4">
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <h1 className="text-2xl font-bold text-[#1A312C]">Create New Quiz</h1>
        </div>
        <div className="glass-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A312C]/60 mb-1">Quiz Title *</label>
            <input
              type="text"
              placeholder="Enter quiz title..."
              value={newQuizData.title}
              onChange={(e) => setNewQuizData({ ...newQuizData, title: e.target.value })}
              className="input-modern"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A312C]/60 mb-1">Description</label>
            <textarea
              placeholder="Enter quiz description..."
              value={newQuizData.description}
              onChange={(e) => setNewQuizData({ ...newQuizData, description: e.target.value })}
              className="input-modern resize-none"
              rows="4"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={newQuizData.is_published}
              onChange={(e) => setNewQuizData({ ...newQuizData, is_published: e.target.checked })}
              className="w-4 h-4 accent-[#428475]"
            />
            <label htmlFor="isPublished" className="text-sm text-[#1A312C]/60">Publish immediately</label>
          </div>
          <button onClick={createNewQuiz} disabled={saving} className="btn-neon w-full justify-center py-3">
            {saving ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" /> Creating...</> : <><FontAwesomeIcon icon={faSave} className="mr-2" /> Create Quiz</>}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-[#428475] border-t-transparent" /></div>;
  }

  const currentPage = pages[currentPageIndex];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/quizzes')} className="btn-glass !py-2 !px-4">
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1A312C]">{quiz?.title || 'Edit Quiz'}</h1>
            <p className="text-[#1A312C]/50 text-sm">
              {pages.length} pages · {pages.reduce((sum, p) => sum + (p.time_limit_seconds || 0), 0)}s total
            </p>
          </div>
        </div>
        <button className="btn-neon !py-2 !px-4" onClick={addPage}>
          <FontAwesomeIcon icon={faPlus} /> Add Page
        </button>
      </div>

      {/* Page List with Image Count */}
      <div className="flex flex-wrap gap-2 pb-4">
        {pages.map((page, index) => {
          const imageCount = page.page_images?.length || 0;
          return (
            <button
              key={page.id}
              onClick={() => setCurrentPageIndex(index)}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300
                ${currentPageIndex === index ? 'bg-[#428475] text-white shadow-lg' : 'glass-card hover:bg-[#428475]/10'}
              `}
            >
              <span>Page {page.page_number}</span>
              <span className="text-xs opacity-60">{page.time_limit_seconds}s</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {imageCount} 📷
              </span>
            </button>
          );
        })}
        {pages.length === 0 && <p className="text-[#1A312C]/40 py-2">No pages yet. Click "Add Page"</p>}
      </div>

      {/* Page Editor */}
      {currentPage && (
        <motion.div
          key={currentPage.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1A312C]">Page {currentPage.page_number}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#1A312C]/40">
                {currentPage.page_images?.length || 0} images
              </span>
              <button onClick={() => deletePage(currentPage.id)} className="btn-glass text-red-500 hover:bg-red-500/10 !py-1 !px-3 text-sm">
                <FontAwesomeIcon icon={faTrash} /> Delete Page
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-[#1A312C]/60">Page Number</label>
              <input
                type="number"
                value={currentPage.page_number}
                onChange={(e) => updatePage(currentPage.id, { page_number: e.target.value })}
                className="input-modern mt-1"
                min="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#1A312C]/60"><FontAwesomeIcon icon={faClock} className="mr-1" /> Time Limit (seconds)</label>
              <input
                type="number"
                value={currentPage.time_limit_seconds}
                onChange={(e) => updatePage(currentPage.id, { time_limit_seconds: e.target.value })}
                className="input-modern mt-1"
                min="3"
                max="60"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#1A312C]/60"><FontAwesomeIcon icon={faTable} className="mr-1" /> Layout</label>
              <select
                value={currentPage.layout_template_id || 1}
                onChange={(e) => updatePage(currentPage.id, { layout_template_id: e.target.value })}
                className="input-modern mt-1"
              >
                {layoutOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.icon} {opt.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Images on this page */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#1A312C]"><FontAwesomeIcon icon={faImage} className="mr-2" /> Images on this page</h3>
              <span className="text-sm text-[#1A312C]/40">
                {currentPage.page_images?.length || 0} images
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentPage.page_images?.map((pi) => (
                <div key={pi.id} className="relative group">
                  <img
                    src={`http://localhost:8000/uploads/${pi.image?.filename}`}
                    alt="page"
                    className="w-full h-24 object-cover rounded-lg border border-[#428475]/10"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23428475" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                    }}
                  />
                  <button
                    onClick={() => removeImageFromPage(currentPage.id, pi.image_id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                    #{pi.position_index !== null ? pi.position_index + 1 : '?'}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <select
                className="input-modern"
                onChange={(e) => {
                  if (e.target.value) {
                    addImageToPage(currentPage.id, e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Add image to page...</option>
                {allImages
                  .filter(img => !currentPage.page_images?.some(pi => pi.image_id === img.id))
                  .map(img => (
                    <option key={img.id} value={img.id}>{img.filename}</option>
                  ))
                }
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default QuizEditor;