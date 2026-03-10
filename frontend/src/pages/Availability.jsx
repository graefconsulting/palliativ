import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, Plus, Calendar as CalendarIcon, X } from 'lucide-react';
import clsx from 'clsx';
import { availabilityApi } from '../api/requests';

export default function Availability() {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    // Form
    const [formData, setFormData] = useState({ date: '', type: 'keine_zeit', notes: '' });

    const fetchAvailabilities = async () => {
        setLoading(true);
        try {
            // Keine Datum-Params = Holt alle aktuellen/zukünftigen Requests für den User (Backend default)
            const data = await availabilityApi.getRequests();
            // Filtern auf zukünftige/aktuelle Tage (optional, machen wir im Frontend zur Sicherheit)
            const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
            setRequests(sorted);
        } catch (err) {
            console.error('Fehler beim Laden der Verfügbarkeiten:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailabilities();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        try {
            await availabilityApi.createRequest(formData);
            setFormData({ date: '', type: 'keine_zeit', notes: '' });
            fetchAvailabilities();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Speichern fehlgeschlagen');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await availabilityApi.deleteRequest(id);
            fetchAvailabilities();
        } catch (err) {
            alert('Fehler beim Löschen');
        }
    };

    const TypeBadge = ({ type }) => {
        if (type === 'keine_zeit') {
            return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Keine Zeit</span>;
        }
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-200">Bevorzugt Dienst</span>;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-brand-text">Meine Verfügbarkeiten</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Neues Element anlegen */}
                <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-brand-border h-fit">
                    <h2 className="text-lg font-bold text-brand-text mb-4">Wunsch eintragen</h2>

                    {formError && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-text mb-1">Datum</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brand-text mb-1">Verfügbarkeit</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                            >
                                <option value="keine_zeit">Keine Zeit (Sperrtermin)</option>
                                <option value="bevorzugt">Bevorzugt Dienst übernehmen</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brand-text mb-1">Bemerkung (Optional)</label>
                            <input
                                type="text"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                placeholder="Grund (nur für Admin sichtbar)"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-2 flex justify-center items-center px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Hinzufügen</>}
                        </button>
                    </form>
                    <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                        Hinweis: Einträge für ein bestehendes Datum werden überschrieben. Admins sehen deine Wünsche direkt bei der Dienstplanung.
                    </p>
                </div>

                {/* Liste */}
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
                    <div className="p-4 border-b border-brand-border bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-brand-text">Eingetragene Wünsche</h2>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-12 text-center text-brand-text-sec flex flex-col items-center">
                            <CalendarIcon className="w-12 h-12 mb-3 text-gray-300" />
                            Keine Verfügbarkeitswünsche hinterlegt.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {requests.map(req => (
                                <div key={req.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                        <div className="flex items-center gap-2 w-32">
                                            <CalendarIcon className="w-4 h-4 text-brand-text-sec" />
                                            <span className="font-semibold text-brand-text">
                                                {format(new Date(req.date), 'dd.MM.yyyy')}
                                            </span>
                                        </div>
                                        <div>
                                            <TypeBadge type={req.type} />
                                            {req.notes && (
                                                <span className="text-sm text-gray-500 ml-3 italic">({req.notes})</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(req.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        title="Löschen"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
