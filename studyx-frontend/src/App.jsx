import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota inicial é o Login */}
        <Route path="/" element={<Login />} />
        
        {/* Rota do nosso Painel */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Se digitar um endereço que não existe, joga de volta pro inicio */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}