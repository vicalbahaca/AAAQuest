
import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { Upload, Wand2, Download, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Loader } from './Loader';

export const ImageEditorMode: React.FC = () => {
  const [image, setImage] = useState<string | null>(null); // base64
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setImage(base64Data);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;
    setLoading(true);
    setGeneratedImage(null);
    try {
      const result = await editImage(image, prompt);
      setGeneratedImage(result);
    } catch (e) {
      console.error(e);
      alert("Error generating image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2 flex justify-center items-center gap-2">
          <Wand2 className="text-cyan-400" /> Nano Banana Editor
        </h2>
        <p className="text-slate-400">Transform images with AI using natural language prompts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Column */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-400" /> Source Image
            </h3>
            
            <div 
              className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden group ${
                image ? 'border-blue-500/50' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
              />
              
              {image ? (
                <>
                  <img 
                    src={`data:image/png;base64,${image}`} 
                    alt="Source" 
                    className="h-full w-full object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white font-medium flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Change Image
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-slate-500 flex flex-col items-center">
                  <Upload className="w-12 h-12 mb-3 opacity-50" />
                  <span className="font-medium">Click to upload image</span>
                  <span className="text-xs mt-1">PNG, JPG</span>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
             <h3 className="text-lg font-semibold text-white mb-4">Edit Prompt</h3>
             <textarea
              className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 resize-none font-mono text-sm"
              placeholder="E.g., 'Add a retro filter', 'Remove the person in the background', 'Make it cyberpunk style'..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleEdit}
              disabled={loading || !image || !prompt}
              className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : <><Wand2 className="w-5 h-5" /> Generate Edit</>}
            </button>
          </div>
        </div>

        {/* Output Column */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" /> Result
          </h3>
          
          <div className="flex-grow bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-center min-h-[400px] overflow-hidden relative">
            {loading ? (
              <Loader text="AI is editing your image..." />
            ) : generatedImage ? (
              <div className="relative w-full h-full flex items-center justify-center group">
                 <img 
                  src={`data:image/png;base64,${generatedImage}`} 
                  alt="AI Generated Edit" 
                  className="max-h-full max-w-full object-contain"
                />
                <a 
                  href={`data:image/png;base64,${generatedImage}`}
                  download="edited-image.png"
                  className="absolute bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-black transition-colors"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            ) : (
              <div className="text-slate-600 flex flex-col items-center p-8 text-center">
                <Wand2 className="w-16 h-16 mb-4 opacity-20" />
                <p>Generated image will appear here.</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200/80">
              Powered by <strong>Gemini 2.5 Flash Image</strong>. Complex edits may take a few seconds. Ensure your prompt clearly describes the desired change.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
