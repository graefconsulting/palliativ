import { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import clsx from 'clsx';
import { Clock, Plus } from 'lucide-react';

export default function RosterDayView({
    currentDate,
    shifts,
    users,
    onCellClick,
    isAdmin
}) {

    const groupedUsers = useMemo(() => {
        const groups = {
            'Koordination': users.filter(u => u.team === 'koordination'),
            'Team 1': users.filter(u => u.team === 'team1'),
            'Team 2': users.filter(u => u.team === 'team2'),
            'Ohne Team': users.filter(u => !u.team)
        };

        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0) delete groups[key];
        });

        return groups;
    }, [users]);

    const getShiftsForUser = (userId) => {
        return shifts.filter(s => s.user_id === userId && isSameDay(new Date(s.date), currentDate));
    };

    // Zählt, wie viele pro Team verfügbar sind (Krank/Urlaub zählen nicht, Offene/Reguläre Dienste zählen)
    const getAvailabilityStats = (teamUsers) => {
        let total = teamUsers.length;
        let available = 0;
        let doctors = 0;
        let nurses = 0;

        teamUsers.forEach(user => {
            const userShifts = getShiftsForUser(user.id);

            // Annahme: Typen, die Abwesenheit bedeuten, haben spezielle Flags oder wir hardcoden es anhand des Namens
            // 'krank_au', 'krank_ohne_au', 'urlaub', 'weiterbildung'
            const isAbsent = userShifts.some(s => ['krank_au', 'krank_ohne_au', 'urlaub', 'weiterbildung'].includes(s.shift_type));

            if (!isAbsent) {
                available++;
                if (user.role === 'arzt') doctors++;
                if (user.role === 'pfleger') nurses++;
            }
        });

        return { total, available, doctors, nurses };
    };

    return (
        <div className="space-y-6">
            {Object.entries(groupedUsers).map(([teamName, teamUsers]) => {
                const stats = getAvailabilityStats(teamUsers);

                return (
                    <div key={teamName} className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
                        <div className="bg-brand-sidebar px-4 py-3 border-b border-brand-border flex justify-between items-center flex-wrap gap-2">
                            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">{teamName}</h3>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
                                    {stats.available} von {stats.total} verfügbar
                                </span>
                                <span className="text-brand-text-sec text-xs bg-gray-100 px-3 py-1 rounded-full">
                                    ({stats.doctors} Ärzte, {stats.nurses} Pfleger)
                                </span>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {teamUsers.map(user => {
                                const userShifts = getShiftsForUser(user.id);

                                return (
                                    <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-brand-text font-bold text-sm">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-brand-text">{user.name}</p>
                                                <p className="text-xs text-brand-text-sec capitalize">{user.role || 'Unbekannt'} • {user.contract_hours_week}h/W</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-2 items-center">
                                            {userShifts.length > 0 ? (
                                                userShifts.map((shift, shiftIndex) => (
                                                    <button
                                                        key={shift.id || shiftIndex}
                                                        onClick={() => isAdmin ? onCellClick(user, currentDate, shift) : null}
                                                        className={clsx(
                                                            "flex items-center gap-3 px-4 py-2 rounded-lg border w-full max-w-md transition-shadow",
                                                            isAdmin ? "hover:shadow-md cursor-pointer" : "cursor-default"
                                                        )}
                                                        style={{
                                                            backgroundColor: `${shift.shiftTypeSetting?.color}15`,
                                                            borderColor: `${shift.shiftTypeSetting?.color}40`
                                                        }}
                                                    >
                                                        <div
                                                            className="w-3 h-3 rounded-full shrink-0"
                                                            style={{ backgroundColor: shift.shiftTypeSetting?.color }}
                                                        />
                                                        <div className="flex-1 text-left flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                            <span className="font-semibold text-brand-text">
                                                                {shift.shiftTypeSetting?.label || shift.shift_type}
                                                            </span>
                                                            {shift.start_time && shift.end_time && (
                                                                <span className="text-sm text-brand-text-sec flex items-center mt-1 sm:mt-0">
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {shift.notes && (
                                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200 truncate max-w-[100px]" title={shift.notes}>
                                                                {shift.notes}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="w-full max-w-md flex justify-center">
                                                    {isAdmin ? (
                                                        <button
                                                            onClick={() => onCellClick(user, currentDate, null)}
                                                            className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-colors w-full justify-center"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            <span className="text-sm font-medium">Dienst zuweisen</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 italic">Kein Dienst eingetragen</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
