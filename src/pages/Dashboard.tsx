import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings as SettingsIcon, 
  TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign, 
  Plus, Search, Filter, MoreVertical, Edit, Trash2, X, QrCode, CreditCard, Printer, 
  CheckCircle2, XCircle, ExternalLink, RefreshCw, AlertCircle, Copy,
  Image, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MOCK_PRODUCTS } from '../lib/mockData';
import { useAuthStore, useSettingsStore, DEFAULT_BANNERS } from '../lib/store';
import { supabase, mapProductFromDb, mapUserFromDb, mapOrderFromDb, handleSupabaseError, seedProducts } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
        const { error } = await supabase.from('users').update({
          display_name: formData.displayName,
          cpf: formData.cpf,
          phone: formData.phone,
          role: formData.role
        }).eq('id', user.uid);
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (error) {
      handleSupabaseError(error, user ? 'UPDATE' : 'INSERT', 'users');
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

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

function ConfirmationDialog({ 
  isOpen, onClose, onConfirm, title, message, 
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  isDestructive = true 
}: ConfirmationDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
            className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 p-8 text-center"
          >
            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-primary/5 text-primary'}`}>
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">{title}</h3>
            <p className="text-sm font-bold text-gray-400 mb-8 leading-relaxed">{message}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={onClose}
                className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all border border-gray-100"
              >
                {cancelLabel}
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:scale-[1.02] ${isDestructive ? 'bg-rose-600 shadow-rose-600/20' : 'bg-primary shadow-primary/20'}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Overview() {
  return (
    <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
      <div className="w-20 h-20 bg-gray-50 rounded-2xl mx-auto flex items-center justify-center mb-6">
        <TrendingUp className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Painel de Métricas</h3>
      <p className="text-gray-400 font-medium">Os gráficos e estatísticas de faturamento serão exibidos aqui à medida que o sistema registrar vendas reais.</p>
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
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders((data || []).map(mapOrderFromDb) as Order[]);
    } catch (error) {
      handleSupabaseError(error, 'SELECT', 'orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      fetchOrders();
    } catch (error) {
      handleSupabaseError(error, 'UPDATE', `orders/${orderId}`);
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
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      setUsers((data || []).map(mapUserFromDb) as UserProfile[]);
    } catch (error) {
      handleSupabaseError(error, 'SELECT', 'users');
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
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const { data: products = [], isLoading: loading, isError, error: fetchError, refetch: fetchProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return (data || []).map(mapProductFromDb) as Product[];
    }
  });

  const handleCopyProduct = (product: Product) => {
    const copy = { ...product, id: '' };
    setSelectedProduct(copy);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (error) {
      handleSupabaseError(error, 'DELETE', `products/${id}`);
    }
  };

  const handleResetCatalog = async () => {
    setResetting(true);
    try {
      await seedProducts();
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch(e) {
      console.error(e);
      alert('Erro ao resetar catálogo.');
    } finally {
      setResetting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (a.category < b.category) return -1;
    if (a.category > b.category) return 1;
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });

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
              <th className="px-4 py-4 w-12 text-center">#</th>
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
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400 font-bold text-xs">Carregando produtos...</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-rose-500 font-black text-xs uppercase tracking-widest bg-rose-50/50">
                  <div className="flex flex-col items-center space-y-2">
                    <AlertCircle className="w-6 h-6" />
                    <span>Erro ao carregar: Limite de cota atingido (Quota Exceeded)</span>
                    <p className="text-[10px] text-rose-400 font-bold normal-case">Os limites de consulta gratuita do Firebase foram excedidos por hoje.</p>
                  </div>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400 font-bold text-xs">Nenhum produto encontrado.</td>
              </tr>
            ) : (
              filteredProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-4 text-center text-xs font-bold text-gray-400">
                    {index + 1}
                  </td>
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
                    {product.isWeeklyOffer && (
                      <span className="ml-2 bg-red-100 text-red-600 text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">Oferta</span>
                    )}
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
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleCopyProduct(product)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                        title="Copiar"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(product.id)}
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

      <ConfirmationDialog 
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Excluir Produto"
        message="Esta ação não pode ser desfeita. O produto será removido permanentemente do catálogo."
        confirmLabel="Excluir Agora"
      />

      <ConfirmationDialog 
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetCatalog}
        title="Resetar Catálogo"
        message="Isso apagará todos os produtos atuais e recarregará os 18 itens oficiais. Deseja continuar?"
        confirmLabel="Resetar Agora"
      />
    </div>
  );
}

