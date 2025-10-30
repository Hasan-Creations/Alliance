
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const metadata: Metadata = {
    title: 'Contact Us | TaskNest',
};

export default function ContactPage() {
    return (
        <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold font-headline text-foreground">Contact Us</h1>
                    <p className="text-lg text-muted-foreground mt-2">Have a question or feedback? We'd love to hear from you.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Send a Message</CardTitle>
                        <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action="https://formspree.io/f/mnnozgkq" method="POST" className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" name="name" type="text" placeholder="Your Name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea id="message" name="message" placeholder="Your message..." rows={5} required />
                            </div>
                            <Button type="submit" className="w-full">Send Message</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
