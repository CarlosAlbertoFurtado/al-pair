import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageSquare, Send, X, Copy, Pin, Reply } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { chatAPI, getSocket, resolveAssetUrl } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

function ChatConversation({ conversation, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
  const { user } = useAuthStore();
  const socket = getSocket();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    chatAPI.getMessages(conversation.id)
      .then(res => {
        setMessages(res.data.data.messages || []);
        setLoading(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch(() => setLoading(false));

    if (socket) {
      socket.emit('conversation:join', { conversationId: conversation.id });
      socket.on('message:new', (data) => {
        if (data.conversationId === conversation.id) {
          setMessages(prev => [...prev, data.message]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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

  const handleReact = (msgId, emoji) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const reactions = m.reactions || [];
        return { ...m, reactions: [...reactions, emoji] };
      }
      return m;
    }));
    setActiveReactionMsgId(null);
  };

  const handleLongPress = (msgId) => {
    setActiveReactionMsgId(msgId === activeReactionMsgId ? null : msgId);
  };

  const otherUser = conversation.otherParticipants?.[0] || conversation.users?.find(u => u.userId !== user?.id)?.user;
  const otherAvatarUrl = resolveAssetUrl(otherUser?.avatarUrl);

  return (
    <div className="flex flex-col h-full bg-slate-950" onClick={() => setActiveReactionMsgId(null)}>
      {/* Chat Header - Premium Dark */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-white active:scale-90 transition-transform">
          <ArrowLeft size={22} />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
          {otherAvatarUrl ? (
            <img src={otherAvatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            (otherUser?.displayName || 'U')[0].toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{otherUser?.displayName || 'Usuário'}</p>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block"></span>
            Online
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center p-10"><LoadingSpinner /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Nenhuma mensagem ainda</p>
            <p className="text-slate-600 text-xs mt-1">Diga olá! 👋</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = (msg.senderId || msg.sender?.id) === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} relative`}>
                <div 
                  className="relative max-w-[78%]"
                  onClick={(e) => { e.stopPropagation(); handleLongPress(msg.id); }}
                >
                  {/* Reaction Menu flutuante */}
                  {activeReactionMsgId === msg.id && (
                    <div 
                      className={`absolute -top-16 ${isMine ? 'right-0' : 'left-0'} z-30 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200`}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Emoji Bar */}
                      <div className="bg-slate-800 rounded-full px-3 py-2 flex gap-2 shadow-2xl border border-slate-700 mb-1">
                        {REACTION_EMOJIS.map(emoji => (
                          <button 
                            key={emoji}
                            onClick={(e) => { e.stopPropagation(); handleReact(msg.id, emoji); }}
                            className="text-2xl hover:scale-125 active:scale-90 transition-transform hover:-translate-y-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      {/* Action Menu */}
                      <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                        <button className="flex items-center gap-3 w-full px-4 py-3 text-white text-sm hover:bg-slate-700 transition-colors">
                          <Reply size={16} className="text-slate-400" /> Responder
                        </button>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(msg.content); setActiveReactionMsgId(null); }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-white text-sm hover:bg-slate-700 transition-colors border-t border-slate-700"
                        >
                          <Copy size={16} className="text-slate-400" /> Copiar
                        </button>
                        <button className="flex items-center gap-3 w-full px-4 py-3 text-white text-sm hover:bg-slate-700 transition-colors border-t border-slate-700">
                          <Pin size={16} className="text-slate-400" /> Fixar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isMine
                      ? 'bg-gradient-to-r from-purple-600 to-rose-500 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'
                  }`}>
                    {msg.content}
                    <div className={`text-[10px] mt-1 ${isMine ? 'text-white/50' : 'text-slate-500'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Reactions Display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`absolute -bottom-3 ${isMine ? 'right-2' : 'left-2'} bg-slate-800 border border-slate-700 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-lg z-10`}>
                      {[...new Set(msg.reactions)].map((r, i) => <span key={i} className="text-xs">{r}</span>)}
                      <span className="text-[10px] text-slate-400 font-bold ml-0.5">{msg.reactions.length}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Dark Theme */}
      <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 bg-slate-900 border-t border-slate-800 shrink-0">
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Mensagem..."
          className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-full text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!newMsg.trim()}
          className="w-11 h-11 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform shadow-lg"
        >
          <Send size={18} className="ml-0.5" />
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
  const location = useLocation();

  useEffect(() => {
    chatAPI.getConversations()
      .then(res => {
        const loadedConversations = res.data.data.conversations || [];
        setConversations(loadedConversations);
        const requestedConversation = location.state?.conversationId;
        if (requestedConversation) {
          const existing = loadedConversations.find(conv => conv.id === requestedConversation);
          setActiveConv(existing || {
            id: requestedConversation,
            otherParticipants: location.state?.user ? [location.state.user] : [],
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [location.state]);

  if (activeConv) {
    return <ChatConversation conversation={activeConv} onBack={() => setActiveConv(null)} />;
  }

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;

  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center p-10 mt-16 text-center">
        <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
          <MessageSquare size={32} className="text-purple-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-2">Sem conversas</h3>
        <p className="text-sm text-slate-400 max-w-[200px]">Encontre au pairs no feed e inicie uma conversa!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 px-4 py-4">Mensagens</h2>
      {conversations.map(conv => {
        const otherUser = conv.otherParticipants?.[0] || conv.users?.find(u => u.userId !== user?.id)?.user;
        const otherAvatarUrl = resolveAssetUrl(otherUser?.avatarUrl);
        return (
          <button
            key={conv.id}
            onClick={() => setActiveConv(conv)}
            className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-50 active:bg-slate-100"
          >
            <div className="relative">
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden shrink-0" style={{width: '52px', height: '52px'}}>
                {otherAvatarUrl ? (
                  <img src={otherAvatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">{(otherUser?.displayName || 'U')[0].toUpperCase()}</span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{otherUser?.displayName || 'Usuário'}</p>
              <p className="text-xs text-slate-400 truncate">{conv.lastMessagePreview || conv.lastMessage?.content || 'Envie uma mensagem'}</p>
            </div>
            {(conv.lastMessageAt || conv.lastMessage?.createdAt) && (
              <span className="text-[10px] text-slate-400 shrink-0">
                {new Date(conv.lastMessageAt || conv.lastMessage.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
