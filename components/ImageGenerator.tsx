
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { Download, ImageIcon, AlertCircle, Wand2 } from 'lucide-react';
import { Loader } from './Loader';

export const ImageGenerationMode: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setGeneratedImage(null);
    try {
      const result = await generateImage(prompt, size);
      setGeneratedImage(result);
    } catch (e) {
      console.error(e);
      alert("Error generando la imagen. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-600 mb-2 flex justify-center items-center gap-2">
          <Wand2 className="text-pink-400" /> Generador de Imágenes
        </h2>
        <p className="text-slate-400">Crea recursos visuales usando Gemini 3 Pro Image Preview</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-6">
             <h3 className="text-lg font-semibold text-white mb-4">Prompt</h3>
             <textarea
              className="w-full h-40 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
              placeholder="Describe la imagen que quieres generar. Ej: 'Un botón de interfaz futurista con efecto neón azul sobre fondo oscuro...'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <div className="mt-4">
              <label className="text-sm font-semibold text-slate-300 mb-2 block">Tamaño</label>
              <div className="grid grid-cols-3 gap-2">
                {['1K', '2K', '4K'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s as any)}
                    className={`py-2 rounded-lg text-sm font-bold border ${
                      size === s 
                        ? 'bg-pink-600 border-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)]' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="w-full mt-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(219,39,119,0.3)] flex items-center justify-center gap-2"
            >
              {loading ? 'Generando...' : <><Wand2 className="w-5 h-5" /> Crear Imagen</>}
            </button>
          </div>
          
          <div className="bg-pink-900/10 border border-pink-500/20 rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
            <p className="text-xs text-pink-200/80">
              Modelo: <strong>gemini-3-pro-image-preview</strong>. <br/>
              Las resoluciones altas (4K) pueden tardar más en generarse.
            </p>
          </div>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col min-h-[500px]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-pink-400" /> Resultado
          </h3>
          
          <div className="flex-grow bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative">
            {loading ? (
              <Loader text={`Renderizando en ${size}...`} />
            ) : generatedImage ? (
              <div className="relative w-full h-full flex items-center justify-center group bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
                 <img 
                  src={`data:image/png;base64,${generatedImage}`} 
                  alt="AI Generated" 
                  className="max-h-full max-w-full object-contain shadow-2xl"
                />
                <a 
                  href={`data:image/png;base64,${generatedImage}`}
                  download={`gen-${size}-${Date.now()}.png`}
                  className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-black transition-all transform hover:scale-105 border border-white/10"
                >
                  <Download className="w-5 h-5" /> Descargar {size}
                </a>
              </div>
            ) : (
              <div className="text-slate-600 flex flex-col items-center p-8 text-center">
                <Wand2 className="w-20 h-20 mb-6 opacity-20" />
                <p className="text-lg">Tu imagen generada aparecerá aquí.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
