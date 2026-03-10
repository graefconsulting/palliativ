const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, name: u.name, team: u.team })));

  const shiftTypes = await prisma.shiftTypeSetting.findMany();
  console.log("Shift Types:", shiftTypes.map(st => ({ type: st.shift_type, label: st.label })));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
