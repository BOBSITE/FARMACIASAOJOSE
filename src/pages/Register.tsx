import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { Mail, Lock, User, CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, handleSupabaseError } from '../lib/supabase';

const registerSchema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.name,
            cpf: data.cpf,
          }
        }
      });
      if (authError) throw authError;

      if (!authData.session) {
        alert('Cadastro realizado! Por favor, verifique seu e-mail (ou a caixa de spam) para confirmar a conta antes de fazer o login.');
        navigate('/login');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      let message = err.message || 'Erro ao criar conta.';
      if (message === 'User already registered') {
        message = 'Este e-mail já está cadastrado.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-primary/5 border border-gray-100"
      >
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-secondary/20 -rotate-3">
            <span className="text-white font-black text-3xl">P</span>
          </div>
          <h1 className="text-3xl font-display font-black text-gray-900">Crie sua conta</h1>
          <p className="text-gray-500">Junte-se ao nosso programa de fidelidade e economize.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('name')}
                placeholder="Seu nome"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 ml-4">{errors.name.message as string}</p>}
          </div>

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
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">CPF (Somente números)</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('cpf')}
                placeholder="00000000000"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              />
            </div>
            {errors.cpf && <p className="text-xs text-red-500 ml-4">{errors.cpf.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 ml-4">{errors.password.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Confirmar Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 ml-4">{errors.confirmPassword.message as string}</p>}
          </div>

          <button
            disabled={loading}
            type="submit"
            className="sm:col-span-2 w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? 'Criando conta...' : 'Cadastrar Agora'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary font-black hover:underline">Entrar</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
