import React, { useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import clsx from 'clsx';

export default function RosterWeekView({
    currentDate,
    shifts,
    users,
    holidays,
    onCellClick,
    isAdmin
}) {

    // 7 Tage der aktuellen Woche generieren
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(currentDate, i));
    }, [currentDate]);

    // Gruppiere User nach Teams
    const groupedUsers = useMemo(() => {
        const groups = {
            'Koordination': users.filter(u => u.team === 'koordination'),
            'Team 1': users.filter(u => u.team === 'team1'),
            'Team 2': users.filter(u => u.team === 'team2'),
            'Ohne Team': users.filter(u => !u.team)
        };

        // Leere Gruppen entfernen
        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0) delete groups[key];
        });

        return groups;
    }, [users]);

    const getShiftsForUserAndDay = (userId, date) => {
        return shifts.filter(s => s.user_id === userId && isSameDay(new Date(s.date), date));
    };

    // Prüfe ob ein Tag Feiertag in Hessen ist
    const isHoliday = (date) => {
        const formattedDate = format(date, 'yyyy-MM-dd');
        return holidays.find(h => h.date === formattedDate);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead className="bg-brand-sidebar">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-brand-text uppercase tracking-wider w-48 sticky left-0 bg-brand-sidebar z-10 border-r border-b border-brand-border">
                                Mitarbeiter
                            </th>
                            {weekDays.map((day, i) => {
                                const holiday = isHoliday(day);
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <th
                                        key={i}
                                        scope="col"
                                        className={clsx(
                                            "px-2 py-3 text-center text-xs tracking-wider min-w-[100px] border-r border-b border-brand-border last:border-r-0",
                                            isToday ? "bg-brand-primary/10 font-bold text-brand-primary" : "font-medium text-brand-text-sec",
                                            (isWeekend || holiday) && !isToday ? "bg-red-50/50" : ""
                                        )}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="uppercase">{format(day, 'EEE', { locale: de })}</span>
                                            <span className="text-sm mt-1">{format(day, 'dd.MM.')}</span>
                                            {holiday && (
                                                <span className="text-[10px] text-red-500 mt-1 truncate w-20" title={holiday.localName}>
                                                    {holiday.localName}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {Object.entries(groupedUsers).map(([teamName, teamUsers]) => (
                            <React.Fragment key={teamName}>
                                {/* Team Header Row */}
                                <tr className="bg-gray-50">
                                    <td colSpan={8} className="px-4 py-2 text-xs font-bold text-brand-text-sec uppercase tracking-wider sticky left-0 border-b border-brand-border">
                                        {teamName}
                                    </td>
                                </tr>

                                {/* User Rows */}
                                {teamUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-2 text-sm font-medium text-brand-text sticky left-0 bg-white border-r border-b border-brand-border align-middle">
                                            <div className="min-h-[40px] flex flex-col justify-center">
                                                <span className="truncate w-32 md:w-40 block" title={user.name}>{user.name}</span>
                                                <span className="text-xs text-brand-text-sec capitalize block">{user.role || '-'}</span>
                                            </div>
                                        </td>

                                        {weekDays.map((day, i) => {
                                            const userShifts = getShiftsForUserAndDay(user.id, day);
                                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                            const holiday = isHoliday(day);

                                            return (
                                                <td
                                                    key={i}
                                                    onClick={() => isAdmin ? onCellClick(user, day, userShifts[0]) : null}
                                                    className={clsx(
                                                        "px-2 py-2 text-center border-r border-b border-brand-border last:border-r-0 relative group align-top",
                                                        isAdmin && "cursor-pointer hover:bg-gray-100",
                                                        (isWeekend || holiday) && userShifts.length === 0 ? "bg-red-50/50" : "bg-white"
                                                    )}
                                                >
                                                    {userShifts.length > 0 ? (
                                                        <div className="flex flex-col gap-1 w-full h-full">
                                                            {userShifts.map((shift, shiftIndex) => (
                                                                <div
                                                                    key={shift.id || shiftIndex}
                                                                    className="w-full min-h-[40px] rounded flex flex-col items-center justify-center p-1 text-white text-[11px] font-medium leading-tight shadow-sm transition-transform hover:scale-[1.02] relative"
                                                                    style={{ backgroundColor: shift.shiftTypeSetting?.color || '#cbd5e1' }}
                                                                    title={shift.notes ? `${shift.shiftTypeSetting?.label}: ${shift.notes}` : shift.shiftTypeSetting?.label}
                                                                    onClick={(e) => {
                                                                        if (isAdmin) {
                                                                            e.stopPropagation();
                                                                            onCellClick(user, day, shift);
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className="truncate w-full">{shift.shiftTypeSetting?.label || shift.shift_type}</span>
                                                                    {(shift.start_time && shift.end_time) && (
                                                                        <span className="opacity-90 font-normal">
                                                                            {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                                                                        </span>
                                                                    )}
                                                                    {shift.notes && (
                                                                        <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full border border-white translate-x-1 -translate-y-1"></span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        isAdmin && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary">
                                                            <span className="text-xl">+</span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
