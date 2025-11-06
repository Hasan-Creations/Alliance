
import { sendReminders } from '@/ai/flows/send-reminders-flow';
import {NextRequest, NextResponse} from 'next/server';

export const GET = async (req: NextRequest) => {
    // In production, the sendReminders function will handle its own authorization.
    // In development, it will return early without erroring.
    try {
        await sendReminders(req);
        return NextResponse.json({ success: true, message: 'Reminders processed.' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error('Error in /api/send-reminders:', errorMessage);
        
        if (errorMessage.includes('Unauthorized')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
};
