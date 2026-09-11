import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { postsAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';

export function CommentsModal({ post, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const fetchComments = async () => {
    try {
      const res = await postsAPI.getComments(post.id);
      setComments(res.data.data.comments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await postsAPI.addComment(post.id, content);
      setComments([...comments, res.data.data.comment]);
      setContent('');
    } catch (err) {
      console.error(err);
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
              className="flex-1 bg-slate-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button 
              type="submit" 
              disabled={submitting || !content.trim()}
              className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-opacity"
            >
              <Send size={18} className="ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
