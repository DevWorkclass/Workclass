/**
 * Entrée du parcours de réservation — redirige vers la 1re étape.
 */
import { redirect } from 'next/navigation';

interface ReservationPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ReservationPage({ params }: ReservationPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/reservation/etape-1`);
}
