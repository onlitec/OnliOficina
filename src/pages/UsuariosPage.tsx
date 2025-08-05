import React from 'react';
import { GerenciamentoUsuarios } from '@/components/usuarios/GerenciamentoUsuarios';

export function UsuariosPage() {
  return (
    <div className="container mx-auto p-6">
      <GerenciamentoUsuarios />
    </div>
  );
}

export default UsuariosPage;