import { useCallback, useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import { postsAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export function CommentsModal({ post, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex flex-col justify-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-slideUp">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Comentários</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center p-10"><LoadingSpinner /></div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">Nenhum comentário ainda. Seja o primeiro!</div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {(comment.author?.displayName || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 bg-slate-50 rounded-2xl p-3 rounded-tl-sm">
                  <p className="text-xs font-bold text-slate-900 mb-1">{comment.author?.displayName}</p>
                  <p className="text-sm text-slate-700">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Adicione um comentário..."
              className="min-w-0 flex-1 rounded-full bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button 
              type="submit" 
              disabled={submitting || !content.trim()}
              className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-opacity"
            >
              <Send size={18} className="ml-1" />
            </button>
          </form>
          {error && (
            <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
