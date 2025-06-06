import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  steam_id: string | null;
  steam_id_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

const SteamIdManager: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [newSteamId, setNewSteamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [canUpdate, setCanUpdate] = useState(false);
  const [nextUpdateDate, setNextUpdateDate] = useState<Date | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao carregar perfil:', profileError);
        setError('Erro ao carregar perfil do usuário');
        return;
      }

      setProfile(profileData);
      setNewSteamId(profileData.steam_id || '');
      
      // Verificar se pode atualizar o Steam ID
      if (profileData.steam_id_updated_at) {
        const lastUpdate = new Date(profileData.steam_id_updated_at);
        const nextUpdate = new Date(lastUpdate.getTime() + (40 * 24 * 60 * 60 * 1000)); // 40 dias
        const now = new Date();
        
        setCanUpdate(now >= nextUpdate);
        setNextUpdateDate(nextUpdate);
      } else {
        setCanUpdate(true);
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSteamId = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSteamId.trim()) {
      setError('Por favor, insira um Steam ID válido');
      return;
    }

    if (!profile) {
      setError('Perfil não carregado');
      return;
    }

    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ steam_id: newSteamId.trim() })
        .eq('user_id', profile.user_id);

      if (updateError) {
        throw updateError;
      }

      setSuccess('Steam ID atualizado com sucesso!');
      await loadUserProfile(); // Recarregar dados
    } catch (err: any) {
      console.error('Erro ao atualizar Steam ID:', err);
      setError(err.message || 'Erro ao atualizar Steam ID');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilUpdate = () => {
    if (!nextUpdateDate) return 0;
    const now = new Date();
    const diffTime = nextUpdateDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md bg-game-dark border border-neon-green/20">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-neon-green" />
          <span className="ml-2 text-white">Carregando...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-game-dark border border-neon-green/20 shadow-lg shadow-neon-green/10">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-neon-green">Gerenciar Steam ID</CardTitle>
        <CardDescription className="text-gray-400">
          Atualize seu Steam ID. Alterações só são permitidas a cada 40 dias.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Steam ID Atual
              </label>
              <div className="p-2 bg-gray-800 rounded border border-gray-700 text-white">
                {profile.steam_id || 'Não definido'}
              </div>
            </div>

            {profile.steam_id_updated_at && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Última Atualização
                </label>
                <div className="p-2 bg-gray-800 rounded border border-gray-700 text-white text-sm">
                  {formatDate(profile.steam_id_updated_at)}
                </div>
              </div>
            )}

            {!canUpdate && nextUpdateDate && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-400 font-medium">Alteração bloqueada</p>
                  <p className="text-yellow-300">
                    Você poderá alterar seu Steam ID novamente em {getDaysUntilUpdate()} dias
                    ({formatDate(nextUpdateDate.toISOString())})
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleUpdateSteamId} className="space-y-4">
              <div>
                <label htmlFor="steamId" className="block text-sm font-medium text-gray-300 mb-1">
                  Novo Steam ID
                </label>
                <Input
                  id="steamId"
                  type="text"
                  placeholder="76561198262445629 ou URL do perfil Steam"
                  value={newSteamId}
                  onChange={(e) => setNewSteamId(e.target.value)}
                  disabled={!canUpdate || updating}
                  className="bg-gray-800 border-gray-700 text-white focus:border-neon-green"
                />
              </div>

              {error && (
                <div className="flex items-start space-x-2 p-3 bg-red-900/30 border border-red-600/50 rounded">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-start space-x-2 p-3 bg-green-900/30 border border-green-600/50 rounded">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={!canUpdate || updating || newSteamId.trim() === (profile.steam_id || '')}
                className="w-full bg-neon-green text-game-dark hover:bg-neon-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar Steam ID'
                )}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SteamIdManager;