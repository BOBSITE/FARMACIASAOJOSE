import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, LayoutGrid, Pill, Sparkles, Bath, Activity, Apple, Heart } from 'lucide-react';

const CATEGORIES_DATA = [
  {
    name: 'Medicamentos',
    icon: <Pill className="w-8 h-8" />,
    color: 'bg-blue-50 text-blue-600',
    slug: 'medicamentos',
    subcategories: ['Analgésicos', 'Anti-inflamatórios', 'Gripes e Resfriados', 'Antibióticos', 'Antialérgicos', 'Digestivos']
  },
  {
    name: 'Cosméticos e Beleza',
    icon: <Sparkles className="w-8 h-8" />,
    color: 'bg-pink-50 text-pink-600',
    slug: 'cosmeticos-e-beleza',
    subcategories: ['Skincare', 'Maquiagem', 'Cabelos', 'Perfumes', 'Proteção Solar', 'Dermocosméticos']
  },
  {
    name: 'Higiene Pessoal',
    icon: <Bath className="w-8 h-8" />,
    color: 'bg-green-50 text-green-600',
    slug: 'higiene-pessoal',
    subcategories: ['Banho', 'Desodorantes', 'Higiene Oral', 'Cuidados com Mãos e Pés', 'Higiene Íntima']
  },
  {
    name: 'Prod. Ortopédicos',
    icon: <Activity className="w-8 h-8" />,
    color: 'bg-purple-50 text-purple-600',
    slug: 'prod-ortopedicos',
    subcategories: ['Joelheiras', 'Tornozeleiras', 'Cintas', 'Tipoias', 'Palmilhas']
  },
  {
    name: 'Alimentos',
    icon: <Apple className="w-8 h-8" />,
    color: 'bg-orange-50 text-orange-600',
    slug: 'alimentos',
    subcategories: ['Suplementos', 'Barras de Cereal', 'Chás', 'Adoçantes', 'Alimentos Funcionais']
  },
  {
    name: 'Vida Saudável',
    icon: <Heart className="w-8 h-8" />,
    color: 'bg-red-50 text-red-600',
    slug: 'vida-saudavel',
    subcategories: ['Vitaminas', 'Minerais', 'Ômega 3', 'Colágeno', 'Emagrecedores']
  }
];

export default function Categories() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-4 mb-12">
        <div className="p-4 bg-primary/10 rounded-3xl text-primary">
          <LayoutGrid className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-black text-gray-900">Todas as Categorias</h1>
          <p className="text-gray-500">Navegue por todos os nossos departamentos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {CATEGORIES_DATA.map((cat, idx) => (
          <motion.div 
            key={cat.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary/20 transition-all group"
          >
            <div className="flex items-center justify-between mb-8">
              <div className={`p-4 rounded-3xl ${cat.color}`}>
                {cat.icon}
              </div>
              <Link 
                to={`/category/${cat.slug}`}
                className="text-primary font-bold flex items-center hover:underline"
              >
                Ver tudo <ChevronRight className="ml-1 w-4 h-4" />
              </Link>
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-6">{cat.name}</h2>

            <div className="grid grid-cols-1 gap-3">
              {cat.subcategories.map((sub) => (
                <Link 
                  key={sub}
                  to={`/category/${cat.slug}?sub=${sub}`}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 text-gray-600 hover:text-primary transition-all group/item"
                >
                  <span className="font-medium">{sub}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
