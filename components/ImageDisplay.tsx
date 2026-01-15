
import React, { useState } from 'react';
import { Download, Share2, Expand, AlertCircle, Loader2, Wand2 } from 'lucide-react';
import { GenerationParams } from '../types';
import { editPyramidImage } from '../services/geminiService';

interface Props {
  imageUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  params: GenerationParams;
  setCurrentImage: (url: string) => void;
}

const ImageDisplay: React.FC<Props> = ({ imageUrl, isGenerating, error, params, setCurrentImage }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `pyragen-${Date.now()}.png`;
    link.click();
  };

  const handleEdit = async () => {
    if (!imageUrl || !editPrompt.trim()) return;
    setIsEditing(true);
    try {
      const newUrl = await editPyramidImage(imageUrl, editPrompt);
      setCurrentImage(newUrl);
      setEditPrompt('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative group">
        <div className="aspect-square w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl transition-all">
          {(isGenerating || isEditing) && (
            <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center px-6">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-white">{isEditing ? 'Refining Architecture' : 'Synthesizing Geometry'}</h4>
                <p className="text-slate-400 text-sm max-w-xs">
                  {isEditing ? `Applying: "${editPrompt}"` : `Assembling ${params.levels} levels...`}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-red-400 gap-3 px-8 text-center bg-red-950/20 backdrop-blur-md">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {!imageUrl && !isGenerating && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
              <Expand className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium">Configure and click Generate</p>
            </div>
          )}

          {imageUrl && (
            <>
              <img 
                src={imageUrl} 
                alt="Generated 3D Tile Pyramid" 
                className={`w-full h-full object-cover transition-opacity duration-1000 ${isGenerating || isEditing ? 'opacity-0' : 'opacity-100'}`}
              />
              <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleDownload}
                  className="bg-white/10 backdrop-blur-md hover:bg-white/20 p-3 rounded-2xl text-white border border-white/20"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  className="bg-white/10 backdrop-blur-md hover:bg-white/20 p-3 rounded-2xl text-white border border-white/20"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {imageUrl && !isGenerating && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-2">
          <input 
            type="text" 
            placeholder="Edit render (e.g. 'Add a retro filter', 'Make it neon')"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-4 py-2 outline-none focus:border-blue-500 transition-colors"
          />
          <button 
            onClick={handleEdit}
            disabled={isEditing || !editPrompt}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 p-2 rounded-xl text-white transition-all"
          >
            <Wand2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
