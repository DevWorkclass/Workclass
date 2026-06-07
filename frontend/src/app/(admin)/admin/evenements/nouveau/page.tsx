import { PageHeader } from '@/components/admin/PageHeader';
import { EventForm } from '@/components/admin/EventForm';

export default function NewEventPage() {
  return (
    <>
      <PageHeader
        title="Nouvel événement"
        subtitle="Remplissez les informations ci-dessous pour créer un nouvel événement"
        backHref="/admin/evenements"
      />
      
      <section className="mt-6 max-w-4xl rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <EventForm />
      </section>
    </>
  );
}
