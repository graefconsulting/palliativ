const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Fetch users to map by name
    const users = await prisma.user.findMany();
    const userMap = {};
    users.forEach(u => {
        // Create an easy lookup mapping, e.g. "Heike Kunkel" -> id
        userMap[u.name.trim()] = u.id;
    });

    // 2. We define the additional shifts that need to be added.
    // Based on screenshots provided by user:
    /*
        Pflegeteam:
        - Katrin Diehl: So 15.03: Rufdienst Wochenende Früh (08:00 - 20:00) AND Rufdienst Wochenende Spät (20:00 - 08:00)
        - Dennis Hajok: Do 12.03: Tagdienst (08:00 - 16:30) AND Rufdienst Woche (16:30 - 08:00)
        - Heike Kunkel: Mi 11.03: Tagdienst (08:00 - 16:30) AND Rufdienst Woche (16:30 - 08:00)
        - Heike Kunkel: Do 12.03: 17:00-00:00 Nicht verfügbar (IGNORE, wir mappen nur Dienste) / Nach Rufdienst (08:00 - 16:30)
        - Markus Jantz: Mo 09.03: Nach Rufdienst (08:00 - 16:30)
        - Michael Nierula: Di 10.03: Tagdienst (08:00-16:30) AND Rufdienst Woche (16:30-08:00)
        - Michael Nierula: Fr 13.03: Tagdienst (08:00-16:30) AND 16:30-00:00 Nicht verfügbar
        - Sonja Pukrop: Fr 13.03: Tagdienst (08:00 - 16:30) AND Rufdienst Freitag (16:30 - 08:00)
        - Susanne Fasold: Fr 13.03: Anderer Tagdienst (08:00 - 15:30)

        Ärzteteam:
        - Araceli Marcos: Mi 11.03: Tagdienst AND Rufdienst Woche (16:30-08:00)
        - Britta Gürke: Fr 13.03: Tagdienst AND Rufdienst Freitag
        - Britta Gürke: Sa 14.03: Rufdienst WE Früh AND Rufdienst WE Spät
        - Britta Gürke: So 15.03: Rufdienst WE Früh AND Rufdienst WE Spät
        - Gabriele Rietze: Di 10.03: Tagdienst AND Rufdienst Woche
        - Irene Marx: Mo 09.03: Nach Rufdienst
        - Irene Marx: Di 10.03: Weiterbildung (ganztägig)
        - Michael Schirmer: Mo 09.03: Rufdienst Woche
        - Michael Schirmer: Do 12.03: Tagdienst AND Rufdienst Woche
    */

    const missingShifts = [
        // Katrin Diehl (Sunday 15th) -> Wait, we might have added one of them already.
        // To be safe, let's just insert all secondary shifts that are clearly overlapping on the same day.

        { name: 'Katrin Diehl', date: '2026-03-15', shift_type: 'rufdienst_we_spaet', start_time: '20:00', end_time: '08:00' }, // Assuming Früh is already in

        { name: 'Dennis Hajok', date: '2026-03-12', shift_type: 'rufdienst_woche', start_time: '16:30', end_time: '08:00' },

        { name: 'Heike Kunkel', date: '2026-03-11', shift_type: 'rufdienst_woche', start_time: '16:30', end_time: '08:00' },
        // Missed from previous run potentially:
        { name: 'Markus Jantz', date: '2026-03-09', shift_type: 'nach_rufdienst', start_time: '08:00', end_time: '16:30' },

        { name: 'Michael Nierula', date: '2026-03-10', shift_type: 'rufdienst_woche', start_time: '16:30', end_time: '08:00' },

        { name: 'Sonja Pukrop', date: '2026-03-13', shift_type: 'rufdienst_freitag', start_time: '16:30', end_time: '08:00' },

        { name: 'Araceli Marcos', date: '2026-03-11', shift_type: 'rufdienst_woche', start_time: '16:30', end_time: '08:00' },

        { name: 'Britta Gürke', date: '2026-03-13', shift_type: 'rufdienst_freitag', start_time: '16:30', end_time: '08:00' },
        { name: 'Britta Gürke', date: '2026-03-14', shift_type: 'rufdienst_we_spaet', start_time: '20:00', end_time: '08:00' },
        { name: 'Britta Gürke', date: '2026-03-15', shift_type: 'rufdienst_we_spaet', start_time: '20:00', end_time: '08:00' },

        { name: 'Gabriele Rietze', date: '2026-03-10', shift_type: 'rufdienst_woche', start_time: '16:30', end_time: '08:00' },
        { name: 'Michael Schirmer', date: '2026-03-12', shift_type: 'rufdienst_woche', start_time: '16:30', end_time: '08:00' },
    ];

    console.log(`Found ${missingShifts.length} missing secondary shifts to process.`);

    for (const s of missingShifts) {
        const userId = userMap[s.name];
        if (!userId) {
            console.warn(`User ${s.name} not found in DB! Skipping shift on ${s.date}.`);
            continue;
        }

        const dateObj = new Date(s.date);

        // Let's check if this specific shift type on this date for this user already exists to avoid duplicates
        const existing = await prisma.shift.findFirst({
            where: {
                user_id: userId,
                date: dateObj,
                shift_type: s.shift_type
            }
        });

        if (existing) {
            console.log(`[SKIP] Shift ${s.shift_type} for ${s.name} on ${s.date} already exists.`);
            continue;
        }

        // Calculate actual datetimes
        const [startH, startM] = s.start_time.split(':').map(Number);
        const [endH, endM] = s.end_time.split(':').map(Number);

        const startDt = new Date(s.date);
        startDt.setHours(startH, startM, 0, 0);

        const endDt = new Date(s.date);
        endDt.setHours(endH, endM, 0, 0);

        // Adjust for overnight shift
        if (endH < startH || (endH === startH && endM < startM)) {
            endDt.setDate(endDt.getDate() + 1);
        }

        try {
            await prisma.shift.create({
                data: {
                    user_id: userId,
                    date: dateObj,
                    shift_type: s.shift_type,
                    start_time: startDt,
                    end_time: endDt,
                    created_by: users[0].id
                }
            });
            console.log(`[OK] Inserted ${s.shift_type} for ${s.name} on ${s.date}.`);
        } catch (err) {
            console.error(`[ERROR] Failed to insert for ${s.name}: ${err.message}`);
        }
    }

    console.log("Done adding double shifts!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
