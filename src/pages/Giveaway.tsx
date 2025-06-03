import React, { useEffect, useState } from 'react';
import { getLivepixPayments } from '../integrations/livepix/api';

interface DailyDonation {
  date: string;
  donations: { name: string; value: number }[];
}

const Giveaway = () => {
  const [dailyDonations, setDailyDonations] = useState<DailyDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const payments = await getLivepixPayments();
        const groupedDonations: { [key: string]: { name: string; value: number }[] } = {};

        payments.forEach(payment => {
          const date = new Date(payment.created_at).toLocaleDateString('pt-BR');
          if (!groupedDonations[date]) {
            groupedDonations[date] = [];
          }

          const repetitions = Math.floor(payment.value / 3);
          for (let i = 0; i < repetitions; i++) {
            groupedDonations[date].push({ name: payment.payer_name, value: payment.value });
          }
        });

        const sortedDates = Object.keys(groupedDonations).sort((a, b) => {
          const [dayA, monthA, yearA] = a.split('/').map(Number);
          const [dayB, monthB, yearB] = b.split('/').map(Number);
          return new Date(yearB, monthB - 1, dayB).getTime() - new Date(yearA, monthA - 1, dayA).getTime();
        });

        const formattedDonations: DailyDonation[] = sortedDates.map(date => ({
          date,
          donations: groupedDonations[date],
        }));

        setDailyDonations(formattedDonations);
      } catch (err) {
        setError('Failed to fetch donations.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Carregando doações...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Erro: {error}</div>;
  }

  return (
    <div className="p-6 bg-game-dark-blue rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-neon-green mb-6">Sorteio de Doações</h1>
      {dailyDonations.length === 0 ? (
        <p className="text-gray-400">Nenhuma doação encontrada.</p>
      ) : (
        dailyDonations.map(day => (
          <div key={day.date} className="mb-8 bg-game-dark-blue p-4 rounded-md shadow-md">
            <h2 className="text-2xl font-semibold text-neon-green mb-4">Doações de {day.date}</h2>
            <ul className="space-y-2">
              {day.donations.map((donation, index) => (
                <li key={index} className="flex justify-between items-center text-gray-300 bg-game-dark p-3 rounded-md">
                  <span>{donation.name}</span>
                  <span className="font-medium text-neon-green">R$ {donation.value.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default Giveaway;

getLivepixPayments()
  .then(payments => console.log('Pagamentos:', payments))
  .catch(err => console.error('Erro ao buscar pagamentos:', err));