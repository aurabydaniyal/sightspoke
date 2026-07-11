import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBrain, faChartBar, faClock, faTarget, 
  faDownload, faRefresh, faLightbulb, faCheckCircle,
  faSpinner, faImage, faUserMd, faHeartbeat,
  faUsers, faList
} from '@fortawesome/free-solid-svg-icons';
import { analyzeQuizResponses, getQuizAIInsights } from '../../api/aiApi';
import SkeletonLoader, { LoadingMessage } from '../common/SkeletonLoader';
import DotField from '../common/DotField';
import { useAlert } from '../common/CustomAlert';

const AIInsights = ({ quizId, quizTitle }) => {
  const { success, error, warning, info } = useAlert();
  
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [stats, setStats] = useState({
    totalResponses: 0,
    totalChats: 0,
    avgLatency: '—',
    mostSelected: null,
    psychologicalInsights: null,
    keyFindings: []  // ✅ Added
  });

  useEffect(() => {
    loadInsights();
  }, [quizId]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const response = await getQuizAIInsights(quizId);
      if (response && response.length > 0) {
        const latest = response[response.length - 1];
        setInsights(latest);
        if (latest.content && latest.content.analysis) {
          setAnalysis(latest.content.analysis);
        }
        if (latest.content) {
          const mostSelected = latest.content.most_selected || null;
          const avgLatency = latest.content.avg_latency;
          const formattedLatency = avgLatency !== undefined && avgLatency !== null && avgLatency !== '—' 
            ? parseFloat(avgLatency).toFixed(2) 
            : '—';
          
          setStats({
            totalResponses: latest.content.total_responses || 0,
            totalChats: latest.content.chat_count || 0,
            avgLatency: formattedLatency,
            mostSelected: mostSelected,
            psychologicalInsights: latest.content.analysis || null,
            keyFindings: latest.content.key_findings || []  // ✅ Added
          });
        }
      } else {
        info('No insights generated yet. Click "Generate Analysis" to create them.');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        info('No insights found. Generate analysis to get started.');
      } else {
        error('Failed to load AI insights');
        console.error('Load insights error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeQuizResponses(quizId);
      if (result && result.analysis) {
        setAnalysis(result.analysis);
        const mostSelected = result.most_selected || null;
        const avgLatency = result.avg_latency;
        const formattedLatency = avgLatency !== undefined && avgLatency !== null && avgLatency !== '—' 
          ? parseFloat(avgLatency).toFixed(2) 
          : '—';
        
        setStats({
          totalResponses: result.total_responses || 0,
          totalChats: result.chat_history?.length || 0,
          avgLatency: formattedLatency,
          mostSelected: mostSelected,
          psychologicalInsights: result.analysis || null,
          keyFindings: result.key_findings || []  // ✅ Added
        });
        success('Psychological analysis generated!');
      }
    } catch (err) {
      error('Failed to generate analysis');
      console.error('Generate analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = (image) => {
    if (!image) return '';
    if (image.url && image.url.startsWith('http')) return image.url;
    if (image.file_path && image.file_path.startsWith('http')) return image.file_path;
    if (image.file_path && image.file_path.startsWith('/uploads/')) {
      return `http://localhost:8000${image.file_path}`;
    }
    if (image.filename) {
      return `http://localhost:8000/uploads/${image.filename}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingMessage text="Generating psychological insights..." />
        <SkeletonLoader height="200px" />
        <SkeletonLoader height="100px" />
        <SkeletonLoader height="80px" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-[#428475]/10 flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faBrain} className="text-4xl text-[#428475]" />
        </div>
        <h3 className="text-xl font-semibold text-[#1A312C] mb-2">No Psychological Analysis Yet</h3>
        <p className="text-[#1A312C]/50">Generate AI insights from participant responses.</p>
        <button
          onClick={generateAnalysis}
          className="btn-neon mt-4"
          disabled={loading}
        >
          <FontAwesomeIcon icon={loading ? faSpinner : faRefresh} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Generating...' : 'Generate Analysis'}
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-[400px]">
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={67}
          glowRadius={160}
          sparkle
          waveAmplitude={0}
          cursorRadius={500}
          cursorForce={0.1}
          bulgeOnly
          gradientFrom="#428475"
          gradientTo="#89D7B7"
          glowColor="#89D7B7"
        />
      </div>

      <div className="relative z-10 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-[#1A312C]">{stats.totalResponses}</p>
            <p className="text-xs text-[#1A312C]/50">Total Responses</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-[#1A312C]">{stats.totalChats}</p>
            <p className="text-xs text-[#1A312C]/50">Chats</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-[#1A312C]">{stats.avgLatency}s</p>
            <p className="text-xs text-[#1A312C]/50">Avg Latency</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-[#1A312C]">
              {stats.mostSelected?.percentage || 0}%
            </p>
            <p className="text-xs text-[#1A312C]/50">Most Selected</p>
          </div>
        </div>

        {/* ✅ Key Findings - NEW */}
        {stats.keyFindings && stats.keyFindings.length > 0 && (
          <div className="glass-card p-4 border-l-4 border-[#89D7B7]">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faList} className="text-[#89D7B7]" />
              <h4 className="font-semibold text-[#1A312C]">Key Findings</h4>
            </div>
            <ul className="space-y-2">
              {stats.keyFindings.map((finding, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[#1A312C]/80">
                  <span className="text-[#89D7B7] mt-1">•</span>
                  <span>
                    {finding.type === 'most_selected' 
                      ? `"${finding.title}" was selected by ${finding.percentage}% of participants (${finding.count} selections)`
                      : finding.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Most Selected Image - FIXED to show image */}
          {stats.mostSelected && stats.mostSelected.url && (
            <div className="glass-card p-4">
              <h4 className="font-semibold text-[#1A312C] mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faImage} className="text-[#89D7B7]" />
                Most Selected Image
              </h4>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-[#428475]/10 bg-[#1A312C]/5">
                  <img
                    src={stats.mostSelected.url}
                    alt={stats.mostSelected.title || 'Most selected image'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', stats.mostSelected.url);
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23428475" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1A312C]">
                    {stats.mostSelected.title || 'Image'}
                  </p>
                  <p className="text-sm text-[#1A312C]/50 line-clamp-2">
                    {stats.mostSelected.description || 'No description'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs text-[#428475] font-medium">
                      Selected {stats.mostSelected.selection_count || 0} times ({stats.mostSelected.percentage || 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Expert Analysis Report */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A312C] flex items-center gap-2">
              <FontAwesomeIcon icon={faUserMd} className="text-[#89D7B7]" />
              Expert Survey Analysis
            </h3>
            <div className="flex gap-2">
              <button
                onClick={generateAnalysis}
                disabled={loading}
                className="btn-glass !py-1.5 !px-3 text-sm"
              >
                <FontAwesomeIcon icon={loading ? faSpinner : faRefresh} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Generating...' : 'Regenerate'}
              </button>
              <button
                onClick={() => {
                  if (!analysis) return;
                  const blob = new Blob([analysis], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Survey_Report_${quizId}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  success('Report downloaded!');
                }}
                className="btn-glass !py-1.5 !px-3 text-sm"
              >
                <FontAwesomeIcon icon={faDownload} /> Download
              </button>
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-[#1A312C]/80 text-sm leading-relaxed">
              {analysis}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;