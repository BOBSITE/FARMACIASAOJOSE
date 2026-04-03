import React from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
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

  const { data: products, isLoading } = useQuery({
    queryKey: ['products-category', categoryId, subcategory],
    queryFn: async () => {
      const path = 'products';
      try {
        let q = query(collection(db, path));
        
        if (categoryId && categoryId !== 'todas') {
          // Map URL friendly names back to display names if needed, 
          // but assuming they match for now or handled by slug logic
          const categoryMap: Record<string, string> = {
            'medicamentos': 'Medicamentos',
            'cosmeticos-e-beleza': 'Cosméticos e Beleza',
            'higiene-pessoal': 'Higiene Pessoal',
            'prod-ortopedicos': 'Prod. Ortopédicos',
            'alimentos': 'Alimentos',
            'vida-saudavel': 'Vida Saudável',
            'ofertas': 'Ofertas'
          };
          
          const targetCategory = categoryMap[categoryId] || categoryId;
          q = query(q, where('category', '==', targetCategory));
        }

        if (subcategory) {
          q = query(q, where('subcategory', '==', subcategory));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    }
  });

  const categoryTitle = categoryId ? categoryId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Todas as Categorias';

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
              <h3 className="font-black text-xl text-gray-800">Dermo e Beleza</h3>
            </div>
            
            <div className="space-y-4">
              {/* Filter Section Component */}
              <FilterSection title="Categorias" defaultOpen={true}>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                  {['Perfumes Femininos (100)', 'Perfumes Masculinos (150)', 'Esmalte (50)', 'Shampoo (80)', 'Hidratante Corporal (120)', 'Condicionador (40)', 'Sabonetes e Sais de Banho (110)', 'Máscara de Hidratação (70)'].map(item => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" />
                      <span className="text-xs text-gray-500 group-hover:text-primary transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Fragrância">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                  {['Citrus (12)', 'Floral (45)', 'Amadeirado (30)', 'Doce (25)', 'Fresco (18)'].map(item => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" />
                      <span className="text-xs text-gray-500 group-hover:text-primary transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Embalagem">
                <div className="space-y-2">
                  {['Frasco (85)', 'Refil (15)', 'Box (10)'].map(item => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" />
                      <span className="text-xs text-gray-500 group-hover:text-primary transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Kit">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" />
                    <span className="text-xs text-gray-500 group-hover:text-primary transition-colors">Sim (15)</span>
                  </label>
                </div>
              </FilterSection>

              <FilterSection title="Tamanho">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                  {['250ml (40)', '500ml (30)', '1L (15)', '200g (25)', '400g (20)'].map(item => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" />
                      <span className="text-xs text-gray-500 group-hover:text-primary transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Voltagem">
                <div className="space-y-2">
                  {['110v (5)', '220v (4)', 'Bivolt (8)'].map(item => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" />
                      <span className="text-xs text-gray-500 group-hover:text-primary transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <div className="py-4 border-t border-gray-50">
                <h4 className="font-bold text-sm text-gray-700 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Faixa de Preço
                </h4>
                <div className="px-2">
                  <input type="range" className="w-full accent-primary" min="0" max="5000" />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                    <span>R$ 0,00</span>
                    <span>R$ 5.000,00</span>
                  </div>
                </div>
              </div>

              <FilterSection title="Marcas" defaultOpen={true}>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                  {['Vichy (124)', 'La Roche (150)', 'Eucerin (80)', 'Avène (95)', 'Nivea (200)', 'L\'Oréal (180)', 'Dove (140)'].map(item => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" />
                      <span className="text-xs text-gray-500 group-hover:text-primary transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Subcategorias">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                  {['Skincare (300)', 'Cabelos (450)', 'Corpo e Banho (200)', 'Maquiagem (150)', 'Proteção Solar (120)'].map(item => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" />
                      <span className="text-xs text-gray-500 group-hover:text-primary transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-grow">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-display font-black text-gray-900">
              {subcategory || categoryTitle}
              <span className="ml-4 text-sm font-normal text-gray-400">
                {products?.length || 0} produtos encontrados
              </span>
            </h1>
            
            <select className="bg-white border-gray-200 rounded-full px-4 py-2 text-sm focus:ring-primary focus:border-primary outline-none">
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
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
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
