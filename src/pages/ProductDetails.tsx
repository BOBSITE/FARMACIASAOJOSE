import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart, ShieldCheck, Truck, Clock, Heart, Share2, Star, ChevronRight, Minus, Plus, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase, mapProductFromDb, handleSupabaseError } from '../lib/supabase';
import { useCartStore } from '../lib/store';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import PrescriptionModal from '../components/PrescriptionModal';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return mapProductFromDb(data) as Product;
      } catch (error) {
        handleSupabaseError(error, 'SELECT', `products/${id}`);
        return null;
      }
    },
    enabled: !!id
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['products-related', product?.category],
    queryFn: async () => {
      if (!product?.category) return [];
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', product.category)
          .limit(5);
        if (error) throw error;
        return (data || [])
          .map(mapProductFromDb)
          .filter((p: Product) => p.id !== product.id)
          .slice(0, 4) as Product[];
      } catch (error) {
        handleSupabaseError(error, 'SELECT', 'products');
        return [];
      }
    },
    enabled: !!product?.category
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-500 font-bold">Carregando produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Produto não encontrado</h2>
        <Link to="/" className="mt-4 text-primary font-bold inline-block">Voltar para a Home</Link>
      </div>
    );
  }

  const handleAddToCartClick = () => {
    if (product.requiresPrescription) {
      setIsModalOpen(true);
    } else {
      addItem({ ...product, quantity, selectedVariations: selectedOptions });
    }
  };

  const handleConfirmPrescription = () => {
    addItem({ ...product, quantity, selectedVariations: selectedOptions });
    setIsModalOpen(false);
  };

  const discount = product.promoPrice && product.promoPrice > product.price
    ? Math.round(((product.promoPrice - product.price) / product.promoPrice) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-gray-400 mb-8 overflow-x-auto whitespace-nowrap pb-2">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/catalog" className="hover:text-primary">{product.category}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600 font-bold truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* Image Gallery */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex items-center justify-center relative overflow-hidden"
          >
            <img
              src={product.images[activeImage] || 'https://picsum.photos/seed/medicine/600/600'}
              alt={product.name}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            {discount > 0 && (
              <span className="absolute top-6 left-6 bg-secondary text-white font-black px-4 py-2 rounded-2xl shadow-lg shadow-secondary/20">
                -{discount}% OFF
              </span>
            )}
          </motion.div>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-20 h-20 rounded-2xl border-2 transition-all flex-shrink-0 p-2 bg-white ${
                  activeImage === i ? 'border-primary shadow-md' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <img
                  src={img}
                  alt={`${product.name} thumbnail ${i}`}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full w-fit">
                  {product.manufacturer}
                </span>
                {product.sku && (
                  <span className="text-[10px] text-gray-400 mt-2 font-mono">
                    REF: {product.sku}
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-secondary transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-primary transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-gray-900 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex text-accent">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-500 font-medium">(128 avaliações)</span>
              <span className="text-sm text-green-600 font-bold flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1" /> Em estoque
              </span>
            </div>
          </div>

          {product.stripeType !== 'None' && (
            <div className={`p-4 rounded-2xl flex items-start space-x-3 ${
              product.stripeType === 'Red' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-900'
            }`}>
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Medicamento de Tarja {product.stripeType === 'Red' ? 'Vermelha' : 'Preta'}</p>
                <p className="text-xs opacity-80">A venda deste medicamento requer a apresentação de receita médica original.</p>
              </div>
            </div>
          )}

          {product.variations && product.variations.length > 0 && (
            <div className="space-y-6">
              {product.variations.map((variation) => (
                <div key={variation.name} className="space-y-3">
                  <p className="text-sm text-gray-500 font-medium">
                    {variation.name}: <span className="text-gray-900 font-black">{selectedOptions[variation.name] || variation.options[0]?.name}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variation.options.map((opt) => {
                      const isSelected = (selectedOptions[variation.name] || variation.options[0]?.name) === opt.name;
                      const isOutOfStock = opt.stock === 0;
                      
                      return (
                        <button
                          key={opt.name}
                          disabled={isOutOfStock}
                          onClick={() => setSelectedOptions(prev => ({ ...prev, [variation.name]: opt.name }))}
                          className={`px-4 py-2 rounded-full text-sm font-bold transition-all border-2 ${
                            isSelected 
                              ? 'bg-[#E3F2FD] border-[#0047BA] text-[#0047BA]' 
                              : isOutOfStock
                                ? 'border-dashed border-gray-300 text-gray-300 cursor-not-allowed'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {opt.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-end space-x-4">
              {product.promoPrice && product.promoPrice > product.price ? (
                <div className="flex flex-col">
                  <span className="text-sm text-gray-400 line-through">
                    R$ {product.promoPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-4xl font-black text-primary font-mono">
                    R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <span className="text-4xl font-black text-gray-900 font-mono">
                  R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
              <span className="text-xs text-gray-400 mb-2">à vista no PIX</span>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center bg-gray-100 rounded-2xl p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-white rounded-xl transition-all text-gray-500"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-white rounded-xl transition-all text-gray-500"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCartClick}
                className="flex-grow bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-primary/20 active:scale-95"
              >
                <ShoppingCart className="w-6 h-6" />
                <span>Adicionar ao Carrinho</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
              <Truck className="w-6 h-6 text-primary" />
              <div>
                <p className="text-xs font-bold">Entrega em casa</p>
                <p className="text-[10px] text-gray-500">Receba em até 2 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
              <Clock className="w-6 h-6 text-secondary" />
              <div>
                <p className="text-xs font-bold">Retirada em loja</p>
                <p className="text-[10px] text-gray-500">Grátis em 30 minutos</p>
              </div>
            </div>
          </div>
          
          {product.requiresPrescription && (
            <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-[#F57F17] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-800 mb-0.5">Retenção de Receita</p>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  Este produto requer retenção de receita médica. O envio da receita será solicitado antes de adicionar ao carrinho.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-8 mb-20">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            <button 
              onClick={() => setActiveTab('desc')}
              className={`py-4 px-2 font-black transition-all border-b-4 ${
                activeTab === 'desc' ? 'border-primary text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Descrição
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-2 font-black transition-all border-b-4 ${
                activeTab === 'reviews' ? 'border-primary text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Avaliações
            </button>
          </div>
        </div>

        {activeTab === 'desc' ? (
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed break-words overflow-x-hidden">
            <div 
              dangerouslySetInnerHTML={{ __html: product.description || '' }} 
              className="mb-8 overflow-hidden"
            />
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h4 className="text-gray-900 font-black uppercase tracking-tight mb-4">Especificações</h4>
              <ul className="list-none p-0 space-y-3">
                <li className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-gray-400 uppercase text-[10px]">Princípio Ativo</span>
                  <span className="font-black text-gray-900 text-xs">{product.activeIngredient || 'N/A'}</span>
                </li>
                <li className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-gray-400 uppercase text-[10px]">Fabricante</span>
                  <span className="font-black text-gray-900 text-xs">{product.manufacturer}</span>
                </li>
                {product.ean && (
                  <li className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-400 uppercase text-[10px]">EAN</span>
                    <span className="font-black text-gray-900 text-xs">{product.ean}</span>
                  </li>
                )}
                {product.sku && (
                  <li className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-400 uppercase text-[10px]">SKU</span>
                    <span className="font-black text-gray-900 text-xs">{product.sku}</span>
                  </li>
                )}
                <li className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-gray-400 uppercase text-[10px]">Registro MS</span>
                  <span className="font-black text-gray-900 text-xs">1.2345.6789.001-2</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex justify-center text-accent">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-8 h-8 fill-current" />)}
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Ainda não há avaliações</h3>
              <p className="text-sm text-gray-500 font-bold">Seja o primeiro a avaliar este produto e ajude outros clientes!</p>
              <button className="bg-white px-8 py-3 rounded-2xl border border-gray-200 font-black text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all shadow-sm">
                Escrever Avaliação
              </button>
            </div>
          </div>
        )}
      </div>
      <section>
        <h2 className="text-2xl font-display font-black text-gray-900 mb-8">Quem viu este produto, também viu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts?.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <PrescriptionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmPrescription}
      />
    </div>
  );
}
