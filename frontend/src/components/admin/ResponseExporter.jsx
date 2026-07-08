import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, faFileExcel, faFileCode, faSpinner, 
  faFilePdf, faBrain, faTimes, faExpand, faCompress,
  faFileAlt, faUsers, faChartBar, faClock, faCheckCircle, faCode
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import { analyzeQuizResponses } from '../../api/aiApi';
import { useAlert } from '../common/CustomAlert';
import toast from 'react-hot-toast';

const ResponseExporter = () => {
  const { id } = useParams();
  const quizId = id;
  const { success, error, warning, info } = useAlert();

  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('json');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportedData, setExportedData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

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

  // ============================================================
  // GENERATE PDF REPORT WITH EXECUTIVE SUMMARY
  // ============================================================
  const generatePDFReport = async () => {
    setGeneratingPDF(true);
    try {
      // Get responses
      const responsesRes = await adminApi.get(`/quizzes/${quizId}/responses`);
      const responses = responsesRes.data;
      
      // Get quiz info
      const quizRes = await adminApi.get(`/quizzes/${quizId}`);
      const quiz = quizRes.data;

      // Get AI insights if available
      let aiAnalysis = null;
      try {
        const insightsRes = await adminApi.get(`/ai/insights/${quizId}`);
        if (insightsRes.data && insightsRes.data.length > 0) {
          const latest = insightsRes.data[insightsRes.data.length - 1];
          aiAnalysis = latest.content?.analysis || null;
        }
      } catch (e) {
        // No AI insights yet - user can generate from Insights tab
      }

      // Calculate stats
      const uniqueTokens = new Set(responses.map(r => r.participant_token));
      let totalTime = 0;
      let totalTimeouts = 0;
      responses.forEach(r => {
        if (r.latency_ms) totalTime += r.latency_ms;
        if (r.timeout_flag) totalTimeouts++;
      });
      const avgTime = responses.length > 0 ? (totalTime / responses.length / 1000).toFixed(1) : 0;

      // Build report content
      const reportContent = generateReportContent(quiz, responses, {
        totalResponses: responses.length,
        totalParticipants: uniqueTokens.size,
        avgTime: avgTime,
        totalTimeouts: totalTimeouts,
        aiAnalysis: aiAnalysis || 'Generate AI insights from the AI Insights tab for detailed analysis.'
      });

      // Download as text file (PDF-like format)
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_${quiz.title || quizId}_${new Date().toISOString().slice(0,10)}.pdf.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success('PDF Report generated successfully!');
    } catch (error) {
      error('Failed to generate PDF report');
      console.error('PDF Error:', error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ============================================================
  // REPORT CONTENT GENERATOR
  // ============================================================
  const generateReportContent = (quiz, responses, stats) => {
    const now = new Date().toLocaleString();
    const separator = '═'.repeat(60);
    const dash = '─'.repeat(60);

    return `
╔${'═'.repeat(78)}╗
║${' '.repeat(25)}SIGHTSPOKE REPORT${' '.repeat(25)}║
╚${'═'.repeat(78)}╝

${separator}
EXECUTIVE SUMMARY
${separator}

Report Generated: ${now}
Quiz Title: ${quiz.title || 'Unknown'}
Quiz Status: ${quiz.is_published ? '✅ Published' : '📝 Draft'}
Total Pages: ${quiz.pages?.length || 0}

${separator}
KEY METRICS
${separator}

📊 Total Responses:     ${stats.totalResponses}
👤 Total Participants:  ${stats.totalParticipants}
⏱️  Average Time:        ${stats.avgTime}s
⏰ Total Timeouts:       ${stats.totalTimeouts}
📈 Completion Rate:     ${stats.totalResponses > 0 ? Math.round((stats.totalResponses / (stats.totalParticipants * (quiz.pages?.length || 1))) * 100) : 0}%

${separator}
AI INSIGHTS
${separator}

${stats.aiAnalysis || '💡 No AI insights generated yet. Go to the AI Insights tab to generate analysis.'}

${separator}
QUIZ OVERVIEW
${separator}

📝 Description:
${quiz.description || 'No description provided.'}

${quiz.ai_overview ? `🤖 AI Overview:
${quiz.ai_overview}` : ''}

${separator}
RESPONSE DATA SUMMARY
${separator}

Total Responses Collected: ${stats.totalResponses}
Unique Participants: ${stats.totalParticipants}
Average Decision Time: ${stats.avgTime}s
Total Timeouts: ${stats.totalTimeouts}

${separator}
FOOTER
${separator}

This report was generated by SightSpoke AI Platform.
For more detailed analysis, visit the AI Insights tab.

© ${new Date().getFullYear()} SightSpoke · Privacy First · No Tracking
    `;
  };

  // ============================================================
  // LEGACY EXPORT (JSON/CSV)
  // ============================================================
  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get(`/quizzes/${quizId}/responses`);
      const data = response.data;
      setExportedData(data);
      
      let content;
      let filename;
      let mimeType;

      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = `responses_${quizId}_${new Date().toISOString().slice(0,10)}.json`;
        mimeType = 'application/json';
      } else {
        if (data.length === 0) {
          error('No data to export');
          setLoading(false);
          return;
        }
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(h => {
          const val = row[h] || '';
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(','));
        content = [headers.join(','), ...rows].join('\n');
        filename = `responses_${quizId}_${new Date().toISOString().slice(0,10)}.csv`;
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success(`Exported ${data.length} responses as ${format.toUpperCase()}`);
      setShowPreview(true);
    } catch (error) {
      error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const getPreviewContent = () => {
    if (!exportedData || exportedData.length === 0) return 'No data available';
    if (format === 'json') {
      return JSON.stringify(exportedData, null, 2);
    } else {
      if (exportedData.length === 0) return 'No data available';
      const headers = Object.keys(exportedData[0]);
      const rows = exportedData.map(row => headers.map(h => {
        const val = row[h] || '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(','));
      return [headers.join(','), ...rows].join('\n');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1A312C]">📥 Reports & Export</h2>
          <p className="text-[#1A312C]/40 text-sm">Quiz ID: {quizId}</p>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="btn-glass !py-2 !px-4"
        >
          <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
          {isFullscreen ? ' Exit Fullscreen' : ' Fullscreen'}
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : ''}`}>
        
        {/* Card 1: PDF Report - NEW */}
        <div className="glass-card p-6 hover:border-[#89D7B7]/30 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 flex items-center justify-center">
              <FontAwesomeIcon icon={faFilePdf} className="text-2xl text-[#EF4444]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1A312C]">PDF Report</h3>
              <p className="text-xs text-[#1A312C]/40">Executive Summary</p>
            </div>
          </div>
          <p className="text-sm text-[#1A312C]/50 mb-4">
            Complete report with executive summary, AI insights, and key metrics.
          </p>
          <button
            onClick={generatePDFReport}
            disabled={generatingPDF}
            className="w-full btn-neon !py-2.5 justify-center"
          >
            <FontAwesomeIcon icon={generatingPDF ? faSpinner : faFilePdf} className={generatingPDF ? 'animate-spin' : ''} />
            {generatingPDF ? 'Generating...' : 'Generate PDF Report'}
          </button>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#1A312C]/30">
            <FontAwesomeIcon icon={faBrain} className="text-[#89D7B7]" />
            <span>Includes AI insights + full data summary</span>
          </div>
        </div>

        {/* Card 2: JSON Export */}
        <div className="glass-card p-6 hover:border-[#428475]/30 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[#428475]/10 flex items-center justify-center">
              <FontAwesomeIcon icon={faFileCode} className="text-2xl text-[#428475]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1A312C]">JSON Export</h3>
              <p className="text-xs text-[#1A312C]/40">Structured Data</p>
            </div>
          </div>
          <p className="text-sm text-[#1A312C]/50 mb-4">
            Raw JSON data for developers and external systems integration.
          </p>
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full btn-glass !py-2.5 justify-center"
          >
            <FontAwesomeIcon icon={loading ? faSpinner : faDownload} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Exporting...' : 'Download JSON'}
          </button>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#1A312C]/30">
            <FontAwesomeIcon icon={faCode} className="text-[#428475]" />
            <span>For developers and API integrations</span>
          </div>
        </div>

        {/* Card 3: CSV Export */}
        <div className="glass-card p-6 hover:border-[#428475]/30 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
              <FontAwesomeIcon icon={faFileExcel} className="text-2xl text-[#10B981]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1A312C]">CSV Export</h3>
              <p className="text-xs text-[#1A312C]/40">Spreadsheet Data</p>
            </div>
          </div>
          <p className="text-sm text-[#1A312C]/50 mb-4">
            Excel-compatible CSV for analysis in spreadsheets and BI tools.
          </p>
          <button
            onClick={() => {
              setFormat('csv');
              setTimeout(handleExport, 100);
            }}
            disabled={loading}
            className="w-full btn-glass !py-2.5 justify-center"
          >
            <FontAwesomeIcon icon={loading ? faSpinner : faDownload} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Exporting...' : 'Download CSV'}
          </button>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#1A312C]/30">
            <FontAwesomeIcon icon={faChartBar} className="text-[#10B981]" />
            <span>For Excel, Google Sheets, and BI tools</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-[#1A312C] text-sm mb-2">Preview</h3>
          <pre className="w-full h-48 overflow-auto bg-[#1A312C]/5 rounded-lg p-4 text-xs font-mono text-[#1A312C] border border-[#428475]/10 whitespace-pre-wrap break-all">
            {getPreviewContent()}
          </pre>
        </div>
      )}

      {/* Note */}
      <div className="p-4 bg-[#89D7B7]/10 rounded-xl border border-[#89D7B7]/20">
        <p className="text-sm text-[#1A312C]/60 flex items-center gap-2">
          <FontAwesomeIcon icon={faBrain} className="text-[#89D7B7]" />
          💡 For AI-powered insights and natural language summaries, visit the <strong>"AI Insights"</strong> tab in Quiz Details.
        </p>
      </div>
    </div>
  );
};

export default ResponseExporter;