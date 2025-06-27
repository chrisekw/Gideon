import { redirect } from 'next/navigation';

// This file is intentionally left blank to resolve a routing conflict.
// The main page is defined in src/app/(app)/home/page.tsx
export default function RootPage() {
  redirect('/home');
}
