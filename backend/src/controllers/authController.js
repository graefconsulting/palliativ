const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
        }

        if (user.status !== 'aktiv') {
            return res.status(403).json({ message: 'Konto ist deaktiviert' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
        }

        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            team: user.team,
            app_role: user.app_role,
            name: user.name,
            must_change_password: user.must_change_password
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '12h' });

        res.json({
            token,
            user: tokenPayload
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
};

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // Aus der Token-Middleware

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Altes und neues Passwort erforderlich' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' });

        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Das alte Passwort ist falsch' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password_hash: hashedNewPassword,
                must_change_password: false
            }
        });

        res.json({ message: 'Passwort erfolgreich geändert' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
};

module.exports = { login, changePassword };
