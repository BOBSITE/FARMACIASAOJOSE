import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ChevronLeft, Truck, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../lib/store';
import { Link, useNavigate } from 'react-router-dom';

export default function Cart() {
  const { items, removeItem, updateQuantity } = useCartStore();
  const navigate = useNavigate();

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 150 ? 0 : 15.00;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-8">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-16 h-16 text-gray-300" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-display font-black text-gray-900">Seu carrinho está vazio</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Não perca tempo! Explore nossas ofertas e cuide da sua saúde agora mesmo.
          </p>
        </div>
        <Link 
          to="/" 
          className="inline-flex items-center bg-primary text-white font-bold px-8 py-4 rounded-full hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
        >
          Começar a Comprar <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-4 mb-12">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-display font-black text-gray-900">Meu Carrinho</h1>
        <span className="bg-gray-100 text-gray-500 text-sm font-bold px-3 py-1 rounded-full">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6"
              >
                <div className="w-24 h-24 bg-gray-50 rounded-2xl p-2 flex-shrink-0">
                  <img 
                    src={item.images[0] || 'https://picsum.photos/seed/medicine/200/200'} 
                    alt={item.name} 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-grow space-y-2 text-center sm:text-left">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">{item.manufacturer}</p>
                  <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                  <div className="flex items-center justify-center sm:justify-start space-x-4">
                    <span className="text-lg font-black text-gray-900 font-mono">
                      R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {item.promoPrice && item.promoPrice > item.price && (
                      <span className="text-xs text-gray-400 line-through">
                        R$ {item.promoPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center bg-gray-100 rounded-2xl p-1">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-white rounded-xl transition-all text-gray-500"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-white rounded-xl transition-all text-gray-500"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-3 text-gray-400 hover:text-secondary hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6 sticky top-32">
            <h2 className="text-xl font-display font-black text-gray-900">Resumo do Pedido</h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Frete</span>
                <span className={`font-bold ${shipping === 0 ? 'text-primary' : 'text-gray-900'}`}>
                  {shipping === 0 ? 'Grátis' : `R$ ${shipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-[10px] text-primary font-bold bg-green-50 p-2 rounded-lg">
                  Faltam R$ {(150 - subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para frete grátis!
                </p>
              )}
              <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                <span className="text-gray-900 font-bold">Total</span>
                <span className="text-3xl font-black text-primary font-mono">
                  R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-primary/20 active:scale-95"
              >
                <span>Finalizar Compra</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link 
                to="/" 
                className="w-full flex items-center justify-center text-sm font-bold text-gray-400 hover:text-primary transition-colors"
              >
                Continuar Comprando
              </Link>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-3">
              <div className="flex items-center space-x-2 text-[10px] text-gray-400">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Pagamento 100% seguro via Mercado Pago</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] text-gray-400">
                <Truck className="w-4 h-4 text-primary" />
                <span>Entrega rápida em todo o Brasil</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
