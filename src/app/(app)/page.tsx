import { redirect } from 'next/navigation';

// The main page has been moved to /home.
// This redirect ensures that anyone accessing the old URL is correctly routed.
export default function OldRootPage() {
  redirect('/home');
}
