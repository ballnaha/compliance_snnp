import { Resend } from 'resend';
import { prisma } from './prisma';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale('th');

const resend = new Resend(process.env.RESEND_API_KEY);

interface ExpiryItem {
    id: string;
    cat_name: string;
    category_name: string;
    license: string;
    license_no: string;
    factory_name: string;
    expire_datetime: Date | string | null;
    responsible_person: string;
    document_preparer: string;
}

const serialize = (data: any) => {
    return JSON.parse(
        JSON.stringify(data, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
};

export async function sendScheduledExpiryNotifications(targetUserId?: string) {
    try {
        // 1. Fetch items expiring within 90 days (including already expired)
        const items: any[] = await prisma.$queryRawUnsafe(`
            SELECT f.*, m.name as category_name, s.name as factory_name
            FROM categories_form f
            LEFT JOIN categories_master m ON f.cat_name = m.id
            LEFT JOIN status_master s ON f.factory = s.code_id AND s.type = 'Factory'
            WHERE (f.inactive IS NULL OR f.inactive != 'on')
            AND DATEDIFF(f.expire_datetime, NOW()) <= 90
            ORDER BY f.expire_datetime ASC
        `);

        if (items.length === 0) {
            return { success: true, message: "No items expiring within 90 days found." };
        }

        // 2. Fetch all users for mapping emails
        const users = await prisma.users.findMany({
            select: { id: true, email: true, name: true }
        });
        const userMap = new Map(users.map(u => [u.id.toString(), u]));

        // 3. Group items by Responsible and Preparer
        const responsibleGroups = new Map<string, any[]>();
        const preparerGroups = new Map<string, any[]>();

        items.forEach(item => {
            const serialized = serialize(item);

            if (item.responsible_person && userMap.has(item.responsible_person.toString())) {
                const userId = item.responsible_person.toString();
                // If targeting a specific user, only include them
                if (!targetUserId || userId === targetUserId) {
                    if (!responsibleGroups.has(userId)) responsibleGroups.set(userId, []);
                    responsibleGroups.get(userId)?.push(serialized);
                }
            }

            if (item.document_preparer && userMap.has(item.document_preparer.toString())) {
                const userId = item.document_preparer.toString();
                // If targeting a specific user, only include them
                if (!targetUserId || userId === targetUserId) {
                    if (!preparerGroups.has(userId)) preparerGroups.set(userId, []);
                    preparerGroups.get(userId)?.push(serialized);
                }
            }
        });

        const results = [];

        // 4. Send emails to Responsible Persons
        for (const [userId, groupItems] of responsibleGroups.entries()) {
            const user = userMap.get(userId);
            if (user?.email) {
                const emailResult = await sendEmail(
                    user.email,
                    "ใบอนุญาตใกล้หมดอายุ (สำหรับผู้รับผิดชอบ)",
                    user.name,
                    groupItems,
                    "Responsible"
                );
                results.push({ user: user.name, type: 'Responsible', status: emailResult });
            }
        }

        // 5. Send emails to Document Preparers
        for (const [userId, groupItems] of preparerGroups.entries()) {
            const user = userMap.get(userId);
            if (user?.email) {
                const emailResult = await sendEmail(
                    user.email,
                    "ใบอนุญาตใกล้หมดอายุ (สำหรับผู้จัดเตรียมเอกสาร)",
                    user.name,
                    groupItems,
                    "Preparer"
                );
                results.push({ user: user.name, type: 'Preparer', status: emailResult });
            }
        }

        if (targetUserId && results.length === 0) {
            return { success: true, message: "No items found for this specific user." };
        }

        return { success: true, results };

    } catch (error) {
        console.error("Email Service Error:", error);
        throw error;
    }
}

async function sendEmail(to: string, subject: string, userName: string, items: any[], role: string) {
    const html = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="background-color: #0f172a; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">SNNP Compliance</h1>
                <p style="color: #818cf8; margin: 5px 0 0; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Notification System</p>
            </div>
            
            <div style="padding: 24px;">
                <p style="font-size: 16px; color: #1e293b; margin-bottom: 24px;">
                    เรียนคุณ <strong>${userName}</strong>,
                </p>
                <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                    ระบบตรวจสอบพบใบอนุญาตที่ใกล้จะหมดอายุ (ภายใน 90 วัน) หรือหมดอายุแล้ว โดยท่านมีบทบาทเป็น <strong>${role === 'Responsible' ? 'ผู้รับผิดชอบ' : 'ผู้จัดเตรียมเอกสาร'}</strong> ดังนี้:
                </p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 13px; color: #64748b;">หมวดหมู่</th>
                            <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 13px; color: #64748b;">ชื่อใบอนุญาต</th>
                            <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: center; font-size: 13px; color: #64748b;">วันหมดอายุ</th>
                            <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: center; font-size: 13px; color: #64748b;">โรงงาน</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => {
        const isExpired = item.expire_datetime && dayjs(item.expire_datetime).isBefore(dayjs(), 'day');
        return `
                            <tr>
                                <td style="border: 1px solid #e2e8f0; padding: 12px; font-size: 14px; color: #1e293b;">${item.category_name || '-'}</td>
                                <td style="border: 1px solid #e2e8f0; padding: 12px; font-size: 14px; color: #1e293b;">
                                    ${item.license || '-'}
                                    <br/><small style="color: #94a3b8;">${item.license_no || ''}</small>
                                </td>
                                <td style="border: 1px solid #e2e8f0; padding: 12px; font-size: 14px; text-align: center; color: ${isExpired ? '#ef4444' : '#1e293b'}; font-weight: ${isExpired ? 'bold' : 'normal'};">
                                    ${item.expire_datetime ? dayjs(item.expire_datetime).format('DD MMM BBBB') : '-'}
                                    ${isExpired ? '<br/><span style="font-size: 11px; color: #ef4444;">(หมดอายุแล้ว)</span>' : ''}
                                </td>
                                <td style="border: 1px solid #e2e8f0; padding: 12px; font-size: 14px; text-align: center; color: #1e293b;">${item.factory_name || item.factory || '-'}</td>
                            </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
                
                <div style="margin-top: 32px; padding: 20px; background-color: #f1f5f9; border-radius: 6px;">
                    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">
                        ท่านสามารถตรวจสอบรายละเอียดเพิ่มเติมและดำเนินการต่ออายุได้ที่ระบบ SNNP Compliance
                    </p>
                    <a href="${process.env.AUTH_URL || 'http://localhost:5001'}" style="display: inline-block; margin-top: 15px; background-color: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">เข้าสู่ระบบเพื่อจัดการ</a>
                </div>
            </div>
            
            <div style="padding: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    อีเมลฉบับนี้เป็นการแจ้งเตือนแบบอัตโนมัติ กรุณาอย่าตอบกลับ
                </p>
            </div>
        </div>
    `;

    try {
        const data = await resend.emails.send({
            from: 'SNNP Compliance <noreply@resend.dev>', // Should be updated to a verified domain in production
            to: [to],
            subject: subject,
            html: html,
        });
        return { success: true, data };
    } catch (error: any) {
        console.error(`Error sending email to ${to}:`, error);
        return { success: false, error: error.message };
    }
}
