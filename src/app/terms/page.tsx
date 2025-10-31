
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Terms and Conditions | Alliance',
};

export default function TermsAndConditionsPage() {
    return (
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold font-headline text-foreground">Terms and Conditions</h1>
                    <p className="text-lg text-muted-foreground mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="prose prose-lg max-w-none text-foreground space-y-4">
                    <p>
                        Welcome to Alliance! These terms and conditions outline the rules and regulations for the use of Alliance's Website, located at this domain.
                    </p>
                    <p>
                        By accessing this website we assume you accept these terms and conditions. Do not continue to use Alliance if you do not agree to take all of the terms and conditions stated on this page.
                    </p>

                    <h2 className="text-2xl font-semibold font-headline">Accounts</h2>
                    <p>
                        When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                    </p>

                    <h2 className="text-2xl font-semibold font-headline">Data and Privacy</h2>
                    <p>
                        Your data is stored securely and may be accessed only when necessary for maintenance, debugging, or service improvement. We do not share or use your data for any unrelated purposes.
                    </p>

                    <h2 className="text-2xl font-semibold font-headline">Intellectual Property</h2>
                    <p>
                        The Service and its original content, features, and functionality are and will remain the exclusive property of Alliance and its licensors.
                    </p>

                    <h2 className="text-2xl font-semibold font-headline">Termination</h2>
                    <p>
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>

                    <h2 className="text-2xl font-semibold font-headline">Changes to Terms</h2>
                    <p>
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                    </p>

                    <h2 className="text-2xl font-semibold font-headline">Contact Us</h2>
                    <p>
                        If you have any questions about these Terms, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
