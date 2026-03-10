const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                team: true,
                app_role: true,
                contract_hours_week: true,
                vacation_days_year: true,
                status: true
            },
            orderBy: { name: 'asc' }
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
};

const createUser = async (req, res) => {
    const { name, email, role, team, app_role, contract_hours_week, vacation_days_year } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: 'Name und E-Mail sind erforderlich' });
    }

    try {
        const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existing) {
            return res.status(400).json({ message: 'Diese E-Mail wird bereits verwendet' });
        }

        const hashedPassword = await bcrypt.hash('Palliativ2026!', 10);

        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password_hash: hashedPassword,
                role,
                team,
                app_role: app_role || 'mitarbeiter',
                contract_hours_week: contract_hours_week || 40,
                vacation_days_year: vacation_days_year || 30,
                must_change_password: true,
                status: 'aktiv'
            }
        });

        res.status(201).json({ message: 'Benutzer erstellt', userId: user.id });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Erstellen' });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Entferne passwort aus den updates, falls versehentlich mitgesendet
    delete updateData.password_hash;
    delete updateData.must_change_password;
    delete updateData.id;

    try {
        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });
        res.json({ message: 'Benutzer aktualisiert' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Fehler beim Aktualisieren' });
    }
};

const deactivateUser = async (req, res) => {
    const { id } = req.params;

    // Admin (Veit Gräf) darf sich nicht selbst deaktivieren (als Schutz)
    if (req.user.id === id) {
        return res.status(400).json({ message: 'Du kannst deinen eigenen Account nicht deaktivieren' });
    }

    try {
        await prisma.user.update({
            where: { id },
            data: { status: 'deaktiviert' }
        });
        res.json({ message: 'Benutzer erfolgreich deaktiviert' });
    } catch (error) {
        console.error('Error deactivating user:', error);
        res.status(500).json({ message: 'Fehler bei der Deaktivierung' });
    }
};

module.exports = { getAllUsers, createUser, updateUser, deactivateUser };
