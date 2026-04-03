import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, MapPin, ShoppingBag, Shield, 
  Save, Plus, Trash2, Package, Clock, 
  CheckCircle2, XCircle, Truck, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../lib/store';
import { doc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order } from '../types';

type Tab = 'data' | 'address' | 'orders' | 'security';

export default function Account() {
  const { user, setUser, isAuthReady } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'data';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab;
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    cpf: user?.cpf || '',
    phone: user?.phone || '',
  });

  const [addressData, setAddressData] = useState({
    street: user?.address?.street || '',
    number: user?.address?.number || '',
    complement: user?.address?.complement || '',
    neighborhood: user?.address?.neighborhood || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
  });

  useEffect(() => {
    if (isAuthReady && !user) {
      navigate('/login');
    }
  }, [user, isAuthReady, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName,
        email: user.email,
        cpf: user.cpf || '',
        phone: user.phone || '',
      });
      setAddressData({
        street: user.address?.street || '',
        number: user.address?.number || '',
        complement: user.address?.complement || '',
        neighborhood: user.address?.neighborhood || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || '',
      });

      if (activeTab === 'orders') {
        fetchOrders();
      }
    }
  }, [user, activeTab]);

  const fetchOrders = async () => {
    if (!user) return;
    setIsLoadingOrders(true);
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), formData);
      setUser({ ...user, ...formData });
      alert('Dados atualizados com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { address: addressData });
      setUser({ ...user, address: addressData });
      alert('Endereço atualizado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthReady || !user) return null;

  const tabs = [
    { id: 'data', label: 'Meus Dados', icon: User, desc: 'Informações pessoais e contato' },
    { id: 'address', label: 'Endereço', icon: MapPin, desc: 'Local de entrega dos pedidos' },
    { id: 'orders', label: 'Meus Pedidos', icon: ShoppingBag, roles: ['CLIENT'], desc: 'Histórico e rastreamento' },
    { id: 'security', label: 'Segurança', icon: Shield, desc: 'Senha e privacidade' },
  ].filter(t => !t.roles || t.roles.includes(user.role));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'APPROVED': return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      case 'SHIPPED': return <Truck className="w-5 h-5 text-purple-500" />;
      case 'DELIVERED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'CANCELLED': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Aguardando Pagamento';
      case 'APPROVED': return 'Pagamento Aprovado';
      case 'SHIPPED': return 'Em Transporte';
      case 'DELIVERED': return 'Entregue';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <aside className="lg:w-72 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-display font-black text-gray-900">{user.displayName}</h2>
            <p className="text-sm text-gray-400 mb-4">{user.email}</p>
            <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              {user.role}
            </span>
          </div>

          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold transition-all group ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                    : 'text-gray-500 hover:bg-white hover:text-primary'
                }`}
              >
                <div className={`p-2 rounded-lg ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-primary/10'}`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm leading-tight">{tab.label}</p>
                  <p className={`text-[10px] font-medium opacity-60 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>{tab.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'data' && (
              <motion.div
                key="data"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-sm border border-gray-100"
              >
                <h3 className="text-2xl font-display font-black text-gray-900 mb-8">Informações Pessoais</h3>
                <form onSubmit={handleSaveData} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
                    <input 
                      type="text" 
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">E-mail</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      disabled
                      className="w-full bg-gray-100 border-none rounded-2xl py-4 px-6 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">CPF</label>
                    <input 
                      type="text" 
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Telefone</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2 pt-4">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="bg-primary text-white font-black px-12 py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : <><Save className="w-5 h-5 mr-2" /> Salvar Alterações</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'address' && (
              <motion.div
                key="address"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-sm border border-gray-100"
              >
                <h3 className="text-2xl font-display font-black text-gray-900 mb-8">Endereço de Entrega</h3>
                <form onSubmit={handleSaveAddress} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Rua / Logradouro</label>
                    <input 
                      type="text" 
                      value={addressData.street}
                      onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Número</label>
                    <input 
                      type="text" 
                      value={addressData.number}
                      onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Complemento</label>
                    <input 
                      type="text" 
                      value={addressData.complement}
                      onChange={(e) => setAddressData({ ...addressData, complement: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Bairro</label>
                    <input 
                      type="text" 
                      value={addressData.neighborhood}
                      onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">CEP</label>
                    <input 
                      type="text" 
                      value={addressData.zipCode}
                      onChange={(e) => setAddressData({ ...addressData, zipCode: e.target.value })}
                      placeholder="00000-000"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Cidade</label>
                    <input 
                      type="text" 
                      value={addressData.city}
                      onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Estado</label>
                    <select 
                      value={addressData.state}
                      onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Selecione</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3 pt-4">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="bg-primary text-white font-black px-12 py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : <><Save className="w-5 h-5 mr-2" /> Salvar Endereço</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-display font-black text-gray-900 uppercase tracking-tighter">Meus Pedidos</h3>
                      <p className="text-xs font-bold text-gray-400">Acompanhe o status das suas compras</p>
                    </div>
                    <div className="bg-gray-50 px-4 py-2 rounded-xl">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Pedidos: </span>
                      <span className="text-sm font-black text-primary">{orders.length}</span>
                    </div>
                  </div>

                  {isLoadingOrders ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Carregando histórico...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-20 space-y-6">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                        <ShoppingBag className="w-12 h-12 text-gray-200" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-gray-900 uppercase tracking-tight">Nenhum pedido encontrado</p>
                        <p className="text-sm text-gray-400 mt-1">Você ainda não realizou compras em nossa loja online.</p>
                      </div>
                      <button 
                        onClick={() => navigate('/')}
                        className="bg-primary text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all uppercase tracking-widest text-xs"
                      >
                        Começar a comprar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {orders.map((order) => (
                        <div key={order.id} className="group border-2 border-gray-50 hover:border-primary/20 rounded-[2rem] overflow-hidden transition-all hover:shadow-xl hover:shadow-primary/5">
                          <div className="bg-gray-50/50 px-8 py-6 flex flex-wrap items-center justify-between gap-6 border-b border-gray-50">
                            <div className="flex items-center space-x-8">
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pedido</p>
                                <p className="text-sm font-black text-gray-900 tracking-tight">#{order.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data</p>
                                <p className="text-sm font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                                <p className="text-sm font-black text-primary tracking-tighter">R$ {order.total.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100">
                              {getStatusIcon(order.status)}
                              <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{getStatusLabel(order.status)}</span>
                            </div>
                          </div>
                          <div className="p-8">
                            <div className="space-y-6">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group/item">
                                  <div className="flex items-center space-x-6">
                                    <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm group-hover/item:border-primary/20 transition-colors">
                                      <img src={item.images[0]} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1">{item.name}</p>
                                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        {item.quantity} UN <span className="mx-2">•</span> R$ {item.price.toFixed(2)} cada
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-black text-gray-900 tracking-tighter">R$ {(item.price * item.quantity).toFixed(2)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Order Tracking Progress */}
                            <div className="mt-10 pt-10 border-t border-gray-50">
                              <div className="relative flex justify-between">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0" />
                                <div 
                                  className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-1000" 
                                  style={{ 
                                    width: order.status === 'PENDING' ? '0%' : 
                                           order.status === 'APPROVED' ? '33%' : 
                                           order.status === 'SHIPPED' ? '66%' : 
                                           order.status === 'DELIVERED' ? '100%' : '0%' 
                                  }} 
                                />
                                {[
                                  { label: 'Pedido Realizado', status: 'PENDING' },
                                  { label: 'Pagamento Aprovado', status: 'APPROVED' },
                                  { label: 'Em Transporte', status: 'SHIPPED' },
                                  { label: 'Entregue', status: 'DELIVERED' }
                                ].map((step, i) => {
                                  const isActive = order.status === step.status || 
                                    (order.status === 'APPROVED' && i < 1) ||
                                    (order.status === 'SHIPPED' && i < 2) ||
                                    (order.status === 'DELIVERED' && i < 3);
                                  const isCurrent = order.status === step.status;

                                  return (
                                    <div key={i} className="relative z-10 flex flex-col items-center">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-4 ${
                                        isCurrent ? 'bg-primary border-primary/20 scale-125 shadow-lg shadow-primary/20' :
                                        isActive ? 'bg-primary border-white' : 'bg-white border-gray-100'
                                      }`}>
                                        {isActive ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-2 h-2 bg-gray-200 rounded-full" />}
                                      </div>
                                      <p className={`text-[9px] font-black uppercase tracking-widest mt-3 whitespace-nowrap ${
                                        isActive ? 'text-primary' : 'text-gray-400'
                                      }`}>
                                        {step.label}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="mt-10 flex items-center justify-between pt-6 border-t border-gray-50">
                              <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Atualizado em {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <button className="bg-gray-50 text-gray-900 font-black px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest flex items-center hover:bg-gray-100 transition-all border border-gray-100">
                                Detalhes Completos <ChevronRight className="w-4 h-4 ml-2" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-sm border border-gray-100"
              >
                <h3 className="text-2xl font-display font-black text-gray-900 mb-8">Segurança da Conta</h3>
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Alterar Senha</p>
                        <p className="text-xs text-gray-400">Recomendamos trocar sua senha a cada 3 meses.</p>
                      </div>
                    </div>
                    <button className="bg-white text-gray-900 font-bold px-6 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                      Alterar
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm">
                        <Trash2 className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Excluir Conta</p>
                        <p className="text-xs text-gray-400">Esta ação é irreversível e apagará todos os seus dados.</p>
                      </div>
                    </div>
                    <button className="bg-white text-secondary font-bold px-6 py-2 rounded-xl text-sm border border-gray-200 hover:bg-red-50 transition-colors">
                      Excluir
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
