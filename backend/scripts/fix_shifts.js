const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting DB update...");

    // 1. Delete the wrong shift types that were added manually by my previous script
    const deletedWrongShifts = await prisma.shift.deleteMany({
        where: {
            shift_type: {
                in: ['rufdienst_we_spaet', 'rufdienst_freitag']
            }
        }
    });
    console.log(`Deleted ${deletedWrongShifts.count} incorrect shift entries.`);

    // 2. Fetch all shifts to update their times
    const allShifts = await prisma.shift.findMany();
    let updatedCount = 0;

    for (const shift of allShifts) {
        let newStartH, newStartM, newEndH, newEndM;
        let shouldUpdate = false;

        if (shift.shift_type === 'tagesdienst' || shift.shift_type === 'anderer_tagesdienst' || shift.shift_type === 'tagdienst_frueh_6' || shift.shift_type === 'tagdienst_frueh_5') {
            // "für den Tagdienst von 8 Uhr bis 16:30 Uhr"
            // Let's assume the user meant all Tagdienste for now, unless specific.
            // But wait, the screenshot shows Tagdienst Früh 5 is 07:30 - 12:30.
            if (shift.shift_type === 'tagesdienst') {
                newStartH = 8; newStartM = 0; newEndH = 16; newEndM = 30;
                shouldUpdate = true;
            }
        } else if (shift.shift_type === 'rufdienst_woche') {
            // "für den Rufdienst unter der Woche von 16:30 Uhr bis 8 Uhr morgens"
            newStartH = 16; newStartM = 30; newEndH = 8; newEndM = 0;
            shouldUpdate = true;
        } else if (shift.shift_type === 'rufdienst_we_frueh') {
            // "für den Rufdienst am Wochenende früh von 8 Uhr bis 20 Uhr"
            newStartH = 8; newStartM = 0; newEndH = 20; newEndM = 0;
            shouldUpdate = true;
        } else if (shift.shift_type === 'rufdienst_we_spaet') {
            // The correct label in DB is probably 'rufdienst_we_spät' or similar. Let's check matching.
            newStartH = 20; newStartM = 0; newEndH = 8; newEndM = 0;
            shouldUpdate = true;
        }

        // Apply matching to the correct DB type
        if (shift.shift_type === 'rufdienst_we_spät') {
            newStartH = 20; newStartM = 0; newEndH = 8; newEndM = 0;
            shouldUpdate = true;
        }


        if (shouldUpdate) {
            const startDt = new Date(shift.date);
            startDt.setHours(newStartH, newStartM, 0, 0);

            const endDt = new Date(shift.date);
            endDt.setHours(newEndH, newEndM, 0, 0);

            // Crosses midnight?
            if (newEndH < newStartH || (newEndH === newStartH && newEndM < newStartM)) {
                endDt.setDate(endDt.getDate() + 1);
            }

            await prisma.shift.update({
                where: { id: shift.id },
                data: {
                    start_time: startDt,
                    end_time: endDt
                }
            });
            updatedCount++;
        }
    }

    console.log(`Updated times for ${updatedCount} shifts.`);

    // 3. Let's double check if we need to insert the correct shifts for the ones we deleted
    // Britta Gürke (14.03, 15.03) -> 'rufdienst_we_spät' instead of 'rufdienst_we_spaet'
    // Britta Gürke (13.03) -> 'rufdienst_woche' instead of 'rufdienst_freitag'
    // Sonja Pukrop (13.03) -> 'rufdienst_woche' instead of 'rufdienst_freitag'

    const users = await prisma.user.findMany();
    const adminId = users.find(u => u.app_role === 'admin')?.id || users[0].id;

    const findUserId = (name) => users.find(u => u.name.includes(name))?.id;

    const correctMissingShifts = [
        { name: 'Britta Gürke', date: '2026-03-14', shift_type: 'rufdienst_we_spät', start_time: '20:00', end_time: '08:00' },
        { name: 'Britta Gürke', date: '2026-03-15', shift_type: 'rufdienst_we_spät', start_time: '20:00', end_time: '08:00' },
        { name: 'Britta Gürke', date: '2026-03-13', shift_type: 'rufdienst_woche', start_time: '16:30', end_time: '08:00' },
        { name: 'Sonja Pukrop', date: '2026-03-13', shift_type: 'rufdienst_woche', start_time: '16:30', end_time: '08:00' },
        { name: 'Katrin Diehl', date: '2026-03-15', shift_type: 'rufdienst_we_spät', start_time: '20:00', end_time: '08:00' }
    ];

    for (const s of correctMissingShifts) {
        const userId = findUserId(s.name);
        if (!userId) continue;

        const dateObj = new Date(s.date);

        const existing = await prisma.shift.findFirst({
            where: { user_id: userId, date: dateObj, shift_type: s.shift_type }
        });

        if (!existing) {
            // Calculate datetimes
            const [startH, startM] = s.start_time.split(':').map(Number);
            const [endH, endM] = s.end_time.split(':').map(Number);

            const startDt = new Date(s.date);
            startDt.setHours(startH, startM, 0, 0);

            const endDt = new Date(s.date);
            endDt.setHours(endH, endM, 0, 0);

            if (endH < startH || (endH === startH && endM < startM)) { endDt.setDate(endDt.getDate() + 1); }

            await prisma.shift.create({
                data: {
                    user_id: userId,
                    date: dateObj,
                    shift_type: s.shift_type,
                    start_time: startDt,
                    end_time: endDt,
                    created_by: adminId
                }
            });
            console.log(`Re-inserted correct shift: ${s.shift_type} for ${s.name} on ${s.date}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
