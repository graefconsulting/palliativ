import { useState, useEffect, useMemo } from 'react';
import { format, differenceInMinutes, getMonth, getYear, setMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { Loader2, Download, Check, X as CloseIcon } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { timeApi } from '../api/time';
import api from '../api/axios';
import clsx from 'clsx';

export default function TimeApprovals() {
    const { user } = useAuthStore();
    const isAdminOrLeitung = user?.app_role === 'admin' || user?.app_role === 'leitung';

    const [loading, setLoading] = useState(true);
    const [trackings, setTrackings] = useState([]);
    const [users, setUsers] = useState([]);

    const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()) + 1);
    const [selectedYear, setSelectedYear] = useState(getYear(new Date()));

    useEffect(() => {
        const fetchData = async () => {
            if (!isAdminOrLeitung) return;
            setLoading(true);
            try {
                const formattedMonth = String(selectedMonth).padStart(2, '0');
                const [trackingsData, usersData] = await Promise.all([
                    timeApi.getTrackings(formattedMonth, selectedYear),
                    api.get('/users') // brauchen wir ggf. um auch user ohne Einträge aufzulisten, für diesen Showcase reicht die Liste der trackings aus
                ]);
                setTrackings(trackingsData);
                setUsers(usersData.data);
            } catch (err) {
                console.error('Fehler beim Laden der Zeiterfassung:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedMonth, selectedYear, isAdminOrLeitung]);

    const handleStatusUpdate = async (id, status) => {
        try {
            await timeApi.updateStatus(id, status);
            // Optimistisch aktualisieren
            setTrackings(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        } catch (err) {
            alert('Fehler beim Aktualisieren des Status');
        }
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return 0;
        return differenceInMinutes(new Date(end), new Date(start)) / 60;
    };

    const getDurationString = (start, end) => {
        if (!start || !end) return '-';
        const mins = differenceInMinutes(new Date(end), new Date(start));
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m > 0 ? m + 'm' : ''}`;
    };

    // Gruppieren nach User
    const groupedTrackings = useMemo(() => {
        const groups = {};
        trackings.forEach(t => {
            if (!groups[t.user_id]) {
                groups[t.user_id] = { user: t.user, trackings: [], pending: 0, totalHours: 0 };
            }
            groups[t.user_id].trackings.push(t);
            if (t.status === 'ausstehend') groups[t.user_id].pending++;
            if (t.status === 'genehmigt') {
                groups[t.user_id].totalHours += calculateDuration(t.start_time, t.end_time);
            }
        });

        // Sortiere nach denen mit ausstehenden Anträgen zuerst
        return Object.values(groups).sort((a, b) => b.pending - a.pending);
    }, [trackings]);

    // Export CSV
    const handleExportCSV = () => {
        const headers = ['Mitarbeiter', 'Rolle', 'Vertragsstunden/Woche', 'Genehmigte İst-Stunden (Monat)'];
        const rows = groupedTrackings.map(group => [
            group.user.name,
            group.user.role || '-',
            group.user.contract_hours_week,
            group.totalHours.toFixed(2)
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Zeiten_Export_${selectedYear}_${selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isAdminOrLeitung) return <div className="p-12 text-center">Keine Berechtigung</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-brand-border">
                <h1 className="text-2xl font-bold text-brand-text">Abrechnung & Freigabe</h1>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-brand-border">
                        <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(Number(e.target.value))}
                            className="border-none bg-transparent focus:ring-0 text-sm font-medium text-brand-text py-0"
                        >
                            {Array.from({ length: 12 }).map((_, i) => (
                                <option key={i + 1} value={i + 1}>{format(setMonth(new Date(), i), 'MMMM', { locale: de })}</option>
                            ))}
                        </select>
                        <span className="text-gray-300">|</span>
                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="border-none bg-transparent focus:ring-0 text-sm font-medium text-brand-text py-0"
                        >
                            {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors font-medium text-sm"
                    >
                        <Download className="w-4 h-4" /> CSV Export
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                </div>
            ) : groupedTrackings.length === 0 ? (
                <div className="bg-white p-12 text-center text-brand-text-sec rounded-xl shadow-sm border border-brand-border">
                    Keine Zeiterfassungen für diesen Monat gefunden.
                </div>
            ) : (
                <div className="space-y-6">
                    {groupedTrackings.map(group => (
                        <div key={group.user.id} className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">

                            <div className="bg-brand-sidebar px-6 py-4 border-b border-brand-border flex justify-between items-center flex-wrap gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-brand-text">{group.user.name}</h2>
                                    <p className="text-sm text-brand-text-sec capitalize">{group.user.role} • {group.user.contract_hours_week}h/Woche</p>
                                </div>

                                <div className="flex items-center gap-4 text-sm font-medium">
                                    {group.pending > 0 && (
                                        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                                            {group.pending} ausstehend
                                        </div>
                                    )}
                                    <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 font-bold">
                                        {group.totalHours.toFixed(2)} h (Genehmigt)
                                    </div>
                                </div>
                            </div>

                            <div className="p-0 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeiten</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dauer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notiz</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {group.trackings.map(t => (
                                            <tr key={t.id} className={clsx(t.status === 'ausstehend' && "bg-yellow-50/20")}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {format(new Date(t.date), 'dd.MM.yyyy')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(new Date(t.start_time), 'HH:mm')} - {format(new Date(t.end_time), 'HH:mm')} Uhr
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                                    {getDurationString(t.start_time, t.end_time)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={t.notes}>
                                                    {t.notes || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {t.status === 'ausstehend' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleStatusUpdate(t.id, 'abgelehnt')}
                                                                className="flex items-center gap-1 px-2.5 py-1.5 border border-red-200 text-red-600 bg-white rounded hover:bg-red-50 transition-colors"
                                                            >
                                                                <CloseIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(t.id, 'genehmigt')}
                                                                className="flex items-center gap-1 px-2.5 py-1.5 border border-green-200 text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
                                                            >
                                                                <Check className="w-4 h-4" /> Genehmigen
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className={clsx(
                                                            "px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider",
                                                            t.status === 'genehmigt' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                        )}>
                                                            {t.status}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
