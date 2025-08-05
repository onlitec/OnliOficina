import React, { createContext, useContext, ReactNode } from 'react';
import { useTenant } from '@/hooks/useTenant';
import type { Tenant, TenantUser, TenantStatistics, TenantInvite } from '@/hooks/useTenant';

type TenantContextType = ReturnType<typeof useTenant>;

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const tenantHook = useTenant();

  return (
    <TenantContext.Provider value={tenantHook}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenantContext deve ser usado dentro de um TenantProvider');
  }
  return context;
};

export default TenantProvider;