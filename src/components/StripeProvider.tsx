import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import getStripe from '../services/stripeService';

interface StripeProviderProps {
  children: React.ReactNode;
}

// Configurações do Elements
const stripeOptions = {
  // Configurações de aparência do checkout
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Ideal Sans, system-ui, sans-serif',
      spacingUnit: '2px',
      borderRadius: '4px',
    },
  },
  // Configurações de localização
  locale: 'pt-BR' as const,
};

/**
 * Provider do Stripe que envolve a aplicação
 * Disponibiliza o contexto do Stripe para todos os componentes filhos
 */
const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const stripePromise = getStripe();

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      {children}
    </Elements>
  );
};

export default StripeProvider;