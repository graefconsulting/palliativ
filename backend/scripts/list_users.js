const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, app_role: true }
    });
    console.log(users.map(u => `${u.name} - ${u.email} - ${u.app_role}`).join('\n'));

    // Look for a user with 'gref' or 'feindpunkt'
    const target = users.find(u => u.email.includes('gref') || u.email.includes('feindpunkt'));
    if (target) {
        await prisma.user.update({
            where: { id: target.id },
            data: { app_role: 'admin' }
        });
        console.log(`\nPromoted ${target.name} (${target.email}) to Admin!`);
    } else {
        console.log("Could not find the user!");
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
