
import { sendReminders } from '@/ai/flows/send-reminders-flow';
import {NextRequest, NextResponse} from 'next/server';

export const GET = async (req: NextRequest) => {
    // Secure the endpoint to be triggered only by Vercel Cron Jobs
    if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        await sendReminders();
        return NextResponse.json({ success: true, message: 'Reminders sent successfully.' });
    } catch (error) {
        console.error('Error sending reminders:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
};
