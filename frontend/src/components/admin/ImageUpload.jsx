import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCloudUpload, faImage, faTrash, faCheck, 
  faEye, faTimes, faSpinner 
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import { useAlert } from '../common/CustomAlert'; // ✅ Import custom alert

const ImageUpload = ({ onUploadComplete }) => {
  // ✅ Use custom alert hooks
  const { success, error, warning, info, confirm } = useAlert();
  
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State for title and description
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  // Load images on mount
  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get('/images');
      setUploadedImages(response.data);
    } catch (err) {
      error('Failed to load images'); // ✅ Custom error alert
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    try {
      const results = [];
      for (const file of acceptedFiles) {
        if (file.size > 5 * 1024 * 1024) {
          error(`${file.name} is too large (max 5MB)`); // ✅ Custom error alert
          continue;
        }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('title', uploadTitle || file.name.split('.')[0]);
        fd.append('description', uploadDescription || '');
        
        const response = await adminApi.post('/images/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        results.push(response.data);
        success(`Uploaded: ${file.name}`); // ✅ Custom success alert
      }
      
      setUploadedImages([...uploadedImages, ...results]);
      setUploadTitle('');
      setUploadDescription('');
      if (onUploadComplete) onUploadComplete(results);
      
    } catch (err) {
      error('Upload failed: ' + (err.response?.data?.detail || 'Unknown error')); // ✅ Custom error alert
    } finally {
      setUploading(false);
    }
  }, [uploadedImages, onUploadComplete, uploadTitle, uploadDescription, success, error]);

  const deleteImage = async (imageId) => {
    // ✅ Custom confirm dialog instead of window.confirm
    const confirmed = await confirm(
      'Delete this image? This action cannot be undone.',
      'Delete Image'
    );
    if (!confirmed) return;
    
    try {
      await adminApi.delete(`/images/${imageId}`);
      setUploadedImages(uploadedImages.filter(img => img.id !== imageId));
      success('Image deleted successfully'); // ✅ Custom success alert
    } catch (err) {
      error('Failed to delete image'); // ✅ Custom error alert
    }
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

  return (
    <div className="space-y-6">
      {/* Header with View Gallery Button */}
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

        {/* Title & Description Inputs */}
        <div className="mt-4 max-w-md mx-auto">
          <div className="grid grid-cols-1 gap-3">
            <div className="text-left">
              <label className="text-sm font-medium text-[#1A312C]/60">Image Title</label>
              <input
                type="text"
                placeholder="Enter image title..."
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="input-modern mt-1"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="text-left">
              <label className="text-sm font-medium text-[#1A312C]/60">Description</label>
              <input
                type="text"
                placeholder="Enter image description..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="input-modern mt-1"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <p className="text-xs text-[#1A312C]/30 mt-2">
            💡 Title & description help AI analyze image context
          </p>
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#428475] border-t-transparent" />
            <p className="text-sm text-[#428475] mt-2">Uploading...</p>
          </div>
        )}
      </div>

      {/* Gallery View */}
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
                  <div className="aspect-square rounded-lg overflow-hidden border border-[#428475]/10 bg-[#1A312C]/5">
                    <img
                      src={`http://localhost:8000/uploads/${img.filename}`}
                      alt={img.title || img.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23428475" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                      }}
                    />
                    {/* Show title on hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {img.title || img.filename}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    </button>
                  </div>
                  <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {img.mime_type?.split('/')[1]?.toUpperCase() || 'IMG'}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ImageUpload;