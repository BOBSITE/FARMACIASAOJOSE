import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase, mapUserFromDb, handleSupabaseError } from './lib/supabase';
import { useAuthStore, useSettingsStore } from './lib/store';
import { UserProfile } from './types';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PDV from './pages/PDV';
import Category from './pages/Category';
import Search from './pages/Search';
import Categories from './pages/Categories';
import Account from './pages/Account';

export default function App() {
  const { setUser, setAuthReady } = useAuthStore();
  const { fetchSettings } = useSettingsStore();
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/dashboard');
  const isPDV = location.pathname.startsWith('/pdv');
  const hideLayout = isDashboard || isPDV;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Use an IIFE to prevent GoTrue from awaiting this execution and hanging
      (async () => {
      if (session?.user) {
        const uid = session.user.id;
        try {
          const { data: userRow, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', uid)
            .single();

          if (error && error.code === 'PGRST116') {
            // No profile found, create one
            console.log('No user profile found, creating new one...');
            const isAdminEmail = session.user.email === 'betvdoc@gmail.com';
            const newProfile = {
              id: uid,
              email: session.user.email || '',
              display_name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || '',
              cpf: session.user.user_metadata?.cpf || null,
              role: isAdminEmail ? 'ADMIN' : 'CLIENT',
              loyalty_points: 0,
            };
            const { error: insertError } = await supabase.from('users').insert(newProfile);
            if (insertError) {
              handleSupabaseError(insertError, 'INSERT', 'users');
            }
            setUser(mapUserFromDb(newProfile) as UserProfile);
          } else if (error) {
            handleSupabaseError(error, 'SELECT', 'users');
          } else if (userRow) {
            let profile = mapUserFromDb(userRow) as UserProfile;
            // Force admin role for the specific email if not already set
            if (session.user.email === 'betvdoc@gmail.com' && profile.role !== 'ADMIN') {
              console.log('Forcing ADMIN role for betvdoc@gmail.com');
              await supabase.from('users').update({ role: 'ADMIN' }).eq('id', uid);
              profile.role = 'ADMIN';
            }
            setUser(profile);
          }
        } catch (error) {
          handleSupabaseError(error, 'AUTH', `users/${uid}`);
        }
      } else {
        setUser(null);
      }
      setAuthReady(true);
      })();
    });

    // Load settings from DB
    fetchSettings();

    return () => subscription.unsubscribe();
  }, [setUser, setAuthReady, fetchSettings]);

  return (
    <div className="min-h-screen flex flex-col">
      {!hideLayout && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/pdv" element={<PDV />} />
          <Route path="/account" element={<Account />} />
          <Route path="/category/:categoryId" element={<Category />} />
          <Route path="/search" element={<Search />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
    </div>
  );
}
