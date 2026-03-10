const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    const target = users.find(u => u.email.toLowerCase().includes('feindpunkt'));
    if (target) {
        await prisma.user.update({
            where: { id: target.id },
            data: { app_role: 'admin' }
        });
        console.log(`Promoted ${target.email} to Admin!`);
    } else {
        // Create the user if they don't exist, since they are apparently logged in
        // Their name: Feindpunkt Gref ?
        // We probably shouldn't create them if we don't know the password hash or auth provider mechanism.
        // Let's just create a dummy or print all users again to see if they were added recently.
        console.log("Still not found. Here are all recent users:");
        console.log(users.map(u => u.email).join(', '));
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
