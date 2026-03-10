import { useState, useEffect, useMemo } from 'react';
import { format, getMonth, getYear, setMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { Loader2, HeartPulse, Download } from 'lucide-react';
import { shiftsApi } from '../api/shifts';
import useAuthStore from '../store/authStore';
import clsx from 'clsx';

export default function ReportsIllness() {
    const { user } = useAuthStore();
    const isAdminOrLeitung = user?.app_role === 'admin' || user?.app_role === 'leitung';

    const [loading, setLoading] = useState(true);
    const [shifts, setShifts] = useState([]);

    const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()) + 1);
    const [selectedYear, setSelectedYear] = useState(getYear(new Date()));

    useEffect(() => {
        if (!isAdminOrLeitung) return;
        const fetchReport = async () => {
            setLoading(true);
            try {
                const formattedMonth = String(selectedMonth).padStart(2, '0');
                const data = await shiftsApi.getIllnessReport(formattedMonth, selectedYear);
                setShifts(data);
            } catch (err) {
                console.error('Fehler beim Laden des Kranken-Berichts:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [selectedMonth, selectedYear, isAdminOrLeitung]);

    const groupedData = useMemo(() => {
        const groups = {};
        shifts.forEach(shift => {
            if (!groups[shift.user_id]) {
                groups[shift.user_id] = { user: shift.user, shifts: [], total: 0, auCount: 0 };
            }
            groups[shift.user_id].shifts.push(shift);
            groups[shift.user_id].total++;
            if (shift.shift_type === 'krank_au') groups[shift.user_id].auCount++;
        });
        return Object.values(groups).sort((a, b) => b.total - a.total);
    }, [shifts]);

    const handleExportCSV = () => {
        const headers = ['Mitarbeiter', 'Rolle', 'Datum', 'Art', 'Notiz'];
        const rows = [];

        groupedData.forEach(group => {
            group.shifts.forEach(s => {
                rows.push([
                    group.user.name,
                    group.user.role || '',
                    format(new Date(s.date), 'dd.MM.yyyy'),
                    s.shift_type === 'krank_au' ? 'Krank mit AU' : 'Krank ohne AU',
                    s.notes || ''
                ]);
            });
        });

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Krankentage_${selectedYear}_${selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isAdminOrLeitung) return <div className="p-12 text-center text-red-500">Keine Berechtigung</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-brand-border">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg text-red-700">
                        <HeartPulse className="w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold text-brand-text">Krankheitsauswertung</h1>
                </div>

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
                        disabled={groupedData.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors font-medium text-sm disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" /> CSV Export
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
            ) : groupedData.length === 0 ? (
                <div className="bg-white p-12 text-center text-brand-text-sec rounded-xl shadow-sm border border-brand-border">
                    Keine Krankheitstage in diesem Monat dokumentiert.
                </div>
            ) : (
                <div className="space-y-6">
                    {groupedData.map(group => (
                        <div key={group.user.id} className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-brand-border flex justify-between items-center flex-wrap gap-4">
                                <h2 className="text-lg font-bold text-brand-text">{group.user.name}</h2>
                                <div className="flex gap-2">
                                    <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-bold text-sm border border-red-200">
                                        {group.total} Tage Total
                                    </div>
                                    {group.total > group.auCount && (
                                        <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-bold text-sm border border-orange-200">
                                            {group.total - group.auCount} ohne AU
                                        </div>
                                    )}
                                </div>
                            </div>
                            <ul className="divide-y divide-gray-100 p-2">
                                {group.shifts.map(shift => (
                                    <li key={shift.id} className="p-4 hover:bg-red-50/30 transition-colors flex justify-between items-center rounded-lg m-1">
                                        <div>
                                            <span className="font-semibold text-brand-text block">{format(new Date(shift.date), 'EEEE, dd. MMMM', { locale: de })}</span>
                                            <span className={clsx(
                                                "text-sm mt-1 block font-medium",
                                                shift.shift_type === 'krank_au' ? "text-green-600" : "text-orange-600"
                                            )}>
                                                {shift.shift_type === 'krank_au' ? 'Mit AU' : 'Ohne AU'}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
