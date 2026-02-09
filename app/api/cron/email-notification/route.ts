import { NextResponse } from 'next/server';
import { sendScheduledExpiryNotifications } from '@/lib/email-service';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Check for a secret key to prevent unauthorized access
        // You should set CRON_SECRET in your .env
        if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json({ error: "RESEND_API_KEY is missing" }, { status: 500 });
        }

        const result = await sendScheduledExpiryNotifications();
        return NextResponse.json({
            message: "Cron job executed successfully",
            timestamp: new Date().toISOString(),
            result
        });
    } catch (error: any) {
        console.error("Cron Job Error:", error);
        return NextResponse.json({ error: error.message || "Cron job failed" }, { status: 500 });
    }
}
