
import { sendReminders } from '@/ai/flows/send-reminders-flow';
import {NextRequest, NextResponse} from 'next/server';

export const GET = async (req: NextRequest) => {
    // Explicitly check for the cron secret in production environments.
    // This is the main security check for the cron job.
    if (process.env.NODE_ENV === 'production') {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.error('Error in /api/send-reminders: Unauthorized. The CRON_SECRET did not match.');
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        await sendReminders(req);
        return NextResponse.json({ success: true, message: 'Reminders processed.' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error('Error in /api/send-reminders:', errorMessage);
        
        // The unauthorized check above is more specific, but we keep this for general errors.
        if (errorMessage.includes('Unauthorized')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
};
