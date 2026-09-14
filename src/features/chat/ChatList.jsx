import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, MessageSquare, Send, X, Copy, Pin, Reply, Image, Mic, MicOff, Camera, Pencil, Trash2, Check, CheckCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { chatAPI, getSocket, resolveAssetUrl, uploadAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

function ChatConversation({ conversation, onBack }) {
  const [messages, setMessages] = useState([]);
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
  
  const { user } = useAuthStore();
  const socket = getSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(() => {
    chatAPI.getMessages(conversation.id)
      .then(res => {
        setMessages(res.data.data.messages || []);
        setLoading(false);
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
          scrollToBottom();
          socket.emit('messages:read', { conversationId: conversation.id });
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
  }, [conversation.id, socket, user?.id, scrollToBottom]);

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
    <div className="flex flex-col h-full bg-slate-950" onClick={() => setActiveReactionMsgId(null)}>
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-white active:scale-90 transition-transform">
          <ArrowLeft size={22} />
        </button>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
            {otherAvatarUrl ? (
              <img src={otherAvatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (otherUser?.displayName || 'U')[0].toUpperCase()
            )}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-slate-900 rounded-full ${isOtherOnline ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{otherUser?.displayName || 'Usuário'}</p>
          <p className={`text-xs font-medium ${isOtherOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
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
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Nenhuma mensagem ainda</p>
            <p className="text-slate-600 text-xs mt-1">Diga olá! 👋</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = (msg.senderId || msg.sender?.id) === user?.id;
            const msgImageUrl = resolveAssetUrl(msg.imageUrl);
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} relative`}>
                <div 
                  className="relative max-w-[78%]"
                  onClick={(e) => { e.stopPropagation(); setActiveReactionMsgId(msg.id === activeReactionMsgId ? null : msg.id); }}
                >
                  {/* Reaction Menu */}
                  {activeReactionMsgId === msg.id && (
                    <div className={`absolute -top-16 ${isMine ? 'right-0' : 'left-0'} z-30 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200`} onClick={e => e.stopPropagation()}>
                      <div className="bg-slate-800 rounded-full px-3 py-2 flex gap-2 shadow-2xl border border-slate-700 mb-1">
                        {REACTION_EMOJIS.map(emoji => (
                          <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="text-2xl hover:scale-125 active:scale-90 transition-transform hover:-translate-y-1">
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                        <button className="flex items-center gap-3 w-full px-4 py-3 text-white text-sm hover:bg-slate-700">
                          <Reply size={16} className="text-slate-400" /> Responder
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(msg.content); setActiveReactionMsgId(null); }} className="flex items-center gap-3 w-full px-4 py-3 text-white text-sm hover:bg-slate-700 border-t border-slate-700">
                          <Copy size={16} className="text-slate-400" /> Copiar
                        </button>
                        {isMine && (
                          <button onClick={() => { setEditingMsgId(msg.id); setEditText(msg.content); setActiveReactionMsgId(null); }} className="flex items-center gap-3 w-full px-4 py-3 text-white text-sm hover:bg-slate-700 border-t border-slate-700">
                            <Pencil size={16} className="text-slate-400" /> Editar
                          </button>
                        )}
                        <button className="flex items-center gap-3 w-full px-4 py-3 text-white text-sm hover:bg-slate-700 border-t border-slate-700">
                          <Pin size={16} className="text-slate-400" /> Fixar
                        </button>
                        {isMine && (
                          <button onClick={() => handleDeleteMsg(msg.id)} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 text-sm hover:bg-slate-700 border-t border-slate-700">
                            <Trash2 size={16} /> Apagar
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Edit Mode */}
                  {editingMsgId === msg.id ? (
                    <div className="bg-slate-800 rounded-2xl p-3 border border-purple-500">
                      <input value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-transparent text-white text-sm outline-none" autoFocus />
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setEditingMsgId(null)} className="text-xs text-slate-400 px-3 py-1 rounded-lg hover:bg-slate-700">Cancelar</button>
                        <button onClick={() => handleEditSave(msg.id)} className="text-xs text-white bg-purple-600 px-3 py-1 rounded-lg">Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Image Message */}
                      {msgImageUrl && (
                        <img src={msgImageUrl} alt="" className="rounded-2xl mb-1 max-h-48 object-cover w-full" />
                      )}
                      {/* Message Bubble */}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                        isMine ? 'bg-gradient-to-r from-purple-600 to-rose-500 text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'
                      }`}>
                        {msg.content}
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                          {msg.isEdited && <span className="text-[9px] opacity-50">editado</span>}
                          <span className={`text-[10px] ${isMine ? 'text-white/50' : 'text-slate-500'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && (
                            msg.isRead ? <CheckCheck size={12} className="text-blue-300 ml-0.5" /> : <Check size={12} className="text-white/40 ml-0.5" />
                          )}
                        </div>
                      </div>
                    </>
                  )}

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

        {/* Typing Indicator */}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 border border-slate-700">
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
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <LoadingSpinner />
          <span className="text-xs text-slate-400">Enviando mídia...</span>
        </div>
      )}

      {/* Recording UI */}
      {isRecording ? (
        <div className="flex items-center gap-3 p-4 bg-red-950/50 border-t border-red-900/50">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-300 text-sm font-bold flex-1">Gravando... {recordingTime}s</span>
          <button onClick={cancelRecording} className="p-2 text-slate-400 hover:text-white active:scale-90">
            <X size={20} />
          </button>
          <button onClick={stopRecording} className="w-11 h-11 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full flex items-center justify-center active:scale-90 shadow-lg">
            <Send size={18} />
          </button>
        </div>
      ) : (
        /* Normal Input */
        <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 bg-slate-900 border-t border-slate-800 shrink-0">
          {/* Camera */}
          <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-2 text-slate-500 hover:text-purple-400 active:scale-90 transition-transform">
            <Camera size={20} />
          </button>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
          
          {/* Gallery */}
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-purple-400 active:scale-90 transition-transform">
            <Image size={20} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
          
          {/* Text Input */}
          <input
            type="text"
            value={newMsg}
            onChange={(e) => { setNewMsg(e.target.value); handleTyping(); }}
            placeholder="Mensagem..."
            className="flex-1 min-w-0 px-4 py-3 bg-slate-800 border border-slate-700 rounded-full text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500 transition-colors"
          />
          
          {newMsg.trim() ? (
            <button type="submit" className="w-11 h-11 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg shrink-0">
              <Send size={18} className="ml-0.5" />
            </button>
          ) : (
            <button type="button" onClick={startRecording} className="w-11 h-11 bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 rounded-full flex items-center justify-center active:scale-90 transition-all shrink-0">
              <Mic size={20} />
            </button>
          )}
        </form>
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
        const isOnline = otherUser?.isOnline ?? false;
        return (
          <button
            key={conv.id}
            onClick={() => setActiveConv(conv)}
            className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-50 active:bg-slate-100"
          >
            <div className="relative shrink-0">
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden" style={{width: '52px', height: '52px'}}>
                {otherAvatarUrl ? (
                  <img src={otherAvatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">{(otherUser?.displayName || 'U')[0].toUpperCase()}</span>
                )}
              </div>
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{otherUser?.displayName || 'Usuário'}</p>
              <p className="text-xs text-slate-400 truncate">{conv.lastMessagePreview || conv.lastMessage?.content || 'Envie uma mensagem'}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {(conv.lastMessageAt || conv.lastMessage?.createdAt) && (
                <span className="text-[10px] text-slate-400">
                  {new Date(conv.lastMessageAt || conv.lastMessage.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {conv.unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{conv.unreadCount}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
