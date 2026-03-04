import { type ReactNode } from 'react'; // Adicionado 'type' aqui
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const token = localStorage.getItem('@Acheii:token');
    const userStorage = localStorage.getItem('@Acheii:user');
    const user = userStorage ? JSON.parse(userStorage) : null;

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirecionamento inteligente baseado na role do usuário logado
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};