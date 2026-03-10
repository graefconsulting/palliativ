const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting DB time and duplicate fixing...");

    // 1. Delete all incorrect shift types that I manually added
    const deletedWrongShifts = await prisma.shift.deleteMany({
        where: {
            shift_type: {
                in: [
                    'rufdienst_we_spaet',
                    'rufdienst_we_spät',
                    'rufdienst_we_frueh',
                    'rufdienst_freitag'
                ]
            }
        }
    });
    console.log(`Deleted ${deletedWrongShifts.count} incorrect shift entries.`);

    // 2. Fetch all remaining valid shifts to update their times
    const allShifts = await prisma.shift.findMany();
    let updatedCount = 0;

    for (const shift of allShifts) {
        let newStartH, newStartM, newEndH, newEndM;
        let shouldUpdate = false;

        if (shift.shift_type === 'tagesdienst') {
            newStartH = 8; newStartM = 0; newEndH = 16; newEndM = 30;
            shouldUpdate = true;
        } else if (shift.shift_type === 'rufdienst_woche') {
            newStartH = 16; newStartM = 30; newEndH = 8; newEndM = 0;
            shouldUpdate = true;
        } else if (shift.shift_type === 'rufdienst_we_fruh') {
            newStartH = 8; newStartM = 0; newEndH = 20; newEndM = 0;
            shouldUpdate = true;
        } else if (shift.shift_type === 'rufdienst_we_spat') {
            newStartH = 20; newStartM = 0; newEndH = 8; newEndM = 0;
            shouldUpdate = true;
        } else if (shift.shift_type === 'nach_rufdienst') {
            newStartH = 8; newStartM = 0; newEndH = 16; newEndM = 30;
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

            // Only update if changes are needed
            if (shift.start_time?.getTime() !== startDt.getTime() || shift.end_time?.getTime() !== endDt.getTime()) {
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
    }
    console.log(`Updated times for ${updatedCount} existing shifts.`);

    // 3. Make sure Britta Gürke and Katrin Diehl have the correct double shifts
    const users = await prisma.user.findMany();
    const adminId = users.find(u => u.app_role === 'admin')?.id || users[0].id;

    const correctMissingShifts = [
        { name: 'Britta Gürke', date: '2026-03-14', shift_type: 'rufdienst_we_spat', start_time: '20:00', end_time: '08:00' },
        { name: 'Britta Gürke', date: '2026-03-15', shift_type: 'rufdienst_we_spat', start_time: '20:00', end_time: '08:00' },
        { name: 'Katrin Diehl', date: '2026-03-15', shift_type: 'rufdienst_we_spat', start_time: '20:00', end_time: '08:00' },
        // These ones should already be correct, or were missing due to typos
        { name: 'Sonja Pukrop', date: '2026-03-13', shift_type: 'rufdienst_woche', start_time: '16:30', end_time: '08:00' },
        { name: 'Britta Gürke', date: '2026-03-13', shift_type: 'rufdienst_woche', start_time: '16:30', end_time: '08:00' }
    ];

    for (const s of correctMissingShifts) {
        const userId = users.find(u => u.name.includes(s.name))?.id;
        if (!userId) continue;

        const dateObj = new Date(s.date);

        const existing = await prisma.shift.findFirst({
            where: { user_id: userId, date: dateObj, shift_type: s.shift_type }
        });

        if (!existing) {
            const [startH, startM] = s.start_time.split(':').map(Number);
            const [endH, endM] = s.end_time.split(':').map(Number);
            const startDt = new Date(s.date); startDt.setHours(startH, startM, 0, 0);
            const endDt = new Date(s.date); endDt.setHours(endH, endM, 0, 0);
            if (endH < startH || (endH === startH && endM < startM)) { endDt.setDate(endDt.getDate() + 1); }

            await prisma.shift.create({
                data: {
                    user_id: userId, date: dateObj, shift_type: s.shift_type,
                    start_time: startDt, end_time: endDt, created_by: adminId
                }
            });
            console.log(`Re-inserted correct shift: ${s.shift_type} for ${s.name} on ${s.date}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
