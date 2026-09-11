import { useState, useEffect } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchAPI, BASE_URL } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function SearchScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], posts: [] });
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchAPI.query(query);
      setResults(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-full pb-10">
      {/* Search Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-slate-100 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pessoas, posts..."
            className="w-full bg-slate-100 border-none rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center p-10"><LoadingSpinner /></div>
        ) : !hasSearched ? (
          <div className="text-center mt-10">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 mx-auto mb-4">
              <Search size={32} />
            </div>
            <p className="text-slate-500 text-sm">Digite algo para buscar na rede.</p>
          </div>
        ) : results.users.length === 0 && results.posts.length === 0 ? (
          <p className="text-center text-slate-500 text-sm mt-10">Nenhum resultado encontrado para "{query}".</p>
        ) : (
          <div className="space-y-6">
            {/* Users */}
            {results.users.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Pessoas</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                  {results.users.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/user/${user.id}`)}
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0"
                        aria-label={`Abrir perfil de ${user.displayName}`}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${BASE_URL}${user.avatarUrl}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.displayName[0].toUpperCase()
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/user/${user.id}`)}
                          className="block max-w-full text-left text-sm font-bold text-slate-900 truncate hover:text-rose-500"
                        >
                          {user.displayName}
                        </button>
                        <p className="text-xs text-slate-400 truncate">{user.role}</p>
                      </div>
                      <button 
                        onClick={() => navigate(`/user/${user.id}`)}
                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                      >
                        Perfil
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {results.posts.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Publicações</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                  {results.posts.map(post => (
                    <div key={post.id} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => post.author?.id && navigate(`/user/${post.author.id}`)}
                          className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0"
                          aria-label={`Abrir perfil de ${post.author?.displayName || 'usuário'}`}
                        >
                          {(post.author?.displayName || 'U')[0].toUpperCase()}
                        </button>
                        <button
                          type="button"
                          onClick={() => post.author?.id && navigate(`/user/${post.author.id}`)}
                          className="text-xs font-bold text-slate-700 hover:text-rose-500"
                        >
                          {post.author?.displayName}
                        </button>
                      </div>
                      <p className="text-sm text-slate-800 line-clamp-3">{post.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
