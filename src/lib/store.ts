import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, CartItem } from '../types';
import { supabase } from './supabase';

interface AuthState {
  user: UserProfile | null;
  isAuthReady: boolean;
  setUser: (user: UserProfile | null) => void;
  setAuthReady: (ready: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthReady: false,
      setUser: (user) => set({ user }),
      setAuthReady: (ready) => set({ isAuthReady: ready }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.id === item.id);
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((i) =>
          i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
        ),
      })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
    }
  )
);

export interface Banner {
  title: string;
  subtitle: string;
  image: string;
  color: string;
  badge: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  primaryButtonVisible?: boolean;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  secondaryButtonVisible?: boolean;
}

export interface StoreSettings {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  hoursWeekday: string;
  hoursWeekend: string;
  aboutText: string;
  aboutImage: string;
  yearsOfHistory: string;
  happyClients: string;
  banners: Banner[];
}

interface SettingsState {
  settings: StoreSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  fetchSettings: () => Promise<void>;
  saveSettings: (newSettings: StoreSettings) => Promise<void>;
}

export const DEFAULT_BANNERS: Banner[] = [
  {
    title: "Sua saúde em primeiro lugar 💚",
    subtitle: "Os melhores medicamentos e cuidados para você e sua família.",
    image: "https://famaciasaojose.robert1588.workers.dev/banner1.png",
    color: "from-green-600 to-green-400",
    badge: "Confiança & Cuidado",
    primaryButtonText: "Ver Ofertas",
    primaryButtonLink: "/catalog",
    primaryButtonVisible: true,
    secondaryButtonText: "Cadastre-se",
    secondaryButtonLink: "/register",
    secondaryButtonVisible: true
  },
  {
    title: "Semana da Higiene 🧴",
    subtitle: "Descontos imperdíveis em produtos de higiene pessoal e beleza.",
    image: "https://famaciasaojose.robert1588.workers.dev/banner2.png",
    color: "from-blue-600 to-blue-400",
    badge: "Ofertas Especiais",
    primaryButtonText: "Ver Ofertas",
    primaryButtonLink: "/catalog",
    primaryButtonVisible: true,
    secondaryButtonText: "Saiba Mais",
    secondaryButtonLink: "/about",
    secondaryButtonVisible: true
  },
  {
    title: "Linha de Suplementos ⚡",
    subtitle: "Energia e disposição para o seu dia a dia. Confira nossa linha completa.",
    image: "https://famaciasaojose.robert1588.workers.dev/banner3.png",
    color: "from-orange-600 to-orange-400",
    badge: "Performance & Saúde",
    primaryButtonText: "Ver Suplementos",
    primaryButtonLink: "/catalog?category=suplementos",
    primaryButtonVisible: true,
    secondaryButtonText: "Consultar",
    secondaryButtonLink: "/contact",
    secondaryButtonVisible: true
  },
  {
    title: "Cuidados Infantis 🧸",
    subtitle: "Tudo para o conforto e saúde do seu bebê. Marcas premium com preços baixos.",
    image: "https://famaciasaojose.robert1588.workers.dev/banner4.png",
    color: "from-pink-500 to-rose-400",
    badge: "Mamãe & Bebê",
    primaryButtonText: "Ver Produtos",
    primaryButtonLink: "/catalog?category=infantil",
    primaryButtonVisible: true,
    secondaryButtonText: "Cadastre-se",
    secondaryButtonLink: "/register",
    secondaryButtonVisible: true
  },
  {
    title: "Dermocosméticos ✨",
    subtitle: "Sua pele merece o melhor tratamento. Confira nossa seleção de skincare.",
    image: "https://famaciasaojose.robert1588.workers.dev/banner5.png",
    color: "from-purple-600 to-indigo-400",
    badge: "Beleza & Estética",
    primaryButtonText: "Ver Promoções",
    primaryButtonLink: "/catalog?category=beleza",
    primaryButtonVisible: true,
    secondaryButtonText: "Especialista",
    secondaryButtonLink: "/contact",
    secondaryButtonVisible: true
  }
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: {
        name: 'Farmácia São José - Matriz',
        cnpj: '12.345.678/0001-90',
        email: 'contato@farmaciasaojose.com.br',
        phone: '(85) 99999-9999',
        address: 'Rua Exemplo, 123 - Centro, Caucaia - CE, 61600-000',
        hoursWeekday: 'Segunda a Sábado: 07:00 às 22:00',
        hoursWeekend: 'Domingos e Feriados: 08:00 às 20:00',
        aboutText: 'Na Farmácia São José, acreditamos que saúde vai além de medicamentos. É sobre cuidado, atenção e estar presente nos momentos que você mais precisa. Há anos servindo a comunidade com dedicação e profissionalismo.',
        aboutImage: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=1200',
        yearsOfHistory: '15+',
        happyClients: '10k+',
        banners: DEFAULT_BANNERS
      },
      isLoading: false,
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      fetchSettings: async () => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'store_config')
            .single();
          
          if (data?.value) {
            set({ settings: { ...get().settings, ...data.value } });
          }
        } catch (error) {
          console.error('Error fetching settings:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      saveSettings: async (newSettings) => {
        set({ isLoading: true });
        try {
          const { error } = await supabase
            .from('settings')
            .upsert({ 
              key: 'store_config', 
              value: newSettings,
              updated_at: new Date().toISOString()
            });
          
          if (error) throw error;
          set({ settings: newSettings });
        } catch (error) {
          console.error('Error saving settings:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'settings-storage',
    }
  )
);
