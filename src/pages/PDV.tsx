import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShoppingCart, User, CreditCard, QrCode, 
  DollarSign, Trash2, Minus, Plus, ArrowRight, 
  Monitor, Package, ChevronLeft, AlertCircle,
  Printer, X, Calculator, Hash, UserPlus, Check
} from 'lucide-react';
import { collection, getDocs, query, limit, addDoc } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CartItem, Product } from '../types';
import { useAuthStore } from '../lib/store';

export default function PDV() {
  const { user, isAuthReady } = useAuthStore();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [paymentStep, setPaymentStep] = useState(false);
  const [customerCpf, setCustomerCpf] = useState('');
  const [isIdentifyingCustomer, setIsIdentifyingCustomer] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT' | 'DEBIT' | 'PIX' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastItem, setLastItem] = useState<CartItem | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [lastSale, setLastSale] = useState<{
    cart: CartItem[];
    total: number;
    paymentMethod: string | null;
    amountPaid: string;
    change: number;
    customerCpf: string;
    date: string;
  } | null>(null);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Access Control
  useEffect(() => {
    if (isAuthReady) {
      const isStaff = user && (user.role === 'ADMIN' || user.role === 'FARMACEUTICO' || user.role === 'ATENDENTE');
      if (!isStaff) {
        navigate('/');
      }
    }
  }, [user, isAuthReady, navigate]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKey(e.key);
      setTimeout(() => setPressedKey(null), 150);

      // Print Confirmation Shortcuts
      if (showPrintConfirm) {
        if (e.key === 'Enter') {
          e.preventDefault();
          setShowPrintConfirm(false);
          setShowSuccessModal(true);
          setTimeout(() => window.print(), 500);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowPrintConfirm(false);
          setShowSuccessModal(true);
          return;
        }
      }

      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F2') {
        e.preventDefault();
        setIsIdentifyingCustomer(true);
      }
      if (e.key === 'F3') {
        e.preventDefault();
        if (cart.length > 0) {
          setShowCancelConfirm(true);
        }
      }
      if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) setPaymentStep(true);
      }
      if (e.key === 'Escape') {
        setPaymentStep(false);
        setIsIdentifyingCustomer(false);
        setShowCancelConfirm(false);
        setShowSuccessModal(false);
        setShowPrintConfirm(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, showPrintConfirm, showSuccessModal]);

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products-pdv'],
    queryFn: async () => {
      const path = 'products';
      try {
        const q = query(collection(db, path), limit(100));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    retry: false
  });

  if (!isAuthReady) return null;

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.ean.includes(search)
  ) || [];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      let newItem: CartItem;
      if (existing) {
        newItem = { ...existing, quantity: existing.quantity + 1 };
        setLastItem(newItem);
        return prev.map(i => i.id === product.id ? newItem : i);
      }
      newItem = { ...product, quantity: 1 };
      setLastItem(newItem);
      return [...prev, newItem];
    });
    setSearch('');
    searchInputRef.current?.focus();
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => 
      i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
    if (lastItem?.id === id) setLastItem(null);
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const change = amountPaid ? Math.max(0, parseFloat(amountPaid) - total) : 0;

  const finalizeSale = async () => {
    if (!paymentMethod) {
      alert('Por favor, selecione uma forma de pagamento.');
      return;
    }

    if (paymentMethod === 'CASH' && (!amountPaid || parseFloat(amountPaid) < total)) {
      alert('Valor pago insuficiente.');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate processing time for card/pix
      if (paymentMethod !== 'CASH') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const orderData = {
        userId: user?.uid || 'anonymous',
        customerCpf: customerCpf || null,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          images: item.images
        })),
        total,
        status: 'APPROVED',
        paymentMethod,
        amountPaid: paymentMethod === 'CASH' ? parseFloat(amountPaid) : total,
        change: paymentMethod === 'CASH' ? change : 0,
        createdAt: new Date().toISOString(),
        isPdv: true,
        operatorId: user?.uid,
        operatorName: user?.displayName || 'SISTEMA'
      };

      // Add order to Firestore
      await addDoc(collection(db, 'orders'), orderData);

      // Store last sale data for printing before clearing
      setLastSale({
        cart: [...cart],
        total,
        paymentMethod,
        amountPaid,
        change,
        customerCpf,
        date: new Date().toLocaleString()
      });

      setShowPrintConfirm(true);
      setCart([]);
      setLastItem(null);
      setPaymentStep(false);
      setCustomerCpf('');
      setAmountPaid('');
      setPaymentMethod(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f4f7f6] z-[100] flex flex-col font-mono select-none overflow-hidden text-gray-900">
      {/* Top Bar - Store Info */}
      <header className="bg-[#1a1a1a] text-white px-6 py-3 flex items-center justify-between border-b-4 border-primary">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xl">SJ</div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tighter leading-none">Farmácia São José</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unidade Matriz - PDV #04</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-700" />
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Operador</p>
            <p className="text-xs font-bold text-primary">{user?.displayName?.toUpperCase() || 'SISTEMA'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status do Sistema</p>
            <div className="flex items-center justify-end space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-green-500 uppercase">Online</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data e Hora</p>
            <p className="text-sm font-bold">{new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <Link to="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <Monitor className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">
        {/* Main Area: Search & Last Item */}
        <div className="flex-grow flex flex-col p-6 space-y-6 overflow-hidden">
          
          {/* Last Item Display - Professional PDV Style */}
          <div className="grid grid-cols-12 gap-6 h-48">
            <div className="col-span-8 bg-white border-2 border-gray-200 rounded-2xl p-6 flex items-center space-x-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
              {lastItem ? (
                <>
                  <div className="w-32 h-32 bg-gray-50 rounded-xl p-2 shrink-0 border border-gray-100">
                    <img src={lastItem.images[0]} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{lastItem.manufacturer}</p>
                    <h2 className="text-3xl font-black text-gray-900 leading-tight truncate uppercase">{lastItem.name}</h2>
                    <div className="flex items-baseline space-x-4 mt-2">
                      <p className="text-sm font-bold text-gray-500">QTD: {lastItem.quantity}</p>
                      <p className="text-sm font-bold text-gray-500">UNIT: R$ {lastItem.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Subtotal Item</p>
                    <p className="text-5xl font-black text-primary tracking-tighter">R$ {(lastItem.price * lastItem.quantity).toFixed(2)}</p>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-300 space-y-2">
                  <Package className="w-12 h-12" />
                  <p className="text-xl font-black uppercase tracking-widest">Aguardando Registro</p>
                </div>
              )}
            </div>

            <div className="col-span-4 bg-primary text-white rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-primary/20">
              <div>
                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Total da Venda</p>
                <p className="text-5xl font-black tracking-tighter">R$ {total.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 opacity-60" />
                  <span className="text-sm font-black">{cart.length} ITENS</span>
                </div>
                {customerCpf && (
                  <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                    <User className="w-3 h-3" />
                    <span className="text-[10px] font-black">{customerCpf}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center space-x-3 text-gray-400">
              <Search className="w-6 h-6" />
              <span className="text-xs font-black bg-gray-100 px-2 py-1 rounded border border-gray-200">F1</span>
            </div>
            <input 
              ref={searchInputRef}
              autoFocus
              type="text" 
              placeholder="ESCANEIE O CÓDIGO OU DIGITE O NOME DO PRODUTO..." 
              className="w-full bg-white border-2 border-gray-200 rounded-2xl py-6 pl-24 pr-8 text-2xl font-black shadow-sm focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all uppercase placeholder:text-gray-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Product Grid */}
          <div className="flex-grow overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pr-2 custom-scrollbar">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100"></div>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center text-center p-12 space-y-4 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <Package className="w-16 h-16 text-gray-200" />
                <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">Nenhum produto encontrado</h3>
              </div>
            ) : (
              filteredProducts.map(product => (
                <motion.button
                  key={product.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(product)}
                  className="bg-white p-4 rounded-2xl shadow-sm border-2 border-transparent hover:border-primary transition-all text-left flex flex-col group relative overflow-hidden"
                >
                  <div className="aspect-square mb-3 bg-gray-50 rounded-xl p-3 flex items-center justify-center group-hover:bg-white transition-colors">
                    <img src={product.images[0]} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{product.manufacturer}</p>
                    <h3 className="font-black text-gray-900 text-xs line-clamp-2 leading-tight uppercase">{product.name}</h3>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-lg font-black text-primary tracking-tighter">R$ {product.price.toFixed(2)}</p>
                    <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Sidebar: Digital Receipt */}
        <aside className="w-[480px] bg-white border-l-4 border-gray-200 flex flex-col relative z-10 shadow-2xl">
          <div className="p-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Printer className="w-6 h-6 text-gray-400" />
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Cupom Fiscal Eletrônico</h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Série 001</span>
            </div>
          </div>

          {/* Receipt Content - Thermal Paper Style */}
          <div className="flex-grow overflow-y-auto p-8 font-mono text-xs text-gray-800 bg-[#fdfdfd] relative">
            {/* Receipt Header */}
            <div className="text-center mb-6 space-y-1">
              <p className="font-black text-sm">FARMÁCIA SÃO JOSÉ LTDA</p>
              <p>CNPJ: 12.345.678/0001-90</p>
              <p>AV. BRASIL, 1500 - CENTRO</p>
              <p className="border-b border-dashed border-gray-300 py-2">------------------------------------------</p>
              <div className="flex justify-between font-black uppercase py-1">
                <span>Item</span>
                <span className="flex-grow px-4 text-left">Descrição</span>
                <span>Total</span>
              </div>
              <p className="border-b border-dashed border-gray-300 pb-2">------------------------------------------</p>
            </div>

            <AnimatePresence mode="popLayout">
              {cart.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative py-2 hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <span className="w-6 text-gray-400">{String(idx + 1).padStart(3, '0')}</span>
                    <div className="flex-grow px-4 min-w-0">
                      <p className="font-black uppercase truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.quantity} UN X R$ {item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-black">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-white border border-gray-200 rounded hover:text-primary"><Minus className="w-3 h-3" /></button>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-white border border-gray-200 rounded hover:text-primary"><Plus className="w-3 h-3" /></button>
                        <button onClick={() => removeFromCart(item.id)} className="p-1 bg-white border border-gray-200 rounded hover:text-rose-500"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {cart.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                <ShoppingCart className="w-16 h-16" />
                <p className="font-black uppercase tracking-widest">Aguardando Registro de Itens</p>
              </div>
            )}

            {/* Receipt Footer */}
            {cart.length > 0 && (
              <div className="mt-8 pt-4 border-t border-dashed border-gray-300 space-y-2">
                <div className="flex justify-between font-black text-sm">
                  <span>TOTAL BRUTO</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>DESCONTOS</span>
                  <span>R$ 0,00</span>
                </div>
                <div className="flex justify-between font-black text-lg pt-2 border-t-2 border-gray-900">
                  <span>TOTAL LÍQUIDO</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts Legend */}
          <div className="p-6 bg-[#1a1a1a] text-white grid grid-cols-2 gap-3 border-t-4 border-primary">
            {[
              { key: 'F1', label: 'BUSCAR', action: () => searchInputRef.current?.focus() },
              { key: 'F2', label: 'CPF NOTA', action: () => setIsIdentifyingCustomer(true) },
              { key: 'F3', label: 'CANCELAR', action: () => {
                if (cart.length > 0) setShowCancelConfirm(true);
              }},
              { key: 'F10', label: 'PAGAR', action: () => {
                if (cart.length > 0) setPaymentStep(true);
              }},
            ].map(item => (
              <button 
                key={item.key} 
                onClick={(e) => {
                  e.currentTarget.blur();
                  item.action();
                }}
                className={`flex items-center space-x-3 p-2 rounded-lg border transition-all text-left active:scale-95 ${
                  pressedKey === item.key 
                    ? 'bg-primary border-primary shadow-lg shadow-primary/20' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <span className={`px-2 py-0.5 rounded text-[10px] font-black transition-colors ${
                  pressedKey === item.key ? 'bg-white text-primary' : 'bg-primary text-white'
                }`}>{item.key}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{item.label}</span>
              </button>
            ))}
            <button 
              disabled={cart.length === 0}
              onClick={() => setPaymentStep(true)}
              className="col-span-2 bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 mt-2 active:scale-95"
            >
              <span className="text-lg tracking-tighter uppercase">Finalizar Venda (F10)</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </aside>
      </div>

      {/* Identify Customer Modal */}
      <AnimatePresence>
        {isIdentifyingCustomer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 bg-primary text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserPlus className="w-6 h-6" />
                  <h2 className="text-xl font-black uppercase tracking-tighter">Identificar Cliente</h2>
                </div>
                <button onClick={() => setIsIdentifyingCustomer(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CPF na Nota</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="000.000.000-00"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-6 text-xl font-black focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
                      value={customerCpf}
                      onChange={(e) => setCustomerCpf(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => setIsIdentifyingCustomer(false)}
                  className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all uppercase tracking-widest"
                >
                  Confirmar Identificação
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentStep && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl flex"
            >
              {/* Left: Payment Info */}
              <div className="flex-grow p-12 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button onClick={() => setPaymentStep(false)} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Pagamento</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total a Pagar</p>
                    <p className="text-5xl font-black text-primary tracking-tighter">R$ {total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'CASH', label: 'Dinheiro', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
                    { id: 'CREDIT', label: 'Cartão Crédito', icon: CreditCard, color: 'bg-blue-50 text-blue-600' },
                    { id: 'DEBIT', label: 'Cartão Débito', icon: CreditCard, color: 'bg-indigo-50 text-indigo-600' },
                    { id: 'PIX', label: 'PIX QR Code', icon: QrCode, color: 'bg-teal-50 text-teal-600' },
                  ].map((method) => (
                    <button 
                      key={method.id}
                      onClick={() => {
                        setPaymentMethod(method.id as any);
                        if (method.id !== 'CASH') setAmountPaid(total.toString());
                        else setAmountPaid('');
                      }}
                      className={`p-6 rounded-3xl border-2 transition-all flex items-center space-x-4 group ${
                        paymentMethod === method.id 
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' 
                          : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-4 rounded-2xl transition-all ${
                        paymentMethod === method.id 
                          ? 'bg-primary text-white' 
                          : `${method.color} group-hover:bg-primary/10`
                      }`}>
                        <method.icon className="w-6 h-6" />
                      </div>
                      <span className={`font-black uppercase tracking-widest text-sm ${
                        paymentMethod === method.id ? 'text-primary' : 'text-gray-800'
                      }`}>{method.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {paymentMethod === 'CASH' ? (
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border-2 border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm">
                          <Calculator className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Recebido</p>
                          <input 
                            autoFocus
                            type="number" 
                            placeholder="0,00"
                            className="bg-transparent border-none p-0 text-3xl font-black focus:ring-0 w-48 placeholder:text-gray-200"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Troco</p>
                        <p className={`text-4xl font-black ${change > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                          R$ {change.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ) : paymentMethod === 'PIX' ? (
                    <div className="flex items-center space-x-8 p-8 bg-teal-50 rounded-3xl border-2 border-teal-100">
                      <div className="w-32 h-32 bg-white p-2 rounded-2xl shadow-sm">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FarmaciaSaoJosePDV" 
                          alt="PIX QR Code" 
                          className="w-full h-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-black text-teal-600 uppercase tracking-widest">Aguardando Pagamento PIX</p>
                        <p className="text-sm text-teal-800 font-bold">Peça ao cliente para escanear o QR Code acima.</p>
                        <div className="flex items-center space-x-2 text-xs text-teal-600 bg-white/50 px-3 py-1 rounded-full w-fit">
                          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                          <span>Sincronizando com o banco...</span>
                        </div>
                      </div>
                    </div>
                  ) : paymentMethod ? (
                    <div className="flex items-center space-x-8 p-8 bg-blue-50 rounded-3xl border-2 border-blue-100">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <CreditCard className="w-8 h-8 text-blue-600 animate-bounce" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Aguardando Maquininha</p>
                        <p className="text-sm text-blue-800 font-bold">Insira ou aproxime o cartão do cliente.</p>
                        <div className="flex items-center space-x-2 text-xs text-blue-600 bg-white/50 px-3 py-1 rounded-full w-fit">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <span>Processando transação...</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Selecione uma forma de pagamento acima</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Summary & Action */}
              <div className="w-80 bg-gray-900 p-12 flex flex-col justify-between text-white">
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-4">Resumo da Venda</p>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="opacity-60">Itens:</span>
                        <span className="font-black">{cart.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="opacity-60">Subtotal:</span>
                        <span className="font-black">R$ {total.toFixed(2)}</span>
                      </div>
                      {customerCpf && (
                        <div className="pt-4 border-t border-white/10">
                          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">Cliente</p>
                          <p className="text-xs font-black text-primary">{customerCpf}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={finalizeSale}
                  disabled={isProcessing || !paymentMethod || (paymentMethod === 'CASH' && (!amountPaid || parseFloat(amountPaid) < total))}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-black py-6 rounded-3xl shadow-2xl shadow-primary/40 transition-all transform hover:scale-105 uppercase tracking-widest flex flex-col items-center disabled:opacity-50 disabled:hover:scale-100"
                >
                  <span className="text-xs opacity-60 mb-1">
                    {isProcessing ? 'Processando...' : 'Confirmar e Imprimir'}
                  </span>
                  <span className="text-lg">
                    {isProcessing ? 'Aguarde...' : 'Finalizar'}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Sale Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[400] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Cancelar Venda?</h2>
              <p className="text-gray-500 mb-8">Todos os itens do carrinho serão removidos. Esta ação não pode ser desfeita.</p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-grow py-4 bg-gray-100 hover:bg-gray-200 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => {
                    setCart([]);
                    setLastItem(null);
                    setCustomerCpf('');
                    setShowCancelConfirm(false);
                  }}
                  className="flex-grow py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-200"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Confirmation Modal */}
      <AnimatePresence>
        {showPrintConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[400] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl p-10 text-center"
            >
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8">
                <Printer className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-3">Venda Finalizada!</h2>
              <p className="text-gray-500 mb-10">Deseja imprimir o cupom fiscal desta venda?</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setShowPrintConfirm(false);
                    setShowSuccessModal(true);
                    setTimeout(() => window.print(), 500);
                  }}
                  className="py-5 bg-primary hover:bg-primary/90 text-white rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-primary/20 flex items-center justify-center space-x-2"
                >
                  <Check className="w-5 h-5" />
                  <span>Sim</span>
                </button>
                <button 
                  onClick={() => {
                    setShowPrintConfirm(false);
                    setShowSuccessModal(true);
                  }}
                  className="py-5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-3xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center space-x-2"
                >
                  <X className="w-5 h-5" />
                  <span>Não</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[400] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl p-10 text-center"
            >
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Check className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-3">Venda Finalizada!</h2>
              <p className="text-gray-500 mb-10">O pedido foi registrado com sucesso no sistema.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    window.print();
                  }}
                  className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-primary/20 flex items-center justify-center space-x-3"
                >
                  <Printer className="w-5 h-5" />
                  <span>Imprimir Cupom</span>
                </button>
                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-3xl font-black uppercase tracking-widest text-sm transition-all"
                >
                  Nova Venda
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Printable Receipt Section */}
      <div id="print-receipt" className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 font-mono text-[10px] leading-tight text-black">
        {lastSale && (
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
              {lastSale.cart.map((item) => (
                <div key={item.id} className="py-1">
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
                <span>R$ {lastSale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>FORMA PAGTO.</span>
                <span className="font-black uppercase">{lastSale.paymentMethod}</span>
              </div>
              {lastSale.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between">
                    <span>VALOR RECEBIDO</span>
                    <span>R$ {parseFloat(lastSale.amountPaid || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black">
                    <span>TROCO</span>
                    <span>R$ {lastSale.change.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 text-center space-y-2">
              <p className="border-b border-dashed border-black pb-2">------------------------------------------</p>
              {lastSale.customerCpf ? (
                <p className="font-black">CPF DO CONSUMIDOR: {lastSale.customerCpf}</p>
              ) : (
                <p>CONSUMIDOR NÃO IDENTIFICADO</p>
              )}
              <p className="text-[8px]">DATA: {lastSale.date}</p>
              <p className="text-[8px]">OPERADOR: {user?.displayName || 'SISTEMA'}</p>
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