function Settings() {
  const [mpStatus, setMpStatus] = useState<{ connected: boolean; source?: string; userId?: string; publicKey?: string; updatedAt?: string }>({ connected: false });
  const [loading, setLoading] = useState(false);
  const { settings, updateSettings, fetchSettings, saveSettings, isLoading: localLoading } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const checkMpStatus = async () => {
    try {
      // Use server API to check status (works with env vars AND database)
      const response = await fetch('/api/mercadopago/status');
      if (response.ok) {
        const data = await response.json();
        setMpStatus(data);
      }
    } catch (error) {
      console.error('Error checking MP status:', error);
    }
  };

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    fetchSettings();
    checkMpStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MERCADOPAGO_AUTH_SUCCESS') {
        checkMpStatus();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/mercadopago/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        url,
        'mercadopago_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Erro ao iniciar conexão com Mercado Pago. Verifique se o CLIENT_ID está configurado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await saveSettings(localSettings);
      alert('Configurações da loja salvas com sucesso no banco de dados!');
    } catch (error) {
      alert('Erro ao salvar configurações. Verifique o console.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({ ...localSettings, aboutImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newBanners = [...(localSettings.banners || [])];
        newBanners[index] = { ...newBanners[index], image: reader.result as string };
        setLocalSettings({ ...localSettings, banners: newBanners });
      };
      reader.readAsDataURL(file);
    }
  };

  const addBanner = () => {
    const newBanner = {
      title: "Novo Banner",
      subtitle: "Descrição do banner",
      image: "",
      color: "from-green-600 to-green-400",
      badge: "Novidade",
      primaryButtonText: "Ver Ofertas",
      primaryButtonLink: "/catalog",
      primaryButtonVisible: true,
      secondaryButtonText: "Cadastre-se",
      secondaryButtonLink: "/register",
      secondaryButtonVisible: true
    };
    setLocalSettings({ ...localSettings, banners: [...(localSettings.banners || []), newBanner] });
  };

  const removeBanner = (index: number) => {
    const newBanners = (localSettings.banners || []).filter((_, i) => i !== index);
    setLocalSettings({ ...localSettings, banners: newBanners });
  };

  const updateBanner = (index: number, field: string, value: string) => {
    const newBanners = [...(localSettings.banners || [])];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setLocalSettings({ ...localSettings, banners: newBanners });
  };

  const restoreDefaultBanners = () => {
    if (window.confirm('Deseja restaurar todos os banners originais da loja? Isso substituirá seus banners atuais.')) {
      setLocalSettings({ ...localSettings, banners: DEFAULT_BANNERS });
      alert('Banners originais carregados na visualização! Salve as alterações para aplicar ao site.');
    }
  };

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
            <input 
              type="text" 
              value={localSettings.name}
              onChange={(e) => setLocalSettings({...localSettings, name: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CNPJ</label>
            <input 
              type="text" 
              value={localSettings.cnpj}
              onChange={(e) => setLocalSettings({...localSettings, cnpj: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail de Contato</label>
            <input 
              type="email" 
              value={localSettings.email}
              onChange={(e) => setLocalSettings({...localSettings, email: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefone / WhatsApp</label>
            <input 
              type="text" 
              value={localSettings.phone}
              onChange={(e) => setLocalSettings({...localSettings, phone: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Endereço Completo</label>
            <input 
              type="text" 
              value={localSettings.address}
              onChange={(e) => setLocalSettings({...localSettings, address: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Horário (Seg a Sáb)</label>
            <input 
              type="text" 
              value={localSettings.hoursWeekday}
              onChange={(e) => setLocalSettings({...localSettings, hoursWeekday: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Horário (Dom e Feriados)</label>
            <input 
              type="text" 
              value={localSettings.hoursWeekend}
              onChange={(e) => setLocalSettings({...localSettings, hoursWeekend: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Anos de História</label>
            <input 
              type="text" 
              value={localSettings.yearsOfHistory}
              onChange={(e) => setLocalSettings({...localSettings, yearsOfHistory: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
              placeholder="Ex: 15+"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clientes Felizes</label>
            <input 
              type="text" 
              value={localSettings.happyClients}
              onChange={(e) => setLocalSettings({...localSettings, happyClients: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary" 
              placeholder="Ex: 10k+"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Texto "Sobre Nós"</label>
            <textarea 
              value={localSettings.aboutText}
              onChange={(e) => setLocalSettings({...localSettings, aboutText: e.target.value})}
              rows={4}
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-primary resize-none" 
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Foto "Sobre Nós"</label>
            <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
              {localSettings.aboutImage ? (
                <div className="relative group shrink-0">
                  <img 
                    src={localSettings.aboutImage} 
                    className="w-32 h-32 object-cover rounded-3xl shadow-lg border-4 border-white" 
                    alt="Preview" 
                  />
                  <button 
                    onClick={() => setLocalSettings({...localSettings, aboutImage: ''})}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                  <Image className="w-8 h-8 text-gray-200" />
                </div>
              )}
              
              <div className="flex-1 space-y-3">
                <div className="flex flex-col gap-1">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight">Anexar Imagem</h4>
                  <p className="text-[10px] font-bold text-gray-400">Arraste uma foto ou clique no botão abaixo para selecionar</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => document.getElementById('aboutImageInput')?.click()}
                    className="bg-white border border-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Selecionar Arquivo
                  </button>
                  <input 
                    id="aboutImageInput"
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">PNG, JPG ou WEBP (Max 2MB)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Banners do Carrossel</h3>
              <p className="text-xs font-bold text-gray-400">Configure os banners que aparecem no topo da página inicial</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={restoreDefaultBanners}
                className="bg-gray-50 text-gray-600 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2 border border-gray-100 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Padrão
              </button>
              <button 
                onClick={() => {
                  addBanner();
                  alert('Banner adicionado ao final da lista!');
                }}
                className="bg-green-50 text-green-700 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest hover:bg-green-100 transition-all flex items-center gap-2 border border-green-100 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Banner
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(localSettings.banners || []).map((banner, index) => (
              <div key={index} className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-gray-400 border border-gray-100">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{banner.title || 'Sem Título'}</h4>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-white border border-gray-100 text-gray-500`}>
                        {banner.badge}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeBanner(index)}
                    className="text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Título Principal</label>
                    <input 
                      type="text"
                      value={banner.title}
                      onChange={(e) => updateBanner(index, 'title', e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-xl py-2 px-4 text-xs font-bold focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Subtítulo / Descrição</label>
                    <input 
                      type="text"
                      value={banner.subtitle}
                      onChange={(e) => updateBanner(index, 'subtitle', e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-xl py-2 px-4 text-xs font-bold focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Etiqueta (Badge)</label>
                    <input 
                      type="text"
                      value={banner.badge}
                      onChange={(e) => updateBanner(index, 'badge', e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-xl py-2 px-4 text-xs font-bold focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Imagem do Banner</label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {banner.image ? <img src={banner.image} className="w-full h-full object-cover" /> : <Image className="w-4 h-4 text-gray-300" />}
                      </div>
                      <button 
                        type="button"
                        onClick={() => document.getElementById(`bannerInput-${index}`)?.click()}
                        className="bg-white border border-gray-200 text-gray-600 font-bold px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                      >
                        Carregar Foto
                      </button>
                      <input 
                        id={`bannerInput-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBannerFileChange(index, e)}
                        className="hidden"
                      />
                      <span className="text-[8px] text-gray-300 font-bold max-w-[120px] truncate">
                        {banner.image.startsWith('data:') ? 'Imagem Local' : banner.image}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gradiente de Cor</label>
                    <select 
                      value={banner.color}
                      onChange={(e) => updateBanner(index, 'color', e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-xl py-2 px-4 text-xs font-bold focus:ring-1 focus:ring-primary appearance-none"
                    >
                      <option value="from-green-600 to-green-400">Verde</option>
                      <option value="from-blue-600 to-blue-400">Azul</option>
                      <option value="from-orange-600 to-orange-400">Laranja</option>
                      <option value="from-pink-500 to-rose-400">Rosa</option>
                      <option value="from-purple-600 to-indigo-400">Roxo</option>
                      <option value="from-gray-800 to-gray-600">Escuro</option>
                    </select>
                  </div>

                  {/* Configuração dos Botões */}
                  <div className="sm:col-span-2 lg:col-span-3 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {/* Botão Primário */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Botão Principal</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id={`primaryVisible-${index}`}
                            checked={banner.primaryButtonVisible !== false}
                            onChange={(e) => {
                              const newBanners = [...(localSettings.banners || [])];
                              newBanners[index] = { ...newBanners[index], primaryButtonVisible: e.target.checked };
                              setLocalSettings({ ...localSettings, banners: newBanners });
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary w-3 h-3"
                          />
                          <label htmlFor={`primaryVisible-${index}`} className="text-[8px] font-bold text-gray-400 uppercase">Visível</label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Texto</span>
                          <input 
                            type="text"
                            value={banner.primaryButtonText || ''}
                            onChange={(e) => updateBanner(index, 'primaryButtonText', e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-[10px] font-bold focus:ring-1 focus:ring-primary"
                            placeholder="Ver Ofertas"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Link</span>
                          <input 
                            type="text"
                            value={banner.primaryButtonLink || ''}
                            onChange={(e) => updateBanner(index, 'primaryButtonLink', e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-[10px] font-bold focus:ring-1 focus:ring-primary"
                            placeholder="/catalog"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Botão Secundário */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Botão Secundário</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id={`secondaryVisible-${index}`}
                            checked={banner.secondaryButtonVisible !== false}
                            onChange={(e) => {
                              const newBanners = [...(localSettings.banners || [])];
                              newBanners[index] = { ...newBanners[index], secondaryButtonVisible: e.target.checked };
                              setLocalSettings({ ...localSettings, banners: newBanners });
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary w-3 h-3"
                          />
                          <label htmlFor={`secondaryVisible-${index}`} className="text-[8px] font-bold text-gray-400 uppercase">Visível</label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Texto</span>
                          <input 
                            type="text"
                            value={banner.secondaryButtonText || ''}
                            onChange={(e) => updateBanner(index, 'secondaryButtonText', e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-[10px] font-bold focus:ring-1 focus:ring-primary"
                            placeholder="Cadastre-se"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Link</span>
                          <input 
                            type="text"
                            value={banner.secondaryButtonLink || ''}
                            onChange={(e) => updateBanner(index, 'secondaryButtonLink', e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-[10px] font-bold focus:ring-1 focus:ring-primary"
                            placeholder="/register"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Configuração dos Botões */}
                  <div className="sm:col-span-3 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {/* Botão Primário */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Botão Principal</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id={`primaryVisible-${index}`}
                            checked={banner.primaryButtonVisible !== false}
                            onChange={(e) => updateBanner(index, 'primaryButtonVisible', e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary w-3 h-3"
                          />
                          <label htmlFor={`primaryVisible-${index}`} className="text-[8px] font-bold text-gray-400 uppercase">Visível</label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Texto</span>
                          <input 
                            type="text"
                            value={banner.primaryButtonText || ''}
                            onChange={(e) => updateBanner(index, 'primaryButtonText', e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-[10px] font-bold focus:ring-1 focus:ring-primary"
                            placeholder="Ver Ofertas"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Link</span>
                          <input 
                            type="text"
                            value={banner.primaryButtonLink || ''}
                            onChange={(e) => updateBanner(index, 'primaryButtonLink', e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-[10px] font-bold focus:ring-1 focus:ring-primary"
                            placeholder="/catalog"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Botão Secundário */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Botão Secundário</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id={`secondaryVisible-${index}`}
                            checked={banner.secondaryButtonVisible !== false}
                            onChange={(e) => updateBanner(index, 'secondaryButtonVisible', e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary w-3 h-3"
                          />
                          <label htmlFor={`secondaryVisible-${index}`} className="text-[8px] font-bold text-gray-400 uppercase">Visível</label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Texto</span>
                          <input 
                            type="text"
                            value={banner.secondaryButtonText || ''}
                            onChange={(e) => updateBanner(index, 'secondaryButtonText', e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-[10px] font-bold focus:ring-1 focus:ring-primary"
                            placeholder="Cadastre-se"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Link</span>
                          <input 
                            type="text"
                            value={banner.secondaryButtonLink || ''}
                            onChange={(e) => updateBanner(index, 'secondaryButtonLink', e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-[10px] font-bold focus:ring-1 focus:ring-primary"
                            placeholder="/register"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(!localSettings.banners || localSettings.banners.length === 0) && (
              <div className="text-center py-12 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhum banner cadastrado</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-50 flex justify-end">
          <button 
            onClick={handleSaveSettings}
            disabled={localLoading || loading}
            className="bg-primary text-white font-black px-8 py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            {(localLoading || loading) && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {localLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Integração Mercado Pago</h3>
            <p className="text-xs font-bold text-gray-400">Conecte sua conta para receber pagamentos via Pix e Cartão</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center ${
            mpStatus.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {mpStatus.connected ? (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> Conectado</>
            ) : (
              <><XCircle className="w-3 h-3 mr-1" /> Desconectado</>
            )}
          </div>
        </div>

        <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">
              {mpStatus.connected ? 'Conta Vinculada' : 'Vincular Conta Mercado Pago'}
            </h4>
            <p className="text-xs font-bold text-gray-400 mt-1">
              {mpStatus.connected 
                ? mpStatus.source === 'environment'
                  ? `Configurado via variáveis de ambiente • Public Key: ${mpStatus.publicKey}`
                  : `ID do Usuário: ${mpStatus.userId} • Conectado via OAuth`
                : 'Você precisa conectar sua conta do Mercado Pago para processar pagamentos de forma segura.'}
            </p>
          </div>
          <button 
            onClick={handleConnect}
            disabled={loading}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              mpStatus.connected 
                ? 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50' 
                : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : mpStatus.connected ? (
              <><RefreshCw className="w-3.5 h-3.5" /> Re-conectar</>
            ) : (
              <><ExternalLink className="w-3.5 h-3.5" /> Conectar Agora</>
            )}
          </button>
        </div>

        {mpStatus.connected && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-700 leading-relaxed">
              <strong>Pronto!</strong> Sua farmácia já está configurada para aceitar pagamentos. 
              As credenciais de acesso são gerenciadas de forma segura e criptografada.
            </p>
          </div>
        )}
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
