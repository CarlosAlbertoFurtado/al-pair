import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';
import { PostCard } from '../feed/HomeFeed';

export default function MyPostsScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const lastPostRef = useRef(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchPosts = useCallback(async (nextCursor = null) => {
    if (!user?.id) return;
    try {
      if (nextCursor) setLoadingMore(true);
      else setLoading(true);

      const res = await postsAPI.getFeed({ cursor: nextCursor, authorId: user.id });
      const data = res.data.data;

      setPosts(prev => nextCursor ? [...prev, ...data.posts] : data.posts);
      setCursor(data.nextCursor || null);
      setHasMore(data.hasNextPage || data.hasMore || false);
    } catch (err) {
      console.error('MyPosts fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.id]);

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

  return (
    <div className="pb-6">
      <div className="bg-white p-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <h1 className="text-lg font-black text-slate-800">Meus Posts</h1>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><LoadingSpinner /></div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 text-center mt-10">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhuma publicação ainda</h3>
          <p className="text-sm text-slate-400">Você ainda não compartilhou nada. Vá ao feed principal para criar um post!</p>
        </div>
      ) : (
        <div>
          {posts.map((post, i) => (
            <div key={post.id} ref={i === posts.length - 1 ? lastPostRef : null}>
              <PostCard post={post} />
            </div>
          ))}
          {loadingMore && <div className="flex justify-center p-4"><LoadingSpinner /></div>}
        </div>
      )}
    </div>
  );
}
