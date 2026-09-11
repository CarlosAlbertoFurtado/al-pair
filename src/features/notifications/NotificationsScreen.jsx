import { useState, useEffect } from 'react';
import { ChevronLeft, Bell, Heart, MessageSquare, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.list();
      setNotifications(res.data.data.notifications);
      // Automatically mark all as read when opening the screen
      if (res.data.data.unreadCount > 0) {
        await notificationsAPI.readAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'LIKE': return <Heart size={18} className="text-rose-500" fill="currentColor" />;
      case 'COMMENT': return <MessageSquare size={18} className="text-blue-500" fill="currentColor" />;
      case 'MATCH': return <CheckCircle size={18} className="text-green-500" />;
      default: return <Info size={18} className="text-purple-500" />;
    }
  };

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;

  return (
    <div className="bg-slate-50 min-h-full pb-10">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-slate-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2 text-slate-800">
            <Bell size={20} />
            <h2 className="text-lg font-bold">Notificações</h2>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {notifications.map((notification) => (
          <div key={notification.id} className={`p-4 flex gap-4 ${notification.isRead ? 'bg-white' : 'bg-blue-50/50'}`}>
            <div className="mt-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.isRead ? 'bg-slate-50' : 'bg-white shadow-sm'}`}>
                {getIcon(notification.type)}
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800 mb-0.5">{notification.title}</h4>
              <p className="text-sm text-slate-600 leading-snug">{notification.body}</p>
              <span className="text-[10px] font-bold text-slate-400 mt-2 block">
                {new Date(notification.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {!notification.isRead && (
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">Tudo limpo por aqui</h3>
            <p className="text-sm text-slate-400">Você não tem novas notificações no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
