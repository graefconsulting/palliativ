const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, startOfDay, endOfDay } = require('date-fns');

// Hilfsfunktion: Hole Schichten basierend auf Datumsbereich (Woche oder Monat)
const getShifts = async (req, res) => {
    const { view, date, userId } = req.query; // view: 'day', 'week', 'month'

    if (!date) {
        return res.status(400).json({ message: 'Datum ist erforderlich' });
    }

    try {
        const targetDate = parseISO(date);
        let startDate, endDate;

        if (view === 'month') {
            startDate = startOfMonth(targetDate);
            endDate = endOfMonth(targetDate);
        } else if (view === 'week') {
            startDate = startOfWeek(targetDate, { weekStartsOn: 1 }); // Woche beginnt am Montag
            endDate = endOfWeek(targetDate, { weekStartsOn: 1 });
        } else if (view === 'day') {
            startDate = startOfDay(targetDate);
            endDate = endOfDay(targetDate);
        } else {
            // Fallback: Default ist die aktuelle Woche
            startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
            endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
        }

        const whereClause = {
            date: {
                gte: startDate,
                lte: endDate,
            }
        };

        if (userId) {
            whereClause.user_id = userId; // Filtern für 'Mein Dienstplan' Ansicht
        }

        const shifts = await prisma.shift.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        team: true,
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        res.json(shifts);
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Laden der Schichten' });
    }
};

const createShift = async (req, res) => {
    const { user_id, date, shift_type, start_time, end_time, notes } = req.body;
    const created_by = req.user.id; // Aus Middleware

    if (!user_id || !date || !shift_type) {
        return res.status(400).json({ message: 'Mitarbeiter, Datum und Dienstart sind erforderlich' });
    }

    try {
        const newShift = await prisma.shift.create({
            data: {
                user_id,
                date: new Date(date),
                shift_type,
                start_time: start_time ? new Date(start_time) : null,
                end_time: end_time ? new Date(end_time) : null,
                notes,
                created_by
            }
        });
        res.status(201).json(newShift);
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Anlegen der Schicht' });
    }
};

const updateShift = async (req, res) => {
    const { id } = req.params;
    const { shift_type, start_time, end_time, notes } = req.body;

    try {
        const updatedShift = await prisma.shift.update({
            where: { id },
            data: {
                shift_type,
                start_time: start_time ? new Date(start_time) : null,
                end_time: end_time ? new Date(end_time) : null,
                notes
            }
        });
        res.json(updatedShift);
    } catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Aktualisieren der Schicht' });
    }
};

const deleteShift = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.shift.delete({
            where: { id }
        });
        res.json({ message: 'Schicht erfolgreich gelöscht' });
    } catch (error) {
        console.error('Error deleting shift:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Löschen der Schicht' });
    }
};

const getOnCallReport = async (req, res) => {
    const { month, year } = req.query; // e.g. '03', '2026'
    if (!month || !year) return res.status(400).json({ message: 'Monat und Jahr erforderlich' });

    try {
        const startDate = new Date(year, parseInt(month) - 1, 1);
        const endDate = endOfMonth(startDate);

        const shifts = await prisma.shift.findMany({
            where: {
                date: { gte: startDate, lte: endDate },
                shift_type: { in: ['nach_rufdienst', 'rufdienst_woche', 'rufdienst_we_fruh', 'rufdienst_we_spat'] }
            },
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { date: 'asc' }
        });

        res.json(shifts);
    } catch (error) {
        console.error('Error fetching on-call report:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Laden der Rufdienste' });
    }
};

const getIllnessReport = async (req, res) => {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: 'Monat und Jahr erforderlich' });

    try {
        const startDate = new Date(year, parseInt(month) - 1, 1);
        const endDate = endOfMonth(startDate);

        const shifts = await prisma.shift.findMany({
            where: {
                date: { gte: startDate, lte: endDate },
                shift_type: { in: ['krank_au', 'krank_ohne_au'] }
            },
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { date: 'asc' }
        });

        res.json(shifts);
    } catch (error) {
        console.error('Error fetching illness report:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Laden der Krankheitstage' });
    }
};

module.exports = { getShifts, createShift, updateShift, deleteShift, getOnCallReport, getIllnessReport };
