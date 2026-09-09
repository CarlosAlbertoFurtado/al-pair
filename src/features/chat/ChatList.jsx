import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Video, MessageSquare } from 'lucide-react';
import { chatAPI, getSocket } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';

function ChatConversation({ conversation, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const socket = getSocket();

  useEffect(() => {
    chatAPI.getMessages(conversation.id)
      .then(res => {
        setMessages(res.data.data.messages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    if (socket) {
      socket.emit('conversation:join', { conversationId: conversation.id });
      socket.on('message:new', (data) => {
        if (data.conversationId === conversation.id) {
          setMessages(prev => [...prev, data.message]);
        }
      });
      return () => socket.off('message:new');
    }
  }, [conversation.id, socket]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !socket) return;
    socket.emit('message:send', { conversationId: conversation.id, content: newMsg.trim() });
    setNewMsg('');
  };

  const otherUser = conversation.users?.find(u => u.userId !== user?.id);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800"><ArrowLeft size={22} /></button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          {(otherUser?.user?.displayName || 'U')[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">{otherUser?.user?.displayName || 'Usuário'}</p>
          <p className="text-xs text-green-500">Online</p>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600"><Phone size={20} /></button>
        <button className="p-2 text-slate-400 hover:text-slate-600"><Video size={20} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {loading ? <LoadingSpinner /> : messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
              msg.senderId === user?.id
                ? 'bg-gradient-to-r from-rose-500 to-purple-500 text-white rounded-br-sm'
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
            }`}>
              {msg.content}
              <div className={`text-[10px] mt-1 ${msg.senderId === user?.id ? 'text-white/60' : 'text-slate-400'}`}>
                {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t border-slate-100 bg-white">
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:border-rose-300"
        />
        <button
          type="submit"
          disabled={!newMsg.trim()}
          className="w-10 h-10 bg-gradient-to-r from-rose-500 to-purple-500 text-white rounded-full flex items-center justify-center disabled:opacity-50"
        >
          <MessageSquare size={18} />
        </button>
      </form>
    </div>
  );
}

export default function ChatList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    chatAPI.getConversations()
      .then(res => {
        setConversations(res.data.data.conversations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (activeConv) {
    return <ChatConversation conversation={activeConv} onBack={() => setActiveConv(null)} />;
  }

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;

  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <div className="text-4xl mb-4">💬</div>
        <h3 className="text-lg font-bold text-slate-700 mb-2">Sem conversas</h3>
        <p className="text-sm text-slate-400">Encontre au pairs no feed e inicie uma conversa!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 px-4 py-4">Mensagens</h2>
      {conversations.map(conv => {
        const otherUser = conv.users?.find(u => u.userId !== user?.id);
        return (
          <button
            key={conv.id}
            onClick={() => setActiveConv(conv)}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold">
              {(otherUser?.user?.displayName || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{otherUser?.user?.displayName || 'Usuário'}</p>
              <p className="text-xs text-slate-400 truncate">{conv.lastMessage?.content || 'Envie uma mensagem'}</p>
            </div>
            {conv.lastMessage && (
              <span className="text-[10px] text-slate-400 shrink-0">
                {new Date(conv.lastMessage.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
