'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, BarChart3, LogOut } from 'lucide-react';
import { useUser } from '@/components/UserProvider';
import NotificationBell from '@/components/NotificationBell';
import TimerPill from '@/components/TimerPill';

const itens = [
  { href: '/dashboard', rotulo: 'Início', Icone: Home },
  { href: '/grupos', rotulo: 'Grupos', Icone: Users },
  { href: '/stats', rotulo: 'Stats', Icone: BarChart3 },
];

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const usuario = useUser();

  async function sair() {
  try {
    const r = await fetch('/api/auth/logout', { method: 'POST' });
    if (!r.ok) throw new Error('Falha no logout');
    window.location.assign('/');
  } catch (e) {
    console.error(e);
    alert('Não foi possível sair. Tente novamente.');
  }
}

  return (
    <header className="relative mb-10 flex items-center justify-between">
      <nav className="z-10 flex gap-1 rounded-2xl border border-border/50 bg-card/70 p-1 shadow-sm backdrop-blur-md">
        {itens.map(({ href, rotulo, Icone }) => {
          const ativo = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                ativo
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icone className="h-4 w-4" /> {rotulo}
            </Link>
          );
        })}
      </nav>

      <img
        src="/logo.png"
        alt="UniStudy Logo"
        className="absolute left-1/2 h-10 -translate-x-1/2 object-contain md:h-14"
      />

      <div className="z-10 flex items-center gap-3">
        <TimerPill />
        <NotificationBell />
        <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
          {usuario?.nome}
        </span>
        <button
          onClick={sair}
          className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-accent"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </header>
  );
}