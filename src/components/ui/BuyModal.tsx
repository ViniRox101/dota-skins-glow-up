import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Button } from "./button";

interface BuyModalProps {
  children: React.ReactNode;
  whatsappLink: string;
}

export function BuyModal({ children, whatsappLink }: BuyModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-neon-green/20">
        <DialogHeader>
          <DialogTitle className="text-neon-green">Finalizar Compra</DialogTitle>
          <DialogDescription className="text-gray-300">
            Você será redirecionado para o WhatsApp de um administrador para finalizar a compra.
            Clique no botão "Finalizar Compra" abaixo para entrar em contato com nosso administrador.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-center text-lg font-semibold text-gray-200">Pronto para garantir sua skin?</p>
        </div>
        <div className="flex justify-center">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button className="bg-neon-green text-gray-900 hover:bg-neon-green/80 transition-colors duration-300">
              Finalizar Compra
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}