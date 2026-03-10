const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getShiftSettings = async (req, res) => {
    try {
        const settings = await prisma.shiftTypeSetting.findMany({
            orderBy: { label: 'asc' }
        });
        res.json(settings);
    } catch (error) {
        console.error('Error fetching shift settings:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Laden der Dienstarten' });
    }
};

const updateShiftSetting = async (req, res) => {
    const { id } = req.params;
    const { label, color, default_start, default_end } = req.body;

    try {
        const updated = await prisma.shiftTypeSetting.update({
            where: { id },
            data: { label, color, default_start, default_end }
        });
        res.json(updated);
    } catch (error) {
        console.error('Error updating shift setting:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Aktualisieren der Dienstart' });
    }
};

const createShiftSetting = async (req, res) => {
    const { shift_type, label, color, default_start, default_end } = req.body;

    if (!shift_type || !label || !color) {
        return res.status(400).json({ message: 'Schichtkürzel, Label und Farbe sind erforderlich' });
    }

    try {
        const created = await prisma.shiftTypeSetting.create({
            data: { shift_type, label, color, default_start, default_end }
        });
        res.status(201).json(created);
    } catch (error) {
        console.error('Error creating shift setting:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Anlegen der Dienstart' });
    }
};

const deleteShiftSetting = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.shiftTypeSetting.delete({ where: { id } });
        res.json({ message: 'Dienstart erfolgreich gelöscht' });
    } catch (error) {
        console.error('Error deleting shift setting:', error);
        res.status(500).json({ message: 'Löschen fehlgeschlagen. Möglicherweise noch Schichten davon abhängig?' });
    }
};

module.exports = { getShiftSettings, updateShiftSetting, createShiftSetting, deleteShiftSetting };
