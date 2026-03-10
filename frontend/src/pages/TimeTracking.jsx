import { useState, useEffect } from 'react';
import { format, differenceInMinutes, getMonth, getYear, setMonth, setYear } from 'date-fns';
import { de } from 'date-fns/locale';
import { Loader2, Plus, Clock, Trash2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { timeApi } from '../api/time';
import clsx from 'clsx';

export default function TimeTracking() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [trackings, setTrackings] = useState([]);
    const [summary, setSummary] = useState(null);

    // Date Selection (Standard: aktueller Monat)
    const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()) + 1);
    const [selectedYear, setSelectedYear] = useState(getYear(new Date()));

    // Form State
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '',
        end_time: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const fetchTimeData = async () => {
        setLoading(true);
        try {
            const formattedMonth = String(selectedMonth).padStart(2, '0');
            const [trackingsData, summaryData] = await Promise.all([
                timeApi.getTrackings(formattedMonth, selectedYear),
                timeApi.getSummary(formattedMonth, selectedYear, user?.id)
            ]);
            setTrackings(trackingsData);
            setSummary(summaryData);
        } catch (err) {
            console.error('Fehler beim Laden der Zeiterfassung:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchTimeData();
        }
    }, [user?.id, selectedMonth, selectedYear]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.start_time || !formData.end_time) {
            setFormError('Start- und Endzeit müssen angegeben werden.');
            return;
        }

        const start = new Date(`${formData.date}T${formData.start_time}`);
        const end = new Date(`${formData.date}T${formData.end_time}`);

        if (start >= end) {
            setFormError('Endzeit muss nach Startzeit liegen oder am nächsten Tag (über Mitternacht aktuell nicht im einfachen Formular unterstützt).');
            return;
        }

        setIsSubmitting(true);
        try {
            // Datum parsen und volle Zeitstempel ans Backend senden
            await timeApi.createTracking({
                date: formData.date,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                notes: formData.notes
            });

            setFormData({
                date: format(new Date(), 'yyyy-MM-dd'),
                start_time: '',
                end_time: '',
                notes: ''
            });
            fetchTimeData();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Fehler beim Speichern');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await timeApi.deleteTracking(id);
            fetchTimeData();
        } catch (err) {
            alert('Fehler beim Löschen');
        }
    };

    // Hilfsfunktion: Dauer berechnen
    const getDurationString = (start, end) => {
        if (!start || !end) return '-';
        const mins = differenceInMinutes(new Date(end), new Date(start));
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m > 0 ? m + 'm' : ''}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-brand-text">Zeiterfassung</h1>

                {/* Monat/Jahr Auswahl */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-brand-border shadow-sm">
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                        className="border-none bg-transparent focus:ring-0 text-sm font-medium text-brand-text"
                    >
                        {Array.from({ length: 12 }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>{format(setMonth(new Date(), i), 'MMMM', { locale: de })}</option>
                        ))}
                    </select>
                    <span className="text-gray-300">|</span>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        className="border-none bg-transparent focus:ring-0 text-sm font-medium text-brand-text"
                    >
                        {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Col: Summary & Form */}
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-border">
                        <h2 className="text-lg font-bold text-brand-text mb-4 border-b pb-2">Kontostand (Monat)</h2>
                        {loading ? (
                            <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>
                        ) : summary ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Ist-Stunden (Genehmigt)</span>
                                    <span className="font-semibold text-brand-text">{summary.actualHours} h</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Soll-Stunden (ca.)</span>
                                    <span className="font-semibold text-brand-text">{summary.targetHours} h</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between items-center">
                                    <span className="font-bold text-brand-text">Überstunden</span>
                                    <span className={clsx(
                                        "font-bold text-lg px-2 rounded-md",
                                        summary.overtime > 0 ? "text-green-600 bg-green-50" :
                                            summary.overtime < 0 ? "text-red-600 bg-red-50" : "text-gray-600 bg-gray-100"
                                    )}>
                                        {summary.overtime > 0 ? '+' : ''}{summary.overtime} h
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-400 leading-tight">
                                    Hinweis: Das Saldo basiert nur auf vom Admin genehmigten Ist-Zeiten dieses Monats.
                                </p>
                            </div>
                        ) : null}
                    </div>

                    {/* Form Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-border">
                        <h2 className="text-lg font-bold text-brand-text mb-4">Ist-Zeiten nachtragen</h2>

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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-1">Beginn</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-1">Ende</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Bemerkung (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                    placeholder="Z.B. Längerer Einsatz Patient X"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-2 flex justify-center items-center px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Eintrag einreichen</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Col: Timeline/List */}
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden flex flex-col h-full min-h-[500px]">
                    <div className="p-4 border-b border-brand-border bg-gray-50 flex justify-between items-center shrink-0">
                        <h2 className="text-lg font-bold text-brand-text">Einträge ({format(new Date(selectedYear, selectedMonth - 1, 1), 'MMMM yyyy', { locale: de })})</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-12 flex justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                            </div>
                        ) : trackings.length === 0 ? (
                            <div className="p-12 text-center text-brand-text-sec flex flex-col items-center">
                                <Clock className="w-12 h-12 mb-3 text-gray-300" />
                                Keine Zeiten in diesem Monat eingetragen.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 p-4 space-y-3">
                                {trackings.map(t => (
                                    <div key={t.id} className="border border-brand-border rounded-lg p-3 hover:border-brand-primary/40 transition-colors bg-white">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-brand-text">
                                                    {format(new Date(t.date), 'EEEE, dd.MM.yyyy', { locale: de })}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1.5 text-sm text-brand-text-sec">
                                                    <span className="flex items-center text-gray-700 font-medium">
                                                        <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                                        {format(new Date(t.start_time), 'HH:mm')} - {format(new Date(t.end_time), 'HH:mm')} Uhr
                                                    </span>
                                                    <span className="font-bold text-brand-primary">
                                                        ({getDurationString(t.start_time, t.end_time)})
                                                    </span>
                                                </div>
                                                {t.notes && <p className="text-sm mt-2 p-2 bg-gray-50 rounded text-gray-600 border border-gray-100">"{t.notes}"</p>}
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
                                                    t.status === 'genehmigt' ? "bg-green-100 text-green-700" :
                                                        t.status === 'abgelehnt' ? "bg-red-100 text-red-700" :
                                                            "bg-yellow-100 text-yellow-700"
                                                )}>
                                                    {t.status}
                                                </span>

                                                {t.status === 'ausstehend' && (
                                                    <button
                                                        onClick={() => handleDelete(t.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors mt-2"
                                                        title="Löschen"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
