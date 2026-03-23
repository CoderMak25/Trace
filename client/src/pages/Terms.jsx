import Navbar from '../components/Navbar';

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-heading text-4xl mb-8 border-b-4 border-ink pb-4">Terms of Service</h1>
        <div className="space-y-6 text-lg text-ink/80 leading-relaxed">
          <p><strong>Last Updated: March 2026</strong></p>
          <p>By accessing or using Trace, you agree to be bound by these Terms of Service.</p>
          
          <section>
            <h2 className="font-heading text-2xl text-ink mb-3">1. Description of Service</h2>
            <p>Trace provides a platform for tracking hackathons and syncing event deadlines to your Google Calendar.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-ink mb-3">2. Third-Party Services</h2>
            <p>Our service integrates with Google Calendar. By using these features, you grant Trace the necessary permissions to manage hackathon-related events on your behalf.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-ink mb-3">3. Use of Data</h2>
            <p>We use your data only to provide the services requested. We do not sell or trade user information.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
