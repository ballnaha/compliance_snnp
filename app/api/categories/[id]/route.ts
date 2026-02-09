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

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = BigInt(idStr);
        const body = await request.json();
        const { name, cat_folder, description } = body;

        const category = await prisma.categories_master.update({
            where: { id },
            data: {
                name,
                cat_folder,
                description,
                updated_at: new Date(),
            },
        });

        return NextResponse.json(serialize(category));
    } catch (error) {
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = BigInt(idStr);
        await prisma.categories_master.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Category deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
