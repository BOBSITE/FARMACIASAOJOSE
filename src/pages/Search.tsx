import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase, mapProductFromDb, handleSupabaseError } from '../lib/supabase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const { data: products, isLoading } = useQuery({
    queryKey: ['search-products', q],
    queryFn: async () => {
      try {
        let query = supabase.from('products').select('*');
        
        if (q) {
          const searchPattern = `%${q}%`;
          query = query.or(`name.ilike.${searchPattern},description.ilike.${searchPattern},category.ilike.${searchPattern}`);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(mapProductFromDb) as Product[];
      } catch (error) {
        handleSupabaseError(error, 'SELECT', 'products');
        return [];
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-4 mb-12">
        <div className="p-4 bg-primary/10 rounded-3xl text-primary">
          <SearchIcon className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-black text-gray-900">Resultados da busca</h1>
          <p className="text-gray-500">Você buscou por: <span className="font-bold text-primary">"{q}"</span></p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl h-80 animate-pulse"></div>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <SearchIcon className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Nenhum resultado encontrado</h2>
            <p className="text-gray-500">Não encontramos nenhum produto que corresponda à sua busca. Tente usar palavras-chave mais genéricas.</p>
            <button 
              onClick={() => window.history.back()}
              className="bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-all"
            >
              Voltar e tentar novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
