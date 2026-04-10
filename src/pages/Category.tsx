import React from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase, mapProductFromDb, handleSupabaseError } from '../lib/supabase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { motion } from 'motion/react';
import { Filter, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = false }: FilterSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="py-4 border-t border-gray-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between font-bold text-sm text-gray-700 hover:text-primary transition-colors"
      >
        <span className="flex items-center">
          <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
          {title}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Category() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const subcategory = searchParams.get('sub');

  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);
  const [selectedSubs, setSelectedSubs] = React.useState<string[]>([]);
  const [maxPrice, setMaxPrice] = React.useState<number>(5000);
  const [currentPrice, setCurrentPrice] = React.useState<number>(5000);
  const [sortBy, setSortBy] = React.useState<string>('Mais relevantes');

  const { data: allProducts, isLoading } = useQuery({
    queryKey: ['products-category', categoryId, subcategory],
    queryFn: async () => {
      try {
        let query = supabase.from('products').select('*');
        
        if (categoryId && categoryId !== 'todas') {
          if (categoryId === 'ofertas') {
            query = query.eq('is_weekly_offer', true);
          } else {
            const categoryMap: Record<string, string> = {
              'medicamentos': 'Medicamentos',
              'cosmeticos-e-beleza': 'Cosméticos e Beleza',
              'higiene-pessoal': 'Higiene Pessoal',
              'ortopedicos': 'Ortopédicos',
              'prod-ortopedicos': 'Ortopédicos',
              'alimentos': 'Alimentos',
              'suplementos': 'Suplementos',
              'vida-saudavel': 'Suplementos',
              'mamae-e-bebe': 'Mamãe & Bebê'
            };
            
            const targetCategory = categoryMap[categoryId] || categoryId;
            query = query.eq('category', targetCategory);
          }
        }

        if (subcategory) {
          query = query.eq('subcategory', subcategory);
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

  const availableBrands = React.useMemo(() => {
    if (!allProducts) return [];
    const counts = allProducts.reduce((acc, p) => {
      acc[p.manufacturer] = (acc[p.manufacturer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allProducts]);

  const availableSubs = React.useMemo(() => {
    if (!allProducts) return [];
    const counts = allProducts.reduce((acc, p) => {
      if (p.subcategory) {
        acc[p.subcategory] = (acc[p.subcategory] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allProducts]);

  React.useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      const highest = Math.max(...allProducts.map(p => p.price));
      const roundedMax = Math.ceil(highest / 100) * 100 || 100; // Round up to nearest 100
      setMaxPrice(roundedMax);
      setCurrentPrice(roundedMax);
    }
  }, [allProducts]);

  const filteredProducts = React.useMemo(() => {
    if (!allProducts) return [];
    
    let filtered = allProducts.filter(p => {
      const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(p.manufacturer);
      // Only filter by subcategory if no URL subcategory is active (otherwise it's redundant/conflicting)
      const matchSub = (selectedSubs.length === 0 || !p.subcategory) ? true : selectedSubs.includes(p.subcategory);
      const matchPrice = p.price <= currentPrice;
      return matchBrand && matchPrice && (!subcategory || p.subcategory === subcategory) && matchSub;
    });

    switch (sortBy) {
      case 'Menor preço':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'Maior preço':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'Mais vendidos':
        filtered.sort((a, b) => (b.badge === 'Mais Vendido' ? -1 : 1));
        break;
    }

    return filtered;
  }, [allProducts, selectedBrands, selectedSubs, currentPrice, sortBy, subcategory]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleSub = (sub: string) => {
    setSelectedSubs(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedSubs([]);
    setCurrentPrice(maxPrice);
  };

  const categoryTitle = categoryId === 'ofertas' 
    ? 'Ofertas da Semana' 
    : categoryId 
      ? categoryId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
      : 'Todas as Categorias';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
        <a href="/" className="hover:text-primary">Home</a>
        <ChevronRight className="w-4 h-4" />
        <span className={subcategory ? 'hover:text-primary cursor-pointer' : 'text-gray-900 font-bold'}>
          {categoryTitle}
        </span>
        {subcategory && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-bold">{subcategory}</span>
          </>
        )}
      </nav>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-72 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-xl text-gray-800">{categoryTitle}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="py-4 border-t border-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    Faixa de Preço
                  </h4>
                  {(selectedBrands.length > 0 || selectedSubs.length > 0 || currentPrice < maxPrice) && (
                    <button 
                      onClick={clearFilters}
                      className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
                <div className="px-2">
                  <input 
                    type="range" 
                    className="w-full accent-primary" 
                    min="0" 
                    max={maxPrice} 
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(Number(e.target.value))}
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                    <span>R$ 0,00</span>
                    <span>R$ {currentPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>

              {availableBrands.length > 0 && (
                <FilterSection title="Marcas" defaultOpen={true}>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                    {availableBrands.map(([brand, count]) => (
                      <label key={brand} className="flex items-center space-x-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="rounded text-primary focus:ring-primary w-4 h-4" 
                        />
                        <span className="text-xs text-gray-500 group-hover:text-primary transition-colors flex-1 truncate">{brand}</span>
                        <span className="text-[10px] text-gray-400 font-medium">({count})</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>
              )}

              {!subcategory && availableSubs.length > 0 && (
                <FilterSection title="Subcategorias">
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                    {availableSubs.map(([sub, count]) => (
                      <label key={sub} className="flex items-center space-x-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedSubs.includes(sub)}
                          onChange={() => toggleSub(sub)}
                          className="rounded text-primary focus:ring-primary w-4 h-4" 
                        />
                        <span className="text-xs text-gray-500 group-hover:text-primary transition-colors flex-1 truncate">{sub}</span>
                        <span className="text-[10px] text-gray-400 font-medium">({count})</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>
              )}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-grow">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-display font-black text-gray-900">
              {subcategory || categoryTitle}
              <span className="ml-4 text-sm font-normal text-gray-400">
                {filteredProducts.length} produtos encontrados
              </span>
            </h1>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border-gray-200 rounded-full px-4 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
            >
              <option>Mais relevantes</option>
              <option>Menor preço</option>
              <option>Maior preço</option>
              <option>Mais vendidos</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl h-80 animate-pulse"></div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-500 text-lg">Nenhum produto encontrado nesta categoria.</p>
              <button 
                onClick={() => window.history.back()}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Voltar para a página anterior
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
