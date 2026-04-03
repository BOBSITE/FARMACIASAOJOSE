import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, LogOut, LayoutDashboard, Monitor, ChevronDown, Plus, ShoppingBag } from 'lucide-react';
import { useAuthStore, useCartStore } from '../lib/store';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = async () => {
    await signOut(auth);
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="bg-primary text-white py-2 px-4 text-center text-sm font-medium">
        Frete grátis em compras acima de R$ 150,00! 🚚
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="https://famaciasaojose.robert1588.workers.dev/logo.png" 
              alt="Farmácia São José" 
              className="h-12 sm:h-16 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full flex items-center bg-gray-100 rounded-full overflow-hidden group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar medicamentos, cosméticos, higiene..."
                className="flex-grow bg-transparent border-none py-3 px-6 focus:ring-0 text-sm"
              />
              <button type="submit" className="bg-[#2E7D32] text-white p-3 hover:bg-[#1B5E20] transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* User Account */}
            <div className="hidden lg:flex items-center space-x-3 text-gray-500 relative" ref={menuRef}>
              <div className="p-2 bg-gray-100 rounded-full">
                <User className="w-6 h-6" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-[10px] font-medium">Olá, bem-vindo!</p>
                <button 
                  onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : navigate('/login')}
                  className="text-sm font-bold text-gray-800 hover:text-primary transition-colors flex items-center"
                >
                  <span>{user ? user.displayName.split(' ')[0] : 'Minha Conta'}</span>
                  {user && <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />}
                </button>
              </div>

              <AnimatePresence>
                {isUserMenuOpen && user && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 overflow-hidden z-[110]"
                  >
                    <div className="px-4 py-2 border-b border-gray-50 mb-2">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Minha Conta</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                      <p className="text-xs font-bold text-primary mt-1">{user.loyaltyPoints} pontos</p>
                    </div>

                    <Link 
                      to="/account" 
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      <User className="w-5 h-5 mr-3" /> Meus Dados
                    </Link>

                    {user.role === 'CLIENT' && (
                      <Link 
                        to="/account?tab=orders" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <ShoppingBag className="w-5 h-5 mr-3" /> Meus Pedidos
                      </Link>
                    )}

                    {user.role === 'ADMIN' && (
                      <Link 
                        to="/dashboard" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <LayoutDashboard className="w-5 h-5 mr-3" /> Painel Admin
                      </Link>
                    )}
                    {(user.role === 'ADMIN' || user.role === 'FARMACEUTICO' || user.role === 'ATENDENTE') && (
                      <Link 
                        to="/pdv" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <Monitor className="w-5 h-5 mr-3" /> Frente de Caixa
                      </Link>
                    )}
                    <div className="mt-2 pt-2 border-t border-gray-50">
                      <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center px-4 py-3 text-sm text-secondary hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-5 h-5 mr-3" /> Sair da Conta
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <Link to="/cart" className="flex items-center space-x-3 group">
              <div className="relative p-2 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <p className="text-[10px] font-medium text-gray-500">Meu</p>
                <p className="text-sm font-bold text-gray-800">Carrinho</p>
              </div>
            </Link>

            {/* WhatsApp */}
            <a 
              href="https://wa.me/5500000000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden lg:flex items-center space-x-2 bg-[#25D366] text-white px-5 py-2.5 rounded-full font-bold hover:bg-[#128C7E] transition-all shadow-md active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* Mobile Menu */}
            <button className="md:hidden p-2 hover:bg-gray-100 rounded-full">
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Category Bar */}
      <div className="hidden md:block">
        <CategoryBar />
      </div>
    </nav>
  );
}

function CategoryBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const categories = [
    { name: 'Ofertas da Semana 🔥', highlight: true, slug: 'ofertas' },
    { name: 'Medicamentos', hasMegaMenu: true, slug: 'medicamentos' },
    { name: 'Higiene Pessoal', slug: 'higiene-pessoal' },
    { name: 'Cosméticos e Beleza', slug: 'cosmeticos-e-beleza' },
    { name: 'Mamãe & Bebê', slug: 'mamae-e-bebe' },
    { name: 'Suplementos', slug: 'suplementos' },
    { name: 'Ortopédicos', slug: 'prod-ortopedicos' },
  ];

  const subcategories = [
    'Analgésicos', 'Anti-inflamatórios', 'Gripes e Resfriados', 
    'Antibióticos', 'Antialérgicos', 'Digestivos', 
    'Dermatológicos', 'Oftalmológicos', 'Primeiros Socorros', 'Antissépiticos'
  ];

  const products = [
    'Dipirona', 'Paracetamol', 'Ibuprofeno', 
    'Ácido Acetilsalicílico (AAS)', 'Novalgina', 'Dorflex', 'Torsilax'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-[#2E7D32] text-white relative">
      <div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative"
        onMouseLeave={() => setActiveMenu(null)}
      >
        <div className="flex items-center h-12 overflow-x-auto no-scrollbar">
          {/* Todas as Categorias */}
          <Link to="/categories" className="flex items-center space-x-2 bg-[#1B5E20] h-full px-6 font-bold whitespace-nowrap hover:bg-[#144317] transition-colors">
            <Menu className="w-5 h-5" />
            <span>Todas as categorias</span>
          </Link>

          {/* Other Categories */}
          <div className="flex items-center h-full ml-4 space-x-6">
            {categories.map((cat) => (
              <div key={cat.name} className="h-full relative group">
                <Link 
                  to={`/category/${cat.slug}`}
                  onMouseEnter={() => setActiveMenu(cat.hasMegaMenu ? cat.name : null)}
                  className={`h-full text-sm font-bold whitespace-nowrap transition-colors flex items-center space-x-1 ${
                    cat.highlight ? 'text-[#FFEB3B]' : 'text-white hover:text-white/80'
                  }`}
                >
                  <span>{cat.name}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Mega Menu for Medicamentos - Moved outside scrolling container to avoid overflow issues */}
        <AnimatePresence>
          {activeMenu === 'Medicamentos' && (
            <div 
              ref={menuRef}
              className="absolute top-full left-[280px] w-[600px] bg-white text-gray-800 shadow-2xl rounded-b-2xl border-t-4 border-[#2E7D32] z-[100] flex animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {/* Sidebar */}
              <div className="w-1/3 bg-gray-50 border-r border-gray-100 py-4">
                {subcategories.map((sub, idx) => (
                  <Link 
                    key={sub}
                    to={`/category/medicamentos?sub=${sub}`}
                    className={`block w-full text-left px-6 py-2 text-sm font-medium transition-colors ${
                      idx === 0 ? 'bg-[#E8F5E9] text-[#2E7D32] border-l-4 border-[#2E7D32]' : 'hover:bg-gray-100'
                    }`}
                  >
                    {sub}
                  </Link>
                ))}
              </div>
              {/* Content */}
              <div className="w-2/3 p-6 grid grid-cols-2 gap-4">
                {products.map((prod) => (
                  <Link 
                    key={prod} 
                    to={`/search?q=${prod}`}
                    className="text-sm text-gray-600 hover:text-primary transition-colors"
                  >
                    {prod}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
