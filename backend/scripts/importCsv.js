const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const CSV_FILE_PATH = path.join(__dirname, '..', '..', 'mitarbeiter.csv');
const DEFAULT_PASSWORD = 'Palliativ2026!';

async function importCsv() {
    console.log('Starte Überprüfung der Mitarbeiter-Datenbank...');
    try {
        const existingCount = await prisma.user.count();
        if (existingCount > 0) {
            console.log(`Es existieren bereits ${existingCount} Mitarbeiter. CSV-Import wird übersprungen.`);
            return;
        }

        console.log(`Lese ${CSV_FILE_PATH} ein...`);
        const results = [];

        // Wir wrappen das Einlesen in ein Promise
        await new Promise((resolve, reject) => {
            fs.createReadStream(CSV_FILE_PATH)
                .pipe(csv({ separator: ',' }))
                .on('data', (data) => results.push(data))
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        console.log(`${results.length} Einträge in CSV gefunden. Bereite Import vor...`);
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

        for (const row of results) {
            const name = row.name ? row.name.trim() : null;
            const email = row.email ? row.email.trim() : null;
            let role = row.rolle ? row.rolle.trim().toLowerCase() : null;
            let team = row.team ? row.team.trim().toLowerCase() : null;
            let appRole = row.app_rolle ? row.app_rolle.trim().toLowerCase() : null;

            // Validiere notwendige Felder
            if (!name || !email) {
                console.warn(`Überspringe Zeile wegen fehlendem Namen oder E-Mail: ${JSON.stringify(row)}`);
                continue;
            }

            // Default contract hours and vacation (Dummies, da aus CSV nicht vorgegeben)
            const contract_hours_week = 40;
            const vacation_days_year = 30;

            // Bestimme App-Rolle: "Veit Gräf" immer Admin
            if (appRole === 'admin' || email.toLowerCase() === 'veit.graef@gmx.de') {
                appRole = 'admin';
            } else if (appRole === 'leitung') {
                appRole = 'leitung';
            } else {
                appRole = 'mitarbeiter';
            }

            // Rollen und Team-Defaults
            if (role === '') role = null; // Enum erwartet bestimmte werte, wir lassen es krachen falls arzt/pfleger/koordination nicht zutrifft
            if (team === '') team = null;

            // Fallback für Rolle, wenn leer -> wir nehmen mal 'pfleger' an, ausser bei admin
            if (!role) {
                if (appRole === 'admin') role = 'koordination';
                else role = 'pfleger';
            }

            // Fallback Team
            if (team !== 'team1' && team !== 'team2' && team !== 'koordination') {
                team = null;
            }

            try {
                await prisma.user.create({
                    data: {
                        name: name,
                        email: email.toLowerCase(),
                        password_hash: hashedPassword,
                        role: role,
                        team: team,
                        app_role: appRole,
                        contract_hours_week: contract_hours_week,
                        vacation_days_year: vacation_days_year,
                        status: 'aktiv',
                        must_change_password: true
                    }
                });
                console.log(`Mitarbeiter importiert: ${name} (${email}) - App-Rolle: ${appRole}`);
            } catch (err) {
                console.error(`Fehler beim Import von ${name} (${email}):`, err.message);
            }
        }

        console.log('CSV-Import erfolgreich abgeschlossen!');
    } catch (error) {
        console.error('Fehler beim Import:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Wenn direkt aufgerufen
if (require.main === module) {
    importCsv();
}

module.exports = importCsv;
