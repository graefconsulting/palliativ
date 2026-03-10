import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Loader2, Users, HeartPulse, Palmtree, GraduationCap, Stethoscope, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import api from '../api/axios';
import { shiftsApi, shiftSettingsApi } from '../api/shifts';

export default function Dashboard() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [shiftSettings, setShiftSettings] = useState([]);

    const navigateToday = () => setCurrentDate(new Date());
    const navigatePrev = () => setCurrentDate(addDays(currentDate, -1));
    const navigateNext = () => setCurrentDate(addDays(currentDate, 1));

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const dateStr = format(currentDate, 'yyyy-MM-dd');

                const [usersRes, settingsParams, shiftsData] = await Promise.all([
                    api.get('/users'),
                    shiftSettingsApi.getSettings(),
                    shiftsApi.getShifts(dateStr, 'day')
                ]);

                setUsers(usersRes.data.filter(u => u.status === 'aktiv'));
                setShiftSettings(settingsParams);

                // Verknüpfe Shifts mit ihren Settings
                const enrichedShifts = shiftsData.map(shift => ({
                    ...shift,
                    shiftTypeSetting: settingsParams.find(set => set.shift_type === shift.shift_type)
                }));

                setShifts(enrichedShifts);
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [currentDate]);

    const dashboardGroups = useMemo(() => {
        const groups = {
            team1: [],
            team2: [],
            koordination: [],
            absent: []
        };

        const absentTypes = ['krank_au', 'krank_ohne_au', 'urlaub', 'weiterbildung'];

        users.forEach(user => {
            // Finde Schichten für diesen User heute
            const userShifts = shifts.filter(s => s.user_id === user.id);

            // Ist die Person abwesend?
            const isAbsent = userShifts.some(s => absentTypes.includes(s.shift_type));

            // Welche aktuelle Schicht(en) hat die Person? (Fokussiere auf Hauptschichten für Dashboard)
            const activeShifts = userShifts.filter(s => !absentTypes.includes(s.shift_type));

            const entry = {
                user,
                isAbsent,
                absentShift: isAbsent ? userShifts.find(s => absentTypes.includes(s.shift_type)) : null,
                activeShifts
            };

            // Nur Personen anzeigen, die heute eine Schicht (oder Abwesenheit) haben
            // ODER (Optional): Nur Personen mit aktivem Tages/Rufdienst.
            // Requirement ist: "wer an dem heutigen Tag anwesend ist" + "unten abwesende".
            // Heißt wir zeigen nur die Leute die im Dienstplan für heute stehen.
            if (userShifts.length > 0) {
                if (isAbsent) {
                    groups.absent.push(entry);
                } else if (user.team === 'koordination') {
                    groups.koordination.push(entry);
                } else if (user.team === 'team1') {
                    groups.team1.push(entry);
                } else if (user.team === 'team2') {
                    groups.team2.push(entry);
                }
                // Was ist mit Leuten ohne Team? Hängen wir sie an Team 1 oder lassen sie weg? 
                // We'll put them in koordination or ignore for now if not explicitly asked.
            }
        });

        // WICHTIG: Sortieren nach Rolle (Arzt > Pfleger)
        const sortByRole = (a, b) => {
            if (a.user.role === 'arzt' && b.user.role !== 'arzt') return -1;
            if (a.user.role !== 'arzt' && b.user.role === 'arzt') return 1;
            return a.user.name.localeCompare(b.user.name);
        };

        groups.team1.sort(sortByRole);
        groups.team2.sort(sortByRole);
        groups.koordination.sort(sortByRole);
        groups.absent.sort((a, b) => a.user.name.localeCompare(b.user.name));

        return groups;
    }, [users, shifts]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    const todayDateStr = format(currentDate, 'EEEE, dd. MMMM yyyy', { locale: de });

    // Helfer für das Rendern der Personen-Karten
    const PersonCard = ({ entry }) => {
        const roleColors = {
            'arzt': 'bg-blue-100 text-blue-800 border-blue-200',
            'pfleger': 'bg-teal-100 text-teal-800 border-teal-200',
            'default': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        const colorClass = roleColors[entry.user.role] || roleColors.default;

        return (
            <div className="flex items-center justify-between p-3 rounded-lg border border-brand-border bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                        {entry.user.role === 'arzt' ? (
                            <Stethoscope className="w-5 h-5 text-brand-primary" />
                        ) : (
                            <span className="font-bold text-brand-primary">
                                {entry.user.name.charAt(0)}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-brand-text">{entry.user.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${colorClass}`}>
                                {entry.user.role || 'Mitarbeiter'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Schicht Badges */}
                {entry.activeShifts && entry.activeShifts.length > 0 && (
                    <div className="flex flex-col gap-1 items-end">
                        {entry.activeShifts.map(s => (
                            <span
                                key={s.id}
                                className="text-xs px-2 py-1 rounded text-white font-medium shadow-sm"
                                style={{ backgroundColor: s.shiftTypeSetting?.color || '#cbd5e1' }}
                            >
                                {s.shiftTypeSetting?.label || s.shift_type}
                            </span>
                        ))}
                    </div>
                )}

                {/* Abwesenheits Badge */}
                {entry.isAbsent && entry.absentShift && (
                    <span
                        className="text-xs px-2 py-1 rounded text-white font-medium shadow-sm flex items-center gap-1"
                        style={{ backgroundColor: entry.absentShift.shiftTypeSetting?.color || '#cbd5e1' }}
                    >
                        {entry.absentShift.shift_type === 'urlaub' && <Palmtree className="w-3 h-3" />}
                        {entry.absentShift.shift_type.includes('krank') && <HeartPulse className="w-3 h-3" />}
                        {entry.absentShift.shift_type === 'weiterbildung' && <GraduationCap className="w-3 h-3" />}
                        {entry.absentShift.shiftTypeSetting?.label || entry.absentShift.shift_type}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 overflow-y-auto pb-8">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">Tagesübersicht</h1>
                    <p className="text-brand-text-sec mt-1 capitalize">{todayDateStr}</p>
                </div>

                {/* Date Controls */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={navigateToday}
                        className="px-4 py-1.5 text-sm font-medium text-brand-text border border-brand-border rounded-lg hover:bg-gray-50 flex items-center"
                    >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Heute
                    </button>
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

                <div className="hidden md:flex items-center gap-4 w-full md:w-auto justify-end">
                    <div className="text-center px-4 border-r border-gray-200">
                        <p className="text-3xl font-bold text-brand-primary">
                            {dashboardGroups.team1.length + dashboardGroups.team2.length + dashboardGroups.koordination.length}
                        </p>
                        <p className="text-xs text-brand-text-sec uppercase tracking-wider font-semibold">Anwesend</p>
                    </div>
                    <div className="text-center pl-2">
                        <p className="text-3xl font-bold text-red-500">
                            {dashboardGroups.absent.length}
                        </p>
                        <p className="text-xs text-brand-text-sec uppercase tracking-wider font-semibold">Abwesend</p>
                    </div>
                </div>
            </div>

            {/* Main Teams: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Team 1 */}
                <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden flex flex-col">
                    <div className="bg-brand-sidebar p-4 border-b border-brand-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-primary" />
                            <h2 className="font-bold text-brand-text text-lg">Team 1</h2>
                        </div>
                        <span className="bg-brand-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                            {dashboardGroups.team1.length}
                        </span>
                    </div>
                    <div className="p-4 flex-1 bg-gray-50/50">
                        {dashboardGroups.team1.length === 0 ? (
                            <p className="text-center text-brand-text-sec py-8">Niemand aus Team 1 im Dienst.</p>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                {dashboardGroups.team1.map(entry => (
                                    <PersonCard key={entry.user.id} entry={entry} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Team 2 */}
                <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden flex flex-col">
                    <div className="bg-brand-sidebar p-4 border-b border-brand-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-primary" />
                            <h2 className="font-bold text-brand-text text-lg">Team 2</h2>
                        </div>
                        <span className="bg-brand-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                            {dashboardGroups.team2.length}
                        </span>
                    </div>
                    <div className="p-4 flex-1 bg-gray-50/50">
                        {dashboardGroups.team2.length === 0 ? (
                            <p className="text-center text-brand-text-sec py-8">Niemand aus Team 2 im Dienst.</p>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                {dashboardGroups.team2.map(entry => (
                                    <PersonCard key={entry.user.id} entry={entry} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Koordination & Absenzen */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">

                {/* Koordination */}
                <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden flex flex-col">
                    <div className="bg-brand-sidebar p-4 border-b border-brand-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-primary" />
                            <h2 className="font-bold text-brand-text text-lg">Koordination</h2>
                        </div>
                        <span className="bg-brand-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                            {dashboardGroups.koordination.length}
                        </span>
                    </div>
                    <div className="p-4 flex-1 bg-gray-50/50">
                        {dashboardGroups.koordination.length === 0 ? (
                            <p className="text-center text-brand-text-sec py-6">Keine Koordination im Dienst.</p>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                {dashboardGroups.koordination.map(entry => (
                                    <PersonCard key={entry.user.id} entry={entry} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Abwesend */}
                <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden flex flex-col border-red-200">
                    <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HeartPulse className="w-5 h-5 text-red-500" />
                            <h2 className="font-bold text-red-900 text-lg">Abwesend</h2>
                        </div>
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {dashboardGroups.absent.length}
                        </span>
                    </div>
                    <div className="p-4 flex-1 bg-gray-50/50">
                        {dashboardGroups.absent.length === 0 ? (
                            <p className="text-center text-brand-text-sec py-6">Alle Mitarbeiter sind gesund und da.</p>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                {dashboardGroups.absent.map(entry => (
                                    <PersonCard key={entry.user.id} entry={entry} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
