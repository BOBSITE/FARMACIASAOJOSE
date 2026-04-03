import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ArrowRight, Zap, ShieldCheck, Truck, Clock, Star, MapPin, Phone, Mail, Globe, Share2, MessageCircle } from 'lucide-react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';

const BANNERS = [
  {
    title: "Sua saúde em primeiro lugar 💚",
    subtitle: "Os melhores medicamentos e cuidados para você e sua família.",
    image: "https://famaciasaojose.robert1588.workers.dev/banner1.png",
    color: "from-green-600 to-green-400",
    badge: "Confiança & Cuidado"
  },
  {
    title: "Semana da Higiene 🧴",
    subtitle: "Descontos imperdíveis em produtos de higiene pessoal e beleza.",
    image: "https://famaciasaojose.robert1588.workers.dev/banner2.png",
    color: "from-blue-600 to-blue-400",
    badge: "Ofertas Especiais"
  },
  {
    title: "Linha de Suplementos ⚡",
    subtitle: "Energia e disposição para o seu dia a dia. Confira nossa linha completa.",
    image: "https://famaciasaojose.robert1588.workers.dev/banner3.png",
    color: "from-orange-600 to-orange-400",
    badge: "Performance & Saúde"
  },
  {
    title: "Cuidados Infantis 🧸",
    subtitle: "Tudo para o conforto e saúde do seu bebê. Marcas premium com preços baixos.",
    image: "https://famaciasaojose.robert1588.workers.dev/banner4.png",
    color: "from-pink-500 to-rose-400",
    badge: "Mamãe & Bebê"
  },
  {
    title: "Dermocosméticos ✨",
    subtitle: "Sua pele merece o melhor tratamento. Confira nossa seleção de skincare.",
    image: "https://famaciasaojose.robert1588.workers.dev/banner5.png",
    color: "from-purple-600 to-indigo-400",
    badge: "Beleza & Estética"
  }
];

