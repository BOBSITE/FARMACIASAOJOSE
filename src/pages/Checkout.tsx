import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Truck, ShieldCheck, ArrowRight, CheckCircle2, QrCode } from 'lucide-react';
import { useCartStore, useAuthStore } from '../lib/store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

export default function Checkout() {
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  const status = searchParams.get('status');

  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    if (publicKey) {
      initMercadoPago(publicKey, { locale: 'pt-BR' });
    }
  }, []);

  useEffect(() => {
    if (status === 'success' || status === 'approved') {
      clearCart();
    }
  }, [status, clearCart]);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 150 ? 0 : 15.00;
  const total = subtotal + shipping;

  const handleCreatePreference = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });
      
      const data = await response.json();
      if (data.id) {
        setPreferenceId(data.id);
        
        const orderData = {
          userId: user?.uid || 'anonymous',
          status: 'PENDING',
          total,
          items,
          paymentMethod: 'MERCADOPAGO',
          preferenceId: data.id,
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'orders'), orderData);
      } else {
        throw new Error(data.error || 'Failed to create preference');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao conectar com o Mercado Pago. Verifique as chaves de API.');
    } finally {
      setLoading(false);
    }
  };

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

  if (status === 'failure') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-8">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-display font-black text-gray-900">Pagamento Recusado</h1>
          <p className="text-gray-500">
            Houve um problema com o seu pagamento. Por favor, tente novamente.
          </p>
        </div>
        <button 
          onClick={() => navigate('/checkout')}
          className="bg-primary text-white font-bold px-8 py-4 rounded-full hover:bg-primary/90 transition-all"
        >
          Tentar Novamente
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
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">1</div>
              <h2 className="text-xl font-display font-black text-gray-900">Endereço de Entrega</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input placeholder="CEP" className="bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary" />
              <input placeholder="Número" className="bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary" />
              <input placeholder="Rua" className="sm:col-span-2 bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary" />
              <input placeholder="Bairro" className="bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary" />
              <input placeholder="Cidade" className="bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary" />
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
                <p className="text-sm text-gray-500">Pague com PIX, Cartão de Crédito ou Boleto de forma segura.</p>
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
            
            {!preferenceId ? (
              <button 
                onClick={handleCreatePreference}
                disabled={loading || items.length === 0}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Pagar com Mercado Pago'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            ) : (
              <div className="mt-4">
                <Wallet initialization={{ preferenceId }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
