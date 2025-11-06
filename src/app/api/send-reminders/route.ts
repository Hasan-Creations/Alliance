
import { sendReminders } from '@/ai/flows/send-reminders-flow';
import {NextRequest, NextResponse} from 'next/server';

export const GET = async (req: NextRequest) => {
    // This function is designed to run only in production via Vercel Cron Jobs.
    // In development, it will exit gracefully without erroring.
    if (process.env.NODE_ENV !== 'production') {
        console.log('[sendReminders] Skipping reminder check in development environment.');
        return NextResponse.json({ success: true, message: 'Reminders processed in development mode (skipped).'});
    }

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        console.error('[send-reminders] CRITICAL: CRON_SECRET environment variable is not set on the server.');
        return NextResponse.json({ success: false, error: 'Configuration error: Cron secret not set on server.' }, { status: 500 });
    }

    const vercelCronSecret = req.headers.get('x-vercel-cron-secret');
    if (vercelCronSecret !== cronSecret) {
        console.error('Error in /api/send-reminders: Unauthorized. The x-vercel-cron-secret header did not match.');
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        await sendReminders(req);
        return NextResponse.json({ success: true, message: 'Reminders processed.' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error('Error in /api/send-reminders:', errorMessage);
        return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
};
