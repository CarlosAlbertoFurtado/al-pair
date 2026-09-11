import { useState, useEffect, useRef, useCallback } from 'react';
import { Bookmark, Flag, Heart, MessageSquare, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { postsAPI, BASE_URL, moderationAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ReportModal } from '../../components/ReportModal';
import { CommentsModal } from './CommentsModal';

export function PostCard({ post }) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || post.likesCount || 0);
  const [saved, setSaved] = useState(post.isBookmarked || false);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();

  const handleLike = async () => {
    try {
      await postsAPI.like(post.id);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleBookmark = async () => {
    try {
      await postsAPI.toggleBookmark(post.id);
      setSaved(!saved);
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
      alert('Link copiado!');
    }
  };

  const handleReport = async (payload) => {
    await moderationAPI.report(payload);
    setNotice('Denúncia enviada para moderação.');
    window.setTimeout(() => setNotice(''), 3500);
  };

  const imageUrl = post.imageUrl
    ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${BASE_URL}${post.imageUrl}`)
    : null;
  const avatarUrl = post.author?.avatarUrl
    ? (post.author.avatarUrl.startsWith('http') ? post.author.avatarUrl : `${BASE_URL}${post.author.avatarUrl}`)
    : null;
  const authorId = post.author?.id || post.authorId;

  const openAuthorProfile = () => {
    if (authorId) navigate(`/user/${authorId}`);
  };

  return (
    <article className="bg-white border-b border-slate-100 pb-2">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <button
          type="button"
          onClick={openAuthorProfile}
          disabled={!authorId}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0 disabled:cursor-default"
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
            className="block max-w-full text-left text-sm font-bold text-slate-900 truncate hover:text-rose-500 disabled:hover:text-slate-900 disabled:cursor-default"
          >
            {post.author?.displayName || 'Usuário'}
          </button>
          <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</p>
        </div>
      </div>

      {/* Rematch Badge */}
      {post.type === 'REMATCH' && (
        <div className={`mx-4 mb-2 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
          post.rematchUrgency === 'URGENT' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
        }`}>
          <span>🚨</span>
          <div>
            <span className="uppercase tracking-wider">{post.rematchUrgency === 'URGENT' ? 'Rematch Urgente' : 'Rematch (Transfer)'}</span>
            {(post.rematchCity || post.rematchState) && (
              <span className="font-normal opacity-80 ml-1">
                em {post.rematchCity}{post.rematchCity && post.rematchState ? ', ' : ''}{post.rematchState}
              </span>
            )}
          </div>
        </div>
      )}

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
          <button onClick={() => setShowComments(true)} className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors">
            <MessageSquare size={20} />
            <span className="text-xs font-bold">{post._count?.comments || 0}</span>
          </button>
          <button onClick={handleShare} className="text-slate-400 hover:text-green-400 transition-colors">
            <Share2 size={20} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleBookmark} className={`transition-colors ${saved ? 'text-amber-500' : 'text-slate-400 hover:text-amber-400'}`}>
            <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => setShowReport(true)} className="text-slate-400 hover:text-red-500 transition-colors" aria-label="Denunciar publicação">
            <Flag size={19} />
          </button>
        </div>
      </div>

      {notice && (
        <div className="mx-4 mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          {notice}
        </div>
      )}
      
      {showComments && (
        <CommentsModal post={post} onClose={() => setShowComments(false)} />
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

  const fetchPosts = useCallback(async (nextCursor = null) => {
    try {
      if (nextCursor) setLoadingMore(true);
      else setLoading(true);

      const res = await postsAPI.getFeed({ cursor: nextCursor });
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
