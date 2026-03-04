import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register'; 
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import DashboardAdmin from './pages/DashboardAdmin';
import GestaoLojas from './components/GestaoLojas';
import ValidacaoProdutos from './components/ValidacaoProdutos';
import MonitoramentoIA from './components/MonitoramentoIA';
import RelatorioFinanceiro from './components/RelatorioFinanceiro';
import Estoque from './components/Estoque';

function App() {
  return (
    <Router>
      <Routes>
        {/* ROTAS PÚBLICAS */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ROTAS ADMINISTRATIVAS (Somente Admin) */}
        <Route 
          path="/dashboard-admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}> 
              <DashboardAdmin/>
            </ProtectedRoute>
          } 
        />
        
        {/* Nova Rota: Gestão de Lojas */}
        <Route 
          path="/gestao-lojas" 
          element={
            <ProtectedRoute allowedRoles={['admin']}> 
              <GestaoLojas />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/validacao-produtos" 
          element={
            <ProtectedRoute allowedRoles={['admin']}> 
              <ValidacaoProdutos />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/monitoramento-ia" 
          element={
            <ProtectedRoute allowedRoles={['admin']}> 
              <MonitoramentoIA />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/relatorios-financeiro" 
          element={
            <ProtectedRoute allowedRoles={['admin']}> 
              <RelatorioFinanceiro />
            </ProtectedRoute>
          } 
        />

        {/* ROTAS DO LOJISTA (Somente User) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Dashboard/>
            </ProtectedRoute>
          } 
        />
          {/* Nova Rota: Gerenciamento de Estoque */}
        <Route 
          path="/estoque" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Estoque />
            </ProtectedRoute>
          } 
        />

        {/* REDIRECIONAMENTO DE SEGURANÇA */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;