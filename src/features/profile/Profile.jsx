import { useState, useEffect } from 'react';
import { Camera, Grid, LogIn, ChevronRight, ShieldAlert, CheckSquare, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { api, BASE_URL, uploadAPI, usersAPI } from '../../api';
import { hasVisibleFace, validatePhotoFile } from '../../utils/imageValidation';

function resolveAssetUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
}

export default function Profile() {
  const { user, userRole, logout, updateUser } = useAuthStore();
  const [stats, setStats] = useState({ postsCount: 0, followersCount: 0, followingCount: 0 });
  const [form, setForm] = useState({ displayName: '', bio: '', city: '', country: '', avatarUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      api.get(`/users/${user.id}`)
        .then(res => {
          const u = res.data.data.user;
          setForm({
            displayName: u.displayName || '',
            bio: u.bio || '',
            city: u.city || '',
            country: u.country || '',
            avatarUrl: u.avatarUrl || '',
          });
          setStats({
            postsCount: u._count?.posts || 0,
            followersCount: u._count?.followers || 0,
            followingCount: u._count?.following || 0,
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;

  const avatarUrl = resolveAssetUrl(form.avatarUrl || user?.avatarUrl);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validatePhotoFile(file, { maxSizeMb: 3 });
    if (validationError) {
      setError(validationError);
      event.target.value = '';
      return;
    }

    setError('');
    setNotice('');
    setUploadingAvatar(true);

    try {
      const faceDetected = await hasVisibleFace(file);
      if (faceDetected === false) {
        setError('A foto de perfil precisa mostrar uma pessoa com o rosto visível.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAPI.avatar(formData);
      updateField('avatarUrl', res.data.data.url);
      setNotice('Foto carregada. Salve o perfil para aplicar.');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setError(err.response?.data?.message || 'Não foi possível enviar a foto de perfil.');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        displayName: form.displayName.trim(),
        bio: form.bio.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        avatarUrl: form.avatarUrl || null,
      };
      const res = await usersAPI.updateProfile(payload);
      updateUser(res.data.data.user);
      setNotice('Perfil atualizado com sucesso.');
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.response?.data?.message || 'Não foi possível salvar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const menuSections = [
    {
      title: 'Minha Conta',
      items: [
        { icon: Grid, label: 'Meus Posts', badge: stats.postsCount, onClick: () => navigate('/my-posts') },
        // { icon: Star, label: 'Avaliações Recebidas' }, // Oculto: mock
        // { icon: Award, label: 'Conquistas' }, // Oculto: mock
      ]
    },
    {
      title: 'Ferramentas',
      items: [
        // Cofre Digital fica fora da beta ate existir politica LGPD, storage seguro e auditoria.
        { icon: CheckSquare, label: 'Minha Jornada', desc: 'Checklist de passos', onClick: () => navigate('/journey') },
        // { icon: Building, label: 'Agências', desc: 'Avaliações reais' }, // Oculto: mock
        { icon: ShieldAlert, label: 'SOS & Emergências', desc: 'Ajuda rápida', onClick: () => navigate('/emergency') },
      ]
    },
    /* Oculto por enquanto até MVP 2
    {
      title: 'Configurações',
      items: [
        { icon: Settings, label: 'Configurações' },
        { icon: Globe, label: 'Idioma' },
      ]
    }
    */
  ];

  return (
    <div className="pb-6">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-rose-500 via-purple-500 to-indigo-600 p-6 pb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4 mb-4">
          <label className="relative w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-2 border-white/30 overflow-hidden shrink-0 cursor-pointer">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (form.displayName || user?.displayName || 'U')[0].toUpperCase()
            )}
            <span className="absolute inset-x-0 bottom-0 h-7 bg-black/45 flex items-center justify-center">
              <Camera size={16} />
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarSelect}
              disabled={uploadingAvatar || saving}
            />
          </label>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{form.displayName || user?.displayName || 'Usuário'}</h2>
            <p className="text-white/70 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 px-3 py-0.5 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
              {userRole === 'candidate' ? '🌍 Au Pair' : userRole === 'alumni' ? '🎓 Ex Au Pair' : '⭐ Mentora'}
            </span>
            {uploadingAvatar && <p className="mt-2 text-xs font-semibold text-white/80">Validando foto...</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-around mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-3">
          <div className="text-center">
            <p className="text-xl font-black">{stats.postsCount}</p>
            <p className="text-[11px] text-white/70 font-medium">Posts</p>
          </div>
          <div className="text-center border-x border-white/20 px-6">
            <p className="text-xl font-black">{stats.followersCount}</p>
            <p className="text-[11px] text-white/70 font-medium">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black">{stats.followingCount}</p>
            <p className="text-[11px] text-white/70 font-medium">Seguindo</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="mt-4 mx-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-slate-800">Editar perfil</h3>
          <button
            type="submit"
            disabled={saving || uploadingAvatar || !form.displayName.trim()}
            className="h-9 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Nome</label>
          <input
            value={form.displayName}
            onChange={(event) => updateField('displayName', event.target.value)}
            maxLength={80}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(event) => updateField('bio', event.target.value.slice(0, 300))}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none"
          />
          <p className="mt-1 text-[11px] text-slate-400 text-right">{form.bio.length}/300</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Cidade</label>
            <input
              value={form.city}
              onChange={(event) => updateField('city', event.target.value)}
              maxLength={80}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">País</label>
            <input
              value={form.country}
              onChange={(event) => updateField('country', event.target.value)}
              maxLength={80}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </div>
        </div>

        {notice && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{notice}</p>}
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}
      </form>

      {/* Menu Sections */}
      {menuSections.map((section, si) => (
        <div key={si} className="mt-4 mx-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">{section.title}</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {section.items.map((item, ii) => (
              <button key={ii} onClick={item.onClick} className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <item.icon size={18} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-slate-800">{item.label}</p>
                  {item.desc && <p className="text-xs text-slate-400">{item.desc}</p>}
                </div>
                {item.badge !== undefined && (
                  <span className="text-xs font-bold text-slate-400">{item.badge}</span>
                )}
                <ChevronRight size={16} className="text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Logout Button */}
      <div className="mx-4 mt-6">
        <button
          onClick={logout}
          className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors text-sm"
        >
          <LogIn size={16} className="inline mr-2 rotate-180" />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
