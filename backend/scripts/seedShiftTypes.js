const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const shiftTypes = [
  { shift_type: 'tagesdienst', label: 'Tagesdienst', color: '#4A90D9', default_start: '1970-01-01T08:00:00Z', default_end: '1970-01-01T16:30:00Z' },
  { shift_type: 'nach_rufdienst', label: 'Nach Rufdienst', color: '#E8924A', default_start: '1970-01-01T08:00:00Z', default_end: '1970-01-01T16:30:00Z' },
  { shift_type: 'rufdienst_woche', label: 'Rufdienst Woche', color: '#7BB8E8', default_start: '1970-01-01T16:30:00Z', default_end: '1970-01-02T08:00:00Z' },
  { shift_type: 'rufdienst_we_fruh', label: 'Rufdienst WE Früh', color: '#7BB8E8', default_start: '1970-01-01T08:00:00Z', default_end: '1970-01-01T20:00:00Z' },
  { shift_type: 'rufdienst_we_spat', label: 'Rufdienst WE Spät', color: '#7BB8E8', default_start: '1970-01-01T20:00:00Z', default_end: '1970-01-02T08:00:00Z' },
  { shift_type: 'krank_au', label: 'Krank mit AU', color: '#D94A4A', default_start: null, default_end: null },
  { shift_type: 'krank_ohne_au', label: 'Krank ohne AU', color: '#E88080', default_start: null, default_end: null },
  { shift_type: 'urlaub', label: 'Urlaub', color: '#D4A832', default_start: null, default_end: null },
  { shift_type: 'weiterbildung', label: 'Weiterbildung', color: '#5B8C5A', default_start: null, default_end: null }
];

async function seedShiftTypes() {
  console.log('Starte Überprüfung der ShiftTypeSettings...');
  try {
    const existingCount = await prisma.shiftTypeSetting.count();
    if (existingCount > 0) {
      console.log(`Es existieren bereits ${existingCount} ShiftTypeSettings in der Datenbank. Seeding wird übersprungen.`);
      return;
    }

    console.log('Tabelle ist leer. Füge Standardwerte ein...');
    for (const st of shiftTypes) {
      await prisma.shiftTypeSetting.create({
        data: st
      });
      console.log(`ShiftType ${st.shift_type} eingefügt.`);
    }
    console.log('Seeding der ShiftTypeSettings erfolgreich!');
  } catch (error) {
    console.error('Fehler beim Seeden der ShiftTypeSettings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Wenn das Skript direkt aufgerufen wird
if (require.main === module) {
  seedShiftTypes();
}

module.exports = seedShiftTypes;
