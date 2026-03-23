import Navbar from '../components/Navbar';

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-heading text-4xl mb-8 border-b-4 border-ink pb-4">Privacy Policy</h1>
        <div className="space-y-6 text-lg text-ink/80 leading-relaxed">
          <p><strong>Last Updated: March 2026</strong></p>
          <p>Trace ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our web application.</p>
          
          <section>
            <h2 className="font-heading text-2xl text-ink mb-3">1. Information We Collect</h2>
            <p>When you sign in using Google, we collect the following basic profile information: Your Name, Your Email Address, and Your Profile Picture.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-ink mb-3">2. How We Use Google Calendar Data</h2>
            <p>Trace requests access to your Google Calendar (<code>https://www.googleapis.com/auth/calendar.events</code>). This is used strictly for:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Adding Events:</strong> To automatically add hackathon registration deadlines and event dates to your calendar when you "Save" an event.</li>
              <li><strong>Removing/Updating Events:</strong> To keep your calendar accurate if you un-save an event or if the schedule changes.</li>
            </ul>
            <p className="mt-4">We <strong>DO NOT</strong> read your personal events, use your data for ads, or share it with third parties. Trace follows the Google API Services User Data Policy, including the Limited Use requirements.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-ink mb-3">3. Contact</h2>
            <p>If you have questions, please contact us at mayank.kamble24@spit.ac.in</p>
          </section>
        </div>
      </div>
    </div>
  );
}
