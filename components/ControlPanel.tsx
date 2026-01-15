
import React, { useRef } from 'react';
import { TilePattern, PyramidBase, GenerationParams, LightDirection } from '../types';
import { Sparkles, Palette, Maximize, Shapes, Wallpaper, Sun, Moon, Image as ImageIcon, Trash2, Upload } from 'lucide-react';

interface Props {
  params: GenerationParams;
  setParams: React.Dispatch<React.SetStateAction<GenerationParams>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

const ControlPanel: React.FC<Props> = ({ params, setParams, onGenerate, isGenerating }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (key: keyof GenerationParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange('referenceImage', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const patterns = Object.values(TilePattern);
  const bases = Object.values(PyramidBase);
  const lightingDirections: LightDirection[] = ['Top-Down', 'Side-lit', 'Frontal', 'High-Contrast'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-8 sticky top-4">
      <div className="space-y-6">
        {/* Reference Guide Section */}
        <section>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
            <ImageIcon className="w-4 h-4 text-pink-500" />
            Reference Guide (Optional)
          </label>
          <div className="space-y-3">
            {!params.referenceImage ? (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all text-slate-500 hover:text-pink-400 group"
              >
                <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Upload architectural guide</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </button>
            ) : (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-700">
                <img src={params.referenceImage} alt="Reference Guide" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => handleChange('referenceImage', undefined)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            <p className="text-[10px] text-slate-500 leading-tight">
              AI will use this image to influence geometric composition and atmosphere.
            </p>
          </div>
        </section>

        {/* Dimensions Section */}
        <section>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
            <Maximize className="w-4 h-4 text-blue-500" />
            Structural Dimensions
          </label>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500 uppercase tracking-wider">Levels (Height)</span>
                <span className="text-blue-400 font-mono">{params.levels}</span>
              </div>
              <input 
                type="range" min="2" max="15" step="1"
                value={params.levels}
                onChange={(e) => handleChange('levels', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500 uppercase tracking-wider">Base Scale</span>
                <span className="text-blue-400 font-mono">{params.baseSize}x{params.baseSize}</span>
              </div>
              <input 
                type="range" min="3" max="20" step="1"
                value={params.baseSize}
                onChange={(e) => handleChange('baseSize', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Lighting Section */}
        <section>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
            <Sun className="w-4 h-4 text-amber-500" />
            Studio Lighting
          </label>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {lightingDirections.map(dir => (
                <button
                  key={dir}
                  onClick={() => handleChange('lightDirection', dir)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all border ${
                    params.lightDirection === dir 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                    : 'bg-slate-800 border-transparent text-slate-500'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500 uppercase tracking-wider">Intensity</span>
                <span className="text-amber-400 font-mono">{params.lightIntensity}%</span>
              </div>
              <input 
                type="range" min="10" max="100" step="5"
                value={params.lightIntensity}
                onChange={(e) => handleChange('lightIntensity', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Shadows</span>
              <button
                onClick={() => handleChange('shadowsEnabled', !params.shadowsEnabled)}
                className={`p-1 rounded-lg border flex items-center gap-2 transition-all ${
                  params.shadowsEnabled ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}
              >
                {params.shadowsEnabled ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span className="text-[10px] uppercase tracking-widest">{params.shadowsEnabled ? 'On' : 'Off'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
            <Palette className="w-4 h-4 text-blue-500" />
            Tile Aesthetics
          </label>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 relative">
                <select 
                  value={params.pattern}
                  onChange={(e) => handleChange('pattern', e.target.value as TilePattern)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl py-2.5 px-4 outline-none focus:border-blue-500 transition-colors appearance-none"
                >
                  {patterns.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <Shapes className="w-4 h-4" />
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-2">
                  <input 
                    type="color"
                    value={params.tileColor}
                    onChange={(e) => handleChange('tileColor', e.target.value)}
                    className="w-10 h-10 rounded-lg bg-transparent cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={params.tileColor}
                    onChange={(e) => handleChange('tileColor', e.target.value)}
                    className="flex-1 bg-transparent text-slate-300 font-mono text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
          isGenerating 
          ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
        }`}
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Synthesizing Guide...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {params.referenceImage ? 'Generate from Guide' : 'Generate Structure'}
          </>
        )}
      </button>
    </div>
  );
};

export default ControlPanel;
