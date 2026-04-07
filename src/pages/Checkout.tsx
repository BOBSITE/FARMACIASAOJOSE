import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Truck, ShieldCheck, ArrowRight, CheckCircle2, CreditCard, QrCode, AlertCircle, Loader2 } from 'lucide-react';
import { useCartStore, useAuthStore } from '../lib/store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default function Checkout() {
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState({
    zipCode: '',
    number: '',
    street: '',
    neighborhood: '',
    city: '',
    state: 'CE'
  });

  const status = searchParams.get('status');
  const preference_id = searchParams.get('preference_id');

  useEffect(() => {
    const handleSuccess = async () => {
      if (status === 'success' || status === 'approved') {
        if (preference_id) {
          try {
            await updateDoc(doc(db, 'orders', preference_id), { status: 'APPROVED' });
          } catch (e) {
            console.error("Failed to update order status", e);
          }
        }
        clearCart();
      }
    };
    handleSuccess();
  }, [status, preference_id, clearCart]);

  useEffect(() => {
    const fetchUserAddress = async () => {
      if (!user?.uid) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.address) {
            setAddress({
              zipCode: userData.address.zipCode || '',
              number: userData.address.number || '',
              street: userData.address.street || '',
              neighborhood: userData.address.neighborhood || '',
              city: userData.address.city || '',
              state: userData.address.state || 'CE'
            });
          }
        }
      } catch (e) {
        console.error("Error fetching user address:", e);
      }
    };
    fetchUserAddress();
  }, [user?.uid]);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  const isFreeShippingArea = address.zipCode.replace(/\D/g, '').startsWith('61600') || 
                            address.zipCode.replace(/\D/g, '').startsWith('61601');
  
  const shipping = (isFreeShippingArea && subtotal >= 100) ? 0 : 15.00;
  const total = subtotal + shipping;

  const handlePayment = async () => {
    if (items.length === 0) return;
    
    if (!address.zipCode || !address.street || !address.number || !address.neighborhood || !address.city) {
      setError('Por favor, preencha todos os campos do endereço de entrega.');
      return;
    }

    const cleanZip = address.zipCode.replace(/\D/g, '');
    if (!cleanZip.startsWith('616')) {
      setError('No momento, realizamos entregas apenas para a cidade de Caucaia (Ceará).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items,
          payerEmail: user?.email,
          userId: user?.uid
        }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Erro ao criar preferência');
      }

      // Save order to Firestore as PENDING
      try {
        await setDoc(doc(db, 'orders', data.id), {
          id: data.id,
          userId: user?.uid || 'guest',
          payerEmail: user?.email || '',
          operatorName: user?.displayName || '',
          items,
          total,
          subtotal,
          shipping,
          address,
          status: 'PENDING',
          paymentMethod: 'MERCADOPAGO',
          createdAt: new Date().toISOString()
        });
      } catch (dbError) {
        console.error('Failed to save order to fast database:', dbError);
        // Continue anyway since we have the checkout URL
      }

      // Redirect directly to Mercado Pago checkout
      const checkoutUrl = data.init_point || data.sandbox_init_point;
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('URL de checkout não recebida do Mercado Pago');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Erro ao processar pagamento. Tente novamente.');
      setLoading(false);
    }
  };

  // Success screen
  if (status === 'success' || status === 'approved') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-8">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-primary"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <div className="space-y-4">
          <h1 className="text-3xl font-display font-black text-gray-900">Pagamento Aprovado!</h1>
          <p className="text-gray-500">
            Seu pedido foi recebido e o pagamento foi confirmado. Você receberá atualizações por e-mail.
          </p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-primary text-white font-bold px-8 py-4 rounded-full hover:bg-primary/90 transition-all"
        >
          Voltar para a Loja
        </button>
      </div>
    );
  }

  // Failure screen
  if (status === 'failure') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-8">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
          <AlertCircle className="w-12 h-12" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-display font-black text-gray-900">Pagamento Recusado</h1>
          <p className="text-gray-500">
            Houve um problema com o seu pagamento. Por favor, tente novamente.
          </p>
        </div>
        <button 
          onClick={() => { setError(null); navigate('/checkout'); }}
          className="bg-primary text-white font-bold px-8 py-4 rounded-full hover:bg-primary/90 transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  // Pending screen
  if (status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-8">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-600">
          <QrCode className="w-12 h-12" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-display font-black text-gray-900">Pagamento Pendente</h1>
          <p className="text-gray-500">
            Seu pagamento está sendo processado. Você receberá uma confirmação por e-mail assim que for aprovado.
          </p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-primary text-white font-bold px-8 py-4 rounded-full hover:bg-primary/90 transition-all"
        >
          Voltar para a Loja
        </button>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-8">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <CreditCard className="w-12 h-12" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-display font-black text-gray-900">Carrinho Vazio</h1>
          <p className="text-gray-500">Adicione produtos ao carrinho para finalizar a compra.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-primary text-white font-bold px-8 py-4 rounded-full hover:bg-primary/90 transition-all"
        >
          Ver Produtos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-display font-black text-gray-900 mb-12">Finalizar Pedido</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Shipping */}
          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">1</div>
                <h2 className="text-xl font-display font-black text-gray-900">Endereço de Entrega</h2>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-1 flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-yellow-600" />
                <span className="text-[10px] sm:text-xs font-bold text-yellow-700 uppercase tracking-tighter">Entrega somente em Caucaia</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                placeholder="CEP" 
                value={address.zipCode}
                onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                className="bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary" 
              />
              <input 
                placeholder="Número" 
                value={address.number}
                onChange={(e) => setAddress({ ...address, number: e.target.value })}
                className="bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary" 
              />
              <input 
                placeholder="Rua" 
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="sm:col-span-2 bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary" 
              />
              <input 
                placeholder="Bairro" 
                value={address.neighborhood}
                onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                className="bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary" 
              />
              <input 
                placeholder="Cidade" 
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary" 
              />
            </div>
          </section>

          {/* Step 2: Payment */}
          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">2</div>
              <h2 className="text-xl font-display font-black text-gray-900">Forma de Pagamento</h2>
            </div>
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-xl shrink-0">
                mp
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Mercado Pago</h3>
                <p className="text-sm text-gray-500">Pague com PIX, Cartão de Crédito ou Boleto. Você será redirecionado para o Mercado Pago.</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-gray-400 font-bold">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>Pagamento 100% seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                <span>Frete grátis (Caucaia) acima de R$ 100</span>
              </div>
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6 sticky top-32">
            <h2 className="text-xl font-display font-black text-gray-900">Resumo</h2>
            <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-500 truncate max-w-[150px]">{item.quantity}x {item.name}</span>
                  <span className="font-bold text-gray-900">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Frete</span>
                <span className="font-bold text-primary">{shipping === 0 ? 'Grátis' : `R$ ${shipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
              </div>
              <div className="pt-4 flex justify-between items-end">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-3xl font-black text-primary font-mono">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-bold">{error}</p>
              </div>
            )}

            <button 
              onClick={handlePayment}
              disabled={loading || items.length === 0}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Redirecionando para Mercado Pago...</span>
                </>
              ) : (
                <>
                  <span>Pagar com Mercado Pago</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
