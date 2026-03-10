import { useMemo } from 'react';
import { format, addDays, getDaysInMonth, startOfMonth, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import clsx from 'clsx';
import React from 'react';

export default function RosterMonthView({
    currentDate,
    shifts,
    users,
    holidays,
    onCellClick,
    isAdmin
}) {

    // Alle Tage des aktuellen Monats generieren
    const monthDays = useMemo(() => {
        const start = startOfMonth(currentDate);
        const daysInMonth = getDaysInMonth(currentDate);
        return Array.from({ length: daysInMonth }).map((_, i) => addDays(start, i));
    }, [currentDate]);

    // Gruppiere User nach Teams
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

    const getShiftsForUserAndDay = (userId, date) => {
        return shifts.filter(s => s.user_id === userId && isSameDay(new Date(s.date), date));
    };

    const isHoliday = (date) => {
        const formattedDate = format(date, 'yyyy-MM-dd');
        return holidays.find(h => h.date === formattedDate);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
            <div className="overflow-x-auto pb-2">
                <table className="min-w-full border-collapse">
                    <thead className="bg-brand-sidebar">
                        <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-brand-text uppercase sticky left-0 bg-brand-sidebar z-10 border-r border-brand-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[150px]">
                                Mitarbeiter
                            </th>
                            {monthDays.map((day, i) => {
                                const holiday = isHoliday(day);
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <th
                                        key={i}
                                        scope="col"
                                        className={clsx(
                                            "px-1 py-1 text-center text-xs border-r border-b border-brand-border min-w-[36px]",
                                            isToday ? "bg-brand-primary/10 font-bold text-brand-primary" : "font-medium text-brand-text-sec",
                                            (isWeekend || holiday) && !isToday ? "bg-red-50/50" : ""
                                        )}
                                        title={holiday ? holiday.localName : format(day, 'eeee, dd.MM.yyyy', { locale: de })}
                                    >
                                        <div className="flex flex-col items-center leading-tight">
                                            <span className={clsx("text-[10px]", isWeekend && "text-red-500")}>
                                                {format(day, 'EEEEEE', { locale: de })} {/* Mo, Di, Mi... */}
                                            </span>
                                            <span>{format(day, 'dd')}</span>
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
                                <tr className="bg-gray-50 border-y border-brand-border">
                                    <td colSpan={monthDays.length + 1} className="px-3 py-1.5 text-xs font-bold text-brand-text-sec uppercase tracking-wider sticky left-0 z-10 bg-gray-50">
                                        {teamName}
                                    </td>
                                </tr>

                                {/* User Rows */}
                                {teamUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                                        <td className="px-3 py-2 text-sm font-medium text-brand-text sticky left-0 bg-white border-r border-b border-brand-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10 whitespace-nowrap">
                                            <span className="truncate block w-32" title={user.name}>{user.name}</span>
                                        </td>

                                        {monthDays.map((day, i) => {
                                            const userShifts = getShiftsForUserAndDay(user.id, day);
                                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                            const holiday = isHoliday(day);

                                            return (
                                                <td
                                                    key={i}
                                                    onClick={() => isAdmin ? onCellClick(user, day, userShifts[0]) : null}
                                                    className={clsx(
                                                        "px-0.5 py-0.5 text-center border-r border-b border-brand-border relative group h-10 min-w-[36px] align-top",
                                                        isAdmin && "cursor-pointer hover:bg-gray-100",
                                                        (isWeekend || holiday) && userShifts.length === 0 ? "bg-red-50/50" : "bg-white"
                                                    )}
                                                >
                                                    {userShifts.length > 0 ? (
                                                        <div className="flex flex-col gap-0.5 w-full h-full">
                                                            {userShifts.map((shift, shiftIndex) => (
                                                                <div
                                                                    key={shift.id || shiftIndex}
                                                                    className="w-full flex-1 min-h-[16px] rounded-sm flex items-center justify-center text-white text-[9px] font-bold shadow-sm transition-transform hover:scale-110 relative"
                                                                    style={{ backgroundColor: shift.shiftTypeSetting?.color || '#cbd5e1' }}
                                                                    title={`${shift.shiftTypeSetting?.label} ${shift.start_time ? '(' + format(new Date(shift.start_time), 'HH:mm') + '-' + format(new Date(shift.end_time), 'HH:mm') + ')' : ''}${shift.notes ? ' - ' + shift.notes : ''}`}
                                                                    onClick={(e) => {
                                                                        if (isAdmin) {
                                                                            e.stopPropagation();
                                                                            onCellClick(user, day, shift);
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className="truncate w-full block leading-none px-0.5">
                                                                        {shift.shift_type.substring(0, 3).toUpperCase()}
                                                                    </span>
                                                                    {shift.notes && (
                                                                        <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-yellow-400 rounded-full border border-white"></span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        isAdmin && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary">
                                                            <span className="text-sm">+</span>
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
