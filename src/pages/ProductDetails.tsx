import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart, ShieldCheck, Truck, Clock, Heart, Share2, Star, ChevronRight, Minus, Plus, AlertCircle } from 'lucide-react';
import { doc, getDoc, collection, getDocs, query, limit, where } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useCartStore } from '../lib/store';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;
      const path = `products/${id}`;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Product;
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
        return null;
      }
    },
    enabled: !!id
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['products-related', product?.category],
    queryFn: async () => {
      if (!product?.category) return [];
      const path = 'products';
      try {
        const q = query(
          collection(db, path), 
          where('category', '==', product.category),
          limit(5)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(p => p.id !== product.id)
          .slice(0, 4);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
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

  const handleAddToCart = () => {
    addItem({ ...product, quantity });
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
              <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                {product.manufacturer}
              </span>
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
                onClick={handleAddToCart}
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
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-8 mb-20">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            <button className="border-b-4 border-primary py-4 px-2 font-black text-gray-900">Descrição</button>
            <button className="py-4 px-2 font-bold text-gray-400 hover:text-gray-600">Informações Técnicas</button>
            <button className="py-4 px-2 font-bold text-gray-400 hover:text-gray-600">Avaliações</button>
          </div>
        </div>
        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
          <p>{product.description}</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Princípio Ativo: {product.activeIngredient || 'N/A'}</li>
            <li>Fabricante: {product.manufacturer}</li>
            <li>EAN: {product.ean}</li>
            <li>Registro MS: 1.2345.6789.001-2</li>
          </ul>
        </div>
      </div>

      {/* Related Products */}
      <section>
        <h2 className="text-2xl font-display font-black text-gray-900 mb-8">Quem viu este produto, também viu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts?.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
