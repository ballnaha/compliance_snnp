
import { prisma } from "../lib/prisma";

async function main() {
    try {
        const statuses = await prisma.status_master.findMany();
        console.log("Total records:", statuses.length);
        const types = [...new Set(statuses.map(s => s.type))];
        console.log("Distinct Types:", types);

        const auths = statuses.filter(s => s.type === 'auth');
        console.log("Auth records:", auths);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
