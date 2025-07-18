import React, { useState, useEffect } from 'react';
import { Edit3, Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ProcessingSession, DocumentChunk } from '../types';

interface ChunkViewerProps {
  session: ProcessingSession | null;
  onChunkingComplete: () => void;
  onScriptingComplete: () => void;
  onStepChange: (step: string) => void;
}

const ChunkViewer: React.FC<ChunkViewerProps> = ({
  session,
  onChunkingComplete,
  onScriptingComplete,
  onStepChange
}) => {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [editingChunk, setEditingChunk] = useState<string | null>(null);
  const [scriptingChunks, setScriptingChunks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session) {
      setChunks(session.chunks);
      onChunkingComplete();
    }
  }, [session, onChunkingComplete]);

  const generateScript = async (chunk: DocumentChunk) => {
    setScriptingChunks(prev => new Set(prev).add(chunk.id));
    
    try {
      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunkId: chunk.id,
          content: chunk.content
        })
      });

      const result = await response.json();
      
      setChunks(prev => prev.map(c => 
        c.id === chunk.id 
          ? { ...c, script: result.script, status: 'script_ready' }
          : c
      ));
    } catch (error) {
      console.error('Script generation failed:', error);
      setChunks(prev => prev.map(c => 
        c.id === chunk.id 
          ? { ...c, status: 'error' }
          : c
      ));
    } finally {
      setScriptingChunks(prev => {
        const newSet = new Set(prev);
        newSet.delete(chunk.id);
        return newSet;
      });
    }
  };

  const generateAllScripts = async () => {
    const pendingChunks = chunks.filter(c => !c.script);
    
    for (const chunk of pendingChunks) {
      await generateScript(chunk);
    }
  };

  const allScriptsReady = chunks.every(c => c.script && c.status === 'script_ready');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'script_ready': return 'text-green-600';
      case 'scripting': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (chunk: DocumentChunk) => {
    if (scriptingChunks.has(chunk.id)) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (chunk.status === 'script_ready') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (chunk.status === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  if (!session) {
    return <div>No session data available</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Review Document Chunks
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={generateAllScripts}
              disabled={scriptingChunks.size > 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Generate All Scripts
            </button>
            {allScriptsReady && (
              <button
                onClick={() => onStepChange('generating')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Continue to Video Generation
              </button>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">
          Review the document chunks and generate conversational scripts for each section.
        </p>
      </div>

      <div className="space-y-4">
        {chunks.map((chunk, index) => (
          <div key={chunk.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Chunk {index + 1}
                  </span>
                  {getStatusIcon(chunk)}
                  <span className={`text-sm font-medium ${getStatusColor(chunk.status)}`}>
                    {chunk.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {chunk.title || `Section ${index + 1}`}
                </h3>
              </div>
              
              <div className="flex space-x-2">
                {!chunk.script && (
                  <button
                    onClick={() => generateScript(chunk)}
                    disabled={scriptingChunks.has(chunk.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Generate Script
                  </button>
                )}
                {chunk.script && (
                  <button
                    onClick={() => setEditingChunk(chunk.id)}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    <Edit3 className="w-3 h-3 inline mr-1" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Original Content</h4>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 max-h-32 overflow-y-auto">
                  {chunk.content}
                </div>
              </div>
              
              {chunk.script && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Generated Script</h4>
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <h5 className="font-medium text-blue-900 mb-1">{chunk.script.title}</h5>
                    <div className="space-y-1 text-blue-800">
                      {chunk.script.script_chunks.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-600">
                        <strong>Direction:</strong> {chunk.script.camera_direction}
                      </p>
                      <p className="text-xs text-blue-600">
                        <strong>Environment:</strong> {chunk.script.environment}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChunkViewer;