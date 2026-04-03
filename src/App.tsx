import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, seedProducts } from './lib/firebase';
import { useAuthStore } from './lib/store';
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
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/dashboard');
  const isPDV = location.pathname.startsWith('/pdv');
  const hideLayout = isDashboard || isPDV;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const path = `users/${firebaseUser.uid}`;
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let profile: UserProfile;

          if (userDoc.exists()) {
            profile = userDoc.data() as UserProfile;
            console.log('User profile found:', profile);
            // Force admin role for the specific email if not already set
            if (firebaseUser.email === 'betvdoc@gmail.com' && profile.role !== 'ADMIN') {
              console.log('Forcing ADMIN role for betvdoc@gmail.com');
              profile.role = 'ADMIN';
              await setDoc(doc(db, 'users', firebaseUser.uid), { role: 'ADMIN' }, { merge: true });
            }
            setUser(profile);
            if (profile.role === 'ADMIN') {
              seedProducts();
            }
          } else {
            console.log('No user profile found, creating new one...');
            const isAdminEmail = firebaseUser.email === 'betvdoc@gmail.com';
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              role: isAdminEmail ? 'ADMIN' : 'CLIENT',
              loyaltyPoints: 0,
              createdAt: new Date().toISOString(),
            };
            console.log('New profile:', newProfile);
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUser(newProfile);
            if (newProfile.role === 'ADMIN') {
              seedProducts();
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, path);
        }
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser, setAuthReady]);

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
