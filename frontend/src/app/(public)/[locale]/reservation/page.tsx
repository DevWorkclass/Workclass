/**
 * Entrée du parcours de réservation — redirige vers la 1re étape en
 * CONSERVANT le paramètre `?event=slug` (réservation propre à l'événement choisi).
 */
import { redirect } from 'next/navigation';

interface ReservationPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ event?: string }>;
}

export default async function ReservationPage({ params, searchParams }: ReservationPageProps) {
  const { locale } = await params;
  const { event } = await searchParams;
  const query = event ? `?event=${encodeURIComponent(event)}` : '';
  redirect(`/${locale}/reservation/etape-1${query}`);
}