export default function Home() {
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products-featured'],
    queryFn: async () => {
      const path = 'products';
      try {
        const q = query(collection(db, path), limit(8));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    }
  });

  return (
    <div className="space-y-16 pb-20 bg-gray-50/50">
      {/* Hero Section Slider */}
      <section className="relative h-[500px] sm:h-[600px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${BANNERS[currentBanner].image})` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${BANNERS[currentBanner].color} opacity-80`}></div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center relative z-10">
              <div className="max-w-2xl text-white space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="inline-block bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-sm font-bold mb-4 border border-white/30">
                    {BANNERS[currentBanner].badge}
                  </span>
                  <h1 className="text-5xl sm:text-7xl font-display font-black leading-tight drop-shadow-lg">
                    {BANNERS[currentBanner].title}
                  </h1>
                  <p className="text-xl text-white/90 font-medium max-w-lg mt-4 drop-shadow-md">
                    {BANNERS[currentBanner].subtitle}
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-4 pt-4"
                >
                  <Link to="/catalog" className="bg-white text-gray-900 font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-all flex items-center group shadow-xl">
                    Ver Ofertas <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/register" className="bg-transparent border-2 border-white text-white font-bold px-10 py-4 rounded-full hover:bg-white/10 transition-all backdrop-blur-sm">
                    Cadastre-se
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slider Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentBanner(i)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentBanner === i ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
          <div className="flex items-center space-x-4 p-2">
            <div className="p-4 bg-green-50 rounded-2xl text-green-600">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">Frete Grátis</p>
              <p className="text-xs text-gray-400">Acima de R$ 150</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-2">
            <div className="p-4 bg-red-50 rounded-2xl text-red-600">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">Entrega Rápida</p>
              <p className="text-xs text-gray-400">Em até 2 horas</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-2">
            <div className="p-4 bg-yellow-50 rounded-2xl text-yellow-600">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">Compra Segura</p>
              <p className="text-xs text-gray-400">100% Protegida</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-2">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">Pague com PIX</p>
              <p className="text-xs text-gray-400">Desconto extra</p>
            </div>
          </div>
        </div>
      </div>

      {/* Departamentos Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-black text-gray-900">Departamentos</h2>
          <div className="w-20 h-1.5 bg-green-600 mx-auto mt-4 rounded-full"></div>
          <p className="text-gray-500 mt-4">Tudo o que você precisa para sua saúde e bem-estar</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-6">
          {[
            { name: 'Medicamentos', icon: '💊', color: 'bg-blue-50', hover: 'hover:bg-blue-100' },
            { name: 'Higiene Pessoal', icon: '🧼', color: 'bg-green-50', hover: 'hover:bg-green-100' },
            { name: 'Beleza', icon: '💄', color: 'bg-pink-50', hover: 'hover:bg-pink-100' },
            { name: 'Mamãe & Bebê', icon: '👶', color: 'bg-yellow-50', hover: 'hover:bg-yellow-100' },
            { name: 'Suplementos', icon: '🍊', color: 'bg-orange-50', hover: 'hover:bg-orange-100' },
            { name: 'Ortopédicos', icon: '🩼', color: 'bg-purple-50', hover: 'hover:bg-purple-100' },
            { name: 'Dermocosméticos', icon: '✨', color: 'bg-indigo-50', hover: 'hover:bg-indigo-100' },
            { name: 'Conveniência', icon: '🍫', color: 'bg-amber-50', hover: 'hover:bg-amber-100' },
          ].map((cat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`${cat.color} ${cat.hover} p-4 sm:p-6 rounded-[2rem] flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-sm hover:shadow-xl border border-transparent min-h-[160px]`}
            >
              <span className="text-4xl sm:text-5xl mb-3 block drop-shadow-md">{cat.icon}</span>
              <span className="text-[10px] sm:text-xs font-black text-gray-800 uppercase leading-tight">{cat.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Product Section 1: Saúde e Bem Estar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-4">
          <div className="text-center md:text-left">
            <p className="text-red-600 text-sm font-bold mb-1">Aproveite!</p>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-gray-800">Para a sua Saúde e Bem Estar!</h2>
          </div>
          <Link to="/catalog" className="text-primary font-bold flex items-center hover:underline">
            Ver Todos <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] h-[400px] animate-pulse shadow-sm"></div>
            ))
          ) : (
            products?.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      {/* Product Section 2: Completar Farmacinha */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-4">
          <div className="text-center md:text-left">
            <p className="text-red-600 text-sm font-bold mb-1">Aproveite!</p>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-gray-800">Para Completar a sua Farmacinha!</h2>
          </div>
          <Link to="/catalog" className="text-primary font-bold flex items-center hover:underline">
            Ver Todos <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] h-[400px] animate-pulse shadow-sm"></div>
            ))
          ) : (
            products?.slice(4, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      {/* Product Section 3: Combos Imperdíveis */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-4">
          <div className="text-center md:text-left">
            <p className="text-red-600 text-sm font-bold mb-1">Para a sua Rotina</p>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-gray-800">Combos Imperdíveis!</h2>
          </div>
          <Link to="/catalog" className="text-primary font-bold flex items-center hover:underline">
            Ver Todos <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] h-[400px] animate-pulse shadow-sm"></div>
            ))
          ) : (
            products?.slice(2, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      {/* Product Section 4: Melhores Ofertas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-4">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-1">
              <Zap className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="font-black uppercase tracking-widest text-xs text-red-600">Aproveite as</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-gray-800">Melhores Ofertas para Você!</h2>
          </div>
          <Link to="/catalog" className="bg-green-600 text-white font-bold px-8 py-3 rounded-full hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center">
            Ver Todos <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] h-[400px] animate-pulse shadow-sm"></div>
            ))
          ) : (
            products?.slice(1, 5).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[3rem] overflow-hidden shadow-xl border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-12 sm:p-20 space-y-8">
              <div className="inline-block bg-green-50 text-green-700 px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest">
                Nossa História
              </div>
              <h2 className="text-4xl sm:text-5xl font-display font-black text-gray-900 leading-tight">
                Uma farmácia que cuida de você como família
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Na Farmácia São José, acreditamos que saúde vai além de medicamentos. É sobre cuidado, atenção e estar presente nos momentos que você mais precisa. Há anos servindo a comunidade de Caucaia com dedicação e profissionalismo.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <p className="text-4xl font-black text-green-600">15+</p>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Anos de História</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-black text-green-600">10k+</p>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Clientes Felizes</p>
                </div>
              </div>
              <button className="bg-gray-900 text-white font-bold px-10 py-4 rounded-full hover:bg-gray-800 transition-all shadow-xl">
                Conheça Nossa Equipe
              </button>
            </div>
            <div className="relative h-[400px] lg:h-auto">
              <img 
                src="https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=1200" 
                alt="Interior da Farmácia São José" 
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent lg:hidden"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Venha nos Visitar Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-display font-black text-gray-900">Venha nos Visitar</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 uppercase text-sm tracking-wider">Endereço</h4>
                  <p className="text-gray-500 mt-1">Rua Exemplo, 123 - Centro, Caucaia - CE</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 uppercase text-sm tracking-wider">Horário de Funcionamento</h4>
                  <p className="text-gray-500 mt-1">Segunda a Sábado: 07:00 às 22:00</p>
                  <p className="text-gray-500">Domingos e Feriados: 08:00 às 20:00</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 uppercase text-sm tracking-wider">Telefone / WhatsApp</h4>
                  <p className="text-gray-500 mt-1">(85) 99999-9999</p>
                </div>
              </div>
            </div>
            <button className="w-full sm:w-auto bg-green-600 text-white font-bold px-10 py-4 rounded-full hover:bg-green-700 transition-all shadow-lg flex items-center justify-center">
              Como Chegar <MapPin className="ml-2 w-5 h-5" />
            </button>
          </div>
          <div className="h-[400px] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.34756531398!2d-38.659345!3d-3.731861!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c74c1000000000%3A0x0!2zM8KwNDMnNTQuNyJTIDM4wrAzOSczMy42Ilc!5e0!3m2!1spt-BR!2sbr!4v1625584500000!5m2!1spt-BR!2sbr" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy"
              title="Localização Farmácia São José"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Fale com a gente Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-green-600 rounded-[3rem] p-8 sm:p-16 text-white relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-display font-black leading-tight">Fale com a gente</h2>
              <p className="text-xl text-green-50 opacity-90">
                Dúvidas, sugestões ou pedidos especiais? Nossa equipe está pronta para te atender com toda atenção.
              </p>
              <div className="flex flex-col space-y-4 pt-4">
                <a href="https://wa.me/5585999999999" target="_blank" rel="noreferrer" className="flex items-center space-x-4 bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all backdrop-blur-sm border border-white/10">
                  <div className="p-3 bg-green-500 rounded-xl">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase opacity-70">WhatsApp</p>
                    <p className="text-lg font-black">(85) 99999-9999</p>
                  </div>
                </a>
                <div className="flex items-center space-x-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase opacity-70">E-mail</p>
                    <p className="text-lg font-black">contato@farmaciasaojose.com</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <a href="#" className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all border border-white/10">
                  <Globe className="w-6 h-6" />
                </a>
                <a href="#" className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all border border-white/10">
                  <Share2 className="w-6 h-6" />
                </a>
              </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl text-gray-900">
              <h3 className="text-2xl font-black mb-6">Envie sua mensagem</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input placeholder="Seu Nome" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-green-600" />
                  <input placeholder="Seu E-mail" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-green-600" />
                </div>
                <input placeholder="Assunto" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-green-600" />
                <textarea placeholder="Sua Mensagem" rows={4} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-green-600 resize-none"></textarea>
                <button className="w-full bg-green-600 text-white font-black py-5 rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 active:scale-95">
                  Enviar Mensagem
                </button>
              </form>
            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>
        </div>
      </section>
    </div>
  );
}

