import { useState, useRef } from 'react';
import { Camera, Video, Image as ImageIcon, Sparkles, UploadCloud, FileCheck, Radio } from 'lucide-react';
import type { InputMode } from '../../types/traffic';

interface InputSelectorProps {
  inputMode: InputMode;
  onSelectMode: (mode: InputMode) => void;
  onFileUpload: (file: File, type: 'video' | 'image') => void;
  uploadedFile: { name: string; size: string; type: string } | null;
  uploadProgress: number;
}

export const InputSelector: React.FC<InputSelectorProps> = ({
  inputMode,
  onSelectMode,
  onFileUpload,
  uploadedFile,
  uploadProgress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadType, setUploadType] = useState<'video' | 'image'>('video');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const isVid = file.type.startsWith('video');
      onFileUpload(file, isVid ? 'video' : 'image');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isVid = file.type.startsWith('video');
      onFileUpload(file, isVid ? 'video' : 'image');
    }
  };

  const triggerUpload = (type: 'video' | 'image') => {
    setUploadType(type);
    onSelectMode(type);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  return (
    <div className="glass-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: 'var(--cyan-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Stream Input Source</span>
        </div>
        <span className="badge badge-cyan">Active Source</span>
      </div>

      {/* Tabs */}
      <div className="input-tabs-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        <button
          className={`input-tab-btn ${inputMode === 'demo' ? 'active' : ''}`}
          onClick={() => onSelectMode('demo')}
          title="Interactive Highway Simulation with live vehicle detections"
        >
          <Sparkles size={13} />
          <span>Highway Cam</span>
        </button>

        <button
          className={`input-tab-btn ${inputMode === 'video' ? 'active' : ''}`}
          onClick={() => onSelectMode('video')}
          title="Live MJPEG YOLO Stream from Python Backend"
        >
          <Radio size={13} />
          <span>YOLO Backend</span>
        </button>

        <button
          className={`input-tab-btn ${inputMode === 'webcam' ? 'active' : ''}`}
          onClick={() => onSelectMode('webcam')}
          title="Real-Time Webcam Detection"
        >
          <Camera size={13} />
          <span>Live Camera</span>
        </button>

        <button
          className={`input-tab-btn ${inputMode === 'image' ? 'active' : ''}`}
          onClick={() => triggerUpload('image')}
          title="Upload an image for instant YOLO vehicle detection"
        >
          <ImageIcon size={13} />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Quick Action to Upload Custom Video */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-secondary"
          style={{ flex: 1, fontSize: 12, padding: '7px 12px' }}
          onClick={() => triggerUpload('video')}
        >
          <Video size={13} style={{ color: 'var(--cyan-primary)' }} />
          <span>Upload Custom Video</span>
        </button>

        <button
          className="btn btn-secondary"
          style={{ flex: 1, fontSize: 12, padding: '7px 12px' }}
          onClick={() => triggerUpload('image')}
        >
          <ImageIcon size={13} style={{ color: 'var(--color-motorcycle)' }} />
          <span>Upload Test Image</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={uploadType === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png'}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Drag & Drop Zone */}
      {(inputMode === 'video' || inputMode === 'image') && (
        <div
          className={`dropzone-container ${isDragOver ? 'is-dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="dropzone-icon-circle">
            <UploadCloud size={24} />
          </div>

          <div>
            <div className="dropzone-text-title">
              Drop {inputMode === 'video' ? 'traffic video (MP4, WebM)' : 'traffic image (JPG, PNG)'} here
            </div>
            <div className="dropzone-text-sub">
              or click to browse local computer storage
            </div>
          </div>

          {uploadedFile && (
            <div className="upload-progress-wrap" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                  <FileCheck size={14} style={{ color: 'var(--color-success)' }} />
                  <strong>{uploadedFile.name}</strong> ({uploadedFile.size})
                </span>
                <span style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>
                  {uploadProgress}%
                </span>
              </div>

              <div className="progress-track">
                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
