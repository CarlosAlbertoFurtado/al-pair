import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, Circle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { journeyAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function JourneyScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJourney();
  }, []);

  const fetchJourney = async () => {
    try {
      const res = await journeyAPI.list();
      setItems(res.data.data.items);
      setProgress(res.data.data.progress);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (taskId) => {
    // Optimistic UI update
    setItems(current => current.map(item => {
      if (item.id === taskId) {
        return { ...item, completed: !item.completed };
      }
      return item;
    }));

    try {
      const res = await journeyAPI.toggle(taskId);
      if (res.data.success) {
        // Refresh to get exact progress and XP from backend
        fetchJourney();
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      fetchJourney();
    }
  };

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;

  return (
    <div className="bg-slate-50 min-h-full pb-10">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Minha Jornada</h2>
        </div>
      </div>

      {/* Progress Card */}
      <div className="p-4">
        <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
            <Trophy size={120} />
          </div>
          <h3 className="font-bold text-lg mb-1 relative z-10">Progresso da sua jornada</h3>
          <p className="text-white/80 text-sm mb-4 relative z-10">{progress.completed} de {progress.total} etapas concluídas</p>
          
          <div className="w-full bg-black/20 rounded-full h-3 relative z-10 overflow-hidden">
            <div 
              className="bg-green-400 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${progress.percent}%` }}
            ></div>
          </div>
          <div className="text-right text-xs font-bold mt-2 text-green-300">{progress.percent}%</div>
        </div>
      </div>

      {/* Checklist */}
      <div className="px-4 mt-2">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-2">Passo a passo</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              onClick={() => handleToggle(item.id)}
              className={`flex items-start gap-4 p-4 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${
                item.completed ? 'bg-slate-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="mt-0.5">
                {item.completed ? (
                  <CheckCircle2 size={24} className="text-green-500" />
                ) : (
                  <Circle size={24} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-bold ${item.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                  {item.title}
                </h4>
                <p className={`text-xs mt-1 ${item.completed ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.description}
                </p>
                <div className="mt-2 inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-md text-[10px] font-bold">
                  +{item.xpReward} XP
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
