
import { prisma } from "../lib/prisma";

async function main() {
    try {
        const statuses = await prisma.status_master.findMany({
            where: { type: 'Factory' }
        });
        console.log("Factories in status_master:");
        console.log(JSON.stringify(statuses, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
