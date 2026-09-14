import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Ban, Flag, Heart, MapPin, MessageSquare, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { chatAPI, moderationAPI, postsAPI, resolveAssetUrl, usersAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ReportModal } from '../../components/ReportModal';
import { PhotoViewerModal } from '../../components/PhotoViewerModal';
import { useAuthStore } from '../../store/useAuthStore';
import { PostCard } from '../feed/HomeFeed';

const roleLabels = {
  CANDIDATE: 'Candidata',
  ALUMNI: 'Alumni',
  MENTOR: 'Mentora',
};

export default function UserProfileScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: viewer } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const lastPostRef = useRef(null);

  const isOwnProfile = viewer?.id === id;

  const fetchProfileAndPosts = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [profileRes, postsRes] = await Promise.all([
        usersAPI.getProfile(id),
        postsAPI.getFeed({ authorId: id }),
      ]);
      const feed = postsRes.data.data;
      setProfile(profileRes.data.data.user);
      setPosts(feed.posts || []);
      setCursor(feed.nextCursor || null);
      setHasMore(feed.hasNextPage || feed.hasMore || false);
    } catch (err) {
      console.error('User profile fetch error:', err);
      setError('Não foi possível carregar este perfil.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchMorePosts = useCallback(async () => {
    if (!id || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await postsAPI.getFeed({ authorId: id, cursor });
      const feed = res.data.data;
      setPosts(prev => [...prev, ...(feed.posts || [])]);
      setCursor(feed.nextCursor || null);
      setHasMore(feed.hasNextPage || feed.hasMore || false);
    } catch (err) {
      console.error('User profile posts pagination error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, id, loadingMore]);

  useEffect(() => {
    fetchProfileAndPosts();
  }, [fetchProfileAndPosts]);

  useEffect(() => {
    if (!hasMore || loadingMore || !cursor) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) fetchMorePosts();
      },
      { threshold: 0.5 }
    );

    if (lastPostRef.current) observer.observe(lastPostRef.current);
    return () => observer.disconnect();
  }, [cursor, fetchMorePosts, hasMore, loadingMore]);

  const handleFollow = async () => {
    if (!profile || isOwnProfile) return;
    setActionError('');
    setActionLoading(true);
    try {
      const res = await usersAPI.follow(profile.id);
      const following = res.data.data.following;
      setProfile(prev => ({
        ...prev,
        isFollowing: following,
        _count: {
          ...(prev._count || {}),
          followers: Math.max(0, (prev._count?.followers || 0) + (following ? 1 : -1)),
        },
      }));
    } catch (err) {
      console.error('Follow failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!profile || isOwnProfile) {
      navigate('/chat');
      return;
    }
    setActionLoading(true);
    try {
      const res = await chatAPI.getOrCreateDirect(profile.id);
      navigate('/chat', {
        state: {
          conversationId: res.data.data.conversation.id,
          user: profile,
        },
      });
    } catch (err) {
      console.error('Direct chat failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReport = async (payload) => {
    if (!profile || isOwnProfile) return;
    setActionLoading(true);
    try {
      await moderationAPI.report(payload);
      setNotice('Denúncia enviada para moderação.');
      window.setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      console.error('User report failed:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!profile || isOwnProfile) return;
    const confirmed = window.confirm(`Bloquear ${profile.displayName}? Essa pessoa deixará de aparecer para você.`);
    if (!confirmed) return;

    setActionError('');
    setActionLoading(true);
    try {
      await moderationAPI.block(profile.id);
      navigate('/');
    } catch (err) {
      console.error('Block failed:', err);
      setActionError('Não foi possível bloquear este usuário agora.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;

  if (error || !profile) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="bg-white p-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-lg font-black text-slate-800">Perfil</h1>
        </div>
        <div className="p-10 text-center">
          <h3 className="text-lg font-bold text-slate-700 mb-2">Perfil indisponível</h3>
          <p className="text-sm text-slate-400">{error || 'Este usuário não foi encontrado.'}</p>
        </div>
      </div>
    );
  }

  const avatarUrl = resolveAssetUrl(profile.avatarUrl);
  const coverUrl = resolveAssetUrl(profile.coverUrl);
  const location = [profile.city, profile.country].filter(Boolean).join(', ');

  return (
    <div className="bg-slate-50 min-h-full pb-8">
      <div className="relative bg-white border-b border-slate-100">
        <div className="absolute top-3 left-3 z-10">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-slate-700 hover:bg-white">
            <ArrowLeft size={22} />
          </button>
        </div>

        <div className="h-36 bg-gradient-to-br from-rose-500 via-purple-500 to-indigo-600 overflow-hidden">
          {coverUrl && <img src={coverUrl} alt="" className="w-full h-full object-cover" />}
        </div>

        <div className="px-5 pb-5 -mt-12 text-center">
          <button 
            type="button"
            onClick={() => avatarUrl && setShowPhotoViewer(true)}
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 border-4 border-white shadow-sm mx-auto flex items-center justify-center text-white text-3xl font-black overflow-hidden active:scale-95 transition-transform"
          >
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : profile.displayName[0].toUpperCase()}
          </button>
          <h1 className="mt-3 text-xl font-black text-slate-900">{profile.displayName}</h1>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-500">
            <MapPin size={15} />
            <span>{location || 'Localização não informada'}</span>
          </div>
          <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold">
            {roleLabels[profile.role] || profile.role}
          </span>

          {profile.bio && (
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
          )}

          <div className="grid grid-cols-3 gap-2 mt-4 rounded-2xl bg-slate-50 p-3">
            <div>
              <p className="text-lg font-black text-slate-900">{profile._count?.posts || 0}</p>
              <p className="text-[11px] text-slate-400 font-medium">Posts</p>
            </div>
            <div className="border-x border-slate-200">
              <p className="text-lg font-black text-slate-900">{profile._count?.followers || 0}</p>
              <p className="text-[11px] text-slate-400 font-medium">Seguidores</p>
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{profile._count?.following || 0}</p>
              <p className="text-[11px] text-slate-400 font-medium">Seguindo</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              onClick={isOwnProfile ? () => navigate('/profile') : handleFollow}
              disabled={actionLoading}
              className={`h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                profile.isFollowing
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-gradient-to-r from-rose-500 to-purple-500 text-white'
              } disabled:opacity-60`}
            >
              {isOwnProfile ? <UserCheck size={18} /> : profile.isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
              {isOwnProfile ? 'Meu perfil' : profile.isFollowing ? 'Seguindo' : 'Seguir'}
            </button>
            <button
              type="button"
              onClick={handleMessage}
              disabled={actionLoading}
              className="h-11 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-60"
            >
              <MessageSquare size={18} />
              Mensagem
            </button>
          </div>

          {!isOwnProfile && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                type="button"
                onClick={() => setShowReport(true)}
                disabled={actionLoading}
                className="h-10 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-100 disabled:opacity-60"
              >
                <Flag size={16} />
                Denunciar
              </button>
              <button
                type="button"
                onClick={handleBlock}
                disabled={actionLoading}
                className="h-10 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 disabled:opacity-60"
              >
                <Ban size={16} />
                Bloquear
              </button>
            </div>
          )}

          {notice && (
            <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              {notice}
            </div>
          )}
          {actionError && (
            <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {actionError}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 flex items-center gap-2">
        <Heart size={16} className="text-rose-500" />
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Publicações</h2>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white mx-4 rounded-2xl border border-slate-100 p-8 text-center">
          <h3 className="text-base font-bold text-slate-700 mb-1">Nenhuma publicação ainda</h3>
          <p className="text-sm text-slate-400">Quando {profile.displayName} publicar algo, vai aparecer aqui.</p>
        </div>
      ) : (
        <div className="bg-white">
          {posts.map((post, i) => (
            <div key={post.id} ref={i === posts.length - 1 ? lastPostRef : null}>
              <PostCard post={post} />
            </div>
          ))}
          {loadingMore && <div className="flex justify-center p-4"><LoadingSpinner /></div>}
          {!hasMore && posts.length > 0 && (
            <p className="text-center text-slate-400 text-xs py-6">Você viu todas as publicações.</p>
          )}
        </div>
      )}
      {showReport && profile && (
        <ReportModal
          targetType="USER"
          targetId={profile.id}
          targetName={profile.displayName}
          onClose={() => setShowReport(false)}
          onSubmit={handleReport}
        />
      )}
      {showPhotoViewer && avatarUrl && (
        <PhotoViewerModal src={avatarUrl} alt={profile.displayName} onClose={() => setShowPhotoViewer(false)} />
      )}
    </div>
  );
}
