import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings as SettingsIcon, 
  TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign, 
  Plus, Search, Filter, MoreVertical, Edit, Trash2, X, QrCode, CreditCard, Printer 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MOCK_PRODUCTS } from '../lib/mockData';
import { useAuthStore } from '../lib/store';
import { collection, getDocs, deleteDoc, doc, updateDoc, setDoc, orderBy, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Order, UserProfile } from '../types';
import ProductModal from '../components/ProductModal';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSuccess: () => void;
}

function UserModal({ isOpen, onClose, user, onSuccess }: UserModalProps) {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    cpf: '',
    phone: '',
    role: 'CLIENT' as UserProfile['role']
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        cpf: user.cpf || '',
        phone: user.phone || '',
        role: user.role || 'CLIENT'
      });
    } else {
      setFormData({
        displayName: '',
        email: '',
        cpf: '',
        phone: '',
        role: 'CLIENT'
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: formData.displayName,
          cpf: formData.cpf,
          phone: formData.phone,
          role: formData.role
        });
      } else {
        // For new users, we create a Firestore document.
        // Note: This doesn't create an Auth user, but manages the profile.
        const newDocRef = doc(collection(db, 'users'));
        await setDoc(newDocRef, {
          ...formData,
          uid: newDocRef.id,
          loyaltyPoints: 0,
          createdAt: new Date().toISOString()
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      handleFirestoreError(error, user ? OperationType.UPDATE : OperationType.CREATE, user ? `users/${user.uid}` : 'users');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10"
          >
            <div className="p-8 bg-primary text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6" />
                <h2 className="text-xl font-black uppercase tracking-tighter">{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary"
                  required
                  disabled={!!user}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CPF</label>
                  <input 
                    type="text" 
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargo</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserProfile['role'] })}
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary"
                  >
                    <option value="CLIENT">Cliente</option>
                    <option value="ATENDENTE">Atendente</option>
                    <option value="FARMACEUTICO">Farmacêutico</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : (user ? 'Salvar Alterações' : 'Criar Usuário')}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const data = [
  { name: 'Seg', sales: 4000, profit: 2400 },
  { name: 'Ter', sales: 3000, profit: 1398 },
  { name: 'Qua', sales: 2000, profit: 9800 },
  { name: 'Qui', sales: 2780, profit: 3908 },
  { name: 'Sex', sales: 1890, profit: 4800 },
  { name: 'Sáb', sales: 2390, profit: 3800 },
  { name: 'Dom', sales: 3490, profit: 4300 },
];

