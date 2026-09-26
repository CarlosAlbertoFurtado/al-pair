import { useState, useEffect, useRef, useCallback } from 'react';
import { Bookmark, Flag, Heart, MessageSquare, Share2, Trash2, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { postsAPI, moderationAPI, resolveAssetUrl } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ReportModal } from '../../components/ReportModal';
import { CommentsModal } from './CommentsModal';

// --- Skeleton Component for Premium Loading ---
function PostSkeleton() {
  return (
    <div className="bg-white border-b border-slate-100 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-slate-200"></div>
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-slate-100 rounded w-1/4"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-slate-200 rounded w-full"></div>
        <div className="h-3 bg-slate-200 rounded w-5/6"></div>
      </div>
      <div className="w-full h-[300px] bg-slate-200 rounded-2xl mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="w-6 h-6 bg-slate-200 rounded"></div>
          <div className="w-6 h-6 bg-slate-200 rounded"></div>
          <div className="w-6 h-6 bg-slate-200 rounded"></div>
        </div>
        <div className="flex gap-4">
          <div className="w-6 h-6 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function PostCard({ post, onDelete }) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || post.likesCount || 0);
  const [commentCount, setCommentCount] = useState(post._count?.comments || post.commentsCount || 0);
  const [saved, setSaved] = useState(post.isBookmarked || false);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [notice, setNotice] = useState('');
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOwner = user?.id && (post.author?.id === user.id || post.authorId === user.id);

  const handleLike = async () => {
    try {
      if (!isLiked) {
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
        await postsAPI.like(post.id);
      } else {
        setLikeCount(prev => prev - 1);
        setIsLiked(false);
        await postsAPI.like(post.id); // Assuming toggle behavior on backend
      }
    } catch (err) {
      console.error('Like failed:', err);
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    }
  };

  const handleDoubleTap = (e) => {
    e.preventDefault();
    if (!isLiked) handleLike();
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 1000);
  };

  const handleBookmark = async () => {
    try {
      await postsAPI.toggleBookmark(post.id);
      setSaved(!saved);
      showToast(saved ? 'Removido dos salvos' : 'Salvo na biblioteca');
    } catch (err) {
      console.error('Bookmark failed:', err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'AuPairConnect Post',
      text: post.content,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      navigator.clipboard.writeText(`${post.content} - ${window.location.href}`);
      showToast('Link copiado!');
    }
  };

  const handleReport = async (payload) => {
    await moderationAPI.report(payload);
    showToast('Denúncia enviada para moderação.');
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta publicação?')) return;
    setDeleting(true);
    try {
      await postsAPI.delete(post.id);
      onDelete?.(post.id);
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Não foi possível excluir.');
      setDeleting(false);
    }
  };

  const showToast = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 3000);
  };

  const imageUrl = resolveAssetUrl(post.imageUrl);
  const avatarUrl = resolveAssetUrl(post.author?.avatarUrl);
  const authorId = post.author?.id || post.authorId;

  const openAuthorProfile = () => {
    if (authorId) navigate(`/user/${authorId}`);
  };

  return (
    <article className="bg-white border-b border-slate-100 pb-2 relative">
      {/* Local Toast Notification */}
      {notice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-2">
          {notice}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <button
          type="button"
          onClick={openAuthorProfile}
          disabled={!authorId}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0 disabled:cursor-default active:scale-95 transition-transform"
          aria-label={`Abrir perfil de ${post.author?.displayName || 'usuário'}`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            (post.author?.displayName || 'U')[0].toUpperCase()
          )}
        </button>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={openAuthorProfile}
            disabled={!authorId}
            className="block max-w-full text-left text-sm font-bold text-slate-900 truncate hover:text-rose-500 disabled:hover:text-slate-900 disabled:cursor-default transition-colors"
          >
            {post.author?.displayName || 'Usuário'}
          </button>
          <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</p>
        </div>
      </div>

      {/* Content */}
      <p className="px-4 text-sm text-slate-800 leading-relaxed mb-3">{post.content}</p>

      {/* Image with Double Tap */}
      {imageUrl && (
        <div className="px-4 mb-2">
          <div 
            className="relative w-full rounded-2xl overflow-hidden select-none bg-slate-100 border border-slate-100/50"
            onDoubleClick={handleDoubleTap}
          >
            <img 
              src={imageUrl}
              alt="" 
              className="w-full max-h-[550px] object-cover"
              loading="lazy"
            />
          {/* Big Heart Animation on Double Tap */}
          {showHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart 
                size={80} 
                className="text-rose-500 drop-shadow-2xl animate-ping" 
                fill="currentColor" 
              />
              <Heart 
                size={80} 
                className="text-rose-500 absolute drop-shadow-2xl" 
                fill="currentColor" 
              />
            </div>
          )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-5">
          <button onClick={handleLike} className={`flex items-center gap-1.5 transition-colors active:scale-75 duration-200 ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-400'}`}>
            <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'scale-110 transition-transform' : ''} />
            <span className="text-sm font-bold">{likeCount}</span>
          </button>
          <button onClick={() => setShowComments(true)} className="flex items-center gap-1.5 text-slate-500 hover:text-blue-500 transition-colors active:scale-90">
            <MessageSquare size={22} />
            <span className="text-sm font-bold">{commentCount}</span>
          </button>
          <button onClick={handleShare} className="text-slate-500 hover:text-green-500 transition-colors active:scale-90">
            <Share2 size={22} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleBookmark} className={`transition-colors active:scale-90 ${saved ? 'text-amber-500' : 'text-slate-500 hover:text-amber-400'}`}>
            <Bookmark size={22} fill={saved ? 'currentColor' : 'none'} />
          </button>
          {isOwner ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-slate-400 hover:text-red-500 transition-colors active:scale-90 disabled:opacity-40"
              aria-label="Excluir publicação"
            >
              <Trash2 size={20} />
            </button>
          ) : (
            <button onClick={() => setShowReport(true)} className="text-slate-400 hover:text-red-500 transition-colors active:scale-90" aria-label="Denunciar publicação">
              <Flag size={20} />
            </button>
          )}
        </div>
      </div>

      {showComments && (
        <CommentsModal
          post={post}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentCount(prev => prev + 1)}
        />
      )}
      {showReport && (
        <ReportModal
          targetType="POST"
          targetId={post.id}
          targetName={post.author?.displayName}
          onClose={() => setShowReport(false)}
          onSubmit={handleReport}
        />
      )}
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
  
  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [pullDist, setPullDist] = useState(0);

  const fetchPosts = useCallback(async (nextCursor = null, isRefresh = false) => {
    try {
      if (nextCursor && !isRefresh) setLoadingMore(true);
      else if (!isRefresh) setLoading(true);

      const res = await postsAPI.getFeed({ cursor: nextCursor });
      const data = res.data.data;

      setPosts(prev => (nextCursor && !isRefresh) ? [...prev, ...data.posts] : data.posts);
      setCursor(data.nextCursor || null);
      setHasMore(data.hasNextPage || data.hasMore || false);
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
      setPullDist(0);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDeletePost = useCallback((postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  // Pull to refresh handlers
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (window.scrollY === 0 && touchStartY > 0) {
      const dist = e.touches[0].clientY - touchStartY;
      if (dist > 0) {
        setPullDist(Math.min(dist * 0.5, 100)); // Resistance and max distance
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDist > 60) {
      setIsRefreshing(true);
      fetchPosts(null, true);
    } else {
      setPullDist(0);
    }
    setTouchStartY(0);
  };

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore || loading || isRefreshing) return;

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
  }, [cursor, hasMore, loadingMore, fetchPosts, loading, isRefreshing]);

  return (
    <div 
      onTouchStart={handleTouchStart} 
      onTouchMove={handleTouchMove} 
      onTouchEnd={handleTouchEnd}
      className="min-h-screen"
    >
      {/* Pull to refresh indicator */}
      <div 
        className="flex justify-center items-center overflow-hidden transition-all duration-200 ease-out bg-slate-50"
        style={{ height: `${isRefreshing ? 60 : pullDist}px` }}
      >
        {(pullDist > 0 || isRefreshing) && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-md ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDist * 2}deg)` }}>
            <div className={`w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent ${!isRefreshing ? 'animate-none' : ''}`}></div>
          </div>
        )}
      </div>

      {loading ? (
        // Premium Skeleton Loading
        <div className="space-y-2 bg-slate-50">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 mt-20 text-center">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
            <div className="text-4xl">🌍</div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Seu feed está vazio</h3>
          <p className="text-sm text-slate-500 max-w-[200px]">Siga outras pessoas ou seja o primeiro a publicar algo legal!</p>
        </div>
      ) : (
        <div>
          {posts.map((post, i) => (
            <div key={post.id} ref={i === posts.length - 1 ? lastPostRef : null}>
              <PostCard post={post} onDelete={handleDeletePost} />
            </div>
          ))}
          {loadingMore && <div className="p-4"><PostSkeleton /></div>}
          {!hasMore && posts.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="h-px bg-slate-200 flex-1 mx-4"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Você viu tudo</span>
              <div className="h-px bg-slate-200 flex-1 mx-4"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
