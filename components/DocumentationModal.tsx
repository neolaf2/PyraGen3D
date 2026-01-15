
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
      content: "PyraTutor is trained on this documentation. Ask it for tips on color theory or how specific parameters interact."
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm transition-colors duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Architectural Manual</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
          <div className="bg-blue-50 dark:bg-blue-600/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4">
            <p className="text-blue-700 dark:text-blue-400 text-sm leading-relaxed">
              Welcome to PyraGen 3D. This interface allows you to orchestrate complex geometric structures using generative AI. Follow the guide below to master the controls.
            </p>
          </div>

          <div className="grid gap-6">
            {sections.map((s, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">{s.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{s.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-slate-200 mb-3 text-sm uppercase tracking-widest">System Architecture</h4>
            <div className="flex flex-wrap gap-3">
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg text-[10px] font-mono font-bold text-green-600 dark:text-green-400">GEMINI-2.5-FLASH</div>
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">GEMINI-3.0-PRO-IMAGE</div>
              <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">GEMINI-3.0-PRO-TXT</div>
              <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-mono font-bold text-slate-500">GEMINI-3.0-FLASH-TXT</div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;
