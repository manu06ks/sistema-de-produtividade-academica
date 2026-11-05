import { UserProvider } from '@/components/UserProvider';
import AppHeader from '@/components/AppHeader';

export default function AppLayout({ children }) {
  return (
    <UserProvider>
      <div className="relative min-h-screen bg-gradient-to-b from-accent via-background to-secondary p-4 font-sans text-foreground md:p-8">
        <div className="mx-auto max-w-7xl">
          <AppHeader />
          {children}
        </div>
      </div>
    </UserProvider>
  );
}