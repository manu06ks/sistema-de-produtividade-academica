import { UserProvider } from '@/components/UserProvider';
import { TimerProvider } from '@/components/TimerProvider';
import AppHeader from '@/components/AppHeader';
import { Suspense } from 'react';

export default function AppLayout({ children }) {
  return (
    <UserProvider>
      <TimerProvider>
        <div className="relative min-h-screen bg-gradient-to-b from-accent via-background to-secondary p-4 font-sans text-foreground md:p-8">
          <div className="mx-auto max-w-7xl">
            <Suspense fallback={<div className="mb-10 h-12" />}>
              <AppHeader />
            </Suspense>
            {children}
          </div>
        </div>
      </TimerProvider>
    </UserProvider>
  );
}