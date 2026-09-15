import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, MessageSquare, Send, X, Copy, Pin, Reply, Image, Mic, Camera, Pencil, Trash2, Check, CheckCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { chatAPI, getSocket, resolveAssetUrl, uploadAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PhotoViewerModal } from '../../components/PhotoViewerModal';
import { useAuthStore } from '../../store/useAuthStore';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

function ChatConversation({ conversation, onBack, initialUnreadCount = 0, onRead }) {
  const [messages, setMessages] = useState([]);
  const [highlightedUnreadIds, setHighlightedUnreadIds] = useState(new Set());
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const socket = getSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const initialUnreadCountRef = useRef(initialUnreadCount);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(() => {
    chatAPI.getMessages(conversation.id)
      .then(res => {
        const loadedMessages = res.data.data.messages || [];
        setMessages(loadedMessages);
        if (initialUnreadCountRef.current > 0) {
          const unreadIncomingIds = loadedMessages
            .filter(msg => (msg.senderId || msg.sender?.id) !== user?.id)
            .slice(-initialUnreadCountRef.current)
            .map(msg => msg.id);
          setHighlightedUnreadIds(new Set(unreadIncomingIds));
        } else {
          setHighlightedUnreadIds(new Set());
        }
        setLoading(false);
        onRead?.(conversation.id);
        scrollToBottom();
      })
      .catch(() => setLoading(false));

    if (socket) {
      socket.emit('conversation:join', { conversationId: conversation.id });
      
      // Mark as read
      socket.emit('messages:read', { conversationId: conversation.id });
      
      socket.on('message:new', (data) => {
        if (data.conversationId === conversation.id) {
          setMessages(prev => [...prev, data.message]);
          const senderId = data.message?.senderId || data.message?.sender?.id;
          if (senderId !== user?.id) {
            setHighlightedUnreadIds(prev => new Set([...prev, data.message.id]));
          }
          scrollToBottom();
          socket.emit('messages:read', { conversationId: conversation.id });
          onRead?.(conversation.id);
        }
      });

      socket.on('typing:update', (data) => {
        if (data.conversationId === conversation.id && data.userId !== user?.id) {
          setOtherTyping(data.isTyping);
        }
      });

      socket.on('messages:read', (data) => {
        if (data.conversationId === conversation.id && data.userId !== user?.id) {
          setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
        }
      });

      return () => {
        socket.off('message:new');
        socket.off('typing:update');
        socket.off('messages:read');
      };
    }
  }, [conversation.id, onRead, socket, user?.id, scrollToBottom]);

  // Typing indicator
  const handleTyping = () => {
    if (socket && !isTyping) {
      setIsTyping(true);
      socket.emit('typing:start', { conversationId: conversation.id });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('typing:stop', { conversationId: conversation.id });
    }, 2000);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !socket) return;
    
    clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    socket.emit('typing:stop', { conversationId: conversation.id });
    socket.emit('message:send', { conversationId: conversation.id, content: newMsg.trim() });
    setNewMsg('');
  };

  // Send image
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAPI.postImage(formData);
      const imageUrl = res.data.data.url;
      socket?.emit('message:send', { conversationId: conversation.id, content: '📷 Foto', imageUrl });
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setUploadingMedia(false);
    }
  };

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setUploadingMedia(true);
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          const res = await uploadAPI.upload(formData);
          const audioUrl = res.data.data.url;
          socket?.emit('message:send', { conversationId: conversation.id, content: `🎙️ Áudio (${recordingTime}s)`, imageUrl: audioUrl });
        } catch (err) {
          console.error('Audio upload failed:', err);
        } finally {
          setUploadingMedia(false);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
    setRecordingTime(0);
    clearInterval(recordingIntervalRef.current);
  };

  // Reactions
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

  // Edit message (local only for now)
  const handleEditSave = (msgId) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editText, isEdited: true } : m));
    setEditingMsgId(null);
    setEditText('');
  };

  // Delete message (local)
  const handleDeleteMsg = (msgId) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setActiveReactionMsgId(null);
  };

  const otherUser = conversation.otherParticipants?.[0] || conversation.users?.find(u => u.userId !== user?.id)?.user;
  const otherAvatarUrl = resolveAssetUrl(otherUser?.avatarUrl);
  const isOtherOnline = otherUser?.isOnline ?? false;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-50" onClick={() => setActiveReactionMsgId(null)}>
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm shrink-0">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 active:scale-90 transition-transform">
          <ArrowLeft size={22} />
        </button>
        <div className="relative">
          <button onClick={() => navigate(`/user/${otherUser?.id}`)} className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden active:scale-95 transition-transform">
            {otherAvatarUrl ? (
              <img src={otherAvatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (otherUser?.displayName || 'U')[0].toUpperCase()
            )}
          </button>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${isOtherOnline ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">{otherUser?.displayName || 'Usuário'}</p>
          <p className={`text-xs font-medium ${isOtherOnline ? 'text-emerald-500' : 'text-slate-500'}`}>
            {otherTyping ? 'digitando...' : isOtherOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center p-10"><LoadingSpinner /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm font-bold">Nenhuma mensagem ainda</p>
            <p className="text-slate-400 text-xs mt-1">Diga olá! 👋</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = (msg.senderId || msg.sender?.id) === user?.id;
            const msgImageUrl = resolveAssetUrl(msg.imageUrl);
            const isUnreadHighlight = !isMine && highlightedUnreadIds.has(msg.id);
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} relative`}>
                <div 
                  className="relative max-w-[78%]"
                  onClick={(e) => { e.stopPropagation(); setActiveReactionMsgId(msg.id === activeReactionMsgId ? null : msg.id); }}
                >
                  {/* Reaction Menu */}
                  {activeReactionMsgId === msg.id && (
                    <div className={`absolute -top-16 ${isMine ? 'right-0' : 'left-0'} z-30 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200`} onClick={e => e.stopPropagation()}>
                      <div className="bg-white rounded-full px-3 py-2 flex gap-2 shadow-xl border border-slate-200 mb-1">
                        {REACTION_EMOJIS.map(emoji => (
                          <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="text-2xl hover:scale-125 active:scale-90 transition-transform hover:-translate-y-1">
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                        <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-700 font-medium text-sm hover:bg-slate-50">
                          <Reply size={16} className="text-slate-400" /> Responder
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(msg.content); setActiveReactionMsgId(null); }} className="flex items-center gap-3 w-full px-4 py-3 text-slate-700 font-medium text-sm hover:bg-slate-50 border-t border-slate-100">
                          <Copy size={16} className="text-slate-400" /> Copiar
                        </button>
                        {isMine && (
                          <button onClick={() => { setEditingMsgId(msg.id); setEditText(msg.content); setActiveReactionMsgId(null); }} className="flex items-center gap-3 w-full px-4 py-3 text-slate-700 font-medium text-sm hover:bg-slate-50 border-t border-slate-100">
                            <Pencil size={16} className="text-slate-400" /> Editar
                          </button>
                        )}
                        <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-700 font-medium text-sm hover:bg-slate-50 border-t border-slate-100">
                          <Pin size={16} className="text-slate-400" /> Fixar
                        </button>
                        {isMine && (
                          <button onClick={() => handleDeleteMsg(msg.id)} className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 font-bold text-sm hover:bg-slate-50 border-t border-slate-100">
                            <Trash2 size={16} /> Apagar
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Edit Mode */}
                  {editingMsgId === msg.id ? (
                    <div className="bg-white rounded-2xl p-3 border border-purple-300 shadow-sm">
                      <input value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-transparent text-slate-900 text-sm outline-none" autoFocus />
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setEditingMsgId(null)} className="text-xs font-bold text-slate-500 px-3 py-1 rounded-lg hover:bg-slate-100">Cancelar</button>
                        <button onClick={() => handleEditSave(msg.id)} className="text-xs font-bold text-white bg-purple-600 px-3 py-1 rounded-lg shadow-sm">Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Image Message */}
                      {msgImageUrl && (
                        <img 
                          src={msgImageUrl} 
                          alt="" 
                          className="rounded-2xl mb-1 max-h-48 object-cover w-full cursor-pointer border border-slate-200" 
                          onClick={() => setViewingImage(msgImageUrl)}
                        />
                      )}
                      {/* Message Bubble */}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                        isMine
                          ? 'bg-gradient-to-r from-purple-600 to-rose-500 text-white rounded-br-sm'
                          : isUnreadHighlight
                            ? 'bg-emerald-50 text-slate-900 rounded-bl-sm border border-emerald-200 shadow-emerald-500/10'
                            : 'bg-white text-slate-900 rounded-bl-sm border border-slate-200'
                      }`}>
                        {msg.content}
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                          {msg.isEdited && <span className="text-[9px] opacity-50 font-bold">editado</span>}
                          <span className={`text-[10px] font-bold ${isMine || isUnreadHighlight ? 'text-white/60' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && (
                            msg.isRead ? <CheckCheck size={12} className="text-blue-200 ml-0.5" /> : <Check size={12} className="text-white/40 ml-0.5" />
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Reactions Display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`absolute -bottom-3 ${isMine ? 'right-2' : 'left-2'} bg-white border border-slate-200 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm z-10`}>
                      {[...new Set(msg.reactions)].map((r, i) => <span key={i} className="text-xs">{r}</span>)}
                      <span className="text-[10px] text-slate-500 font-bold ml-0.5">{msg.reactions.length}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 border border-slate-200 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Uploading indicator */}
      {uploadingMedia && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <LoadingSpinner />
          <span className="text-xs font-bold text-slate-500">Enviando mídia...</span>
        </div>
      )}

      {/* Recording UI */}
      {isRecording ? (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border-t border-rose-100">
          <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
          <span className="text-rose-600 text-sm font-bold flex-1">Gravando... {recordingTime}s</span>
          <button onClick={cancelRecording} className="p-2 text-slate-500 hover:text-slate-800 active:scale-90">
            <X size={20} />
          </button>
          <button onClick={stopRecording} className="w-11 h-11 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full flex items-center justify-center active:scale-90 shadow-lg shadow-rose-500/30">
            <Send size={18} />
          </button>
        </div>
      ) : (
        /* Normal Input */
        <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 bg-white border-t border-slate-200 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {/* Camera */}
          <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-2 text-slate-400 hover:text-purple-500 active:scale-90 transition-transform">
            <Camera size={20} />
          </button>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
          
          {/* Gallery */}
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-purple-500 active:scale-90 transition-transform">
            <Image size={20} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
          
          {/* Text Input */}
          <input
            type="text"
            value={newMsg}
            onChange={(e) => { setNewMsg(e.target.value); handleTyping(); }}
            placeholder="Mensagem..."
            className="flex-1 min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none focus:border-purple-400 transition-colors"
          />
          
          {newMsg.trim() ? (
            <button type="submit" className="w-11 h-11 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-rose-500/30 shrink-0">
              <Send size={18} className="ml-0.5" />
            </button>
          ) : (
            <button type="button" onClick={startRecording} className="w-11 h-11 bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-500 hover:bg-white rounded-full flex items-center justify-center active:scale-90 transition-all shrink-0">
              <Mic size={20} />
            </button>
          )}
        </form>
      )}

      {/* Image Viewer */}
      {viewingImage && (
        <PhotoViewerModal src={viewingImage} onClose={() => setViewingImage(null)} />
      )}
    </div>
  );
}

export default function ChatList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const { user } = useAuthStore();
  const location = useLocation();

  const markConversationRead = useCallback((conversationId) => {
    setConversations(prev => prev.map(conv => (
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    )));
    setActiveConv(prev => (
      prev?.id === conversationId ? { ...prev, unreadCount: 0 } : prev
    ));
  }, []);

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

  return (
    <div>
      {/* Lista de conversas - sempre montada, nunca desmontada */}
      {loading ? (
        <div className="flex justify-center p-10"><LoadingSpinner /></div>
      ) : !conversations.length ? (
        <div className="flex flex-col items-center justify-center p-10 mt-16 text-center">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <MessageSquare size={32} className="text-purple-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Sem conversas</h3>
          <p className="text-sm text-slate-400 max-w-[200px]">Encontre au pairs no feed e inicie uma conversa!</p>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-black text-slate-900 px-5 py-4 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-100">Mensagens</h2>
          {conversations.map(conv => {
            const otherUser = conv.otherParticipants?.[0] || conv.users?.find(u => u.userId !== user?.id)?.user;
            const otherAvatarUrl = resolveAssetUrl(otherUser?.avatarUrl);
            const isOnline = otherUser?.isOnline ?? false;
            const hasUnread = (conv.unreadCount || 0) > 0;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`flex items-center gap-3 w-full px-5 py-3.5 transition-colors border-b active:bg-slate-100 ${
                  hasUnread
                    ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/70'
                    : 'border-slate-100 hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-13 h-13 rounded-full flex items-center justify-center text-white font-bold overflow-hidden ${hasUnread ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 ring-2 ring-emerald-300 ring-offset-2 ring-offset-white' : 'bg-gradient-to-tr from-rose-400 to-purple-500'}`} style={{width: '52px', height: '52px'}}>
                    {otherAvatarUrl ? (
                      <img src={otherAvatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{(otherUser?.displayName || 'U')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm font-bold truncate ${hasUnread ? 'text-emerald-800' : 'text-slate-900'}`}>{otherUser?.displayName || 'Usuário'}</p>
                  <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>{conv.lastMessagePreview || conv.lastMessage?.content || 'Envie uma mensagem'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {(conv.lastMessageAt || conv.lastMessage?.createdAt) && (
                    <span className={`text-[10px] ${hasUnread ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'}`}>
                      {new Date(conv.lastMessageAt || conv.lastMessage.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {hasUnread && (
                    <span className="bg-emerald-500 text-white text-[9px] font-black min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">{conv.unreadCount}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Conversa como overlay fixo - NÃO afeta o MainLayout header */}
      {activeConv && (
        <ChatConversation
          conversation={activeConv}
          initialUnreadCount={activeConv.unreadCount || 0}
          onRead={markConversationRead}
          onBack={() => setActiveConv(null)}
        />
      )}
    </div>
  );
}
