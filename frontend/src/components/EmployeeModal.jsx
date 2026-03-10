import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function EmployeeModal({ user, onClose, onSave, isAdmin }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        team: '',
        app_role: 'mitarbeiter',
        contract_hours_week: 40,
        vacation_days_year: 30,
        status: 'aktiv'
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                role: user.role || '',
                team: user.team || '',
                app_role: user.app_role || 'mitarbeiter',
                contract_hours_week: user.contract_hours_week || 40,
                vacation_days_year: user.vacation_days_year || 30,
                status: user.status || 'aktiv'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        let parsedValue = value;

        if (type === 'number') {
            parsedValue = value === '' ? '' : Number(value);
        }

        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            // Clean up empty strings to null for optional enums/strings in DB
            const dataToSave = {
                ...formData,
                role: formData.role === '' ? null : formData.role,
                team: formData.team === '' ? null : formData.team,
            };

            await onSave(dataToSave);
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-brand-border sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-brand-text">
                        {user ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter anlegen'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Stammdaten */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-brand-text-sec uppercase tracking-wider">Stammdaten</h3>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Vollständiger Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">E-Mail Adresse *</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                                    disabled={!!user && !isAdmin} // Nur Admin darf Mail bei existierendem User ändern
                                />
                            </div>
                        </div>

                        {/* Rolle & Zuordnung */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-brand-text-sec uppercase tracking-wider">Zuordnung</h3>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Berufsrolle</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                                >
                                    <option value="">-- Keine Zuordnung --</option>
                                    <option value="arzt">Arzt/Ärztin</option>
                                    <option value="pfleger">Pfleger/in</option>
                                    <option value="koordination">Koordination</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Team</label>
                                <select
                                    name="team"
                                    value={formData.team}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                                >
                                    <option value="">-- Keine Zuordnung --</option>
                                    <option value="team1">Team 1</option>
                                    <option value="team2">Team 2</option>
                                    <option value="koordination">Koordination</option>
                                </select>
                            </div>
                        </div>

                        {/* App-Rechte & Vertrag */}
                        <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">App-Berechtigung</label>
                                <select
                                    name="app_role"
                                    value={formData.app_role}
                                    onChange={handleChange}
                                    disabled={!isAdmin} // Nur Admin darf App-Rechte ändern
                                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                    <option value="mitarbeiter">Mitarbeiter</option>
                                    <option value="leitung">Leitung</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Wochenstunden (h)</label>
                                <input
                                    type="number"
                                    name="contract_hours_week"
                                    step="0.5"
                                    min="0"
                                    required
                                    value={formData.contract_hours_week}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Urlaubstage/Jahr</label>
                                <input
                                    type="number"
                                    name="vacation_days_year"
                                    min="0"
                                    required
                                    value={formData.vacation_days_year}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                                />
                            </div>
                        </div>

                        {/* Status (Nur Admin) */}
                        {user && isAdmin && (
                            <div className="md:col-span-2 pt-4 border-t border-brand-border mt-2">
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.status === 'aktiv'}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            status: e.target.checked ? 'aktiv' : 'deaktiviert'
                                        }))}
                                        className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                                    />
                                    <span className="text-sm font-medium text-brand-text">Account ist aktiv</span>
                                </label>
                                <p className="text-xs text-brand-text-sec mt-1 ml-7">
                                    Deaktivierte Mitarbeiter können sich nicht mehr einloggen, ihre Historie bleibt jedoch im Dienstplan erhalten.
                                </p>
                            </div>
                        )}
                    </div>

                    {!user && (
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-sm mt-6">
                            <strong>Hinweis:</strong> Der neue Mitarbeiter erhält initial das Passwort <code>Palliativ2026!</code> und wird beim ersten Login aufgefordert, dieses zu ändern.
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t border-brand-border mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 py-2 border border-brand-border text-brand-text rounded-md hover:bg-gray-50 font-medium text-sm transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark font-medium leading-5 text-sm transition-colors shadow-sm disabled:opacity-50"
                        >
                            {saving ? 'Speichern...' : 'Speichern'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
