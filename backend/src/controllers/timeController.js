const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startOfMonth, endOfMonth, parseISO, differenceInMinutes, startOfWeek, endOfWeek } = require('date-fns');

// Hilfsfunktion zur Berechnung der Dauer in Stunden
const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const minutes = differenceInMinutes(end, start);
    return Number((minutes / 60).toFixed(2));
};

const getTimeTrackings = async (req, res) => {
    try {
        const { userId, month, year } = req.query; // format month='03', year='2026'
        const currentUserRole = req.user.app_role;
        const currentUserId = req.user.id;

        let whereClause = {};

        // Mitarbeiter sehen nur eigene, Admins alle oder gefiltert
        if (currentUserRole !== 'admin' && currentUserRole !== 'leitung') {
            whereClause.user_id = currentUserId;
        } else if (userId) {
            whereClause.user_id = userId;
        }

        if (month && year) {
            // Monat filter (Basis 0 in JS Date)
            const startDate = new Date(year, parseInt(month) - 1, 1);
            const endDate = endOfMonth(startDate);
            whereClause.date = {
                gte: startDate,
                lte: endDate,
            };
        }

        const trackings = await prisma.timeTracking.findMany({
            where: whereClause,
            include: {
                user: { select: { id: true, name: true, contract_hours_week: true, role: true } },
                reviewer: { select: { id: true, name: true } }
            },
            orderBy: { date: 'asc' }
        });

        res.json(trackings);
    } catch (error) {
        console.error('Error fetching time trackings:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Laden der Zeiterfassung' });
    }
};

const getOvertimeSummary = async (req, res) => {
    try {
        const { userId, month, year } = req.query;
        if (!userId) {
            return res.status(400).json({ message: 'Benutzer-ID erforderlich' });
        }

        const targetDate = new Date(year, parseInt(month) - 1, 1);
        const mStart = startOfMonth(targetDate);
        const mEnd = endOfMonth(targetDate);

        // Hole den User für Vertragsstunden
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'User nicht gefunden' });

        // Hole alle *genehmigten* Einträge des Monats
        const trackings = await prisma.timeTracking.findMany({
            where: {
                user_id: userId,
                status: 'genehmigt',
                date: { gte: mStart, lte: mEnd }
            }
        });

        // Ist-Stunden
        let totalActualHours = 0;
        trackings.forEach(t => {
            totalActualHours += calculateDuration(t.start_time, t.end_time);
        });

        // Vereinfachte Soll-Stunden Berechnung: Wochenstunden / 5 * Arbeitstage im Monat
        // In einer echten App würde man Feiertage, Urlaube und Arbeitstage pro Monat exakt bestimmen.
        // Für diesen Showcase grob: (Wochenstunden / 40) * 173.33 (durchschnittliche Monatsstunden bei Vollzeit)
        const contractHours = parseFloat(user.contract_hours_week);
        const targetMonthlyHours = (contractHours / 40) * 173.33;

        const overtime = totalActualHours - targetMonthlyHours;

        res.json({
            actualHours: Number(totalActualHours.toFixed(2)),
            targetHours: Number(targetMonthlyHours.toFixed(2)),
            overtime: Number(overtime.toFixed(2))
        });

    } catch (error) {
        console.error('Error calculating overtime:', error);
        res.status(500).json({ message: 'Fehler bei der Überstundenberechnung' });
    }
};

const createTimeTracking = async (req, res) => {
    const { date, start_time, end_time, notes } = req.body;
    const user_id = req.user.id;

    if (!date || !start_time || !end_time) {
        return res.status(400).json({ message: 'Datum, Start- und Endzeit sind erforderlich' });
    }

    try {
        // Wenn am gleichen Tag schon einer da ist, könnte man ablehnen. Wir erlauben aber mehrere pro Tag.
        const newEntry = await prisma.timeTracking.create({
            data: {
                user_id,
                date: new Date(date),
                start_time: new Date(start_time),
                end_time: new Date(end_time),
                status: 'ausstehend',
                notes
            }
        });
        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Error creating time entry:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Erstellen des Zeiteintrags' });
    }
};

const updateTimeTrackingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const reviewed_by = req.user.id;

    if (!['genehmigt', 'abgelehnt', 'ausstehend'].includes(status)) {
        return res.status(400).json({ message: 'Ungültiger Status' });
    }

    try {
        const entry = await prisma.timeTracking.update({
            where: { id },
            data: {
                status,
                reviewed_by,
                reviewed_at: new Date()
            }
        });
        res.json(entry);
    } catch (error) {
        console.error('Error updating time status:', error);
        res.status(500).json({ message: 'Interner Serverfehler bei der Status-Änderung' });
    }
};

const deleteTimeTracking = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.app_role;

    try {
        const entry = await prisma.timeTracking.findUnique({ where: { id } });
        if (!entry) return res.status(404).json({ message: 'Eintrag nicht gefunden' });

        // Nur eigene "ausstehende" dürfen gelöscht werden, Admins dürfen alle
        if (userRole !== 'admin' && (entry.user_id !== userId || entry.status !== 'ausstehend')) {
            return res.status(403).json({ message: 'Keine Berechtigung' });
        }

        await prisma.timeTracking.delete({ where: { id } });
        res.json({ message: 'Eintrag gelöscht' });
    } catch (error) {
        console.error('Error deleting time entry:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Löschen des Eintrags' });
    }
};

module.exports = {
    getTimeTrackings,
    getOvertimeSummary,
    createTimeTracking,
    updateTimeTrackingStatus,
    deleteTimeTracking
};