function Overview() {
  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Vendas Hoje', value: 'R$ 12.450', change: '+12.5%', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', trend: 'up' },
          { label: 'Novos Clientes', value: '48', change: '+5.2%', icon: Users, color: 'text-blue-600 bg-blue-50', trend: 'up' },
          { label: 'Pedidos Pendentes', value: '12', change: '-2.4%', icon: ShoppingCart, color: 'text-rose-600 bg-rose-50', trend: 'down' },
          { label: 'Ticket Médio', value: 'R$ 158,40', change: '+8.1%', icon: TrendingUp, color: 'text-amber-600 bg-amber-50', trend: 'up' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-xl ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h4 className="text-xl font-black text-gray-900 tracking-tight">{stat.value}</h4>
              </div>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-black ${
              stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{stat.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Desempenho de Vendas</h3>
              <p className="text-xs font-bold text-gray-400">Acompanhamento semanal de faturamento</p>
            </div>
            <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-xl">
              <button className="px-3 py-1.5 text-[10px] font-black bg-white text-primary rounded-lg shadow-sm uppercase tracking-widest">Semanal</button>
              <button className="px-3 py-1.5 text-[10px] font-black text-gray-400 hover:text-gray-600 rounded-lg uppercase tracking-widest">Mensal</button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A651" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00A651" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} 
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ stroke: '#00A651', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '12px 16px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#00A651" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  strokeWidth={4} 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
          <div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Mais Vendidos</h3>
            <p className="text-xs font-bold text-gray-400">Produtos com maior saída</p>
          </div>
          <div className="space-y-4">
            {MOCK_PRODUCTS.slice(0, 5).map((product, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all group border border-transparent hover:border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl p-2 border border-gray-100 group-hover:border-primary/20 transition-colors shrink-0">
                    <img src={product.images[0]} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-900 line-clamp-1 uppercase tracking-tight">{product.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{product.category}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-primary tracking-tighter">R$ {product.price.toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">124 un</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors border-t border-gray-50 pt-6 flex items-center justify-center space-x-2">
            <span>Ver Relatório Completo</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PDV' | 'ONLINE'>('ALL');
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const { user } = useAuthStore();

  const handlePrint = (order: Order) => {
    setSelectedOrderForPrint(order);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      fetchOrders();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'PDV') return o.isPdv;
    if (filter === 'ONLINE') return !o.isPdv;
    return true;
  });

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'CASH': return <DollarSign className="w-3 h-3" />;
      case 'PIX': return <QrCode className="w-3 h-3" />;
      default: return <CreditCard className="w-3 h-3" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Gerenciar Pedidos</h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg">
            {(['ALL', 'PDV', 'ONLINE'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-[10px] font-black rounded-md uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {f === 'ALL' ? 'Todos' : f}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <button className="p-2 text-gray-400 hover:text-primary transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">ID Pedido</th>
              <th className="px-6 py-4">Origem</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Pagamento</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400 font-bold text-xs">Carregando...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400 font-bold text-xs">Nenhum pedido encontrado.</td></tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                    {order.operatorName && (
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Op: {order.operatorName}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${
                      order.isPdv ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {order.isPdv ? 'PDV' : 'Online'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-bold">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-600">
                      <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                        {getPaymentIcon(order.paymentMethod)}
                      </div>
                      <span className="uppercase tracking-widest text-[10px]">{order.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-gray-900">R$ {order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${
                      order.status === 'DELIVERED' || order.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                      order.status === 'CANCELLED' ? 'bg-rose-100 text-rose-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <select 
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value as Order['status'])}
                        className="text-[10px] font-bold bg-gray-50 border-none rounded-lg py-1 px-2 focus:ring-2 focus:ring-primary"
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="APPROVED">Aprovado</option>
                        <option value="SHIPPED">Enviado</option>
                        <option value="DELIVERED">Entregue</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                      <button 
                        onClick={() => handlePrint(order)}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                        title="Imprimir Cupom"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Hidden Print Section */}
      <div id="print-receipt" className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 font-mono text-[10px] leading-tight text-black">
        {selectedOrderForPrint && (
          <div className="w-full max-w-[80mm] mx-auto">
            <div className="text-center mb-4 space-y-1">
              <p className="font-black text-sm uppercase">Farmácia São José</p>
              <p>CNPJ: 12.345.678/0001-90</p>
              <p>AV. BRASIL, 1500 - CENTRO</p>
              <p>SÃO JOSÉ DOS CAMPOS - SP</p>
              <p className="border-b border-dashed border-black py-1">------------------------------------------</p>
              <p className="font-black py-1">CUPOM FISCAL ELETRÔNICO - NFC-e</p>
              <p className="border-b border-dashed border-black pb-1">------------------------------------------</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-black uppercase">
                <span className="w-8">QTD</span>
                <span className="flex-grow px-2">DESCRIÇÃO</span>
                <span>TOTAL</span>
              </div>
              <p className="border-b border-dashed border-black">------------------------------------------</p>
              {selectedOrderForPrint.items.map((item: any, idx: number) => (
                <div key={idx} className="py-1">
                  <div className="flex justify-between items-start">
                    <span className="w-8">{item.quantity} UN</span>
                    <span className="flex-grow px-2 uppercase">{item.name}</span>
                    <span className="font-black">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <p className="text-[8px] opacity-70 ml-8">V. UNIT: R$ {item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-2 border-t border-dashed border-black space-y-1">
              <div className="flex justify-between font-black text-xs">
                <span>TOTAL BRUTO</span>
                <span>R$ {selectedOrderForPrint.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>FORMA PAGTO.</span>
                <span className="font-black uppercase">{selectedOrderForPrint.paymentMethod}</span>
              </div>
            </div>

            <div className="mt-6 text-center space-y-2">
              <p className="border-b border-dashed border-black pb-2">------------------------------------------</p>
              {selectedOrderForPrint.customerCpf ? (
                <p className="font-black">CPF DO CONSUMIDOR: {selectedOrderForPrint.customerCpf}</p>
              ) : (
                <p>CONSUMIDOR NÃO IDENTIFICADO</p>
              )}
              <p className="text-[8px]">DATA: {new Date(selectedOrderForPrint.createdAt).toLocaleString()}</p>
              <p className="text-[8px]">OPERADOR: {selectedOrderForPrint.operatorName || 'SISTEMA'}</p>
              <p className="pt-4 font-black">OBRIGADO PELA PREFERÊNCIA!</p>
              <div className="pt-4 flex justify-center">
                <QrCode className="w-16 h-16" />
              </div>
              <p className="text-[7px] opacity-50">Consulte pela Chave de Acesso em:</p>
              <p className="text-[7px] opacity-50">www.nfe.fazenda.gov.br/portal</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'CLIENTS'>('EMPLOYEES');
  const { user: currentUser } = useAuthStore();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersData);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'CLIENTS') {
      return matchesSearch && u.role === 'CLIENT';
    } else {
      return matchesSearch && u.role !== 'CLIENT';
    }
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Gestão de Usuários</h2>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setActiveTab('EMPLOYEES')}
              className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'EMPLOYEES' ? 'text-primary border-b-2 border-primary pb-1' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Funcionários
            </button>
            <button 
              onClick={() => setActiveTab('CLIENTS')}
              className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CLIENTS' ? 'text-primary border-b-2 border-primary pb-1' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Clientes
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border-none rounded-lg py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-primary w-full sm:w-48"
            />
          </div>
          <button 
            onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
            className="bg-primary text-white font-black px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest flex items-center whitespace-nowrap hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-2" /> Novo Usuário
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">E-mail</th>
              <th className="px-6 py-4">CPF</th>
              <th className="px-6 py-4">Cargo</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-bold text-xs">Carregando usuários...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-bold text-xs">Nenhum usuário encontrado.</td></tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-xs">
                        {u.displayName.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-gray-900">{u.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-bold">{u.email}</td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-bold">{u.cpf || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${
                      u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-600' :
                      u.role === 'FARMACEUTICO' ? 'bg-blue-100 text-blue-600' :
                      u.role === 'ATENDENTE' ? 'bg-orange-100 text-orange-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => { setSelectedUser(u); setIsModalOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={selectedUser} 
        onSuccess={fetchUsers} 
      />
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        fetchProducts();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'products');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Catálogo de Produtos</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border-none rounded-lg py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-primary w-full sm:w-48"
            />
          </div>
          <button 
            onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
            className="bg-primary text-white font-black px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest flex items-center whitespace-nowrap hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-2" /> Novo Produto
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">Produto</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Preço</th>
              <th className="px-6 py-4">Estoque</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-bold text-xs">Carregando produtos...</td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-bold text-xs">Nenhum produto encontrado.</td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg p-1 shrink-0 border border-gray-100">
                        <img src={product.images[0]} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-xs font-bold text-gray-900 line-clamp-2">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-bold">{product.category}</td>
                  <td className="px-6 py-4 text-xs font-black text-gray-900 whitespace-nowrap">
                    R$ {product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${Math.min((product.stock / 200) * 100, 100)}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{product.stock}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider">Ativo</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={selectedProduct} 
        onSuccess={fetchProducts} 
      />
    </div>
  );
}

function Settings() {
  return (
    <div className="max-w-4xl space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
        <div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Configurações da Loja</h3>
          <p className="text-xs font-bold text-gray-400">Gerencie as informações gerais da sua unidade</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome da Unidade</label>
            <input type="text" defaultValue="Farmácia São José - Matriz" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CNPJ</label>
            <input type="text" defaultValue="12.345.678/0001-90" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail de Contato</label>
            <input type="email" defaultValue="contato@farmaciasaojose.com.br" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefone</label>
            <input type="text" defaultValue="(11) 4002-8922" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-50 flex justify-end">
          <button className="bg-primary text-white font-black px-8 py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Salvar Alterações
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
        <div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Parâmetros do PDV</h3>
          <p className="text-xs font-bold text-gray-400">Configure o comportamento do ponto de venda</p>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Exigir CPF na nota', desc: 'Sempre solicitar identificação do cliente no início da venda', active: true },
            { label: 'Impressão automática', desc: 'Imprimir cupom fiscal imediatamente após o pagamento', active: false },
            { label: 'Controle de estoque rigoroso', desc: 'Impedir vendas de produtos sem saldo em estoque', active: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.label}</p>
                <p className="text-[10px] font-bold text-gray-400">{item.desc}</p>
              </div>
              <button className={`w-12 h-6 rounded-full transition-all relative ${item.active ? 'bg-primary' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.active ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthReady } = useAuthStore();

  useEffect(() => {
    if (isAuthReady && (!user || (user.role !== 'ADMIN' && user.role !== 'FARMACEUTICO' && user.role !== 'ATENDENTE'))) {
      navigate('/');
    }
  }, [user, isAuthReady, navigate]);

  if (!isAuthReady || !user || (user.role !== 'ADMIN' && user.role !== 'FARMACEUTICO' && user.role !== 'ATENDENTE')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const menuItems = [
    { label: 'Visão Geral', icon: LayoutDashboard, path: '/dashboard', roles: ['ADMIN'] },
    { label: 'Produtos', icon: Package, path: '/dashboard/products', roles: ['ADMIN', 'FARMACEUTICO'] },
    { label: 'Pedidos', icon: ShoppingCart, path: '/dashboard/orders', roles: ['ADMIN', 'FARMACEUTICO', 'ATENDENTE'] },
    { label: 'Usuários', icon: Users, path: '/dashboard/users', roles: ['ADMIN'] },
    { label: 'Configurações', icon: SettingsIcon, path: '/dashboard/settings', roles: ['ADMIN'] },
  ].filter(item => item.roles.includes(user.role));

  const currentItem = menuItems.find(item => item.path === location.pathname) || menuItems[0];

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">SJ</div>
            <span className="font-display font-black text-gray-900 tracking-tight">PAINEL ADMIN</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-4">Menu Principal</p>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all group ${
                location.pathname === item.path 
                  ? 'bg-primary/5 text-primary' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${
                location.pathname === item.path ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
              }`} />
              <span className="text-sm">{item.label}</span>
              {location.pathname === item.path && (
                <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary font-black text-xs border border-gray-100">
                {user.displayName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-gray-900 truncate">{user.displayName}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center"
            >
              Voltar para Loja
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-display font-black text-gray-900">{currentItem?.label}</h1>
            <div className="h-4 w-px bg-gray-100" />
            <p className="text-xs font-bold text-gray-400">Dashboard / {currentItem?.label}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Pesquisa global..." 
                className="bg-gray-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary w-64"
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-primary transition-colors relative">
              <div className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-white" />
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Routes>
            <Route index element={user.role === 'ADMIN' ? <Overview /> : <Navigate to={menuItems[0]?.path || '/'} />} />
            <Route path="products" element={user.role === 'ADMIN' || user.role === 'FARMACEUTICO' ? <Products /> : <Navigate to="/dashboard" />} />
            <Route path="orders" element={<Orders />} />
            <Route path="users" element={user.role === 'ADMIN' ? <UserManagement /> : <Navigate to="/dashboard" />} />
            <Route path="settings" element={user.role === 'ADMIN' ? <Settings /> : <Navigate to="/dashboard" />} />
            <Route path="*" element={<div className="bg-white p-12 rounded-xl border border-gray-100 text-center text-gray-400 font-bold text-sm">Em breve...</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
