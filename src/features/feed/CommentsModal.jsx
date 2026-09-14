import { useCallback, useEffect, useState, useRef } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { postsAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export function CommentsModal({ post, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Reaction State
  const [activeReactionCommentId, setActiveReactionCommentId] = useState(null);
  const reactionTimeoutRef = useRef(null);

  const fetchComments = useCallback(async () => {
    setError('');
    try {
      const res = await postsAPI.getComments(post.id);
      setComments(res.data.data.comments || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Não foi possível carregar os comentários.');
    } finally {
      setLoading(false);
    }
  }, [post.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setError('');
    setSubmitting(true);
    try {
      const res = await postsAPI.addComment(post.id, content.trim());
      setComments(prev => [...prev, res.data.data.comment]);
      setContent('');
      onCommentAdded?.();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Não foi possível enviar o comentário.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = (commentId, emoji) => {
    // Optimistic update for reaction
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const reactions = c.reactions || [];
        return { ...c, reactions: [...reactions, emoji] };
      }
      return c;
    }));
    setActiveReactionCommentId(null);
    // TODO: Call API to save reaction
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-slate-50 rounded-t-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-lg">Comentários</h3>
            {!loading && <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold">{comments.length}</span>}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6" onClick={() => setActiveReactionCommentId(null)}>
          {loading ? (
            <div className="flex justify-center p-10"><LoadingSpinner /></div>
          ) : comments.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Nenhum comentário ainda.</p>
              <p className="text-sm text-slate-400 mt-1">Seja o primeiro a interagir!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="relative flex gap-3 group animate-in fade-in zoom-in-95 duration-300">
                
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                  {(comment.author?.displayName || 'U')[0].toUpperCase()}
                </div>
                
                {/* Content Bubble */}
                <div className="flex-1 relative">
                  {/* Reaction Popup Menu */}
                  {activeReactionCommentId === comment.id && (
                    <div className="absolute -top-14 left-0 bg-slate-900 text-white px-3 py-2 rounded-full flex gap-2 shadow-xl animate-in zoom-in-95 slide-in-from-bottom-2 z-20">
                      {EMOJIS.map(emoji => (
                        <button 
                          key={emoji}
                          onClick={(e) => { e.stopPropagation(); handleReact(comment.id, emoji); }}
                          className="text-2xl hover:scale-125 active:scale-90 transition-transform hover:-translate-y-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <div 
                    className="bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-sm border border-slate-100 active:bg-slate-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReactionCommentId(comment.id === activeReactionCommentId ? null : comment.id);
                    }}
                  >
                    <p className="text-xs font-bold text-slate-900 mb-1">{comment.author?.displayName}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
                  </div>
                  
                  {/* Reactions Display (Mocked for now) */}
                  {comment.reactions && comment.reactions.length > 0 && (
                    <div className="absolute -bottom-3 left-4 bg-white border border-slate-100 rounded-full px-1.5 py-0.5 shadow-sm flex items-center gap-1 text-xs z-10 animate-in fade-in">
                      {comment.reactions.map((r, i) => <span key={i}>{r}</span>)}
                      <span className="text-slate-400 text-[10px] ml-0.5 font-bold">{comment.reactions.length}</span>
                    </div>
                  )}

                  {/* Comment Actions */}
                  <div className="flex gap-4 mt-1.5 ml-2">
                    <span className="text-[10px] font-semibold text-slate-400">Há 2 min</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveReactionCommentId(comment.id); }}
                      className="text-[10px] font-bold text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      Responder
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Adicione um comentário..."
              className="min-w-0 flex-1 rounded-full bg-slate-50 px-5 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:border-rose-300 focus:bg-white transition-all"
            />
            <button 
              type="submit" 
              disabled={submitting || !content.trim()}
              className="w-12 h-12 shrink-0 bg-gradient-to-tr from-rose-500 to-purple-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 active:scale-90 transition-transform shadow-md"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </form>
          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 animate-in fade-in">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
