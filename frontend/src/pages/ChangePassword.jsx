import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { Lock } from 'lucide-react';

export default function ChangePassword() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Die neuen Passwörter stimmen nicht überein.');
            return;
        }

        if (newPassword.length < 8) {
            setError('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/change-password', {
                oldPassword,
                newPassword
            });

            // Update local state to reflect that password was changed
            setUser({ ...user, must_change_password: false });

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Fehler beim Ändern des Passworts');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-brand-text text-center mb-2">
                    Passwort ändern
                </h2>
                <p className="text-sm text-brand-text-sec text-center mb-6">
                    Bitte ändern Sie Ihr Initialpasswort, um fortzufahren.
                </p>

                {error && (
                    <div className="bg-shift-krank/10 border border-shift-krank text-shift-krank p-3 rounded-md text-sm mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-text-sec mb-1">
                            Derzeitiges Passwort
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-brand-text-sec mb-1">
                            Neues Passwort
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-brand-text-sec mb-1">
                            Neues Passwort wiederholen
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Speichern...' : 'Passwort speichern'}
                    </button>
                </form>
            </div>
        </div>
    );
}
