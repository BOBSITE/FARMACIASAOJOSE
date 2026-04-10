import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError('');
    try {
      const authPromise = supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      // Race the authentication against a 10 second timeout in case GoTrueClient hangs natively
      const timeoutPromise = new Promise<{ error: Error }>((_, reject) => 
        setTimeout(() => reject(new Error('A conexão expirou. Tente novamente.')), 10000)
      );

      const { error: authError } = await Promise.race([authPromise, timeoutPromise]) as any;

      if (authError) throw authError;

      // Force a full location reload to completely clear any stale GoTrue state if normal navigate hangs
      window.location.href = '/';
    } catch (err: any) {
      let message = 'E-mail ou senha incorretos.';
      if (err?.message) {
        if (err.message === 'Email not confirmed') {
          message = 'Por favor, verifique seu e-mail para confirmar o cadastro antes de entrar.';
        } else {
          message = err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-primary/5 border border-gray-100"
      >
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20 rotate-3">
            <span className="text-white font-black text-3xl">P</span>
          </div>
          <h1 className="text-3xl font-display font-black text-gray-900">Bem-vindo de volta!</h1>
          <p className="text-gray-500">Acesse sua conta para gerenciar seus pedidos e pontos.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('email')}
                type="email"
                placeholder="exemplo@email.com"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 ml-4">{errors.email.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 ml-4">{errors.password.message as string}</p>}
          </div>

          <div className="flex justify-end">
            <button type="button" className="text-xs font-bold text-primary hover:underline">Esqueceu a senha?</button>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar na Conta'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Ainda não tem uma conta?{' '}
            <Link to="/register" className="text-primary font-black hover:underline">Cadastre-se</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
