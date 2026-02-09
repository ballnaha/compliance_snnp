import { NextResponse } from 'next/server';
import { sendScheduledExpiryNotifications } from '@/lib/email-service';

export async function POST(request: Request) {
    try {
        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json({ error: "RESEND_API_KEY is not configured in .env" }, { status: 500 });
        }

        const body = await request.json().catch(() => ({}));
        const { userId } = body;

        const result = await sendScheduledExpiryNotifications(userId);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Test Email error:", error);
        return NextResponse.json({ error: error.message || "Failed to send test emails" }, { status: 500 });
    }
}
