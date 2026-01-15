
import React from 'react';
import { GenerationHistory } from '../types';
import { History, Clock, ChevronRight } from 'lucide-react';

interface Props {
  history: GenerationHistory[];
  onSelect: (item: GenerationHistory) => void;
}

const HistorySidebar: React.FC<Props> = ({ history, onSelect }) => {
  return (
    <div className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/30 transition-colors duration-300">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <History className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        <h2 className="font-semibold text-slate-800 dark:text-slate-200">History</h2>
        <span className="ml-auto bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
          {history.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 px-4 text-center">
            <Clock className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-xs uppercase tracking-widest font-bold opacity-50">Empty Archive</p>
          </div>
        ) : (
          history.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all shadow-sm dark:shadow-none bg-white dark:bg-slate-900"
            >
              <img 
                src={item.imageUrl} 
                alt="History item" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold text-white truncate mr-2">
                    {item.params.levels}L {item.params.pattern}
                  </span>
                  <ChevronRight className="w-3 h-3 text-blue-400" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;
