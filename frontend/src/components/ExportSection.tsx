import React, { useState } from 'react';
import { Download, Settings, Play, Loader2 } from 'lucide-react';
import { ProcessingSession } from '../types';

interface ExportSectionProps {
  session: ProcessingSession | null;
  onStepChange: (step: string) => void;
}

const ExportSection: React.FC<ExportSectionProps> = ({
  session,
  onStepChange
}) => {
  const [includeIntro, setIncludeIntro] = useState(false);
  const [includeOutro, setIncludeOutro] = useState(false);
  const [backgroundMusic, setBackgroundMusic] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const handleExport = async () => {
    if (!session) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          includeIntro,
          includeOutro,
          backgroundMusic
        })
      });

      const result = await response.json();
      
      // Poll for export completion
      const pollExport = async () => {
        const statusResponse = await fetch(`/api/export/status/${result.exportId}`);
        const statusResult = await statusResponse.json();
        
        if (statusResult.progress) {
          setExportProgress(statusResult.progress);
        }
        
        if (statusResult.status === 'completed') {
          setExportUrl(statusResult.downloadUrl);
          setIsExporting(false);
        } else if (statusResult.status === 'failed') {
          setIsExporting(false);
          alert('Export failed. Please try again.');
        } else {
          // Continue polling
          setTimeout(pollExport, 2000);
        }
      };
      
      pollExport();
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      alert('Export failed. Please try again.');
    }
  };

  if (!session) {
    return <div>No session data available</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Export Your Video Series
          </h2>
          <p className="text-gray-600">
            Customize your final video and export it for sharing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Video Preview
            </h3>
            
            <div className="space-y-3">
              {session.chunks.map((chunk, index) => (
                <div key={chunk.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                      {chunk.videoUrl ? (
                        <video
                          src={chunk.videoUrl}
                          className="w-full h-full object-cover rounded"
                          muted
                        />
                      ) : (
                        <Play className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {chunk.script?.title || `Video ${index + 1}`}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {chunk.status === 'video_ready' ? 'Ready' : 'Processing'}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      {index + 1}/{session.chunks.length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Export Options
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeIntro}
                    onChange={(e) => setIncludeIntro(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Include intro slide
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Add a title slide at the beginning of your video
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeOutro}
                    onChange={(e) => setIncludeOutro(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Include outro slide
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Add a closing slide at the end of your video
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Music
                </label>
                <select
                  value={backgroundMusic}
                  onChange={(e) => setBackgroundMusic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No background music</option>
                  <option value="upbeat">Upbeat & Energetic</option>
                  <option value="calm">Calm & Professional</option>
                  <option value="corporate">Corporate & Modern</option>
                  <option value="ambient">Ambient & Subtle</option>
                </select>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-700 mb-2">Video Quality</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="quality"
                      value="1080p"
                      defaultChecked
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">1080p (Recommended)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="quality"
                      value="720p"
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">720p (Faster export)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="quality"
                      value="4k"
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">4K (Premium quality)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6 pt-6 border-t">
          {isExporting ? (
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Exporting your video...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {exportProgress}% complete
              </p>
            </div>
          ) : exportUrl ? (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your video is ready!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your video series has been successfully exported and is ready for download.
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <a
                  href={exportUrl}
                  download
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Video
                </a>
                <button
                  onClick={() => window.open(exportUrl, '_blank')}
                  className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Preview Video
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={handleExport}
                disabled={session.chunks.some(c => c.status !== 'video_ready')}
                className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
              >
                <Download className="w-5 h-5 mr-2" />
                Export Final Video
              </button>
              <p className="text-sm text-gray-600 mt-2">
                This will combine all your videos into a single file
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportSection;