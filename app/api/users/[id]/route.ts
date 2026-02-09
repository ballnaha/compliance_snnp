import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
        const { name, username, email, password, role, department, status, factories, cat_id } = body;

        const updateData: any = {
            name,
            username,
            email,
            role,
            department,
            status,
            cat_id: Array.isArray(cat_id) ? cat_id.join(',') : cat_id,
            updated_at: new Date(),
        };

        // Only update password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 12);
        }

        const user = await prisma.users.update({
            where: { id },
            data: updateData,
        });

        // Update factories: Delete old and insert new
        await prisma.users_factory.deleteMany({
            where: { user_id: Number(id) }
        });

        if (factories && Array.isArray(factories)) {
            for (const factoryName of factories) {
                await prisma.users_factory.create({
                    data: {
                        user_id: Number(id),
                        factory_name: factoryName,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }
                });
            }
        }

        return NextResponse.json(serialize(user));
    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = BigInt(idStr);

        // Delete user factories first
        await prisma.users_factory.deleteMany({
            where: { user_id: Number(id) }
        });

        await prisma.users.delete({
            where: { id },
        });

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
