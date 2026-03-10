const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const users = {
    'Claudia Lange': '2bc48f81-9958-4468-81fc-61e92892ecc7',
    'Dennis Hajok': 'd8afe436-1ee2-4817-bce5-a7294ced3e94',
    'Heike Kunkel': '61ace792-4bfe-4134-aabc-af145c752523',
    'Katrin Diehl': '1db06435-ad68-48c7-8770-2e4cb1458f20',
    'Markus Jantz': 'd6d5fbb9-145e-44bd-adde-19c24e363979',
    'Michael Nierula': '833323e3-a5b6-432b-9734-562c0e4703c2',
    'Sonja Pukrop': 'd00f1a5c-2506-47b6-92dd-940c606f68e5',
    'Susanne Fasold': 'ec8b2214-cbc6-4c9d-921f-98e7fe614192',
    'Susanne Neumann': '136bac4b-7ec8-47a0-814d-2b342efed6af',
    'Araceli Marcos': '5b69fed3-970d-404d-ac18-ef2d1b95d3d2',
    'Britta Gürke': '650c86e1-6c9f-4710-ab2f-2727918a8816',
    'Gabriele Rietze': 'bd573dc7-fa47-434b-aa8b-10072908dcd1',
    'Inna Dolotov': '642e885a-d388-4c95-b4b3-3c5287a66ec8',
    'Irene Marx': '891dc056-8ea8-459c-bfc2-41ffc5ae9566',
    'Michael Schirmer': '9696f1d5-f6bb-4ec2-a8fb-b38f901c7bb7',
    'Per Peters': 'b22eac13-12b3-4622-97fa-5db5d5dc5a43',
    'Philipp Von Trott zu Solz': '122035aa-7e15-4068-9318-432079edbe92',
    'Renée Gräf': '489be868-4224-4ce3-860d-4859b180d3ee',
    'Astrid Schneider-Wiesenborn': '376d7009-1fb8-4e42-9cd1-0efa091ab038',
    'Christine Ernst': '13336fe3-10f1-455a-9199-f389c42e7146'
};

