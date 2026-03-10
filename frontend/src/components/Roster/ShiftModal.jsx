import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';
import useAuthStore from '../../store/authStore';
import { availabilityApi } from '../../api/requests';
import clsx from 'clsx'; // Assuming clsx is available or needs to be imported

export default function ShiftModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    shiftSettings,
    initialData,
    user,
    date
}) {
    const [formData, setFormData] = useState({
        shift_type: '',
        start_time: '',
        end_time: '',
        notes: ''
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [userAvailability, setUserAvailability] = useState(null);


    useEffect(() => {
        if (isOpen) {
            if (initialData?.id) {
                // Edit Mode
                setFormData({
                    shift_type: initialData.shift_type || '',
                    start_time: initialData.start_time ? format(new Date(initialData.start_time), 'HH:mm') : '',
                    end_time: initialData.end_time ? format(new Date(initialData.end_time), 'HH:mm') : '',
                    notes: initialData.notes || ''
                });
            } else {
                // Create Mode
                setFormData({
                    shift_type: '',
                    start_time: '',
                    end_time: '',
                    notes: ''
                });
            }
            setError('');

            // Prüfe Verfügbarkeit
            const fetchAvail = async () => {
                try {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    // Holt Verfügbarkeit nur für diesen Tag und User (die Liste wird nach Tag gefiltert und wir nehmen den Ersten).
                    // Der API Client übergibt date, view und userId. view='month' ist default in requestController.
                    // Wir holen einfach den ganzen Monat und suchen den exakten Tag raus.
                    const res = await availabilityApi.getRequests(dateStr, 'month', user.id);
                    const specific = res.find(r => format(new Date(r.date), 'yyyy-MM-dd') === dateStr);
                    setUserAvailability(specific || null);
                } catch (e) { console.error('Availability Warning Error:', e); }
            };
            if (user && date) fetchAvail();
        }
    }, [isOpen, initialData, date, user]);

    const handleShiftTypeChange = (e) => {
        const selectedTypeCode = e.target.value;
        const selectedSetting = shiftSettings.find(s => s.shift_type === selectedTypeCode);

        setFormData(prev => ({
            ...prev,
            shift_type: selectedTypeCode,
            // Auto-fill default times if available
            start_time: selectedSetting?.default_start || prev.start_time,
            end_time: selectedSetting?.default_end || prev.end_time,
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            // Datum parsen und Zeiten anfügen
            const baseDate = new Date(date);
            let startDateTime = null;
            let endDateTime = null;

            if (formData.start_time) {
                const [hours, minutes] = formData.start_time.split(':');
                startDateTime = new Date(baseDate);
                startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
            }

            if (formData.end_time) {
                const [hours, minutes] = formData.end_time.split(':');
                endDateTime = new Date(baseDate);
                endDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

                // Handling für Schichten über Mitternacht (z.B. Rufdienst 16:30 - 08:00)
                // Wenn Start > End, gehen wir davon aus, dass das Ende am nächsten Tag ist
                if (startDateTime && endDateTime && startDateTime > endDateTime) {
                    endDateTime.setDate(endDateTime.getDate() + 1);
                }
            }

            await onSave({
                id: initialData?.id,
                user_id: user.id,
                date: format(baseDate, 'yyyy-MM-dd'),
                shift_type: formData.shift_type,
                start_time: startDateTime ? startDateTime.toISOString() : null,
                end_time: endDateTime ? endDateTime.toISOString() : null,
                notes: formData.notes
            });

        } catch (err) {
            setError(err.message || 'Fehler beim Speichern der Schicht');
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">

                <div className="flex justify-between items-center p-5 border-b border-brand-border bg-white rounded-t-xl shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-brand-text">
                            {initialData?.id ? 'Dienst bearbeiten' : 'Neuer Dienst'}
                        </h2>
                        <p className="text-sm text-brand-text-sec mt-1">
                            für {user?.name} am {date ? format(date, 'dd.MM.yyyy', { locale: de }) : ''}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                    {userAvailability && (
                        <div className={clsx(
                            "mb-4 p-3 rounded-md text-sm font-medium border flex items-start gap-2",
                            userAvailability.type === 'keine_zeit' ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
                        )}>
                            {userAvailability.type === 'keine_zeit' ? (
                                <span>⚠️ {user?.name} hat sich für diesen Tag abgemeldet (Keine Zeit). {userAvailability.notes && `Grund: ${userAvailability.notes}`}</span>
                            ) : (
                                <span>ℹ️ {user?.name} möchte an diesem Tag bevorzugt Dienst übernehmen. {userAvailability.notes && `(${userAvailability.notes})`}</span>
                            )}
                        </div>
                    )}

                    <form id="shift-form" onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-brand-text mb-1">Dienstart *</label>
                            <select
                                name="shift_type"
                                required
                                value={formData.shift_type}
                                onChange={handleShiftTypeChange}
                                className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm bg-white"
                            >
                                <option value="" disabled>-- Bitte wählen --</option>
                                {shiftSettings.map(setting => (
                                    <option key={setting.id} value={setting.shift_type}>
                                        {setting.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Startzeit</label>
                                <input
                                    type="time"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Endzeit</label>
                                <input
                                    type="time"
                                    name="end_time"
                                    value={formData.end_time}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-brand-text-sec">Zeiten können optional angepasst oder leergelassen werden (z.B. bei Krankheit).</p>

                        <div>
                            <label className="block text-sm font-medium text-brand-text mb-1">Notizen (Optional)</label>
                            <textarea
                                name="notes"
                                rows="3"
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm resize-none"
                                placeholder="Besonderheiten zu diesem Dienst..."
                            />
                        </div>
                    </form>
                </div>

                <div className="p-5 border-t border-brand-border bg-gray-50 flex justify-between rounded-b-xl shrink-0">
                    {initialData?.id ? (
                        <button
                            type="button"
                            onClick={() => onDelete(initialData.id)}
                            disabled={saving}
                            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Löschen
                        </button>
                    ) : (
                        <div /> // Platzhalter für Flex-Layout
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 py-2 border border-brand-border text-brand-text rounded-md hover:bg-white font-medium text-sm transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            form="shift-form"
                            disabled={saving}
                            className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                        >
                            {saving ? 'Speichern...' : 'Speichern'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
