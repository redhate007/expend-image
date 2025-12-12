import React, { useState, useRef, useCallback } from 'react';
import { AspectRatio, GeneratedResult } from './types';
import { generateExpandedImage } from './services/geminiService';
import { Button } from './components/Button';
import { CanvasEditor } from './components/CanvasEditor';

// Icon Components
const UploadIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [scale, setScale] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large. Please upload an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
        setGeneratedResult(null); // Clear previous result
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!canvasDataUrl || !prompt) {
      setError("Please ensure an image is loaded and a prompt is entered.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resultImage = await generateExpandedImage(canvasDataUrl, prompt);
      setGeneratedResult({
        imageUrl: resultImage,
        prompt: prompt,
        timestamp: Date.now()
      });
    } catch (err: any) {
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (generatedResult) {
      const link = document.createElement('a');
      link.href = generatedResult.imageUrl;
      link.download = `expanded-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-cyan-400 p-2 rounded-lg">
              <SparklesIcon />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                ExpandAI
              </h1>
              <p className="text-xs text-gray-500">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-white transition-colors">
            Documentation
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-3 text-red-200 animate-fadeIn">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* Left Column: Controls & Input */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Upload Section */}
            <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800 shadow-xl">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">1. Upload Image</h2>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer border-2 border-dashed border-gray-700 hover:border-blue-500 hover:bg-gray-800/50 rounded-lg p-8 flex flex-col items-center justify-center transition-all duration-200"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
                <div className="p-4 bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-transform duration-200">
                  <UploadIcon />
                </div>
                <p className="text-sm text-gray-300 font-medium">Click to upload</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>

            {/* Configuration Section */}
            <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800 shadow-xl">
               <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">2. Configure Expansion</h2>
               
               <div className="space-y-5">
                 {/* Aspect Ratio */}
                 <div>
                   <label className="block text-xs font-medium text-gray-400 mb-2">Target Aspect Ratio</label>
                   <div className="grid grid-cols-3 gap-2">
                     {Object.values(AspectRatio).map((ratio) => (
                       <button
                         key={ratio}
                         onClick={() => setAspectRatio(ratio)}
                         className={`text-xs py-2 px-3 rounded-md border transition-all ${
                           aspectRatio === ratio 
                             ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                             : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                         }`}
                       >
                         {ratio}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Scale Slider */}
                 <div>
                   <div className="flex justify-between mb-2">
                     <label className="text-xs font-medium text-gray-400">Image Scale</label>
                     <span className="text-xs text-blue-400">{Math.round(scale * 100)}%</span>
                   </div>
                   <input
                     type="range"
                     min="0.2"
                     max="0.9"
                     step="0.05"
                     value={scale}
                     onChange={(e) => setScale(parseFloat(e.target.value))}
                     className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                   />
                   <p className="text-[10px] text-gray-500 mt-1">
                     Smaller scale = more surroundings generated.
                   </p>
                 </div>

                 {/* Prompt Input */}
                 <div>
                   <label className="block text-xs font-medium text-gray-400 mb-2">Prompt</label>
                   <textarea
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     placeholder="Describe the background you want to generate (e.g., 'a futuristic cyberpunk city with neon lights')..."
                     className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-none"
                   />
                 </div>
                 
                 <Button 
                   onClick={handleGenerate} 
                   isLoading={isLoading} 
                   className="w-full py-3 text-sm font-bold tracking-wide"
                   icon={<SparklesIcon />}
                   disabled={!originalImage || !prompt}
                 >
                   {isLoading ? 'Expanding...' : 'Generate Expansion'}
                 </Button>
               </div>
            </div>
          </div>

          {/* Right Column: Canvas & Preview */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Main Preview Area */}
            <div className="bg-[#161b22] p-1 rounded-xl border border-gray-800 shadow-xl min-h-[500px] flex flex-col">
               <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                 <h2 className="text-sm font-semibold text-gray-400">
                    {generatedResult ? 'Result' : 'Canvas Preview'}
                 </h2>
                 {generatedResult && (
                   <button 
                     onClick={() => setGeneratedResult(null)}
                     className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                   >
                     Back to Edit
                   </button>
                 )}
               </div>

               <div className="flex-1 p-4 flex items-center justify-center bg-[#0d1117] overflow-hidden rounded-b-lg relative">
                 {isLoading && (
                   <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                     <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                     <p className="text-blue-400 font-medium animate-pulse">Dreaming up new pixels...</p>
                   </div>
                 )}

                 {generatedResult ? (
                   <div className="relative group max-w-full max-h-full">
                     <img 
                       src={generatedResult.imageUrl} 
                       alt="Expanded Result" 
                       className="max-w-full max-h-[600px] object-contain rounded shadow-2xl"
                     />
                     <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button onClick={downloadImage} variant="secondary" icon={<DownloadIcon />}>
                         Download
                       </Button>
                     </div>
                   </div>
                 ) : (
                   <CanvasEditor 
                     originalImageSrc={originalImage}
                     aspectRatio={aspectRatio}
                     scale={scale}
                     onCanvasReady={setCanvasDataUrl}
                   />
                 )}
               </div>
            </div>

            {/* Instructions / Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#161b22] p-4 rounded-lg border border-gray-800">
                <h3 className="text-gray-300 font-medium mb-1 text-sm">💡 Context is Key</h3>
                <p className="text-xs text-gray-500">Provide a descriptive prompt about the surroundings, not just the object.</p>
              </div>
              <div className="bg-[#161b22] p-4 rounded-lg border border-gray-800">
                <h3 className="text-gray-300 font-medium mb-1 text-sm">📏 Scale Matters</h3>
                <p className="text-xs text-gray-500">Use a smaller scale (e.g. 50%) to give the AI more room to be creative.</p>
              </div>
              <div className="bg-[#161b22] p-4 rounded-lg border border-gray-800">
                <h3 className="text-gray-300 font-medium mb-1 text-sm">⚡ Flash Speed</h3>
                <p className="text-xs text-gray-500">Powered by Gemini 2.5 Flash for fast, high-quality edits.</p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
