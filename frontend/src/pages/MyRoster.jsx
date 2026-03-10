import { useState, useEffect } from 'react';
import { format, getYear } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Printer } from 'lucide-react';
import clsx from 'clsx';
import useRosterStore from '../store/rosterStore';
import useAuthStore from '../store/authStore';
import { shiftsApi, shiftSettingsApi, holidaysApi } from '../api/shifts';

export default function MyRoster() {
    const { user } = useAuthStore();
    const {
        currentDate,
        viewMode,
        setViewMode,
        navigateNext,
        navigatePrev,
        navigateToday
    } = useRosterStore();

    const [loading, setLoading] = useState(true);
    const [shifts, setShifts] = useState([]);
    const [shiftSettings, setShiftSettings] = useState([]);

    // Wenn man auf "Mein Dienstplan" geht, zeigen wir per Default Monatsansicht als Liste oder Grid
    // Um hier eine einfache Listenansicht/Grid zu haben, switchen wir standardmäßig auf Month,
    // erlauben aber week mode falls der User es ändern will.

    useEffect(() => {
        // Erzwinge Monat-Ansicht beim initialen Laden von MyRoster
        setViewMode('month');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const fetchMyShifts = async () => {
            setLoading(true);
            try {
                const dateStr = format(currentDate, 'yyyy-MM-dd');

                const [shiftsData, settingsData] = await Promise.all([
                    shiftsApi.getShifts(dateStr, viewMode, user.id),
                    shiftSettingsApi.getSettings()
                ]);

                setShiftSettings(settingsData);
                // Anreichern
                const enrichedShifts = shiftsData.map(shift => ({
                    ...shift,
                    shiftTypeSetting: settingsData.find(set => set.shift_type === shift.shift_type)
                }));

                setShifts(enrichedShifts);
            } catch (error) {
                console.error('Fehler beim Laden des eigenen Dienstplans:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyShifts();
    }, [currentDate, viewMode, user.id]);

    const handlePrint = () => {
        window.print();
    };

    const headerTitle = viewMode === 'week'
        ? `KW ${format(currentDate, 'w, yyyy', { locale: de })}`
        : format(currentDate, 'MMMM yyyy', { locale: de });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto printable-area">

            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-brand-border no-print">

                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['week', 'month'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={clsx(
                                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                                    viewMode === mode
                                        ? "bg-white text-brand-primary shadow-sm"
                                        : "text-brand-text-sec hover:text-brand-text"
                                )}
                            >
                                {mode === 'week' ? 'Woche' : 'Monat'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={navigateToday}
                        className="hidden sm:flex px-4 py-1.5 text-sm font-medium text-brand-text border border-brand-border rounded-lg hover:bg-gray-50 items-center"
                    >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Heute
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <button
                        onClick={navigatePrev}
                        className="p-2 border border-brand-border rounded-lg hover:bg-gray-50 text-brand-text"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <h2 className="text-lg font-bold text-brand-text min-w-[150px] text-center">
                        {headerTitle}
                    </h2>

                    <button
                        onClick={navigateNext}
                        className="p-2 border border-brand-border rounded-lg hover:bg-gray-50 text-brand-text"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handlePrint}
                        className="p-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors hidden sm:block"
                        title="Dienstplan drucken"
                    >
                        <Printer className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Print Header (Only visible when printing) */}
            <div className="hidden print:block mb-8">
                <h1 className="text-2xl font-bold text-black border-b-2 border-black pb-2">
                    Mein Dienstplan - {user?.name}
                </h1>
                <p className="text-lg mt-2 font-medium">{headerTitle}</p>
            </div>

            {/* Roster List */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden print:border-none print:shadow-none">

                {loading && (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                    </div>
                )}

                {!loading && shifts.length === 0 && (
                    <div className="p-12 text-center text-brand-text-sec">
                        Keine Dienste für diesen Zeitraum eingetragen.
                    </div>
                )}

                {!loading && shifts.length > 0 && (
                    <div className="divide-y divide-gray-100 print:divide-gray-300">
                        {shifts.map(shift => {
                            const shiftDate = new Date(shift.date);
                            const color = shift.shiftTypeSetting?.color || '#cbd5e1';

                            return (
                                <div key={shift.id} className="flex flex-col sm:flex-row p-4 hover:bg-gray-50 transition-colors print:py-2">

                                    {/* Left: Date */}
                                    <div className="flex-shrink-0 w-32 mb-2 sm:mb-0">
                                        <p className="text-sm font-semibold text-brand-text">
                                            {format(shiftDate, 'EEEE', { locale: de })}
                                        </p>
                                        <p className="text-xs text-brand-text-sec">
                                            {format(shiftDate, 'dd. MMMM yyyy', { locale: de })}
                                        </p>
                                    </div>

                                    {/* Middle: Shift Details */}
                                    <div className="flex-1 flex flex-col justify-center border-l-4 pl-4" style={{ borderColor: color }}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-brand-text text-lg">
                                                {shift.shiftTypeSetting?.label || shift.shift_type}
                                            </span>
                                        </div>
                                        {shift.start_time && shift.end_time && (
                                            <div className="text-sm text-brand-text-sec flex items-center mt-1">
                                                <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                                                {format(new Date(shift.start_time), 'HH:mm')} Uhr - {format(new Date(shift.end_time), 'HH:mm')} Uhr
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Notes */}
                                    {shift.notes && (
                                        <div className="mt-2 sm:mt-0 sm:ml-4 sm:w-1/3 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 print:border-none print:bg-transparent pl-3">
                                            <strong>Notiz:</strong> {shift.notes}
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
