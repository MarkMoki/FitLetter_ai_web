import { getCurrentSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  // Check if user is already authenticated
  const session = await getCurrentSession();
  
  if (session) {
    redirect('/dashboard');
  }

  // Redirect to login page for unauthenticated users
  redirect('/login');
}