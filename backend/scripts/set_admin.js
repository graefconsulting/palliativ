const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'feindpunkt_gref@gmx.de' }
    });

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { app_role: 'admin' }
        });
        console.log(`User ${user.name} is now an admin.`);
    } else {
        console.log('User not found!');
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
