import AdminApp from '@/components/admin/AdminApp';

export const metadata = {
  title: 'UniStudy · Administração do banco',
};

// Página fora do grupo (app): precisa abrir mesmo com o banco vazio, quando ainda não existe nenhum usuário.
export default function AdminPage() {
  return <AdminApp />;
}
