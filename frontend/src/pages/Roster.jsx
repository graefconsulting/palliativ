import { useState, useEffect, useMemo } from 'react';
import { format, getYear } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import useRosterStore from '../store/rosterStore';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import { shiftsApi, shiftSettingsApi, holidaysApi } from '../api/shifts';

import RosterDayView from '../components/Roster/RosterDayView';
import RosterWeekView from '../components/Roster/RosterWeekView';
import RosterMonthView from '../components/Roster/RosterMonthView';
import ShiftModal from '../components/Roster/ShiftModal';

export default function Roster() {
    const {
        currentDate,
        viewMode,
        setViewMode,
        navigateNext,
        navigatePrev,
        navigateToday
    } = useRosterStore();

    const currentUser = useAuthStore(state => state.user);
    const isAdmin = currentUser?.app_role === 'admin' || currentUser?.app_role === 'leitung';

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [shiftSettings, setShiftSettings] = useState([]);
    const [holidays, setHolidays] = useState([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ user: null, date: null, shift: null });

    // Initial Data Fetch (Users & Settings)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [usersRes, settingsParams] = await Promise.all([
                    api.get('/users'),
                    shiftSettingsApi.getSettings()
                ]);
                // Nur aktive Mitarbeiter im Dienstplan anzeigen TODO: Ggf. Inaktive aus der DB filtern wenn sie keine Schicht haben?
                setUsers(usersRes.data.filter(u => u.status === 'aktiv'));
                setShiftSettings(settingsParams);
            } catch (err) {
                console.error('Failed to load initial data:', err);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch Shifts & Holidays depending on currentDate and viewMode
    useEffect(() => {
        const fetchShiftsAndHolidays = async () => {
            setLoading(true);
            try {
                const dateStr = format(currentDate, 'yyyy-MM-dd');
                const year = getYear(currentDate);

                const [shiftsData, holidaysData] = await Promise.all([
                    shiftsApi.getShifts(dateStr, viewMode),
                    holidaysApi.getHolidays(year)
                ]);

                // Verknüpfe Shifts mit ihren Settings für Farben und Labels
                const enrichedShifts = shiftsData.map(shift => ({
                    ...shift,
                    shiftTypeSetting: shiftSettings.find(set => set.shift_type === shift.shift_type)
                }));

                setShifts(enrichedShifts);
                setHolidays(holidaysData);
            } catch (err) {
                console.error('Failed to load shifts:', err);
            } finally {
                setLoading(false);
            }
        };

        if (shiftSettings.length > 0) {
            fetchShiftsAndHolidays();
        }
    }, [currentDate, viewMode, shiftSettings]);

    // Header Title Formatting
    const headerTitle = useMemo(() => {
        if (viewMode === 'day') return format(currentDate, 'EEEE, dd. MMMM yyyy', { locale: de });
        if (viewMode === 'week') {
            // startDate is generated inside RosterWeekView usually, here we display just the week/year
            return `KW ${format(currentDate, 'w, yyyy', { locale: de })}`;
        }
        if (viewMode === 'month') return format(currentDate, 'MMMM yyyy', { locale: de });
    }, [currentDate, viewMode]);

    // Modal Handlers
    const handleCellClick = (user, date, shift) => {
        if (!isAdmin) return;
        setModalData({ user, date, shift });
        setIsModalOpen(true);
    };

    const handleSaveShift = async (shiftData) => {
        try {
            if (shiftData.id) {
                await shiftsApi.updateShift(shiftData.id, shiftData);
            } else {
                await shiftsApi.createShift(shiftData);
            }
            setIsModalOpen(false);

            // Reload shifts (hacky way: just trigger a re-fetch manually here, or rely on a generic reload function)
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const shiftsData = await shiftsApi.getShifts(dateStr, viewMode);
            setShifts(shiftsData.map(shift => ({
                ...shift,
                shiftTypeSetting: shiftSettings.find(set => set.shift_type === shift.shift_type)
            })));

        } catch (err) {
            throw err;
        }
    };

    const handleDeleteShift = async (shiftId) => {
        if (window.confirm('Möchten Sie diesen Dienst wirklich löschen?')) {
            try {
                await shiftsApi.deleteShift(shiftId);
                setIsModalOpen(false);
                // Reload shifts
                const dateStr = format(currentDate, 'yyyy-MM-dd');
                const shiftsData = await shiftsApi.getShifts(dateStr, viewMode);
                setShifts(shiftsData.map(shift => ({
                    ...shift,
                    shiftTypeSetting: shiftSettings.find(set => set.shift_type === shift.shift_type)
                })));
            } catch (err) {
                alert(err.message || 'Fehler beim Löschen');
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-8rem)]">

            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-brand-border shrink-0">

                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['day', 'week', 'month'].map((mode) => (
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
                                {mode === 'day' ? 'Tag' : mode === 'week' ? 'Woche' : 'Monat'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={navigateToday}
                        className="px-4 py-1.5 text-sm font-medium text-brand-text border border-brand-border rounded-lg hover:bg-gray-50 flex items-center"
                    >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Heute
                    </button>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <h2 className="text-xl font-bold text-brand-text min-w-[200px] text-center md:text-right">
                        {headerTitle}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={navigatePrev}
                            className="p-2 border border-brand-border rounded-lg hover:bg-gray-50 text-brand-text"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={navigateNext}
                            className="p-2 border border-brand-border rounded-lg hover:bg-gray-50 text-brand-text"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Roster View Container */}
            <div className="flex-1 overflow-y-auto relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center rounded-xl backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                    </div>
                )}

                {!loading && users.length === 0 && (
                    <div className="h-full flex items-center justify-center text-brand-text-sec bg-white rounded-xl border border-brand-border shadow-sm">
                        Keine Mitarbeiterdaten gefunden.
                    </div>
                )}

                {users.length > 0 && (
                    <>
                        {viewMode === 'day' && (
                            <RosterDayView
                                currentDate={currentDate}
                                shifts={shifts}
                                users={users}
                                onCellClick={handleCellClick}
                                isAdmin={isAdmin}
                            />
                        )}
                        {viewMode === 'week' && (
                            <RosterWeekView
                                currentDate={currentDate}
                                shifts={shifts}
                                users={users}
                                holidays={holidays}
                                onCellClick={handleCellClick}
                                isAdmin={isAdmin}
                            />
                        )}
                        {viewMode === 'month' && (
                            <RosterMonthView
                                currentDate={currentDate}
                                shifts={shifts}
                                users={users}
                                holidays={holidays}
                                onCellClick={handleCellClick}
                                isAdmin={isAdmin}
                            />
                        )}
                    </>
                )}
            </div>

            <ShiftModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveShift}
                onDelete={handleDeleteShift}
                shiftSettings={shiftSettings}
                initialData={modalData.shift}
                user={modalData.user}
                date={modalData.date}
            />
        </div>
    );
}
