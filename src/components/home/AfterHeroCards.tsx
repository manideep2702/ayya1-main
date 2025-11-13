"use client";

import { Hand } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

export default function AfterHeroCards() {
  return (
    <section className="relative w-full bg-black">
      <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-white/10">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.5 }} className="border-b md:border-b-0 md:border-r border-white/10">
            <PrayerCard />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <AnnadanamCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PrayerCard() {
  const [index, setIndex] = React.useState(0);
  const slides = [
    `അഖില ഭുവന ദീപം ഭക്ത ചിത്താബ്ജ സൂരം
സുരഗണ പരിസേവ്യം തത്ത്വമസ്യാദി ലക്ഷ്യം
ഹരിഹര സുതമീശം താരകബ്രഹ്മ രൂപം
ശബരിഗിരി നിവാസം ഭാവയേത് ഭൂതനാഥം

अखिल भुवन दीपम् भक्त चित्ताब्ज सूरम्
सुरगण परिसेव्यम् तत्त्वमस्यादि लक्ष्यम्
हरिहर सुतमीशम् तारक ब्रह्म रूपम्
शबरि गिरि निवासम् भावयेत् भूतनाथम् |`,
    `ഭൂതനാഥ സദാനന്ദ സർവഭൂത ദയാപര
രക്ഷരക്ഷ മഹാബാഹോ ശാസ്ത്രേ തുഭ്യം നമോനമഃ

भूतनाथ सदानन्द सर्व भूत दयापर
रक्ष रक्ष महाबाहो शास्त्रे तुभ्यं नमो नमः`,
  ];

  // Swipe/drag detection (touch + mouse)
  const startPoint = React.useRef<number | null>(null);
  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    startPoint.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (startPoint.current === null) return;
    const dx = e.clientX - startPoint.current;
    if (dx < -30) setIndex((i) => Math.min(i + 1, slides.length - 1));
    if (dx > 30) setIndex((i) => Math.max(i - 1, 0));
    startPoint.current = null;
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-200/20 rounded-full blur-3xl" />
      
      {/* Muggulu/Kolam decorative patterns - Top Right */}
      <svg className="absolute top-4 right-4 w-16 h-16 opacity-20" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#D97706" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="30" fill="none" stroke="#D97706" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="20" fill="none" stroke="#D97706" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="10" fill="none" stroke="#D97706" strokeWidth="1.5"/>
        <path d="M50,10 L50,90 M10,50 L90,50 M20,20 L80,80 M80,20 L20,80" stroke="#D97706" strokeWidth="1"/>
      </svg>
      
      {/* Muggulu pattern - Bottom Left */}
      <svg className="absolute bottom-4 left-4 w-20 h-20 opacity-20" viewBox="0 0 100 100">
        <path d="M50,10 L60,30 L80,35 L65,50 L70,70 L50,60 L30,70 L35,50 L20,35 L40,30 Z" fill="none" stroke="#EA580C" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="15" fill="none" stroke="#EA580C" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="5" fill="#EA580C"/>
      </svg>
      
      {/* Small decorative dot pattern - Top Left */}
      <svg className="absolute top-8 left-8 w-12 h-12 opacity-15" viewBox="0 0 100 100">
        <circle cx="20" cy="20" r="3" fill="#D97706"/>
        <circle cx="50" cy="20" r="3" fill="#D97706"/>
        <circle cx="80" cy="20" r="3" fill="#D97706"/>
        <circle cx="20" cy="50" r="3" fill="#D97706"/>
        <circle cx="50" cy="50" r="5" fill="#D97706"/>
        <circle cx="80" cy="50" r="3" fill="#D97706"/>
        <circle cx="20" cy="80" r="3" fill="#D97706"/>
        <circle cx="50" cy="80" r="3" fill="#D97706"/>
        <circle cx="80" cy="80" r="3" fill="#D97706"/>
      </svg>
      
      <div className="relative">
        <h3 className="text-center text-base font-bold tracking-widest text-amber-800 mb-1">
          AYYAPPA PRAYER
        </h3>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-6" />
        
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/50">
          <div
            className="whitespace-pre-line text-[15px] leading-7 text-gray-800 select-text min-h-[200px] cursor-grab active:cursor-grabbing font-medium text-center"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            {slides[index]}
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-8 bg-amber-600' : 'w-2 bg-amber-300 hover:bg-amber-400'
              }`}
              aria-label={`Go to verse ${i + 1}`}
            />
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-center">
          <div className="w-full max-w-md bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 rounded-full p-3 shadow-md">
            <audio
              className="w-full"
              controls
              preload="none"
              src="/Sreekovil-Nada-Thurannu-Jayan-Jaya-Vijaya.mp3"
              style={{filter: 'sepia(0.3) saturate(1.2)'}}
            />
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-2 text-amber-700">
          <Hand className="h-4 w-4 animate-pulse" />
          <span className="text-xs font-medium">Swipe to see more verses</span>
        </div>
      </div>
    </div>
  );
}

function AnnadanamCard() {
  function getSeason(now: Date) {
    const y = now.getFullYear();
    const m = now.getMonth() + 1; // 1-12
    if (m < 11) return { start: new Date(y, 10, 5), end: new Date(y + 1, 0, 7) }; // Nov 5 to Jan 7 (next year)
    if (m === 11 || m === 12) return { start: new Date(y, 10, 5), end: new Date(y + 1, 0, 7) };
    // m === 1
    if (now.getDate() <= 7) return { start: new Date(y - 1, 10, 5), end: new Date(y, 0, 7) };
    return { start: new Date(y, 10, 5), end: new Date(y + 1, 0, 7) };
  }
  function getNextAnnadanamDate(now = new Date()) {
    const { start, end } = getSeason(now);
    if (now < start) return start;
    if (now <= end) return now;
    return new Date(now.getFullYear(), 10, 5); // next season start (Nov 5)
  }
  const nextDate = getNextAnnadanamDate();
  const nextDateLabel = nextDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const rows = [
    { session: "Afternoon", time: "1:00 – 3:00 pm" },
    { session: "Evening", time: "8:30 – 10:00 pm" },
  ];
  return (
    <div className="w-full h-full bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-orange-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-amber-200/20 rounded-full blur-3xl" />
      
      {/* Muggulu/Kolam decorative patterns - Top Left */}
      <svg className="absolute top-6 left-6 w-20 h-20 opacity-20" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="8" fill="none" stroke="#C2410C" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="16" fill="none" stroke="#C2410C" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="24" fill="none" stroke="#C2410C" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="32" fill="none" stroke="#C2410C" strokeWidth="1.5"/>
        <path d="M50,18 L50,82 M18,50 L82,50 M28,28 L72,72 M72,28 L28,72" stroke="#C2410C" strokeWidth="1"/>
        <path d="M50,26 L64,36 L64,50 L64,64 L50,74 L36,64 L36,50 L36,36 Z" stroke="#C2410C" strokeWidth="1.5" fill="none"/>
      </svg>
      
      {/* Traditional Lotus pattern - Bottom Right */}
      <svg className="absolute bottom-6 right-6 w-18 h-18 opacity-20" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="35" fill="none" stroke="#EA580C" strokeWidth="1.5"/>
        <path d="M50,15 L56,35 L76,35 L60,48 L66,68 L50,55 L34,68 L40,48 L24,35 L44,35 Z" fill="none" stroke="#EA580C" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="12" fill="none" stroke="#EA580C" strokeWidth="1.5"/>
      </svg>
      
      {/* Small decorative flower - Top Right */}
      <svg className="absolute top-1/4 right-4 w-14 h-14 opacity-15" viewBox="0 0 100 100">
        <rect x="25" y="25" width="50" height="50" fill="none" stroke="#D97706" strokeWidth="1.5" transform="rotate(45 50 50)"/>
        <circle cx="50" cy="50" r="20" fill="none" stroke="#D97706" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="10" fill="none" stroke="#D97706" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="4" fill="#D97706"/>
      </svg>
      
      <div className="relative">
        <h3 className="text-center text-base font-bold tracking-widest text-orange-800 mb-1">
          UPCOMING ANNADANAM SEVA
        </h3>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mb-4" />
        
        <p className="text-sm text-gray-700 text-center font-medium">Daily seva slots during Annadanam season</p>
        <div className="mt-3 flex items-center justify-center">
          <div className="bg-gradient-to-r from-orange-100 to-amber-100 px-4 py-2 rounded-full border border-orange-200 shadow-sm">
            <p className="text-xs text-gray-600">Next date: <span className="font-bold text-orange-700">{nextDateLabel}</span></p>
          </div>
        </div>
        
        <div className="mt-6 mx-auto w-full max-w-md">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border-2 border-orange-200/50 shadow-lg">
            <div className="bg-gradient-to-r from-orange-100 via-amber-100 to-orange-100 py-3 px-6">
              <div className="flex items-center justify-between text-orange-900 font-bold text-sm">
                <span>Session</span>
                <span>Time</span>
              </div>
            </div>
            <div className="divide-y divide-orange-100">
              {rows.map((r, i) => (
                <div key={r.session} className={`py-4 px-6 flex items-center justify-between hover:bg-amber-50/50 transition-colors ${
                  i % 2 ? 'bg-white/50' : 'bg-amber-50/30'
                }`}>
                  <span className="font-semibold text-orange-800 text-base">{r.session}</span>
                  <span className="text-gray-700 font-medium">{r.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <a 
            href="/calendar/annadanam" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all transform hover:scale-105"
          >
            <span className="text-sm">Virtual Queue Booking</span>
          </a>
          <a 
            href="/volunteer" 
            className="inline-flex items-center gap-2 bg-white hover:bg-amber-50 border-2 border-orange-400 text-orange-700 font-semibold px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all transform hover:scale-105"
          >
            <span className="text-sm">Volunteer</span>
          </a>
        </div>
      </div>
    </div>
  );
}
