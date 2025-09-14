import { getCurrentSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function StartPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect('/dashboard');
  }
  redirect('/login');
}
