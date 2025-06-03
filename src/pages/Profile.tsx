import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, getSession, getCurrentUser, supabase } from '../integrations/supabase/client';
import { Camera, Loader2, Upload, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Database } from '../integrations/supabase/types';

// Usando o tipo da tabela profiles diretamente do arquivo de tipos do Supabase
type Profile = Database['public']['Tables']['profiles']['Row'];

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (!session) {
          navigate('/login');
          return;
        }
        
        const user = await getCurrentUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Fetch profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        setProfile(data as Profile);
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url);
      } catch (error) {
        console.error('Error checking session:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async () => {
    if (!profile) return;
    
    setUpdating(true);
    setMessage(null);
    
    try {
      // Usando o tipo correto para a atualização do perfil
      const updateData: Database['public']['Tables']['profiles']['Update'] = { 
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;
      
      setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
      setProfile({ ...profile, full_name: fullName, avatar_url: avatarUrl });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ text: 'Erro ao atualizar perfil.', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !profile) {
      return;
    }

    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    setUploadingAvatar(true);
    setMessage(null);

    try {
      // Upload da imagem para o storage do Supabase
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Gera URL pública para a imagem
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Atualiza o avatar_url no perfil
      setAvatarUrl(data.publicUrl);
      setMessage({ text: 'Foto de perfil carregada com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      setMessage({ text: 'Erro ao fazer upload da imagem.', type: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-game-dark text-white">
        <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-game-dark text-white">
      <Header />
      <div className="flex flex-col items-center justify-center pt-28 pb-16 px-4">
      <Card className="w-full max-w-md bg-game-dark border border-neon-green/20 shadow-lg shadow-neon-green/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-neon-green">Perfil do Usuário</CardTitle>
          <CardDescription className="text-center text-gray-400">Gerencie suas informações pessoais</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {message && (
            <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
              {message.text}
            </div>
          )}
          
          <div className="flex flex-col items-center mb-4">
            <div 
              className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-neon-green/50 cursor-pointer"
              onClick={handleAvatarClick}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={uploadAvatar}
              accept="image/*"
              className="hidden"
            />
            
            <p className="text-sm text-gray-400 mb-2">Clique na imagem para alterar sua foto</p>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="bg-gray-800 border-gray-700 text-gray-300"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="fullName" className="text-gray-300">Nome Completo</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus:border-neon-green"
              placeholder="Seu nome completo"
            />
          </div>
          
          <div className="flex flex-col space-y-4 pt-4">
            <Button
              onClick={updateProfile}
              disabled={updating}
              className="w-full bg-neon-green text-game-dark hover:bg-neon-green/90"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar Perfil'
              )}
            </Button>
            
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full"
            >
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
      <Footer />
    </div>
  );
};

export default Profile;