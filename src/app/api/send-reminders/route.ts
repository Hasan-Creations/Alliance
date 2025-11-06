
import { sendReminders } from '@/ai/flows/send-reminders-flow';
import {NextRequest, NextResponse} from 'next/server';

export const GET = async (req: NextRequest) => {
    // In production, secure the endpoint to be triggered only by Vercel Cron Jobs.
    if (process.env.NODE_ENV === 'production') {
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
            console.error('[send-reminders] CRITICAL: CRON_SECRET environment variable is not set. The endpoint cannot be secured.');
            return new NextResponse('Configuration error: Cron secret not set.', { status: 500 });
        }

        if (req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        await sendReminders();
        return NextResponse.json({ success: true, message: 'Reminders sent successfully.' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error('Error in /api/send-reminders:', errorMessage);
        return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
};
