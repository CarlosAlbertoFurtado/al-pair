import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageSquare, Share2, MoreHorizontal, Bookmark } from 'lucide-react';
import { postsAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';

const API_BASE = 'http://localhost:3001';

function PostCard({ post }) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || post.likesCount || 0);
  const [saved, setSaved] = useState(false);

  const handleLike = async () => {
    try {
      await postsAPI.like(post.id);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const imageUrl = post.imageUrl
    ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${API_BASE}${post.imageUrl}`)
    : null;

  return (
    <article className="bg-white border-b border-slate-100 pb-2">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          {(post.author?.displayName || 'U')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{post.author?.displayName || 'Usuário'}</p>
          <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</p>
        </div>
        <button className="p-1 text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
      </div>

      {/* Content */}
      <p className="px-4 text-sm text-slate-800 leading-relaxed mb-2">{post.content}</p>

      {/* Image */}
      {imageUrl && (
        <img 
          src={imageUrl}
          alt="" 
          className="w-full aspect-video object-cover"
          loading="lazy"
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}>
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-xs font-bold">{likeCount}</span>
          </button>
          <button className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors">
            <MessageSquare size={20} />
            <span className="text-xs font-bold">{post._count?.comments || 0}</span>
          </button>
          <button className="text-slate-400 hover:text-green-400 transition-colors">
            <Share2 size={20} />
          </button>
        </div>
        <button onClick={() => setSaved(!saved)} className={`transition-colors ${saved ? 'text-amber-500' : 'text-slate-400 hover:text-amber-400'}`}>
          <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  );
}

export default function HomeFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const lastPostRef = useRef(null);
  const { user } = useAuthStore();

  const fetchPosts = useCallback(async (nextCursor = null) => {
    try {
      if (nextCursor) setLoadingMore(true);
      else setLoading(true);

      const res = await postsAPI.getFeed(nextCursor);
      const data = res.data.data;

      setPosts(prev => nextCursor ? [...prev, ...data.posts] : data.posts);
      setCursor(data.nextCursor || null);
      setHasMore(data.hasNextPage || data.hasMore || false);
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && cursor) {
          fetchPosts(cursor);
        }
      },
      { threshold: 0.5 }
    );

    if (lastPostRef.current) observer.observe(lastPostRef.current);
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore, fetchPosts]);

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;

  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <div className="text-4xl mb-4">🌍</div>
        <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhuma publicação ainda</h3>
        <p className="text-sm text-slate-400">Seja o primeiro a compartilhar sua experiência!</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post, i) => (
        <div key={post.id} ref={i === posts.length - 1 ? lastPostRef : null}>
          <PostCard post={post} />
        </div>
      ))}
      {loadingMore && <div className="flex justify-center p-4"><LoadingSpinner /></div>}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-slate-400 text-xs py-6">Você viu tudo! 🎉</p>
      )}
    </div>
  );
}
