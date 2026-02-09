import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // 'responsible' or 'preparer'

        if (!type || !['responsible', 'preparer'].includes(type)) {
            return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
        }

        const field = type === 'responsible' ? 'responsible_person' : 'document_preparer';

        const items: any[] = await prisma.$queryRawUnsafe(`
            SELECT id, cat_name, cat_folder, license, plan, factory, license_no,
                IF(CAST(allow_datetime AS CHAR) = '0000-00-00' OR allow_datetime IS NULL, NULL, allow_datetime) as allow_datetime,
                IF(CAST(expire_datetime AS CHAR) = '0000-00-00' OR expire_datetime IS NULL, NULL, expire_datetime) as expire_datetime,
                IF(CAST(warning_datetime AS CHAR) = '0000-00-00' OR warning_datetime IS NULL, NULL, warning_datetime) as warning_datetime,
                department, status, responsible_person, document_preparer,
                document_receive, document_state, objective, file, remark,
                expected_datetime, reply, inactive, created_at, updated_at
            FROM categories_form
            WHERE ${field} = ? AND (inactive IS NULL OR inactive != 'on')
            ORDER BY id DESC
        `, userId);

        // Fetch all categories for joining
        const categories = await prisma.categories_master.findMany();
        const statusMasters = await prisma.status_master.findMany();
        const users = await prisma.users.findMany();

        const joinedItems = items.map(item => {
            const cat = categories.find(c => c.id.toString() === item.cat_name);
            let fullDesc = item.cat_name;
            if (cat) {
                fullDesc = `${cat.name} ${cat.description || ''}`.trim();
            }

            let factoryName = item.factory;
            if (item.factory) {
                const factory = statusMasters.find(f => f.code_id === item.factory);
                if (factory) factoryName = factory.name;
            }

            let respName = item.responsible_person;
            if (item.responsible_person) {
                const user = users.find(u => u.id.toString() === item.responsible_person);
                if (user) respName = user.name;
            }

            let prepName = item.document_preparer;
            if (item.document_preparer) {
                const user = users.find(u => u.id.toString() === item.document_preparer);
                if (user) prepName = user.name;
            }

            return {
                ...item,
                category_description: fullDesc,
                factory: factoryName,
                responsible_person: respName,
                document_preparer: prepName
            };
        });

        const p = JSON.stringify(joinedItems, (key, value) => typeof value === "bigint" ? value.toString() : value);
        return NextResponse.json(JSON.parse(p));
    } catch (error) {
        console.error("Fetch my-activities error:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
