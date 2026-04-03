import { Mail, Phone, MapPin, Globe, Share2, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center">
              <img 
                src="https://famaciasaojose.robert1588.workers.dev/logo.png" 
                alt="Farmácia São José" 
                className="h-16 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              Sua saúde em primeiro lugar. Oferecemos os melhores medicamentos, dermocosméticos e produtos de higiene com atendimento humanizado em Caucaia-CE.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-3 bg-gray-50 rounded-full text-gray-400 hover:bg-green-600 hover:text-white transition-all hover:shadow-lg hover:shadow-green-600/20">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="p-3 bg-gray-50 rounded-full text-gray-400 hover:bg-blue-600 hover:text-white transition-all hover:shadow-lg hover:shadow-blue-600/20">
                <Share2 className="w-5 h-5" />
              </a>
              <a href="#" className="p-3 bg-gray-50 rounded-full text-gray-400 hover:bg-green-500 hover:text-white transition-all hover:shadow-lg hover:shadow-green-500/20">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-black text-gray-900 mb-6 uppercase text-xs tracking-widest">Institucional</h3>
            <ul className="space-y-3 text-sm text-gray-500 font-medium">
              <li><Link to="/about" className="hover:text-green-600 transition-colors">Sobre Nós</Link></li>
              <li><Link to="/stores" className="hover:text-green-600 transition-colors">Nossas Lojas</Link></li>
              <li><Link to="/careers" className="hover:text-green-600 transition-colors">Trabalhe Conosco</Link></li>
              <li><Link to="/privacy" className="hover:text-green-600 transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/terms" className="hover:text-green-600 transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-black text-gray-900 mb-6 uppercase text-xs tracking-widest">Atendimento</h3>
            <ul className="space-y-3 text-sm text-gray-500 font-medium">
              <li><Link to="/help" className="hover:text-green-600 transition-colors">Central de Ajuda</Link></li>
              <li><Link to="/orders" className="hover:text-green-600 transition-colors">Meus Pedidos</Link></li>
              <li><Link to="/returns" className="hover:text-green-600 transition-colors">Trocas e Devoluções</Link></li>
              <li><Link to="/contact" className="hover:text-green-600 transition-colors">Fale Conosco</Link></li>
              <li><span className="text-gray-900 font-bold">SAC: (85) 99999-9999</span></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="font-black text-gray-900 mb-6 uppercase text-xs tracking-widest">Contato</h3>
            <div className="flex items-start space-x-3 text-sm text-gray-500 font-medium">
              <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p>Rua Exemplo, 123 - Centro<br />Caucaia - CE, 61600-000</p>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-500 font-medium">
              <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p>(85) 99999-9999</p>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-500 font-medium">
              <Mail className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p>contato@farmaciasaojose.com</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          <p>© 2026 Farmácia São José. Todos os direitos reservados.</p>
          <div className="flex items-center space-x-4">
            <p>CNPJ: 00.000.000/0001-00</p>
            <p>Farmacêutico Responsável: Dr. Exemplo - CRF/CE 0000</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

