const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startOfMonth, endOfMonth, parseISO } = require('date-fns');

// --- Vacation Requests ---

const getVacationRequests = async (req, res) => {
    try {
        const userRole = req.user.app_role;
        const userId = req.user.id;

        // Admin und Leitung sehen alle, Mitarbeiter nur ihre eigenen
        const whereClause = (userRole === 'admin' || userRole === 'leitung') ? {} : { user_id: userId };

        const requests = await prisma.vacationRequest.findMany({
            where: whereClause,
            include: {
                user: { select: { id: true, name: true, role: true, team: true } },
                reviewer: { select: { id: true, name: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching vacation requests:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Laden der Urlaubsanträge' });
    }
};

const createVacationRequest = async (req, res) => {
    const { date_from, date_to, notes } = req.body;
    const user_id = req.user.id;

    if (!date_from || !date_to) {
        return res.status(400).json({ message: 'Start- und Enddatum sind erforderlich' });
    }

    try {
        const newRequest = await prisma.vacationRequest.create({
            data: {
                user_id,
                date_from: new Date(date_from),
                date_to: new Date(date_to),
                status: 'ausstehend',
                notes
            }
        });
        res.status(201).json(newRequest);
    } catch (error) {
        console.error('Error creating vacation request:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Erstellen des Urlaubsantrags' });
    }
};

const updateVacationRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status, default_shift_type } = req.body; // 'genehmigt' oder 'abgelehnt'
    const reviewed_by = req.user.id;

    if (!['genehmigt', 'abgelehnt', 'ausstehend'].includes(status)) {
        return res.status(400).json({ message: 'Ungültiger Status' });
    }

    try {
        const updatedRequest = await prisma.vacationRequest.update({
            where: { id },
            data: {
                status,
                reviewed_by,
                reviewed_at: new Date()
            }
        });

        // Optional: Wenn genehmigt, direkt Shifts in den Dienstplan eintragen
        // Dafür müsste der Admin im Frontend ggf. sagen, dass Urlaubstage generiert werden sollen.
        // Wurde im Frontend angekündigt: "ggf. schreibt es direkt Urlaub-Shifts". 
        // Wir implementieren das als Bonus später oder Admin macht es über Roster.

        res.json(updatedRequest);
    } catch (error) {
        console.error('Error updating vacation request status:', error);
        res.status(500).json({ message: 'Interner Serverfehler bei der Status-Änderung' });
    }
};

const deleteVacationRequest = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.app_role;

    try {
        const request = await prisma.vacationRequest.findUnique({ where: { id } });

        if (!request) {
            return res.status(404).json({ message: 'Antrag nicht gefunden' });
        }

        // Nur Ersteller darf seinen ausstehenden Antrag löschen, Admin darf alle löschen
        if (userRole !== 'admin' && (request.user_id !== userId || request.status !== 'ausstehend')) {
            return res.status(403).json({ message: 'Keine Berechtigung diesen Antrag zu löschen' });
        }

        await prisma.vacationRequest.delete({ where: { id } });
        res.json({ message: 'Antrag erfolgreich gelöscht' });
    } catch (error) {
        console.error('Error deleting vacation request:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Löschen des Urlaubsantrags' });
    }
};

// --- Availability Requests ---

const getAvailabilityRequests = async (req, res) => {
    try {
        const { date, view, userId } = req.query; // ähnlich wie shiftController filtern
        const currentUserRole = req.user.app_role;
        const currentUserId = req.user.id;

        let whereClause = {};

        // Mitarbeiter sehen nur ihre eigenen, Admins alle oder gefiltert
        if (currentUserRole !== 'admin' && currentUserRole !== 'leitung') {
            whereClause.user_id = currentUserId;
        } else if (userId) {
            whereClause.user_id = userId;
        }

        if (date) {
            const targetDate = parseISO(date);
            let startDate, endDate;

            if (view === 'month') {
                startDate = startOfMonth(targetDate);
                endDate = endOfMonth(targetDate);
            } else {
                // Standardmäßig Monatsweise abfragen für Availability
                startDate = startOfMonth(targetDate);
                endDate = endOfMonth(targetDate);
            }

            whereClause.date = {
                gte: startDate,
                lte: endDate,
            };
        }

        const requests = await prisma.availabilityRequest.findMany({
            where: whereClause,
            include: {
                user: { select: { id: true, name: true } },
            },
            orderBy: { date: 'asc' }
        });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching availability requests:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Laden der Verfügbarkeiten' });
    }
};

const createAvailabilityRequest = async (req, res) => {
    const { date, type, notes } = req.body;
    const user_id = req.user.id;

    if (!date || !type) {
        return res.status(400).json({ message: 'Datum und Typ sind erforderlich' });
    }

    try {
        // Falls schon einer für diesen Tag existiert, überschreiben!
        const existing = await prisma.availabilityRequest.findFirst({
            where: { user_id, date: new Date(date) }
        });

        if (existing) {
            const updatedRequest = await prisma.availabilityRequest.update({
                where: { id: existing.id },
                data: { type, notes }
            });
            return res.json(updatedRequest);
        }

        const newRequest = await prisma.availabilityRequest.create({
            data: {
                user_id,
                date: new Date(date),
                type, // 'keine_zeit' oder 'bevorzugt'
                notes
            }
        });
        res.status(201).json(newRequest);
    } catch (error) {
        console.error('Error creating availability request:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Erstellen der Verfügbarkeit' });
    }
};

const deleteAvailabilityRequest = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.app_role;

    try {
        const request = await prisma.availabilityRequest.findUnique({ where: { id } });

        if (!request) {
            return res.status(404).json({ message: 'Anfrage nicht gefunden' });
        }

        if (userRole !== 'admin' && request.user_id !== userId) {
            return res.status(403).json({ message: 'Keine Berechtigung' });
        }

        await prisma.availabilityRequest.delete({ where: { id } });
        res.json({ message: 'Anfrage erfolgreich gelöscht' });
    } catch (error) {
        console.error('Error deleting availability request:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Löschen der Verfügbarkeit' });
    }
};

module.exports = {
    getVacationRequests,
    createVacationRequest,
    updateVacationRequestStatus,
    deleteVacationRequest,
    getAvailabilityRequests,
    createAvailabilityRequest,
    deleteAvailabilityRequest
};
