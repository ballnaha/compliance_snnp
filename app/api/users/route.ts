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

export async function GET() {
    try {
        const users = await prisma.users.findMany({
            orderBy: { created_at: 'desc' }
        });

        // Fetch factories for all users manually since no relations are defined in schema
        const userFactories = await prisma.users_factory.findMany();

        const usersWithFactories = users.map(user => ({
            ...user,
            factories: userFactories
                .filter(f => f.user_id?.toString() === user.id.toString())
                .map(f => f.factory_name)
        }));

        return NextResponse.json(serialize(usersWithFactories));
    } catch (error) {
        console.error("Fetch users error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, username, email, password, role, department, status, factories, cat_id } = body;

        if (!name || !username || !email || !password) {
            return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.users.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                role,
                department,
                status,
                cat_id: Array.isArray(cat_id) ? cat_id.join(',') : cat_id,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        // Create factory assignments
        if (factories && Array.isArray(factories)) {
            for (const factoryName of factories) {
                await prisma.users_factory.create({
                    data: {
                        user_id: Number(user.id),
                        factory_name: factoryName,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }
                });
            }
        }

        return NextResponse.json(serialize(user));
    } catch (error) {
        console.error("Create user error:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
