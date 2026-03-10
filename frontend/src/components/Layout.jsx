import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Sidebar from './Sidebar';

export default function Layout() {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.must_change_password) {
        return <Navigate to="/change-password" replace />;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-brand-bg md:flex-row flex-col">
            <Sidebar />
            <main className="flex-1 overflow-y-auto mt-16 md:mt-0 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
