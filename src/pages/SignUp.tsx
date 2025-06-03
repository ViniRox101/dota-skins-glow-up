import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!email || !password || !fullName) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Iniciando registro com:', { email, fullName });
      
      // Registra o usuário com email e senha
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: window.location.origin + '/login'
        }
      });
      
      console.log('Resposta do registro:', data);
      
      if (signUpError) {
        console.error('Erro no registro:', signUpError);
        throw signUpError;
      }
      
      // Verifica se o usuário foi criado com sucesso
      if (data && data.user) {
        // Redireciona para a página de login após o registro
        navigate('/login', { 
          state: { 
            message: 'Conta criada com sucesso! Verifique seu email para confirmar o cadastro.' 
          } 
        });
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro capturado:', err);
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-game-dark text-white">
      <Card className="w-full max-w-md bg-game-dark border border-neon-green/20 shadow-lg shadow-neon-green/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-neon-green">Criar Conta</CardTitle>
          <CardDescription className="text-gray-400">Insira seu e-mail e senha para criar uma nova conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">Nome Completo</label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1 block w-full bg-gray-800 border-gray-700 text-white focus:border-neon-green"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">E-mail</label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full bg-gray-800 border-gray-700 text-white focus:border-neon-green"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Senha</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full bg-gray-800 border-gray-700 text-white focus:border-neon-green"
                minLength={6}
              />
            </div>
            {error && (
              <div className="p-3 rounded bg-red-900/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-neon-green text-game-dark hover:bg-neon-green/90" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar'
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-400">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-medium text-neon-green hover:text-neon-green/80">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;