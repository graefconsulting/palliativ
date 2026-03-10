import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Ban, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import EmployeeModal from '../components/EmployeeModal';
import clsx from 'clsx';

export default function EmployeeManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [error, setError] = useState('');
    const currentUser = useAuthStore((state) => state.user);

    const isAdmin = currentUser?.app_role === 'admin';

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            setError('Fehler beim Laden der Mitarbeiter');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleSave = async (userData) => {
        try {
            if (selectedUser) {
                await api.put(`/users/${selectedUser.id}`, userData);
            } else {
                await api.post('/users', userData);
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Fehler beim Speichern');
        }
    };

    const handleDeactivate = async (id) => {
        if (window.confirm('Möchten Sie diesen Mitarbeiter wirklich deaktivieren?')) {
            try {
                await api.put(`/users/${id}/deactivate`);
                fetchUsers();
            } catch (err) {
                alert(err.response?.data?.message || 'Fehler beim Deaktivieren');
            }
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="p-8 text-center text-brand-text-sec">Lade Mitarbeiter...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-brand-text">Mitarbeiterverwaltung</h1>

                {isAdmin && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors shadow-sm text-sm font-medium"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Mitarbeiter anlegen
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            {/* Filter / Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-border">
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Suchen nach Name, Email oder Rolle..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-brand-sidebar">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-brand-text-sec uppercase tracking-wider">Mitarbeiter</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-brand-text-sec uppercase tracking-wider">Bereich</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-brand-text-sec uppercase tracking-wider">App-Rolle</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-brand-text-sec uppercase tracking-wider">Vertrag (h/W)</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-brand-text-sec uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-3 w-32"><span className="sr-only">Aktionen</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-brand-text-sec">
                                        Keine Mitarbeiter gefunden.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-brand-text">{user.name}</span>
                                                <span className="text-brand-text-sec text-xs">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="capitalize">{user.role || '-'}</span>
                                                <span className="text-gray-500 text-xs capitalize">{user.team?.replace('team', 'Team ') || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap capitalize">
                                            {user.app_role}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.contract_hours_week} h
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "px-2 inline-flex text-xs leading-5 font-semibold rounded-full gap-1 items-center",
                                                user.status === 'aktiv' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            )}>
                                                {user.status === 'aktiv' ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="text-brand-primary hover:text-brand-dark p-1 rounded"
                                                    title="Bearbeiten"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>

                                                {isAdmin && user.status === 'aktiv' && user.id !== currentUser.id && (
                                                    <button
                                                        onClick={() => handleDeactivate(user.id)}
                                                        className="text-red-500 hover:text-red-700 p-1 rounded"
                                                        title="Deaktivieren"
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <EmployeeModal
                    user={selectedUser}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    isAdmin={isAdmin}
                />
            )}
        </div>
    );
}
