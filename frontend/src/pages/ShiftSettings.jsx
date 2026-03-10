import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { shiftSettingsApi } from '../api/shifts';
import useAuthStore from '../store/authStore';

export default function ShiftSettings() {
    const { user } = useAuthStore();
    const isAdminOrLeitung = user?.app_role === 'admin' || user?.app_role === 'leitung';

    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState([]);
    const [error, setError] = useState('');

    // Formular Edit/Create
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ shift_type: '', label: '', color: '#dddddd', default_start: '', default_end: '' });
    const [isCreating, setIsCreating] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await shiftSettingsApi.getSettings();
            setSettings(data);
        } catch (err) {
            console.error(err);
            setError('Fehler beim Laden der Dienstarten');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdminOrLeitung) fetchSettings();
    }, [isAdminOrLeitung]);

    const handleEditClick = (setting) => {
        setError('');
        setIsCreating(false);
        setEditingId(setting.id);
        setFormData({
            shift_type: setting.shift_type,
            label: setting.label,
            color: setting.color,
            default_start: setting.default_start || '',
            default_end: setting.default_end || ''
        });
    };

    const handleCreateClick = () => {
        setError('');
        setEditingId(null);
        setIsCreating(true);
        setFormData({ shift_type: '', label: '', color: '#3b82f6', default_start: '08:00', default_end: '16:30' });
    };

    const handleCancelClick = () => {
        setEditingId(null);
        setIsCreating(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isCreating) {
                await shiftSettingsApi.createSetting(formData);
            } else {
                await shiftSettingsApi.updateSetting(editingId, formData);
            }
            handleCancelClick();
            fetchSettings();
        } catch (err) {
            setError(err.response?.data?.message || 'Speichern fehlgeschlagen');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Achtung: Die Dienstart sollte nur gelöscht werden, wenn keine Schichten mehr existieren, die diesen Typ verwenden. Trotzdem löschen?")) return;
        try {
            await shiftSettingsApi.deleteSetting(id);
            fetchSettings();
        } catch (err) {
            alert(err.response?.data?.message || 'Fehler beim Löschen');
        }
    };

    if (!isAdminOrLeitung) return <div className="p-12 text-center text-red-500">Keine Berechtigung</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-brand-border">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">Einstellungen: Dienstarten</h1>
                    <p className="text-sm text-brand-text-sec mt-1">Verwalte die im Dienstplan verfügbaren Schichtarten für neue Einträge.</p>
                </div>
                {!isCreating && !editingId && (
                    <button
                        onClick={handleCreateClick}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" /> Neue Dienstart
                    </button>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">{error}</div>
            )}

            {(isCreating || editingId) && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-brand-primary/50 relative">
                    <button onClick={handleCancelClick} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold text-brand-text mb-4">{isCreating ? 'Neue Dienstart anlegen' : 'Dienstart bearbeiten'}</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Kürzel (ID) <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    disabled={!isCreating} // Kürzel sollte man danach nicht mehr ändern, da referenziert!
                                    value={formData.shift_type}
                                    onChange={e => setFormData({ ...formData, shift_type: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                    placeholder="z.b. tagesdienst_neu"
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                                <p className="text-xs text-gray-500 mt-1">Nur a-z, 0-9 und _. Wird intern verwendet.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Anzeigename (Label) <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                    placeholder="z.B. Tagesdienst"
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Kalender-Farbe (Hex) <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        required
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="h-10 w-12 p-1 border rounded-md cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        required
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md uppercase font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-1">Std. Start</label>
                                    <input
                                        type="time"
                                        value={formData.default_start}
                                        onChange={e => setFormData({ ...formData, default_start: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-1">Std. Ende</label>
                                    <input
                                        type="time"
                                        value={formData.default_end}
                                        onChange={e => setFormData({ ...formData, default_end: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                            <button type="button" onClick={handleCancelClick} className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm font-medium">Abbrechen</button>
                            <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark flex items-center text-sm font-medium">
                                <Save className="w-4 h-4 mr-2" /> Speichern
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farbe & Label</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kürzel (ID)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auto-Zeiten</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {settings.map(setting => (
                                    <tr key={setting.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <span className="w-4 h-4 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: setting.color }}></span>
                                                <span className="font-medium text-brand-text">{setting.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {setting.shift_type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {setting.default_start && setting.default_end ? `${setting.default_start} - ${setting.default_end}` : <span className="text-gray-400 italic">keine Felder</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(setting)}
                                                    className="p-1.5 text-brand-primary hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(setting.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
