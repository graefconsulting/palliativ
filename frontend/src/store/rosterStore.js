import { create } from 'zustand';
import { startOfWeek, addWeeks, subWeeks, addMonths, subMonths, addDays, subDays, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

const useRosterStore = create((set, get) => ({
    currentDate: startOfWeek(new Date(), { weekStartsOn: 1 }), // Default: Montag der aktuellen Woche
    viewMode: 'week', // 'day', 'week', 'month'

    // Navigation
    setViewMode: (mode) => {
        let newDate = get().currentDate;
        // Beim Wechsel der Ansicht oft sinnvoll, auf den Start des entsprechenden Zeitraums zu springen
        if (mode === 'week') {
            newDate = startOfWeek(newDate, { weekStartsOn: 1 });
        } else if (mode === 'day') {
            newDate = startOfDay(newDate);
        }
        set({ viewMode: mode, currentDate: newDate });
    },

    setCurrentDate: (date) => set({ currentDate: date }),

    navigateNext: () => {
        const state = get();
        if (state.viewMode === 'day') {
            set({ currentDate: addDays(state.currentDate, 1) });
        } else if (state.viewMode === 'week') {
            set({ currentDate: addWeeks(state.currentDate, 1) });
        } else if (state.viewMode === 'month') {
            set({ currentDate: addMonths(state.currentDate, 1) });
        }
    },

    navigatePrev: () => {
        const state = get();
        if (state.viewMode === 'day') {
            set({ currentDate: subDays(state.currentDate, 1) });
        } else if (state.viewMode === 'week') {
            set({ currentDate: subWeeks(state.currentDate, 1) });
        } else if (state.viewMode === 'month') {
            set({ currentDate: subMonths(state.currentDate, 1) });
        }
    },

    navigateToday: () => {
        const today = new Date();
        const state = get();
        if (state.viewMode === 'week') {
            set({ currentDate: startOfWeek(today, { weekStartsOn: 1 }) });
        } else {
            set({ currentDate: startOfDay(today) });
        }
    }
}));

export default useRosterStore;
