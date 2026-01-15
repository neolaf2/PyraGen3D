
import React from 'react';
import { X, HelpCircle, Layers, Box, Sun, Palette, Wand2, MessageSquare } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      icon: <Layers className="w-5 h-5 text-blue-500" />,
      title: "Structural Design",
      content: "Control the verticality and scale of your pyramid. Choose between Square or Triangular footprints for diverse architectural outcomes."
    },
    {
      icon: <Palette className="w-5 h-5 text-purple-500" />,
      title: "Tile Aesthetics",
      content: "Select from 8 high-detail patterns like Marble or Neon. Use the hex color picker to define the primary hue of your building materials."
    },
    {
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      title: "Lighting & Shadows",
      content: "Atmosphere is key. Adjust light direction and intensity to emphasize geometric depth. Toggle shadows for a stylized or realistic feel."
    },
    {
      icon: <Wand2 className="w-5 h-5 text-pink-500" />,
      title: "AI Refinement",
      content: "After generation, use the edit prompt to modify your render. Try prompts like 'Add floating lanterns' or 'Cover it in snow'."
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-green-500" />,
      title: "AI Consultant",
      content: "The chat consultant is trained on this documentation. Ask it for tips on color theory or how specific parameters interact."
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-white">System Guide</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4">
            <p className="text-blue-400 text-sm leading-relaxed">
              Welcome to PyraGen 3D. This interface allows you to orchestrate complex geometric structures using generative AI. Follow the guide below to master the architecture controls.
            </p>
          </div>

          <div className="grid gap-6">
            {sections.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  {s.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-200">{s.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <h4 className="font-semibold text-slate-200 mb-3">Model Credits</h4>
            <div className="flex gap-4 items-center">
              <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-mono text-slate-500">GEMINI-2.5-FLASH-IMAGE</div>
              <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-mono text-slate-500">GEMINI-3-PRO</div>
              <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-mono text-slate-500">GEMINI-2.5-TTS</div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-xl transition-all"
          >
            Got it, Architect
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;
