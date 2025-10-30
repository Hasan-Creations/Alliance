import Image from 'next/image';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/" className="flex items-center gap-2" prefetch={false}>
      <Image src="/favicon.png" alt="TaskNest Logo" width={24} height={24} />
      <span className="text-xl font-bold font-headline text-primary">TaskNest</span>
    </Link>
  );
}
