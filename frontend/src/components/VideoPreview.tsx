import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCw, Download, Loader2 } from 'lucide-react';
import { ProcessingSession, DocumentChunk } from '../types';

interface VideoPreviewProps {
  session: ProcessingSession | null;
  onGenerationComplete: () => void;
  onStepChange: (step: string) => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  session,
  onGenerationComplete,
  onStepChange
}) => {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [generatingVideos, setGeneratingVideos] = useState<Set<string>>(new Set());
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setChunks(session.chunks);
    }
  }, [session]);

  const generateVideo = async (chunk: DocumentChunk) => {
    if (!chunk.script) return;
    
    setGeneratingVideos(prev => new Set(prev).add(chunk.id));
    
    try {
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunkId: chunk.id,
          script: chunk.script.script_chunks.join(' '),
          camera_direction: chunk.script.camera_direction,
          environment: chunk.script.environment
        })
      });

      const result = await response.json();
      
      // Poll for video completion
      const pollVideo = async () => {
        const statusResponse = await fetch(`/api/videos/status/${result.videoId}`);
        const statusResult = await statusResponse.json();
        
        if (statusResult.status === 'completed') {
          setChunks(prev => prev.map(c => 
            c.id === chunk.id 
              ? { ...c, videoUrl: statusResult.videoUrl, status: 'video_ready' }
              : c
          ));
          setGeneratingVideos(prev => {
            const newSet = new Set(prev);
            newSet.delete(chunk.id);
            return newSet;
          });
        } else if (statusResult.status === 'failed') {
          setChunks(prev => prev.map(c => 
            c.id === chunk.id 
              ? { ...c, status: 'error' }
              : c
          ));
          setGeneratingVideos(prev => {
            const newSet = new Set(prev);
            newSet.delete(chunk.id);
            return newSet;
          });
        } else {
          // Continue polling
          setTimeout(pollVideo, 5000);
        }
      };
      
      pollVideo();
    } catch (error) {
      console.error('Video generation failed:', error);
      setChunks(prev => prev.map(c => 
        c.id === chunk.id 
          ? { ...c, status: 'error' }
          : c
      ));
      setGeneratingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(chunk.id);
        return newSet;
      });
    }
  };

  const generateAllVideos = async () => {
    const scriptsReady = chunks.filter(c => c.script && !c.videoUrl);
    
    for (const chunk of scriptsReady) {
      await generateVideo(chunk);
    }
  };

  const allVideosReady = chunks.every(c => c.videoUrl && c.status === 'video_ready');

  const reorderChunks = (fromIndex: number, toIndex: number) => {
    const newChunks = [...chunks];
    const [removed] = newChunks.splice(fromIndex, 1);
    newChunks.splice(toIndex, 0, removed);
    
    // Update order property
    newChunks.forEach((chunk, index) => {
      chunk.order = index;
    });
    
    setChunks(newChunks);
  };

  if (!session) {
    return <div>No session data available</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Generate & Preview Videos
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={generateAllVideos}
              disabled={generatingVideos.size > 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Generate All Videos
            </button>
            {allVideosReady && (
              <button
                onClick={() => onStepChange('preview')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Continue to Export
              </button>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">
          Generate videos from your scripts and preview the results. You can reorder videos by dragging them.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chunks.map((chunk, index) => (
          <div key={chunk.id} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {chunk.script?.title || `Video ${index + 1}`}
                </h3>
                <span className="text-xs text-gray-500">
                  {chunk.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex space-x-1">
                {!chunk.videoUrl && chunk.script && (
                  <button
                    onClick={() => generateVideo(chunk)}
                    disabled={generatingVideos.has(chunk.id)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    {generatingVideos.has(chunk.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                )}
                {chunk.videoUrl && (
                  <button
                    onClick={() => generateVideo(chunk)}
                    className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
              {chunk.videoUrl ? (
                <video
                  src={chunk.videoUrl}
                  controls
                  className="w-full h-full object-cover rounded-lg"
                  poster="/api/videos/thumbnail/${chunk.id}"
                />
              ) : generatingVideos.has(chunk.id) ? (
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Generating video...</p>
                </div>
              ) : (
                <div className="text-center">
                  <Play className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {chunk.script ? 'Ready to generate' : 'No script available'}
                  </p>
                </div>
              )}
            </div>

            {chunk.script && (
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Script:</strong> {chunk.script.script_chunks[0]}...</p>
                <p><strong>Direction:</strong> {chunk.script.camera_direction}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {allVideosReady && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Preview Complete Series
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Video Order</h4>
              <div className="space-y-2">
                {chunks.map((chunk, index) => (
                  <div key={chunk.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-600">
                      {index + 1}.
                    </span>
                    <span className="text-sm text-gray-900 flex-1">
                      {chunk.script?.title || `Video ${index + 1}`}
                    </span>
                    <span className="text-xs text-gray-500">
                      {chunk.videoUrl ? '✓' : '⏳'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setCurrentVideo(chunks[0]?.videoUrl || null)}
                  className="w-full p-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                >
                  <Play className="w-4 h-4 inline mr-1" />
                  Play All Videos
                </button>
                <button
                  onClick={() => onStepChange('preview')}
                  className="w-full p-2 bg-green-50 text-green-700 rounded hover:bg-green-100 text-sm"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Export Final Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;