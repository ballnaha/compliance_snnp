import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const in90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

        // Current month boundaries for urgency calculation
        const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        const endOf2MonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, 0);

        // Match original PHP: datediff(expire_datetime, now()) <= 90 and (inactive is null or inactive = 'off')
        // Use raw query to handle invalid datetime values (0000-00-00)
        const items: any[] = await prisma.$queryRawUnsafe(`
            SELECT id, cat_name, cat_folder, license, plan, factory, license_no,
                IF(CAST(allow_datetime AS CHAR) = '0000-00-00' OR allow_datetime IS NULL, NULL, allow_datetime) as allow_datetime,
                IF(CAST(expire_datetime AS CHAR) = '0000-00-00' OR expire_datetime IS NULL, NULL, expire_datetime) as expire_datetime,
                IF(CAST(warning_datetime AS CHAR) = '0000-00-00' OR warning_datetime IS NULL, NULL, warning_datetime) as warning_datetime,
                department, status, responsible_person, document_preparer,
                document_receive, document_state, objective, file, remark,
                expected_datetime, reply, inactive, created_at, updated_at
            FROM categories_form
            WHERE inactive IS NULL OR inactive = 'off'
            ORDER BY id DESC
        `);

        // Fetch all categories for joining (cat_name -> categories_master.id)
        const categories = await prisma.categories_master.findMany({
            orderBy: { id: 'asc' }
        });

        // Fetch all status_master for factory + document_preparer joins
        const statusMasters = await prisma.status_master.findMany();

        // Fetch users for responsible_person join (responsible_person -> users.id)
        const users = await prisma.users.findMany();

        const joinedItems = items.map(item => {
            // Join: categories_form.cat_name = categories_master.id
            const cat = categories.find(c => c.id.toString() === item.cat_name);
            let categoryName = '';
            let categoryDescription = '';
            let catFolder = item.cat_folder || '';
            if (cat) {
                categoryName = cat.name;
                categoryDescription = cat.description || '';
                catFolder = cat.cat_folder;
            }

            // Join: categories_form.factory = status_master.code_id (s1)
            let factoryName = item.factory || '';
            if (item.factory) {
                const factory = statusMasters.find(f => f.code_id === item.factory);
                if (factory) factoryName = factory.name || '';
            }

            // Join: categories_form.responsible_person = users.id (s2)
            let respName = item.responsible_person || '';
            if (item.responsible_person) {
                const user = users.find(u => u.id.toString() === item.responsible_person);
                if (user) respName = user.name;
            }

            // Join: categories_form.document_preparer = status_master.code_id (s3)
            let prepName = item.document_preparer || '';
            if (item.document_preparer) {
                const sm = statusMasters.find(s => s.code_id === item.document_preparer);
                if (sm) prepName = sm.name || '';
            }

            // Calculate urgency based on expire_datetime relative to today
            // 💀💀💀 = expires this month or already expired
            // 💀💀  = expires next month
            // 💀   = expires within 2 months ahead
            // 0   = not urgent
            let urgencyLevel = 0;
            if (item.expire_datetime) {
                const expire = new Date(item.expire_datetime);
                if (expire <= endOfThisMonth) {
                    urgencyLevel = 3;
                } else if (expire <= endOfNextMonth) {
                    urgencyLevel = 2;
                } else if (expire <= endOf2MonthsAhead) {
                    urgencyLevel = 1;
                }
            }

            // Calculate diff in days (same as PHP Carbon diffInDays)
            let diffDays: number | null = null;
            if (item.expire_datetime) {
                const expire = new Date(item.expire_datetime);
                diffDays = Math.ceil((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            }

            return {
                id: item.id,
                license: item.license,
                plan: item.plan,
                factory: factoryName,
                license_no: item.license_no,
                status: item.status,
                expire_datetime: item.expire_datetime,
                allow_datetime: item.allow_datetime,
                warning_datetime: item.warning_datetime,
                expected_datetime: item.expected_datetime,
                responsible_person: respName,
                document_preparer: prepName,
                department: item.department,
                remark: item.remark,
                cat_folder: catFolder,
                cat_name: item.cat_name,
                category_name: categoryName,
                category_description: categoryDescription,
                urgencyLevel,
                diffDays
            };
        });

        // Filter: datediff(expire_datetime, now()) <= 90 (same as PHP logic)
        const filteredItems = joinedItems.filter(item => {
            if (!item.expire_datetime) return false;
            const expire = new Date(item.expire_datetime as any);
            const diffMs = expire.getTime() - today.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            return diffDays <= 90;
        });

        // Group by category (using cat_folder from joined category)
        const grouped: Record<string, { categoryName: string; categoryDescription: string; items: any[] }> = {};

        for (const cat of categories) {
            const key = cat.cat_folder;
            const catItems = filteredItems.filter(i => i.cat_folder === key);
            if (catItems.length > 0) {
                grouped[key] = {
                    categoryName: cat.name,
                    categoryDescription: cat.description || '',
                    items: catItems
                };
            }
        }

        // Handle items without a matching category
        const unmatchedItems = filteredItems.filter(i => !categories.some(c => c.cat_folder === i.cat_folder));
        if (unmatchedItems.length > 0) {
            grouped['other'] = {
                categoryName: 'อื่นๆ',
                categoryDescription: '',
                items: unmatchedItems
            };
        }

        const p = JSON.stringify({
            categories: grouped,
            totalItems: filteredItems.length,
            month: now.getMonth() + 1,
            year: now.getFullYear()
        }, (key, value) => typeof value === "bigint" ? value.toString() : value);

        return NextResponse.json(JSON.parse(p));
    } catch (error) {
        console.error("Report data error:", error);
        return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 });
    }
}
