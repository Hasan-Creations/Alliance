
import { redirect } from 'next/navigation';

export default function RootPage() {
  // The root of the app group should always redirect to the main dashboard.
  redirect('/dashboard');
}
