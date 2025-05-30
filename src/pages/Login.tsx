import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js'; // Importar createClient

// Inicializar o cliente Supabase (substitua com suas variáveis de ambiente)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key not set in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Limpa erros anteriores

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('Erro de login:', error);
      setError(error.message);
    } else if (data.user) {
      console.log('Login bem-sucedido:', data.user);
      // Redireciona para o painel de administração após o login bem-sucedido
      navigate('/admin');
    } else {
      // Caso não haja erro, mas também não haja usuário (pode acontecer em alguns cenários)
      setError('Credenciais inválidas.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-game-dark text-white">
      <Card className="w-[380px] bg-game-dark border border-neon-green/20 shadow-lg shadow-neon-green/10 animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-neon-green glow-text">Login</CardTitle>
          <CardDescription className="text-gray-400">Entre com suas credenciais para acessar sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-300">Email ou Usuário</Label>
                <Input id="email" type="text" placeholder="seuemail@exemplo.com" className="bg-game-dark border-neon-green/30 text-white placeholder:text-gray-500 focus:border-neon-green focus:ring-neon-green" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-gray-300">Senha</Label>
                <Input id="password" type="password" placeholder="********" className="bg-game-dark border-neon-green/30 text-white placeholder:text-gray-500 focus:border-neon-green focus:ring-neon-green" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full bg-neon-green text-game-dark font-bold hover:bg-neon-green/90 transition-colors duration-300 shadow-md shadow-neon-green/20">Entrar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;