const shiftsToInsert = [
    // Claudia Lange
    { name: 'Claudia Lange', date: '2026-03-09', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Claudia Lange', date: '2026-03-10', type: 'weiterbildung' },
    { name: 'Claudia Lange', date: '2026-03-11', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Claudia Lange', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Claudia Lange', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Claudia Lange', date: '2026-03-14', type: 'rufdienst_we_fruh', start: '08:00', end: '20:00' },
    { name: 'Claudia Lange', date: '2026-03-14', type: 'rufdienst_we_spat', start: '20:00', end: '08:00' },

    // Dennis Hajok
    { name: 'Dennis Hajok', date: '2026-03-09', type: 'weiterbildung' },
    { name: 'Dennis Hajok', date: '2026-03-10', type: 'weiterbildung' },
    { name: 'Dennis Hajok', date: '2026-03-11', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Dennis Hajok', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Dennis Hajok', date: '2026-03-12', type: 'rufdienst_woche', start: '16:30', end: '08:00' },
    { name: 'Dennis Hajok', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30' },

    // Heike Kunkel
    { name: 'Heike Kunkel', date: '2026-03-09', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Heike Kunkel', date: '2026-03-10', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Heike Kunkel', date: '2026-03-11', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Heike Kunkel', date: '2026-03-11', type: 'rufdienst_woche', start: '16:30', end: '08:00' },
    { name: 'Heike Kunkel', date: '2026-03-12', type: 'nach_rufdienst', start: '08:00', end: '16:30' },
    { name: 'Heike Kunkel', date: '2026-03-13', type: 'urlaub' },
    { name: 'Heike Kunkel', date: '2026-03-14', type: 'urlaub' },
    { name: 'Heike Kunkel', date: '2026-03-15', type: 'urlaub' },

    // Katrin Diehl
    { name: 'Katrin Diehl', date: '2026-03-09', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Katrin Diehl', date: '2026-03-09', type: 'rufdienst_woche', start: '16:30', end: '08:00' },
    { name: 'Katrin Diehl', date: '2026-03-10', type: 'nach_rufdienst', start: '08:00', end: '16:30' },
    { name: 'Katrin Diehl', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '12:30' },
    { name: 'Katrin Diehl', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '12:30' },
    { name: 'Katrin Diehl', date: '2026-03-15', type: 'rufdienst_we_fruh', start: '08:00', end: '20:00' },
    { name: 'Katrin Diehl', date: '2026-03-15', type: 'rufdienst_we_spat', start: '20:00', end: '08:00' },

    // Markus Jantz
    { name: 'Markus Jantz', date: '2026-03-09', type: 'nach_rufdienst', start: '08:00', end: '16:30' },
    { name: 'Markus Jantz', date: '2026-03-10', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Markus Jantz', date: '2026-03-11', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Markus Jantz', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Markus Jantz', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30' },

    // Michael Nierula
    { name: 'Michael Nierula', date: '2026-03-09', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Michael Nierula', date: '2026-03-10', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Michael Nierula', date: '2026-03-10', type: 'rufdienst_woche', start: '16:30', end: '08:00' },
    { name: 'Michael Nierula', date: '2026-03-11', type: 'nach_rufdienst', start: '08:00', end: '16:30' },
    { name: 'Michael Nierula', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Michael Nierula', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30' },

    // Sonja Pukrop
    { name: 'Sonja Pukrop', date: '2026-03-09', type: 'weiterbildung' },
    { name: 'Sonja Pukrop', date: '2026-03-10', type: 'weiterbildung' },
    { name: 'Sonja Pukrop', date: '2026-03-11', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Sonja Pukrop', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Sonja Pukrop', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Sonja Pukrop', date: '2026-03-13', type: 'rufdienst_woche', start: '16:30', end: '08:00' },

    // Susanne Fasold
    { name: 'Susanne Fasold', date: '2026-03-09', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Susanne Fasold', date: '2026-03-10', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Susanne Fasold', date: '2026-03-11', type: 'urlaub' },
    { name: 'Susanne Fasold', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Susanne Fasold', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30', notes: 'Anderer Tagdienst' },

    // Susanne Neumann
    { name: 'Susanne Neumann', date: '2026-03-09', type: 'krank_au' },
    { name: 'Susanne Neumann', date: '2026-03-10', type: 'krank_au' },
    { name: 'Susanne Neumann', date: '2026-03-11', type: 'krank_au' },
    { name: 'Susanne Neumann', date: '2026-03-12', type: 'krank_au' },
    { name: 'Susanne Neumann', date: '2026-03-13', type: 'krank_au' },

    // Araceli Marcos
    { name: 'Araceli Marcos', date: '2026-03-09', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Araceli Marcos', date: '2026-03-11', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Araceli Marcos', date: '2026-03-11', type: 'rufdienst_woche', start: '16:30', end: '08:00' },
    { name: 'Araceli Marcos', date: '2026-03-12', type: 'nach_rufdienst', start: '08:00', end: '16:30' },
    { name: 'Araceli Marcos', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30' },

    // Britta Gürke
    { name: 'Britta Gürke', date: '2026-03-09', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Britta Gürke', date: '2026-03-10', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Britta Gürke', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Britta Gürke', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Britta Gürke', date: '2026-03-13', type: 'rufdienst_woche', start: '16:30', end: '08:00' },
    { name: 'Britta Gürke', date: '2026-03-14', type: 'rufdienst_we_fruh', start: '08:00', end: '20:00' },
    { name: 'Britta Gürke', date: '2026-03-14', type: 'rufdienst_we_spat', start: '20:00', end: '08:00' },
    { name: 'Britta Gürke', date: '2026-03-15', type: 'rufdienst_we_fruh', start: '08:00', end: '20:00' },
    { name: 'Britta Gürke', date: '2026-03-15', type: 'rufdienst_we_spat', start: '20:00', end: '08:00' },

    // Gabriele Rietze
    { name: 'Gabriele Rietze', date: '2026-03-09', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Gabriele Rietze', date: '2026-03-10', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Gabriele Rietze', date: '2026-03-10', type: 'rufdienst_woche', start: '16:30', end: '08:00' },
    { name: 'Gabriele Rietze', date: '2026-03-11', type: 'nach_rufdienst', start: '08:00', end: '16:30' },
    { name: 'Gabriele Rietze', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Gabriele Rietze', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30' },

    // Inna Dolotov
    { name: 'Inna Dolotov', date: '2026-03-10', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Inna Dolotov', date: '2026-03-11', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Inna Dolotov', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Inna Dolotov', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30' },

    // Irene Marx
    { name: 'Irene Marx', date: '2026-03-09', type: 'nach_rufdienst', start: '08:00', end: '16:30' },
    { name: 'Irene Marx', date: '2026-03-10', type: 'weiterbildung' },
    { name: 'Irene Marx', date: '2026-03-11', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Irene Marx', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30' },

    // Michael Schirmer
    { name: 'Michael Schirmer', date: '2026-03-09', type: 'rufdienst_woche', start: '16:30', end: '08:00' },
    { name: 'Michael Schirmer', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Michael Schirmer', date: '2026-03-12', type: 'rufdienst_woche', start: '16:30', end: '08:00' },

    // Per Peters
    { name: 'Per Peters', date: '2026-03-09', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Per Peters', date: '2026-03-10', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Per Peters', date: '2026-03-11', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Per Peters', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Per Peters', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30' },

    // Philipp Von Trott zu Solz
    { name: 'Philipp Von Trott zu Solz', date: '2026-03-09', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Philipp Von Trott zu Solz', date: '2026-03-10', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Philipp Von Trott zu Solz', date: '2026-03-11', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Philipp Von Trott zu Solz', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30', notes: 'Anderer Tagdienst' },
    { name: 'Philipp Von Trott zu Solz', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30', notes: 'Anderer Tagdienst' },

    // Renée Gräf
    { name: 'Renée Gräf', date: '2026-03-09', type: 'weiterbildung' },
    { name: 'Renée Gräf', date: '2026-03-10', type: 'weiterbildung' },
    { name: 'Renée Gräf', date: '2026-03-11', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Renée Gräf', date: '2026-03-12', type: 'tagesdienst', start: '08:00', end: '16:30' },
    { name: 'Renée Gräf', date: '2026-03-13', type: 'tagesdienst', start: '08:00', end: '16:30' },

    // Astrid Schneider-Wiesenborn
    { name: 'Astrid Schneider-Wiesenborn', date: '2026-03-09', type: 'tagesdienst', start: '07:30', end: '13:30', notes: 'Tagesdienst früh 6' },
    { name: 'Astrid Schneider-Wiesenborn', date: '2026-03-10', type: 'tagesdienst', start: '07:30', end: '12:30', notes: 'Tagesdienst früh 5' },
    { name: 'Astrid Schneider-Wiesenborn', date: '2026-03-11', type: 'tagesdienst', start: '07:30', end: '16:00', notes: 'Tagesdienst früh' },
    { name: 'Astrid Schneider-Wiesenborn', date: '2026-03-12', type: 'tagesdienst', start: '07:30', end: '13:30', notes: 'Tagesdienst früh 6' },

    // Christine Ernst
    { name: 'Christine Ernst', date: '2026-03-09', type: 'weiterbildung' },
    { name: 'Christine Ernst', date: '2026-03-10', type: 'weiterbildung' },
    { name: 'Christine Ernst', date: '2026-03-11', type: 'weiterbildung' },
    { name: 'Christine Ernst', date: '2026-03-12', type: 'weiterbildung' },
    { name: 'Christine Ernst', date: '2026-03-13', type: 'weiterbildung' }
];

async function main() {
    const defaultAdmin = await prisma.user.findFirst({ where: { role: 'admin' } }) || { id: 'admin123' }; // Fallback for created_by
    const created_by = defaultAdmin.id;

    for (const shift of shiftsToInsert) {
        const user_id = users[shift.name];
        if (!user_id) {
            console.log(`Skipping unknown user: ${shift.name}`);
            continue;
        }

        // Prepare date and times correctly
        const dateObj = new Date(`${shift.date}T00:00:00Z`);
        let startTimeObj = null;
        let endTimeObj = null;

        if (shift.start) {
            startTimeObj = new Date(`${shift.date}T${shift.start}:00Z`);
            if (shift.end) {
                let endDateStr = shift.date;
                // If end time is earlier than start time (e.g. night shift 16:30 to 08:00), it's the next day
                const startHour = parseInt(shift.start.split(':')[0], 10);
                const endHour = parseInt(shift.end.split(':')[0], 10);
                if (endHour < startHour) {
                    const dt = new Date(dateObj);
                    dt.setUTCDate(dt.getUTCDate() + 1);
                    endDateStr = dt.toISOString().split('T')[0];
                }
                endTimeObj = new Date(`${endDateStr}T${shift.end}:00Z`);
            }
        }

        await prisma.shift.create({
            data: {
                user_id,
                date: dateObj,
                shift_type: shift.type,
                start_time: startTimeObj,
                end_time: endTimeObj,
                notes: shift.notes || null,
                created_by: user_id, // we just assign it to themselves since we might not have a reliable admin id
            }
        });
        console.log(`Inserted shift for ${shift.name} on ${shift.date}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
