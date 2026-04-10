import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, Home, Truck, Settings, Award, 
  CreditCard, Repeat, Shield, LogOut, ChevronRight, CheckCircle2, Clock, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../lib/store';
import { supabase, mapOrderFromDb, handleSupabaseError } from '../lib/supabase';
import { Order } from '../types';

type Tab = 'data' | 'address' | 'orders' | 'loyalty' | 'subscriptions' | 'auth';

export default function Account() {
  const { user, setUser, isAuthReady } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'data';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isCheckingCep, setIsCheckingCep] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderQueryTab, setOrderQueryTab] = useState('Em andamento');

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');

  const [addressData, setAddressData] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  useEffect(() => {
    if (isAuthReady && !user) {
      navigate('/login');
    }
  }, [user, isAuthReady, navigate]);

  useEffect(() => {
    if (user) {
      // Split display name if possible
      const nameParts = (user.displayName || '').split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      
      setEmail(user.email);
      setCpf(user.cpf || '');
      setPhone(user.phone || '');
      // Mock missing fields from user object for UI purposes
      setGender(''); 
      setBirthDate('');

      if (user.address) {
        setAddressData(user.address);
      }

      if (activeTab === 'orders') {
        fetchOrders();
      }
    }
  }, [user, activeTab]);

  const fetchOrders = async () => {
    if (!user) return;
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []).map(mapOrderFromDb) as Order[]);
    } catch (error) {
      handleSupabaseError(error, 'SELECT', 'orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const { error } = await supabase.from('users').update({
        display_name: fullName,
        cpf: cpf,
        phone: phone
      }).eq('id', user.uid);
      if (error) throw error;
      setUser({ ...user, displayName: fullName, cpf, phone });
      alert('Dados atualizados com sucesso!');
    } catch (error) {
      handleSupabaseError(error, 'UPDATE', `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCepChange = async (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 8);
    let formattedValue = cleanValue;
    if (cleanValue.length > 5) {
      formattedValue = `${cleanValue.slice(0, 5)}-${cleanValue.slice(5)}`;
    }
    
    setAddressData(prev => ({ ...prev, zipCode: formattedValue }));

    if (cleanValue.length === 8) {
      setIsCheckingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanValue}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setAddressData(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      } finally {
        setIsCheckingCep(false);
      }
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('users').update({
        address: addressData
      }).eq('id', user.uid);
      if (error) throw error;
      setUser({ ...user, address: addressData });
      setIsEditingAddress(false);
      alert('Endereço atualizado com sucesso!');
    } catch (error) {
      handleSupabaseError(error, 'UPDATE', `users/${user.uid}/address`);
      alert('Erro ao salvar endereço. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthReady || !user) return null;

  const tabs = [
    { id: 'data', label: 'Meus dados', icon: User },
    { id: 'address', label: 'Endereço', icon: Home },
    { id: 'orders', label: 'Pedidos', icon: Truck },
    { id: 'loyalty', label: 'Fidelidade', icon: Award, badge: 'Novo!' },
    { id: 'subscriptions', label: 'Assinaturas', icon: Repeat },
    { id: 'auth', label: 'Trocar Senha', icon: Shield },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Blue Header Background */}
      <div className="bg-[#002699] h-32 w-full absolute top-0 left-0 z-0 hidden lg:block" />
      <div className="bg-[#002699] h-16 w-full lg:hidden" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-4 lg:pt-8 w-full block">
        <div className="flex flex-col lg:flex-row shadow-sm bg-white rounded-t-lg overflow-hidden border border-gray-200">
          
          {/* Sidebar */}
          <aside className="lg:w-64 bg-white border-r border-gray-100 flex-shrink-0">
            <div className="py-6">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as Tab)}
                      className={`w-full flex items-center justify-between px-6 py-4 text-sm font-medium transition-colors relative ${
                        isActive ? 'text-[#002699]' : 'text-gray-600 hover:text-[#002699] hover:bg-gray-50'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#D32F2F] rounded-r-full" />
                      )}
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge && (
                        <span className="text-[10px] text-[#D32F2F] font-bold">{tab.badge}</span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8 px-6">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 bg-white">
            <div className="p-8 lg:p-12">
              <AnimatePresence mode="wait">
                {activeTab === 'data' && (
                  <motion.div
                    key="data"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2 className="text-[#002699] font-bold text-xl mb-6">Meus dados</h2>
                    <form onSubmit={handleSaveData}>
                      <div className="border-b border-gray-100 mb-8" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="flex flex-col">
                          <label className="text-gray-500 text-xs font-semibold mb-2">Nome</label>
                          <input 
                            type="text" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-gray-500 text-xs font-semibold mb-2">Sobrenome</label>
                          <input 
                            type="text" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-gray-500 text-xs font-semibold mb-2">Email</label>
                          <input 
                            type="email" 
                            value={email}
                            disabled
                            className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-400 outline-none cursor-not-allowed"
                          />
                        </div>
                        <div className="hidden md:block"></div>
                        <div className="flex flex-col">
                          <label className="text-gray-500 text-xs font-semibold mb-2">CPF</label>
                          <input 
                            type="text" 
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value)}
                            className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-gray-500 text-xs font-semibold mb-2">Gênero</label>
                          <input 
                            type="text" 
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-gray-500 text-xs font-semibold mb-2">Data de nascimento</label>
                          <input 
                            type="text" 
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-gray-500 text-xs font-semibold mb-2">Telefone</label>
                          <input 
                            type="text" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                          />
                        </div>
                      </div>

                      <div className="mt-12 flex justify-end">
                        <button 
                          type="submit"
                          disabled={isSaving}
                          className="bg-[#0047BA] hover:bg-[#003895] text-white font-bold py-3 px-12 rounded-full text-sm transition-colors"
                        >
                          {isSaving ? 'SALVANDO...' : 'EDITAR'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {activeTab === 'address' && (
                  <motion.div
                    key="address"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2 className="text-[#002699] font-bold text-xl mb-6">Endereços</h2>
                    <div className="border-b border-gray-100 mb-8" />
                    
                    {isEditingAddress ? (
                      <form onSubmit={handleSaveAddress} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 md:w-3/4">
                          <div className="flex flex-col relative">
                            <label className="text-gray-500 text-xs font-semibold mb-2">CEP</label>
                            <input 
                              type="text" 
                              value={addressData.zipCode}
                              onChange={(e) => handleCepChange(e.target.value)}
                              maxLength={9}
                              className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                            />
                            {isCheckingCep && <Loader2 className="w-5 h-5 text-[#002699] animate-spin absolute right-4 top-10" />}
                          </div>
                          <div className="flex flex-col">
                            <label className="text-gray-500 text-xs font-semibold mb-2">Estado (UF)</label>
                            <input 
                              type="text" 
                              value={addressData.state}
                              onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                              className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                            />
                          </div>
                          <div className="flex flex-col sm:col-span-2">
                            <label className="text-gray-500 text-xs font-semibold mb-2">Endereço (Rua, Avenida, etc)</label>
                            <input 
                              type="text" 
                              value={addressData.street}
                              onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                              className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-gray-500 text-xs font-semibold mb-2">Número</label>
                            <input 
                              type="text" 
                              value={addressData.number}
                              onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
                              className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-gray-500 text-xs font-semibold mb-2">Complemento</label>
                            <input 
                              type="text" 
                              value={addressData.complement}
                              onChange={(e) => setAddressData({ ...addressData, complement: e.target.value })}
                              placeholder="Apt, Sala, Casa 2..."
                              className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-gray-500 text-xs font-semibold mb-2">Bairro</label>
                            <input 
                              type="text" 
                              value={addressData.neighborhood}
                              onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
                              className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-gray-500 text-xs font-semibold mb-2">Cidade</label>
                            <input 
                              type="text" 
                              value={addressData.city}
                              onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                              className="bg-gray-100 border border-gray-200 rounded-full py-3 px-5 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-[#002699]"
                            />
                          </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-4 md:w-3/4">
                          <button 
                            type="button"
                            onClick={() => setIsEditingAddress(false)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-full text-sm transition-colors uppercase"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit"
                            disabled={isSaving}
                            className="bg-[#0047BA] hover:bg-[#003895] text-white font-bold py-3 px-8 rounded-full text-sm transition-colors flex items-center justify-center min-w-[120px] uppercase"
                          >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Endereço'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {addressData.zipCode ? (
                          <div className="border border-gray-200 rounded-lg p-6 relative w-full md:w-80 shadow-sm bg-white hover:border-[#0047BA]/30 transition-colors">
                            <button 
                              onClick={() => setIsEditingAddress(true)}
                              className="absolute top-6 right-6 text-[#0047BA] font-bold text-xs hover:underline uppercase"
                            >
                              Editar
                            </button>
                            
                            <div className="pr-12 text-gray-700 text-sm space-y-1">
                              <p className="font-medium text-gray-900">{addressData.street || 'Rua não informada'}, {addressData.number || 'S/N'}</p>
                              {addressData.complement && <p className="text-xs text-gray-500">{addressData.complement}</p>}
                              <p className="text-gray-600">{addressData.neighborhood}</p>
                              <p className="text-gray-600">{addressData.city} - {addressData.state}</p>
                              <p className="text-gray-500 text-xs mt-2 pt-2 border-t border-gray-50 font-mono tracking-widest">{addressData.zipCode}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl md:w-3/4 bg-gray-50/50">
                            <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-6 font-medium">Você ainda não tem um endereço cadastrado.</p>
                            <button 
                               onClick={() => setIsEditingAddress(true)}
                               className="bg-[#0047BA] hover:bg-[#003895] text-white font-bold py-3 px-8 rounded-full text-sm transition-colors uppercase shadow-md shadow-blue-500/20"
                            >
                               Adicionar Endereço
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === 'orders' && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2 className="text-[#002699] font-bold text-xl mb-6">Histórico de pedidos</h2>
                    <div className="border-b border-gray-100 mb-8" />
                    
                    {/* Segmented Controls */}
                    <div className="flex border border-gray-200 rounded-full overflow-hidden mb-6">
                      {['Em andamento', 'Finalizados', 'Cancelados'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setOrderQueryTab(tab)}
                          className={`flex-1 text-xs font-bold py-3 text-center transition-colors ${
                            orderQueryTab === tab ? 'bg-[#0047BA] text-white' : 'bg-transparent text-[#0047BA] hover:bg-gray-50'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-3 mb-6">
                      <span className="text-gray-500 text-sm">{orders.length} pedido(s)</span>
                      <select className="border border-gray-300 rounded-full py-1.5 px-4 text-sm text-gray-600 bg-white outline-none">
                        <option>últimos 30 dias</option>
                        <option>últimos 6 meses</option>
                        <option>2025</option>
                      </select>
                    </div>

                    {isLoadingOrders ? (
                      <div className="py-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-[#0047BA] border-t-transparent rounded-full" /></div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">Nenhum pedido encontrado.</div>
                    ) : (
                      <div className="space-y-6">
                        {orders.map((order) => (
                          <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
                              <div>
                                <h4 className="text-[#0047BA] font-bold text-sm">Pedido #{order.id.slice(0, 8).toUpperCase()}-1</h4>
                                <p className="text-xs text-gray-400">Realizado em {new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <button className="text-[#0047BA] font-bold text-xs flex items-center hover:underline">
                                Ver detalhes <ChevronRight className="w-3 h-3 ml-1" />
                              </button>
                            </div>
                            
                            <div className="p-6 bg-gray-50/50">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-3 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-bold text-[#002699]">Entrega 1 de 1</span>
                                    {order.status === 'DELIVERED' ? (
                                      <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold px-2 py-0.5 rounded">Entregue</span>
                                    ) : (
                                      <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold px-2 py-0.5 rounded">Pronto para retirada</span>
                                    )}
                                  </div>
                                  <div className="flex items-start space-x-2 text-gray-700 text-sm">
                                    <Home className="w-4 h-4 mt-0.5" />
                                    <div>
                                      <p className="font-medium">Retirar - em até 1 hora</p>
                                      <p className="text-gray-500 text-xs">Vendido e entregue por Farmácia</p>
                                    </div>
                                  </div>
                                  
                                  <div className="pt-2">
                                    <p className="text-xs font-bold text-gray-900 mb-2">Itens do pedido</p>
                                    <div className="flex space-x-2">
                                      {order.items.map((item, idx) => (
                                        <div key={idx} className="w-10 h-10 bg-white border border-gray-200 rounded p-1 flex items-center justify-center">
                                          <img src={item.images[0]} alt="" className="max-w-full max-h-full object-contain" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="w-full md:w-auto flex justify-end">
                                  <button className="border border-[#0047BA] text-[#0047BA] font-bold px-6 py-2 rounded-full text-sm hover:bg-[#0047BA] hover:text-white transition-colors">
                                    Comprar novamente
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="px-6 py-4 flex justify-between items-center border-t border-gray-100">
                              <span className="font-bold text-sm text-gray-900">Total</span>
                              <span className="font-bold text-sm text-gray-900">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}



                {activeTab === 'loyalty' && (
                  <motion.div
                    key="loyalty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2 className="text-[#002699] font-bold text-lg mb-6">Evolução</h2>
                    <div className="border-b border-gray-100 mb-8" />
                    
                    <div className="bg-white border rounded-xl p-6 shadow-sm mb-10 border-gray-100 relative overflow-hidden">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-[#002699] font-bold text-sm">cliente AZUL</p>
                          <p className="text-gray-500 text-xs">Jan 2026</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#E65100] font-bold text-sm">cliente OURO</p>
                          <p className="text-gray-500 text-xs">Jun 2026</p>
                        </div>
                      </div>
                      
                      <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                        <div className="h-full bg-[#002699] rounded-full" style={{ width: '5%' }}></div>
                      </div>
                      
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-[#002699]">R$ 37,08</span>
                        <span className="text-gray-400">R$ 1200</span>
                      </div>
                    </div>

                    <h2 className="text-[#002699] font-bold text-lg mb-4">Benefícios programa de fidelidade Farmácia</h2>
                    <div className="border-b border-gray-100 mb-6" />

                    <p className="text-gray-400 text-xs mb-6">
                      <strong className="text-gray-500 font-bold block mb-1">Cliente Ouro</strong>
                      Ao se tornar cliente ouro, você poderá aproveitar os benefícios abaixo. Continue comprando conosco e desbloqueie essas vantagens!
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      {[
                        { title: 'Entrega rápida em todo o Brasil', desc: 'Frete grátis ilimitado a partir de R$ 99,00, em econômica, válido para televendas, site e app.' },
                        { title: 'Exames gratuitos', desc: 'Exames gratuitos de avaliação corporal, aferição de pressão, medição de glicemia e aplicação de injetáveis.' },
                        { title: 'Descontos exclusivos', desc: '10% de desconto em medicamentos genéricos de uso contínuo e 3% de desconto em outros medicamentos.' }
                      ].map((item, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl p-6 bg-gray-50/50 flex flex-col items-center text-center opacity-60">
                          <div className="bg-gray-300 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4 flex items-center">
                             <Award className="w-3 h-3 mr-1" /> Benefício Bloqueado
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{item.title}</p>
                          <p className="text-xs text-gray-400 mt-auto">{item.desc}</p>
                        </div>
                      ))}
                    </div>

                    <h2 className="text-[#002699] font-bold text-lg mb-4">Regulamento</h2>
                    <div className="border border-gray-200 rounded-lg p-4 flex justify-between items-center text-gray-600 text-sm hover:bg-gray-50 cursor-pointer">
                      <span className="flex items-center space-x-2">
                         <Repeat className="w-4 h-4" />
                         <span>Regulamento do programa</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </motion.div>
                )}

                {['subscriptions', 'auth'].includes(activeTab) && (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="py-12 text-center text-gray-500"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {activeTab === 'subscriptions' && <Repeat className="w-8 h-8 text-gray-300" />}
                      {activeTab === 'auth' && <Shield className="w-8 h-8 text-gray-300" />}
                    </div>
                    <p className="font-bold text-gray-700">Recurso em desenvolvimento</p>
                    <p className="text-sm mt-2">Esta funcionalidade será liberada em breve.</p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
