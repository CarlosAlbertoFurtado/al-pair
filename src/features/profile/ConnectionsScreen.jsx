import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, MessageCircle, Search, UserRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { chatAPI, resolveAssetUrl, usersAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';

const typeLabels = {
  followers: {
    title: 'Seguidores',
    emptyTitle: 'Nenhum seguidor ainda',
    emptyText: 'Quando alguém seguir este perfil, vai aparecer aqui.',
  },
  following: {
    title: 'Seguindo',
    emptyTitle: 'Não segue ninguém ainda',
    emptyText: 'As pessoas seguidas por este perfil vão aparecer aqui.',
  },
};

export default function ConnectionsScreen() {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const labels = typeLabels[type] || typeLabels.followers;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    const request = type === 'following'
      ? usersAPI.getFollowing(id)
      : usersAPI.getFollowers(id);

    request
      .then((res) => {
        if (!mounted) return;
        setPeople(res.data.data.users || []);
      })
      .catch((err) => {
        console.error('Connections fetch failed:', err);
        if (mounted) setError('Não foi possível carregar esta lista.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, type]);

  const filteredPeople = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return people;
    return people.filter((person) => {
      const text = [person.displayName, person.city, person.country, person.bio].filter(Boolean).join(' ').toLowerCase();
      return text.includes(normalized);
    });
  }, [people, query]);

  const openChat = async (person) => {
    if (person.id === user?.id) {
      navigate('/profile');
      return;
    }

    try {
      const res = await chatAPI.getOrCreateDirect(person.id);
      navigate('/chat', {
        state: {
          conversationId: res.data.data.conversation.id,
          user: person,
        },
      });
    } catch (err) {
      console.error('Direct chat failed:', err);
    }
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100 active:scale-95">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-slate-900">{labels.title}</h1>
            <p className="text-xs text-slate-400">{people.length} perfil{people.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2">
            <Search size={17} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar nesta lista"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><LoadingSpinner /></div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-sm font-semibold text-red-500">{error}</p>
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
            <UserRound size={34} />
          </div>
          <h2 className="text-base font-black text-slate-800">{query ? 'Nenhum resultado' : labels.emptyTitle}</h2>
          <p className="mt-2 text-sm text-slate-400">{query ? 'Tente outro nome, cidade ou país.' : labels.emptyText}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 bg-white">
          {filteredPeople.map((person) => {
            const avatarUrl = resolveAssetUrl(person.avatarUrl);
            const location = [person.city, person.country].filter(Boolean).join(', ');
            return (
              <div key={person.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => navigate(person.id === user?.id ? '/profile' : `/user/${person.id}`)}
                  className="relative h-12 w-12 shrink-0 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 text-white overflow-hidden flex items-center justify-center font-black active:scale-95"
                >
                  {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : (person.displayName || 'U')[0].toUpperCase()}
                  <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${person.isOnline ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(person.id === user?.id ? '/profile' : `/user/${person.id}`)}
                  className="min-w-0 flex-1 text-left active:opacity-70"
                >
                  <p className="truncate text-sm font-black text-slate-900">{person.displayName || 'Usuário'}</p>
                  <p className="truncate text-xs text-slate-500">{person.bio || (person.role === 'MENTOR' ? 'Mentora' : 'Au Pair Connect')}</p>
                  {location && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold text-rose-500">
                      <MapPin size={11} />
                      {location}
                    </p>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => openChat(person)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white active:scale-95"
                  aria-label={`Enviar mensagem para ${person.displayName || 'usuário'}`}
                >
                  <MessageCircle size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
