import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, MessageCircle, UserPlus, X, Loader2, Navigation, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { usersAPI, chatAPI, resolveAssetUrl } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';

// Haversine formula para calcular distância real entre coordenadas
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createMarkerIcon({ avatarUrl, label, isCurrentUser = false, isOnline = false }) {
  const safeLabel = escapeHtml(label || 'U');
  const safeAvatarUrl = escapeHtml(avatarUrl || '');
  const initial = safeLabel[0].toUpperCase();
  const avatar = avatarUrl
    ? `<img src="${safeAvatarUrl}" alt="" class="apc-map-marker-img" />`
    : `<span class="apc-map-marker-initial">${initial}</span>`;
  const status = isCurrentUser ? '' : `<span class="apc-map-status ${isOnline ? 'is-online' : ''}"></span>`;

  return L.divIcon({
    className: '',
    html: `
      <div class="apc-map-marker ${isCurrentUser ? 'is-current' : ''}">
        ${avatar}
        ${status}
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    popupAnchor: [0, -46],
  });
}

function FlyToLocation({ location }) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;
    map.flyTo([location.lat, location.lng], 12, {
      animate: true,
      duration: 1.3,
    });
  }, [location, map]);

  return null;
}

export default function MapScreen() {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : [20, 0];
  const mapZoom = userLocation ? 12 : 2;
  const currentUserIcon = useMemo(() => createMarkerIcon({
    avatarUrl: resolveAssetUrl(user?.avatarUrl),
    label: user?.displayName || 'Você',
    isCurrentUser: true,
  }), [user?.avatarUrl, user?.displayName]);

  const fetchNearby = useCallback(async (lat, lng) => {
    try {
      // Tentar buscar por proximidade real via API
      const res = await usersAPI.getNearby(lat, lng, 100);
      const users = (res.data.data || []).filter(u => u.id !== user?.id);
      
      // Calcular distância real para cada usuário
      const usersWithDist = users.map(u => ({
        ...u,
        distance: u.latitude && u.longitude 
          ? Math.round(getDistanceKm(lat, lng, u.latitude, u.longitude))
          : null
      })).sort((a, b) => (a.distance || 999) - (b.distance || 999));
      
      setNearbyUsers(usersWithDist);
    } catch (err) {
      // Fallback: buscar por search se o nearby falhar
      console.warn('Nearby API failed, using search fallback:', err);
      try {
        const res = await usersAPI.search({ q: user?.city || 'au pair', limit: 15 });
        const users = (res.data.data?.users || []).filter(u => u.id !== user?.id);
        setNearbyUsers(users.map(u => ({ ...u, distance: null })));
      } catch {
        setNearbyUsers([]);
      }
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }, [user?.id, user?.city]);

  useEffect(() => {
    // Pedir localização GPS
    if (!navigator.geolocation) {
      setLocationError('Seu navegador não suporta geolocalização.');
      setScanning(false);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Enviar localização para o backend
        try { await usersAPI.updateLocation(latitude, longitude); } catch {}
        
        // Buscar usuários próximos
        fetchNearby(latitude, longitude);
      },
      (err) => {
        console.warn('GPS denied:', err);
        setLocationError('Permita o acesso à localização para encontrar Au Pairs perto de você.');
        // Fallback sem GPS
        fetchNearby(0, 0);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [fetchNearby]);

  const handleRefresh = () => {
    setScanning(true);
    setLoading(true);
    if (userLocation) {
      fetchNearby(userLocation.lat, userLocation.lng);
    } else {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          fetchNearby(pos.coords.latitude, pos.coords.longitude);
        },
        () => fetchNearby(0, 0)
      );
    }
  };

  const handleMessage = async (targetUser) => {
    try {
      const res = await chatAPI.getOrCreateDirect(targetUser.id);
      navigate('/chat', { state: { conversationId: res.data.data.conversation.id, user: targetUser } });
    } catch (err) {
      console.error('Chat failed:', err);
    }
  };

  const handleFollow = async (targetUser) => {
    try {
      await usersAPI.follow(targetUser.id);
      setNearbyUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, isFollowing: !u.isFollowing } : u));
    } catch (err) {
      console.error('Follow failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Header */}
      <div className="relative z-10 px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
              <MapPin size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black">Radar Au Pairs</h1>
              <p className="text-sm text-slate-400">
                {userLocation ? 'Buscando na sua região' : 'Ative o GPS para resultados precisos'}
              </p>
            </div>
          </div>
          <button onClick={handleRefresh} className="p-2 bg-slate-800/60 rounded-full text-slate-400 hover:text-white active:scale-90 transition-transform">
            <RefreshCw size={18} className={scanning ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Location Error */}
      {locationError && (
        <div className="relative z-10 mx-5 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Navigation size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-300 font-semibold">{locationError}</p>
            <button onClick={handleRefresh} className="text-xs text-amber-400 underline mt-1">Tentar novamente</button>
          </div>
        </div>
      )}

      {/* Scanning State */}
      {scanning && (
        <div className="relative z-10 flex flex-col items-center justify-center py-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500/20 to-purple-600/20 flex items-center justify-center animate-pulse">
            <Loader2 size={32} className="text-purple-400 animate-spin" />
          </div>
          <p className="text-purple-300 font-bold mt-6 text-lg">Buscando Au Pairs...</p>
          <p className="text-slate-500 text-sm mt-2">Escaneando sua região</p>
        </div>
      )}

      {/* Real World Map */}
      <div className="relative z-10 mx-4 mb-5 overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl">
        <div className="h-[340px] w-full">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            minZoom={2}
            maxZoom={18}
            scrollWheelZoom
            className="h-full w-full"
            worldCopyJump
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              detectRetina={true}
            />
            <FlyToLocation location={userLocation} />
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]} icon={currentUserIcon}>
                <Popup>
                  <strong>Você está aqui</strong>
                  <br />
                  Radar centralizado na sua localização.
                </Popup>
              </Marker>
            )}
            {nearbyUsers
              .filter(u => Number.isFinite(Number(u.latitude)) && Number.isFinite(Number(u.longitude)))
              .map((u) => {
                const avatar = resolveAssetUrl(u.avatarUrl);
                const icon = createMarkerIcon({
                  avatarUrl: avatar,
                  label: u.displayName,
                  isOnline: u.isOnline,
                });

                return (
                  <Marker key={u.id} position={[Number(u.latitude), Number(u.longitude)]} icon={icon}>
                    <Popup>
                      <div className="min-w-[150px]">
                        <strong>{u.displayName}</strong>
                        <p className="m-0 text-xs">
                          {u.distance != null ? `Aprox. ${u.distance} km de você` : (u.city || 'Localização informada')}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>
        </div>
        <div className="absolute left-4 top-4 z-[500] rounded-2xl bg-slate-950/80 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md">
          {userLocation ? 'Mapa aproximado na sua posição' : 'Mapa mundial aguardando GPS'}
        </div>
      </div>

      {/* Results */}
      {!scanning && (
        <div className="relative z-10 px-4 pb-8">
          {/* Stats */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
              <p className="text-2xl font-black text-rose-400">{nearbyUsers.length}</p>
              <p className="text-[11px] text-slate-400 font-medium">Au Pairs encontradas</p>
            </div>
            <div className="flex-1 bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
              <p className="text-2xl font-black text-purple-400">{user?.city || '—'}</p>
              <p className="text-[11px] text-slate-400 font-medium">Sua região</p>
            </div>
          </div>

          {/* User Cards */}
          <div className="space-y-3">
            {nearbyUsers.map((u, i) => {
              const avatar = resolveAssetUrl(u.avatarUrl);
              const roleLabel = u.role === 'CANDIDATE' ? '🌍 Quer ser Au Pair' : u.role === 'ALUMNI' ? '🎓 Ex Au Pair' : '⭐ Au Pair';
              return (
                <div 
                  key={u.id}
                  className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/40 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 active:bg-slate-700/60 transition-colors"
                  style={{ animationDelay: `${i * 80}ms` }}
                  onClick={() => setSelectedUser(u)}
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 p-[2px]">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                        {avatar ? (
                          <img src={avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-white">{(u.displayName || 'U')[0].toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 border-2 border-slate-800 rounded-full ${u.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{u.displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={11} className="text-rose-400" />
                      <span className="text-[11px] text-rose-400 font-semibold">
                        {u.distance != null ? `~${u.distance} km` : (u.city || 'Localização não informada')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleFollow(u); }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-90 ${u.isFollowing ? 'bg-slate-700 text-slate-400' : 'bg-purple-600 text-white'}`}
                    >
                      <UserPlus size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMessage(u); }}
                      className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <MessageCircle size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {nearbyUsers.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={32} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-bold">Nenhuma Au Pair encontrada</p>
              <p className="text-slate-600 text-sm mt-2">Ative o GPS ou tente novamente mais tarde</p>
            </div>
          )}
        </div>
      )}

      {/* Selected User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in" onClick={() => setSelectedUser(null)}>
          <div className="bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-800 shadow-2xl animate-in zoom-in-95 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X size={20} />
            </button>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 p-[2px] mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  {resolveAssetUrl(selectedUser.avatarUrl) ? (
                    <img src={resolveAssetUrl(selectedUser.avatarUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{(selectedUser.displayName || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-black text-white">{selectedUser.displayName}</h3>
              <p className="text-sm text-slate-400 mt-1">{selectedUser.bio || 'Au Pair Conectada'}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${selectedUser.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                <span className={`text-xs font-semibold ${selectedUser.isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {selectedUser.isOnline ? 'Online agora' : 'Offline'}
                </span>
              </div>
              {selectedUser.city && (
                <p className="text-xs text-rose-400 mt-2 flex items-center justify-center gap-1">
                  <MapPin size={12} /> {selectedUser.city}{selectedUser.country ? `, ${selectedUser.country}` : ''}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={() => { navigate(`/user/${selectedUser.id}`); setSelectedUser(null); }}
                className="py-3 bg-slate-800 text-white font-bold rounded-xl text-sm hover:bg-slate-700 active:scale-95 transition-all"
              >
                Ver Perfil
              </button>
              <button 
                onClick={() => { handleMessage(selectedUser); setSelectedUser(null); }}
                className="py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold rounded-xl text-sm active:scale-95 transition-all shadow-lg"
              >
                Mensagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
