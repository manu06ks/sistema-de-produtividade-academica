'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const r = await fetch('/api/auth/me');

        if (r.status === 401) {
          await fetch('/api/auth/logout', { method: 'POST' });
          router.replace('/');
          return;
        }
        if (!r.ok) throw new Error('falha');

        const dados = await r.json();
        if (ativo) setUsuario(dados);
      } catch {
        if (ativo) setErro(true);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [router]);

  return (
    <UserContext.Provider value={usuario}>
      {erro && (
        <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          Não foi possível carregar sua conta. Recarregue a página.
        </p>
      )}
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}