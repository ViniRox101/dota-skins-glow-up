import axios from 'axios';

const livepixApi = axios.create({
  baseURL: 'http://localhost:8081',
});

interface LivepixAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface LivepixPayment {
  id: string;
  value: number;
  message: string;
  payer_name: string;
  created_at: string;
}

const getAccessToken = async (): Promise<string> => {
  const clientId = import.meta.env.VITE_LIVEPIX_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_LIVEPIX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Livepix API credentials are not set in environment variables.');
  }

  try {
    const response = await livepixApi.post<LivepixAuthResponse>(
      '/oauth2/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'wallet:read'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('❌ Erro ao obter o token de acesso da Livepix:', error);
    throw error;
  }
};

export const getLivepixPayments = async (): Promise<LivepixPayment[]> => {
  try {
    const accessToken = await getAccessToken();

    const response = await livepixApi.get<{ data: LivepixPayment[] }>(
      '/api/v2/payments',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('❌ Erro ao buscar pagamentos da Livepix:', error);
    throw error;
  }
};

export type { LivepixPayment };
