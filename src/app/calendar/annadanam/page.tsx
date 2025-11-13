import { MapPin, HeartHandshake, HandHeart } from "lucide-react";
import RequireAuth from "@/components/auth/require-auth";
import AnnadanamBooking from "@/components/annadanam/AnnadanamBooking";

export default function Page() {
  const start = "November 5th";
  const end = "January 7th";
  const slots = [
    { session: "Afternoon", time: "1:00 PM – 3:00 PM" },
    { session: "Evening", time: "8:30 PM – 10:00 PM" },
  ];

  return (
    <RequireAuth>
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-6 pt-28 pb-12 space-y-6">
        <header>
          {/* Banner above title */}
          <div className="mb-4">
            <img
              src="/Banner.jpeg"
              alt="Annadanam banner"
              className="w-full h-auto rounded-xl border border-border object-cover"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Annadanam Virtual Queue Booking</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Annadanam season runs from <span className="font-medium text-foreground">{start}</span> to
            {" "}
            <span className="font-medium text-foreground">{end}</span>.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href="https://maps.app.goo.gl/GZNWGfypJUWTbh6L7"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ring-1 ring-border text-foreground hover:bg-white/5"
              aria-label="Open Samithi location in Google Maps"
            >
              <MapPin size={14} /> Google Maps
            </a>
            <a
              href="/volunteer"
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ring-1 ring-border text-foreground hover:bg-white/5"
              aria-label="Volunteer for Annadanam"
            >
              <HandHeart size={14} /> Volunteer
            </a>
            <a
              href="/donate?campaign=annadanam"
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ring-1 ring-border text-foreground hover:bg-white/5"
              aria-label="Donate to Annadanam"
            >
              <HeartHandshake size={14} /> Donate to Annadanam
            </a>
          </div>
        </header>

        <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Daily Time Slots</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[360px] w-full text-sm">
              <thead>
                <tr className="text-left text-foreground">
                  <th className="py-2 pr-4">Session</th>
                  <th className="py-2 pr-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.session} className="border-t border-border text-muted-foreground">
                    <td className="py-2 pr-4 font-medium text-foreground">{s.session}</td>
                    <td className="py-2 pr-4">{s.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Booking UI */}
        <section className="rounded-2xl border border-border bg-card/70 p-0 shadow-sm overflow-hidden">
          <AnnadanamBooking />
        </section>

        <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
          <h3 className="text-base font-semibold">Notes</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Bookings open soon. Please check back for slot availability.</li>
            <li>Timings are subject to Samithi schedule and festival days.</li>
          </ul>
        </section>
      </div>
    </main>
    </RequireAuth>
  );
}
