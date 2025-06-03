import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn, resetPassword } from '../integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  // Verifica se há uma mensagem de sucesso vinda da página de registro
  useEffect(() => {
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      // Limpa a mensagem do histórico de navegação
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Limpa erros anteriores
    setSuccessMessage(null); // Limpa mensagens de sucesso
    setLoading(true);

    try {
      await signIn(email, password);
      console.log('Login bem-sucedido!');
      navigate('/'); // Redireciona para a página inicial após o login bem-sucedido
    } catch (err: any) {
      console.error('Erro de login:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setResetLoading(true);

    if (!email || !email.includes('@')) {
      setError('Por favor, insira um email válido.');
      setResetLoading(false);
      return;
    }

    try {
      await resetPassword(email);
      setSuccessMessage('Enviamos um link de recuperação para o seu email.');
      // Não voltamos automaticamente para a tela de login para que o usuário possa ver a mensagem
    } catch (err: any) {
      console.error('Erro ao solicitar recuperação de senha:', err);
      setError(err.message || 'Erro ao solicitar recuperação de senha.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-game-dark text-white">
      <Card className="w-[380px] bg-game-dark border border-neon-green/20 shadow-lg shadow-neon-green/10 animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          {forgotPassword ? (
            <>
              <CardTitle className="text-3xl font-bold text-neon-green glow-text">Recuperar Senha</CardTitle>
              <CardDescription className="text-gray-400">Enviaremos um link para redefinir sua senha.</CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-3xl font-bold text-neon-green glow-text">Login</CardTitle>
              <CardDescription className="text-gray-400">Entre com suas credenciais para acessar sua conta.</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {forgotPassword ? (
            <form onSubmit={handleResetPassword}>
              <div className="grid gap-4">
                {successMessage && (
                  <div className="p-3 rounded bg-green-900/30 text-green-400 text-sm text-center">
                    {successMessage}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="reset-email" className="text-gray-300">Email</Label>
                  <Input 
                    id="reset-email" 
                    type="email" 
                    placeholder="seuemail@exemplo.com" 
                    className="bg-game-dark border-neon-green/30 text-white placeholder:text-gray-500 focus:border-neon-green focus:ring-neon-green" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                  />
                </div>
                {error && (
                  <div className="p-3 rounded bg-red-900/30 text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-neon-green text-game-dark font-bold hover:bg-neon-green/90 transition-colors duration-300 shadow-md shadow-neon-green/20"
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Link de Recuperação'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full text-neon-green hover:bg-neon-green/10 transition-colors duration-300"
                  onClick={() => setForgotPassword(false)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o Login
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                {successMessage && (
                  <div className="p-3 rounded bg-green-900/30 text-green-400 text-sm text-center">
                    {successMessage}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seuemail@exemplo.com" 
                    className="bg-game-dark border-neon-green/30 text-white placeholder:text-gray-500 focus:border-neon-green focus:ring-neon-green" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-gray-300">Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="********" 
                    className="bg-game-dark border-neon-green/30 text-white placeholder:text-gray-500 focus:border-neon-green focus:ring-neon-green" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                  />
                  <div className="text-right">
                    <button 
                      type="button" 
                      className="text-neon-green text-sm hover:underline focus:outline-none"
                      onClick={() => setForgotPassword(true)}
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="p-3 rounded bg-red-900/30 text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-neon-green text-game-dark font-bold hover:bg-neon-green/90 transition-colors duration-300 shadow-md shadow-neon-green/20"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
                <div className="text-center mt-4">
                  <p className="text-gray-400 text-sm">
                    Não tem uma conta?{' '}
                    <a href="/signup" className="text-neon-green hover:underline">
                      Registre-se
                    </a>
                  </p>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;