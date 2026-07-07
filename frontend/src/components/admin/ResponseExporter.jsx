import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, faFileExcel, faFileCode, faSpinner, 
  faTimes, faExpand, faCompress 
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import toast from 'react-hot-toast';

const ResponseExporter = () => {
  const { id } = useParams();
  const quizId = id;

  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('json');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportedData, setExportedData] = useState(null); // ✅ Renamed from exportData
  const [showPreview, setShowPreview] = useState(false);

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

  // ✅ Renamed function to handleExport
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
          toast.error('No data to export');
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

      toast.success(`Exported ${data.length} responses as ${format.toUpperCase()}`);
      setShowPreview(true);
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error.response?.data || error.message);
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
          <h2 className="text-2xl font-bold text-[#1A312C]">Export Responses</h2>
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

      {/* Main Export Card - Wider */}
      <div className={`glass-card p-6 transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="md:col-span-1 space-y-4">
            <div>
              <label className="text-sm font-medium text-[#1A312C]/60">Export Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="input-modern mt-1"
              >
                <option value="json">📄 JSON (AI Ready)</option>
                <option value="csv">📊 CSV (Excel)</option>
              </select>
            </div>

            <button
              onClick={handleExport} // ✅ Changed from exportData to handleExport
              disabled={loading}
              className="btn-neon w-full justify-center !py-3"
            >
              <FontAwesomeIcon icon={loading ? faSpinner : faDownload} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Exporting...' : `Download ${format.toUpperCase()}`}
            </button>

            <div className="text-sm text-[#1A312C]/40 space-y-1">
              <p className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFileCode} /> JSON for AI analysis
              </p>
              <p className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFileExcel} /> CSV for spreadsheets
              </p>
            </div>

            {exportedData && (
              <div className="p-3 bg-[#89D7B7]/10 rounded-lg">
                <p className="text-sm text-[#1A312C]">
                  📊 Total Responses: <span className="font-bold">{exportedData.length}</span>
                </p>
              </div>
            )}
          </div>

          {/* Right: Preview - Wider Area */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#1A312C] text-sm">
                {showPreview ? 'Preview' : 'Preview will appear here after export'}
              </h3>
              {showPreview && (
                <span className="text-xs text-[#428475] font-medium">
                  {format.toUpperCase()} · {exportedData?.length || 0} records
                </span>
              )}
            </div>
            
            <div className="relative">
              <pre className="w-full h-64 md:h-80 overflow-auto bg-[#1A312C]/5 rounded-lg p-4 text-xs font-mono text-[#1A312C] border border-[#428475]/10 whitespace-pre-wrap break-all">
                {showPreview ? getPreviewContent() : (
                  <span className="text-[#1A312C]/30 flex items-center justify-center h-full">
                    Click "Download" to generate preview
                  </span>
                )}
              </pre>
              {showPreview && (
                <div className="absolute bottom-2 right-2 text-[10px] text-[#1A312C]/20">
                  Scroll to view full content
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Close button when fullscreen */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#1A312C]/10 hover:bg-[#1A312C]/20 transition-colors flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faTimes} className="text-[#1A312C]" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ResponseExporter;