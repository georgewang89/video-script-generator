import React, { useState } from 'react';
import { Upload, FileText, Video, Download, CheckCircle, AlertCircle } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ChunkViewer from './components/ChunkViewer';
import VideoPreview from './components/VideoPreview';
import ExportSection from './components/ExportSection';
import ProgressTracker from './components/ProgressTracker';
import { ProcessingSession } from './types';

type Step = 'upload' | 'chunking' | 'scripting' | 'generating' | 'preview' | 'export';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [session, setSession] = useState<ProcessingSession | null>(null);

  const steps = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'chunking', label: 'Chunking', icon: FileText },
    { key: 'scripting', label: 'Script Review', icon: FileText },
    { key: 'generating', label: 'Video Generation', icon: Video },
    { key: 'preview', label: 'Preview & Export', icon: Download },
  ];

  const handleUploadComplete = (newSession: ProcessingSession) => {
    setSession(newSession);
    setCurrentStep('chunking');
  };

  const handleChunkingComplete = () => {
    setCurrentStep('scripting');
  };

  const handleScriptingComplete = () => {
    setCurrentStep('generating');
  };

  const handleGenerationComplete = () => {
    setCurrentStep('preview');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <FileUpload
            onUploadComplete={handleUploadComplete}
            onStepChange={setCurrentStep}
          />
        );
      case 'chunking':
      case 'scripting':
        return (
          <ChunkViewer
            session={session}
            onChunkingComplete={handleChunkingComplete}
            onScriptingComplete={handleScriptingComplete}
            onStepChange={setCurrentStep}
          />
        );
      case 'generating':
        return (
          <VideoPreview
            session={session}
            onGenerationComplete={handleGenerationComplete}
            onStepChange={setCurrentStep}
          />
        );
      case 'preview':
        return (
          <ExportSection
            session={session}
            onStepChange={setCurrentStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Video Script Generator
          </h1>
          <p className="text-lg text-gray-600">
            Transform your documents into engaging video series with Claude Code and Veo 3
          </p>
        </header>

        <ProgressTracker
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />

        <main className="mt-8">
          {renderStepContent()}
        </main>

        {session && (
          <div className="mt-8 p-4 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  Session: {session.fileName}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {session.chunks.length} chunks
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {session.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
