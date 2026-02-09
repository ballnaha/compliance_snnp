import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function saveFile(file: File): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Format: YYYYMMDDHHmmss-filename
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, '').split('.')[0];
    const fileName = `${timestamp}-${file.name}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Ensure directory exists
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (e) { }

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    return fileName;
}

// Use FormData for PUT as well to handle potential file updates
export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const formData = await request.formData();

        const getValue = (key: string) => {
            const val = formData.get(key);
            // If explicit 'null' string or null, return null for DB
            if (val === 'null') return null;
            // If val exists (including empty string), return it as string
            return val !== null ? val.toString() : undefined;
        };

        // Helper to parse dates correctly or return undefined to skip update if missing
        const getDate = (key: string) => {
            const val = formData.get(key);
            if (val === 'null' || val === '') return null; // Clear date
            if (val) return new Date(val.toString());
            return undefined;
        };

        // Files
        const files = formData.getAll('files') as File[];
        let uploadedFileName: string | undefined = undefined;
        if (files.length > 0 && files[0].name) {
            uploadedFileName = await saveFile(files[0]);
        }

        const deleteFile = formData.get('delete_file') === 'true';

        // Fetch existing record to delete old file if needed
        if (uploadedFileName || deleteFile) {
            const existing = await prisma.categories_form.findUnique({ where: { id: BigInt(id) } });
            if (existing && existing.file) {
                const oldFilePath = path.join(process.cwd(), "public", "uploads", existing.file);
                try {
                    const { unlink } = require('fs/promises');
                    await unlink(oldFilePath);
                } catch (e) {
                    console.log("Could not delete old file:", e);
                }
            }
        }

        const updated = await prisma.categories_form.update({
            where: { id: BigInt(id) },
            data: {
                cat_name: getValue('cat_name'),
                cat_folder: getValue('cat_folder'),
                license: getValue('license'),
                plan: getValue('plan'),
                factory: getValue('factory'),
                license_no: getValue('license_no'),
                allow_datetime: getDate('allow_datetime'),
                expire_datetime: getDate('expire_datetime'),
                warning_datetime: getDate('warning_datetime'),
                department: getValue('department'),
                status: getValue('status'),
                responsible_person: getValue('responsible_person'),
                document_preparer: getValue('document_preparer'),
                document_receive: getValue('document_receive'),
                document_state: getValue('document_state'),
                objective: getValue('objective'),
                remark: getValue('remark'),
                expected_datetime: getValue('expected_datetime'),
                reply: getValue('need_update'),
                inactive: getValue('inactive'),
                file: uploadedFileName ? uploadedFileName : (deleteFile ? null : undefined),
                updated_at: new Date()
            }
        });

        const p = JSON.stringify(updated, (key, value) => typeof value === "bigint" ? value.toString() : value);
        return NextResponse.json(JSON.parse(p));

    } catch (error) {
        console.error("Update compliance error:", error);
        return NextResponse.json({ error: "Failed to update compliance" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    try {
        if (id) {
            // Get Single - use raw query to handle invalid datetime values (0000-00-00)
            const rawItems: any[] = await prisma.$queryRawUnsafe(`
                SELECT id, cat_name, cat_folder, license, plan, factory, license_no,
                    IF(CAST(allow_datetime AS CHAR) = '0000-00-00' OR allow_datetime IS NULL, NULL, allow_datetime) as allow_datetime,
                    IF(CAST(expire_datetime AS CHAR) = '0000-00-00' OR expire_datetime IS NULL, NULL, expire_datetime) as expire_datetime,
                    IF(CAST(warning_datetime AS CHAR) = '0000-00-00' OR warning_datetime IS NULL, NULL, warning_datetime) as warning_datetime,
                    department, status, responsible_person, document_preparer,
                    document_receive, document_state, objective, file, remark,
                    expected_datetime, reply, inactive, created_at, updated_at
                FROM categories_form WHERE id = ?
            `, BigInt(id));
            const item = rawItems[0];
            if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

            // Fetch masters for joining
            const categories = await prisma.categories_master.findMany();
            const factories = await prisma.status_master.findMany({ where: { type: 'factory' } });
            const users = await prisma.users.findMany();

            // Join: categories_form.cat_name = categories_master.id
            const cat = categories.find(c => c.id.toString() === item.cat_name);
            let category_description = item.cat_name || '';
            if (cat) {
                category_description = `${cat.name} ${cat.description || ''}`.trim();
            }

            // Join: factory = status_master.code_id
            let factoryName = item.factory || '';
            if (item.factory) {
                const factory = factories.find(f => f.code_id === item.factory);
                if (factory) factoryName = factory.name || '';
            }

            // Join: responsible_person = users.id
            let respName = item.responsible_person || '';
            if (item.responsible_person) {
                const user = users.find(u => u.id.toString() === item.responsible_person);
                if (user) respName = user.name;
            }

            // Join: document_preparer = users.id (s4 in PHP)
            let prepName = item.document_preparer || '';
            if (item.document_preparer) {
                const user = users.find(u => u.id.toString() === item.document_preparer);
                if (user) prepName = user.name;
            }

            const p = JSON.stringify({
                ...item,
                category_description,
                factory_name: factoryName,
                responsible_person_name: respName,
                document_preparer_name: prepName
            }, (key, value) => typeof value === "bigint" ? value.toString() : value);
            return NextResponse.json(JSON.parse(p));
        }
        const type = searchParams.get("type");
        if (type === 'received-options') {
            const raw = await prisma.categories_form.findMany({
                select: { document_receive: true },
                distinct: ['document_receive'],
                where: {
                    AND: [
                        { document_receive: { not: null } },
                        { document_receive: { not: '' } }
                    ]
                }
            });
            return NextResponse.json(raw.map(r => r.document_receive).filter(Boolean));
        } else if (type === 'state-options') {
            const raw = await prisma.categories_form.findMany({
                select: { document_state: true },
                distinct: ['document_state'],
                where: {
                    AND: [
                        { document_state: { not: null } },
                        { document_state: { not: '' } }
                    ]
                }
            });
            return NextResponse.json(raw.map(r => r.document_state).filter(Boolean));
        }
        else {
            // Get All
            const catIdParam = searchParams.get("cat_id");
            const factoriesParam = searchParams.get("factories");
            const daysParam = searchParams.get("days"); // New: Support filtering by days until expiry
            const showInactive = searchParams.get("show_inactive") === 'true';

            let whereParts: string[] = [];
            let params: any[] = [];

            // 1. Filter Inactive (Like: (inactive is null or inactive = "off"))
            if (!showInactive) {
                whereParts.push("(inactive IS NULL OR inactive != 'on')");
            }

            // 2. Filter by Category (Like: cat_name = 12)
            if (catIdParam) {
                const catIds = catIdParam.split(',').map(id => id.trim()).filter(Boolean);
                whereParts.push(`cat_name IN (${catIds.map(() => '?').join(',')})`);
                params.push(...catIds);
            }

            // 3. Filter by Factory Permissions (Like: join users_factory and where user_id = ...)
            if (factoriesParam) {
                const factoryIds = factoriesParam.split(',').map(id => id.trim()).filter(Boolean);
                whereParts.push(`factory IN (${factoryIds.map(() => '?').join(',')})`);
                params.push(...factoryIds);
            }

            // 4. DateDiff Calculation (Like: datediff(expire_datetime,now()) <= 90)
            if (daysParam) {
                const days = parseInt(daysParam);
                if (!isNaN(days)) {
                    whereParts.push(`DATEDIFF(expire_datetime, NOW()) >= 0 AND DATEDIFF(expire_datetime, NOW()) <= ?`);
                    params.push(days);
                }
            }

            const whereSQL = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

            const items: any[] = await prisma.$queryRawUnsafe(`
                SELECT id, cat_name, cat_folder, license, plan, factory, license_no,
                    IF(CAST(allow_datetime AS CHAR) = '0000-00-00' OR allow_datetime IS NULL, NULL, allow_datetime) as allow_datetime,
                    IF(CAST(expire_datetime AS CHAR) = '0000-00-00' OR expire_datetime IS NULL, NULL, expire_datetime) as expire_datetime,
                    IF(CAST(warning_datetime AS CHAR) = '0000-00-00' OR warning_datetime IS NULL, NULL, warning_datetime) as warning_datetime,
                    department, status, responsible_person, document_preparer,
                    document_receive, document_state, objective, file, remark,
                    expected_datetime, reply, inactive, created_at, updated_at
                FROM categories_form
                ${whereSQL}
                ORDER BY id DESC
            `, ...params);

            // Fetch all categories for joining
            const categories = await prisma.categories_master.findMany();
            // Fetch status_master for factory join
            const statusMasters = await prisma.status_master.findMany();
            // Fetch users for responsible_person + document_preparer joins
            const users = await prisma.users.findMany();

            const joinedItems = items.map(item => {
                // Join: categories_form.cat_name = categories_master.id
                const cat = categories.find(c => c.id.toString() === item.cat_name);
                let fullDesc = item.cat_name;
                if (cat) {
                    fullDesc = `${cat.name} ${cat.description || ''}`.trim();
                }

                // Join: categories_form.factory = status_master.code_id (s1)
                let factoryName = item.factory;
                if (item.factory) {
                    const factory = statusMasters.find(f => f.code_id === item.factory);
                    if (factory) factoryName = factory.name;
                }

                // Join: categories_form.responsible_person = users.id (s2)
                let respName = item.responsible_person;
                if (item.responsible_person) {
                    const user = users.find(u => u.id.toString() === item.responsible_person);
                    if (user) respName = user.name;
                }

                // Join: categories_form.document_preparer = users.id (s4)
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
        }
    } catch (error) {
        console.error("Fetch compliance error:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}


// Keep POST from before? Yes, we should merge or re-declare it.
// To avoid overwriting POST, I should have read the file first and appended/modified.
// But since I am using write_to_file with Overwrite: true on the whole file, I need to include POST again.

// RE-INCLUDING POST
export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const getValue = (key: string) => {
            const val = formData.get(key);
            if (val === 'null') return "";
            return val !== null ? val.toString() : "";
        };

        const getDate = (key: string) => {
            const val = formData.get(key);
            return val && val !== 'null' && val !== '' ? new Date(val.toString()) : null;
        };

        const files = formData.getAll('files') as File[];
        let uploadedFileName: string | null = null;
        if (files.length > 0 && files[0].name) {
            uploadedFileName = await saveFile(files[0]);
        }

        const compliance = await prisma.categories_form.create({
            data: {
                cat_name: getValue('cat_name'),
                cat_folder: getValue('cat_folder'),
                license: getValue('license'),
                plan: getValue('plan'),
                factory: getValue('factory'),
                license_no: getValue('license_no'),
                allow_datetime: getDate('allow_datetime'),
                expire_datetime: getDate('expire_datetime'),
                warning_datetime: getDate('warning_datetime'),
                department: getValue('department'),
                status: getValue('status'),
                responsible_person: getValue('responsible_person'),
                document_preparer: getValue('document_preparer'),
                document_receive: getValue('document_receive'),
                document_state: getValue('document_state'),
                objective: getValue('objective'),
                remark: getValue('remark'),
                expected_datetime: getValue('expected_datetime').toString() === 'null' ? null : getValue('expected_datetime'),
                reply: formData.get('need_update')?.toString() || "on",
                inactive: formData.get('inactive')?.toString() || "off",
                file: uploadedFileName,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        const p = JSON.stringify(compliance, (key, value) => typeof value === "bigint" ? value.toString() : value);
        return NextResponse.json(JSON.parse(p));
    } catch (error) {
        console.error("Create compliance error:", error);
        return NextResponse.json({ error: "Failed to create compliance form" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        // Check if item exists
        const item = await prisma.categories_form.findUnique({
            where: { id: BigInt(id) }
        });

        if (!item) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Delete file if exists
        if (item.file) {
            const filePath = path.join(process.cwd(), "public", "uploads", item.file);
            try {
                const { unlink } = require('fs/promises');
                await unlink(filePath);
            } catch (e) {
                console.log("Error deleting file:", e);
                // Continue with DB delete even if file delete fails
            }
        }

        // Delete from DB
        await prisma.categories_form.delete({
            where: { id: BigInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
