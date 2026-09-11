import { useState, useEffect } from 'react';
import { ChevronLeft, Phone, AlertCircle, PhoneCall, ShieldAlert, Heart, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { emergencyAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function EmergencyScreen() {
  const navigate = useNavigate();
  const [resources, setResources] = useState({ hotlines: [], tips: [] });
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Contact Form
  const [showForm, setShowForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '', isPrimary: false });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [res1, res2] = await Promise.all([
        emergencyAPI.getResources(),
        emergencyAPI.getContacts()
      ]);
      setResources(res1.data.data);
      setContacts(res2.data.data.contacts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;
    
    try {
      await emergencyAPI.addContact(newContact);
      setShowForm(false);
      setNewContact({ name: '', phone: '', relation: '', isPrimary: false });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar contato');
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Remover este contato de emergência?')) return;
    try {
      await emergencyAPI.removeContact(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;

  return (
    <div className="bg-slate-50 min-h-full pb-10">
      {/* Header */}
      <div className="bg-red-50 px-4 py-4 sticky top-0 z-10 border-b border-red-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-red-500 hover:bg-red-100">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2 text-red-600">
            <ShieldAlert size={20} />
            <h2 className="text-lg font-bold">SOS & Emergências</h2>
          </div>
        </div>
      </div>

      {/* SOS Button */}
      <div className="p-6 flex flex-col items-center">
        <button className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_10px_40px_rgba(225,29,72,0.4)] flex flex-col items-center justify-center text-white active:scale-95 transition-transform">
          <AlertCircle size={40} className="mb-1" />
          <span className="font-black text-2xl tracking-wider">SOS</span>
        </button>
        <p className="text-slate-500 text-xs mt-4 text-center">Segure por 3 segundos para enviar um alerta<br/>aos seus contatos principais.</p>
      </div>

      {/* Hotlines */}
      <div className="px-4 mt-2">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-2">Telefones Úteis</h3>
        <div className="grid grid-cols-2 gap-3">
          {resources.hotlines.map((hotline, idx) => (
            <a 
              key={idx}
              href={`tel:${hotline.phone}`}
              className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center active:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                <PhoneCall size={18} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">{hotline.name}</h4>
              <p className="text-xs text-slate-400">{hotline.country}</p>
              <p className="text-sm font-black text-red-500 mt-1">{hotline.phone}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Contatos Pessoais */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-3 ml-2">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Meus Contatos</h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600"
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddContact} className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm mb-4 animate-in slide-in-from-top-2">
            <h4 className="font-bold text-sm mb-3">Novo Contato</h4>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Nome"
                value={newContact.name}
                onChange={e => setNewContact({...newContact, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-rose-300"
              />
              <input 
                type="tel" 
                placeholder="Telefone"
                value={newContact.phone}
                onChange={e => setNewContact({...newContact, phone: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-rose-300"
              />
              <input 
                type="text" 
                placeholder="Parentesco (ex: Host Mom)"
                value={newContact.relation}
                onChange={e => setNewContact({...newContact, relation: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-rose-300"
              />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input 
                  type="checkbox" 
                  checked={newContact.isPrimary}
                  onChange={e => setNewContact({...newContact, isPrimary: e.target.checked})}
                  className="rounded text-rose-500 focus:ring-rose-500"
                />
                Marcar como contato principal
              </label>
              <button 
                type="submit"
                className="w-full py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors"
              >
                Salvar Contato
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${contact.isPrimary ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-500'}`}>
                  {contact.isPrimary ? <Heart size={18} fill="currentColor" /> : <Phone size={18} />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {contact.name}
                    {contact.isPrimary && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-500 text-[9px] uppercase rounded-md">Principal</span>}
                  </h4>
                  <p className="text-xs text-slate-400">{contact.relation || 'Contato'}</p>
                  <p className="text-sm font-medium text-slate-600 mt-0.5">{contact.phone}</p>
                </div>
              </div>
              <button onClick={() => handleDeleteContact(contact.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {contacts.length === 0 && !showForm && (
            <p className="text-center text-slate-400 text-sm py-4">Nenhum contato cadastrado.</p>
          )}
        </div>
      </div>

    </div>
  );
}
