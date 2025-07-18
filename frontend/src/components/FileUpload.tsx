import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Type, Loader2, AlertCircle } from 'lucide-react';
import { ProcessingSession } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface FileUploadProps {
  onUploadComplete: (session: ProcessingSession) => void;
  onStepChange: (step: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onStepChange
}) => {
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsProcessing(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to backend
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Create session object
      const session: ProcessingSession = {
        id: result.sessionId,
        fileName: file.name,
        chunks: result.chunks,
        createdAt: new Date(),
        status: 'chunking'
      };

      onUploadComplete(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const handleTextSubmit = async () => {
    if (!textInput.trim() || !fileName.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textInput,
          fileName: fileName
        }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      const session: ProcessingSession = {
        id: result.sessionId,
        fileName: fileName,
        chunks: result.chunks,
        createdAt: new Date(),
        status: 'chunking'
      };

      onUploadComplete(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Upload Your Document
          </h2>
          <p className="text-gray-600">
            Upload a PDF, DOCX file, or paste your text content to get started
          </p>
        </div>

        {/* Upload Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setUploadMode('file')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all
                ${uploadMode === 'file'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <File className="w-4 h-4 inline mr-2" />
              Upload File
            </button>
            <button
              onClick={() => setUploadMode('text')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all
                ${uploadMode === 'text'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Type className="w-4 h-4 inline mr-2" />
              Paste Text
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {uploadMode === 'file' ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
              ${isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <p className="text-gray-600">Processing your document...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-lg font-medium text-gray-900 mb-1">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                </p>
                <p className="text-gray-600 mb-4">or click to browse</p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOCX, and TXT files (max 10MB)
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-1">
                Document Name
              </label>
              <input
                id="filename"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter a name for your document"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
            </div>
            
            <div>
              <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-1">
                Document Content
              </label>
              <textarea
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your document content here..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
            </div>
            
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || !fileName.trim() || isProcessing}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? 'Processing...' : 'Process Text'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;