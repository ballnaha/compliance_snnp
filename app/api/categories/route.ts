import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to serialize BigInt
const serialize = (data: any) => {
    return JSON.parse(
        JSON.stringify(data, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const catIdParam = searchParams.get("cat_id");

        let categories;
        if (catIdParam) {
            const catIds = catIdParam.split(',').map(id => BigInt(id.trim())).filter(Boolean);
            categories = await prisma.categories_master.findMany({
                where: { id: { in: catIds } },
                orderBy: { cat_folder: 'asc' }
            });
        } else {
            categories = await prisma.categories_master.findMany({
                orderBy: { cat_folder: 'asc' }
            });
        }
        return NextResponse.json(serialize(categories));
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, cat_folder, description } = body;

        if (!name || !cat_folder) {
            return NextResponse.json({ error: "Name and Folder are required" }, { status: 400 });
        }

        const category = await prisma.categories_master.create({
            data: {
                name,
                cat_folder,
                description,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        return NextResponse.json(serialize(category));
    } catch (error) {
        console.error("Create category error:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
