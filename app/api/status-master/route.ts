import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const factoriesParam = searchParams.get('factories');

        let whereClause: any = type ? { type } : {};

        if (factoriesParam) {
            const factoryCodes = factoriesParam.split(',').map(f => f.trim()).filter(Boolean);
            whereClause = {
                ...whereClause,
                code_id: { in: factoryCodes }
            };
        }

        const data = await prisma.status_master.findMany({
            where: whereClause,
            orderBy: { id: 'asc' },
            select: {
                id: true,
                name: true,
                type: true,
                code_id: true
            }
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error("Fetch status_master error:", error);
        return NextResponse.json({ error: "Failed to fetch status master" }, { status: 500 });
    }
}
