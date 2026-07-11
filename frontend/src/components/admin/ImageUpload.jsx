import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCloudUpload, faImage, faTrash, faCheck, 
  faEye, faTimes, faSpinner, faSave,
  faInfoCircle, faExpand
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import { useAlert } from '../common/CustomAlert';

const ImageUpload = ({ onUploadComplete }) => {
  const { success, error, warning, info, confirm } = useAlert();
  
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get('/images');
      setUploadedImages(response.data);
    } catch (err) {
      error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    setSelectedFiles(acceptedFiles);
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      warning('Please select images first');
      return;
    }

    if (!uploadTitle.trim()) {
      warning('Please enter an image title');
      return;
    }

    setUploading(true);
    try {
      const results = [];
      for (const file of selectedFiles) {
        if (file.size > 5 * 1024 * 1024) {
          warning(`${file.name} is too large (max 5MB)`);
          continue;
        }
        
        const fd = new FormData();
        fd.append('file', file);
        fd.append('title', uploadTitle.trim());
        fd.append('description', uploadDescription.trim() || '');
        
        const response = await adminApi.post('/images/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        results.push(response.data);
      }
      
      setUploadedImages([...uploadedImages, ...results]);
      success(`Uploaded ${results.length} images`);
      setUploadTitle('');
      setUploadDescription('');
      setSelectedFiles([]);
      if (onUploadComplete) onUploadComplete(results);
      
    } catch (err) {
      error('Upload failed: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId) => {
    const confirmed = await confirm(
      'Delete this image? This action cannot be undone.',
      'Delete Image'
    );
    if (!confirmed) return;
    
    try {
      await adminApi.delete(`/images/${imageId}`);
      setUploadedImages(uploadedImages.filter(img => img.id !== imageId));
      success('Image deleted');
    } catch (err) {
      error('Failed to delete image');
    }
  };

  const openImageDetail = (image) => {
    setSelectedImage(image);
    setShowDetailModal(true);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true
  });

  const getImageSrc = (image) => {
    if (!image) return '';
    if (image.file_path && image.file_path.startsWith('http')) return image.file_path;
    if (image.file_path && image.file_path.startsWith('/uploads/')) {
      return `http://localhost:8000${image.file_path}`;
    }
    return `http://localhost:8000/uploads/${image.filename || ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#1A312C]">Image Management</h2>
        <button
          onClick={() => setShowGallery(!showGallery)}
          className="btn-glass !py-2 !px-4"
        >
          <FontAwesomeIcon icon={showGallery ? faTimes : faEye} />
          {showGallery ? 'Close Gallery' : `View Gallery (${uploadedImages.length})`}
        </button>
      </div>

      {/* Upload Area */}
      <div className="glass-card p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
            ${isDragActive 
              ? 'border-[#89D7B7] bg-[#89D7B7]/10' 
              : 'border-[#428475]/30 hover:border-[#428475] hover:bg-[#428475]/5'
            }
          `}
        >
          <input {...getInputProps()} />
          <FontAwesomeIcon 
            icon={faCloudUpload} 
            className={`text-5xl mb-4 transition-colors ${isDragActive ? 'text-[#89D7B7]' : 'text-[#428475]/40'}`}
          />
          <p className="text-lg font-medium text-[#1A312C]">
            {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
          </p>
          <p className="text-sm text-[#1A312C]/40 mt-2">
            or click to browse · JPG, PNG, WEBP · Max 5MB each
          </p>
          {selectedFiles.length > 0 && (
            <p className="text-sm text-[#428475] mt-2">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-[#1A312C]/60">Image Title *</label>
            <input
              type="text"
              placeholder="Enter image title..."
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="input-modern mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A312C]/60">Description</label>
            <input
              type="text"
              placeholder="Enter image description..."
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              className="input-modern mt-1"
            />
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0 || !uploadTitle.trim()}
          className="btn-neon w-full justify-center mt-4 !py-3 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              Submit Images
            </>
          )}
        </button>
      </div>

      {/* Gallery */}
      {showGallery && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A312C]">
              All Images ({uploadedImages.length})
            </h3>
            {loading && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#428475]" />}
          </div>
          
          {uploadedImages.length === 0 ? (
            <p className="text-[#1A312C]/40 text-center py-8">No images uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {uploadedImages.map((img) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  <button
                    onClick={() => openImageDetail(img)}
                    className="w-full aspect-square rounded-lg overflow-hidden border border-[#428475]/10 bg-[#1A312C]/5 cursor-pointer hover:border-[#89D7B7] transition-all"
                  >
                    <img
                      src={getImageSrc(img)}
                      alt={img.title || img.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23428475" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1 text-white">
                        <FontAwesomeIcon icon={faExpand} className="text-2xl" />
                        <span className="text-xs">View Details</span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {img.title || img.filename}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => deleteImage(img.id)}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                  
                  <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {img.mime_type?.split('/')[1]?.toUpperCase() || 'IMG'}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ✅ Image Detail Modal - FIXED: Centered with flex */}
      <AnimatePresence>
        {showDetailModal && selectedImage && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
            />

            {/* ✅ Modal Container - Using flex to center */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-[92vw] max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div 
                  className="glass-card p-6 sm:p-8 relative"
                  style={{
                    background: 'rgba(26, 49, 44, 0.96)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(137, 215, 183, 0.15)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[#FFF4E1]/40 hover:text-[#FFF4E1] transition-colors z-10"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xl sm:text-2xl" />
                  </button>

                  {/* Image */}
                  <div className="rounded-xl overflow-hidden mb-4 bg-[#1A312C]/50">
                    <img
                      src={getImageSrc(selectedImage)}
                      alt={selectedImage.title || selectedImage.filename}
                      className="w-full max-h-[300px] object-contain"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23428475" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-[#FFF4E1]/50">Title</h3>
                      <p className="text-[#FFF4E1] text-base font-medium">
                        {selectedImage.title || 'Untitled'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-[#FFF4E1]/50">Description</h3>
                      <p className="text-[#FFF4E1]/80 text-sm">
                        {selectedImage.description || 'No description provided'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#428475]/10">
                      <div>
                        <h4 className="text-xs font-medium text-[#FFF4E1]/40">Filename</h4>
                        <p className="text-[#FFF4E1]/60 text-xs truncate">
                          {selectedImage.filename || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-[#FFF4E1]/40">Type</h4>
                        <p className="text-[#FFF4E1]/60 text-xs">
                          {selectedImage.mime_type || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="btn-neon w-full justify-center mt-2 !py-2.5 text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageUpload;