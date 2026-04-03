import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useCartStore } from '../lib/store';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ ...product, quantity: 1 });
  };

  const discount = product.promoPrice && product.promoPrice > product.price
    ? Math.round(((product.promoPrice - product.price) / product.promoPrice) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 product-card-hover flex flex-col h-full"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {discount > 0 && (
          <span className="bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        {product.stripeType !== 'None' && (
          <span className={`text-white text-[10px] font-bold px-2 py-1 rounded-full ${
            product.stripeType === 'Red' ? 'bg-red-600' : 'bg-black'
          }`}>
            Tarja {product.stripeType === 'Red' ? 'Vermelha' : 'Preta'}
          </span>
        )}
      </div>

      <button className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-secondary transition-colors shadow-sm">
        <Heart className="w-4 h-4" />
      </button>

      {/* Image */}
      <Link to={`/product/${product.id}`} className="block mb-4 relative aspect-square overflow-hidden rounded-xl">
        <img
          src={product.images[0] || 'https://picsum.photos/seed/medicine/400/400'}
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      </Link>

      {/* Info */}
      <div className="flex-grow">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
          {product.manufacturer}
        </p>
        <Link to={`/product/${product.id}`} className="block group-hover:text-primary transition-colors">
          <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug mb-2 h-10">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center space-x-1 mb-3">
          <div className="flex text-accent">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-current" />
            ))}
          </div>
          <span className="text-[10px] text-gray-400">(4.8)</span>
        </div>

        <div className="mt-auto">
          {product.promoPrice && product.promoPrice > product.price ? (
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 line-through">
                R$ {product.promoPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-lg font-bold text-primary font-mono">
                R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-900 font-mono">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        className="mt-4 w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-primary/20 active:scale-95"
      >
        <ShoppingCart className="w-4 h-4" />
        <span className="text-sm">Comprar</span>
      </button>
    </motion.div>
  );
}
