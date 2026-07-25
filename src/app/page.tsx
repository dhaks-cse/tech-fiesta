"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Event, Workshop, SelectedItem } from "@/types";
import { events } from "@/data/events";
import { workshops } from "@/data/workshops";
import { Mail, Phone, MapPin } from "lucide-react";
import { FaInstagram, FaLinkedin } from "react-icons/fa";

// ─── Statically loaded (tiny, needed immediately) ────────────────────────────
import LoadingScreen from "@/components/LoadingScreen";
import CountdownTimer from "@/components/CountdownTimer";
import ScrambledText from "@/components/ScrambledText";

// ─── Dynamically loaded (heavy / not needed at paint) ─────────────────────────
const PixelBlast = dynamic(() => import("@/components/PixelBlast"), {
  ssr: false,
  loading: () => null,
});

const NavBar = dynamic(() => import("@/components/NavBar"), {
  ssr: false,
  loading: () => null,
});

const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: false,
  loading: () => null,
});

const JourneyMap = dynamic(() => import("@/components/JourneyMap"), {
  ssr: false,
  loading: () => null,
});

const EventGrid = dynamic(() => import("@/components/EventGrid"), {
  ssr: false,
  loading: () => (
    <div className="text-white text-center font-mono py-12 animate-pulse">
      Loading events...
    </div>
  ),
});

const WorkshopGrid = dynamic(() => import("@/components/WorkshopGrid"), {
  ssr: false,
  loading: () => (
    <div className="text-white text-center font-mono py-12 animate-pulse">
      Loading workshops...
    </div>
  ),
});

const ContactForm = dynamic(() => import("@/components/ContactForm"), {
  ssr: false,
  loading: () => null,
});

// RegistrationForm: heaviest chunk (firebase writes + jsPDF) — load async
const RegistrationForm = dynamic(() => import("@/components/RegistrationForm"), {
  ssr: false,
  loading: () => (
    <div className="text-white text-center font-mono py-12 animate-pulse">
      Loading registration form...
    </div>
  ),
});

const GlareHover = dynamic(
  () => import("@/components/ReactBits/GlareHover/GlareHover"),
  { ssr: false, loading: () => null }
);

// MatrixRain is an easter egg — only needed on user trigger, completely deferred
const MatrixRain = dynamic(() => import("@/components/MatrixRain"), {
  ssr: false,
  loading: () => null,
});

// ─── Firebase (deferred — only needed for anonymous sign-in check) ─────────────
import { auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";


export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [clockCollectionReady, setClockCollectionReady] = useState(false);
  const [showAnimatedText, setShowAnimatedText] = useState(false);
  const [showNavBar, setShowNavBar] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const [isSelfDestructing, setIsSelfDestructing] = useState(false);
  const [selfDestructCount, setSelfDestructCount] = useState(5);
  useEffect(() => {
    if (auth) {
      signInAnonymously(auth)
        .then(() => {
          console.log("Firebase anonymous login successful");
        })
        .catch((err) => {
          console.error("Firebase anonymous login failed:", err);
        });
    }
  }, []);
  
  // Lifted selection states for Add-to-Cart registration
  const [selectedEvents, setSelectedEvents] = useState<SelectedItem[]>([]);
  const [selectedWorkshops, setSelectedWorkshops] = useState<SelectedItem[]>([]);
  const [selectedNonTechEvents, setSelectedNonTechEvents] = useState<SelectedItem[]>([]);

  const selectedEventsRef = useRef<SelectedItem[]>([]);
  const selectedWorkshopsRef = useRef<SelectedItem[]>([]);
  const selectedNonTechEventsRef = useRef<SelectedItem[]>([]);

  useEffect(() => {
    selectedEventsRef.current = selectedEvents;
  }, [selectedEvents]);

  useEffect(() => {
    selectedWorkshopsRef.current = selectedWorkshops;
  }, [selectedWorkshops]);

  useEffect(() => {
    selectedNonTechEventsRef.current = selectedNonTechEvents;
  }, [selectedNonTechEvents]);

  // Parse deep links with eventId / type search params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const eventId = params.get("eventId");
      const eventType = params.get("type");
      if (eventId && eventType) {
        const id = parseInt(eventId);
        if (eventType === "event") {
          const event = events.find((e) => e.id === id);
          if (event) setSelectedEvents([{ id: event.id, title: event.title }]);
        } else if (eventType === "workshop") {
          const workshop = workshops.find((w) => w.id === id);
          if (workshop) setSelectedWorkshops([{ id: workshop.id, title: workshop.title }]);
        } else if (eventType === "non-tech") {
          const event = events.find((e) => e.id === id && e.type === "non-tech");
          if (event) setSelectedNonTechEvents([{ id: event.id, title: event.title }]);
        }
      }
    }
  }, []);

  // Prevent drag selection globally except for form fields
  useEffect(() => {
    const preventSelection = (e: any) => {
      const target = e.target as HTMLElement;
      if (
        !target ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("select")
      ) {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener("selectstart", preventSelection);
    document.addEventListener("dragstart", preventSelection);

    return () => {
      document.removeEventListener("selectstart", preventSelection);
      document.removeEventListener("dragstart", preventSelection);
    };
  }, []);

  const handleSelectEvent = useCallback((event: Event) => {
    const exists = selectedEventsRef.current.some((e) => e.id === event.id);
    if (exists) {
      toast.success(`Removed "${event.title}" from selections.`, {
        position: "bottom-right",
      });
      setSelectedEvents((prev) => prev.filter((e) => e.id !== event.id));
    } else {
      toast((t) => (
        <div className="flex flex-col gap-2 font-mono text-xs text-white">
          <span className="font-bold text-red-500">// ADDED: "{event.title}"</span>
          <span className="text-gray-400">Select workshops and proceed or proceed with registration.</span>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setActiveSection("workshops");
              }}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer"
            >
              Add Workshops
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setActiveSection("register");
              }}
              className="px-2.5 py-1 bg-white hover:bg-gray-200 text-black rounded text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer"
            >
              Register Now
            </button>
          </div>
        </div>
      ), {
        position: "bottom-right",
        duration: 6000,
        style: {
          background: "rgba(10, 10, 10, 0.95)",
          border: "1px solid rgba(239, 68, 68, 0.5)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.3)",
          backdropFilter: "blur(8px)",
        }
      });
      setSelectedEvents((prev) => [...prev, { id: event.id, title: event.title }]);
    }
  }, []);

  const handleSelectWorkshop = useCallback((workshop: Workshop) => {
    const exists = selectedWorkshopsRef.current.some((w) => w.id === workshop.id);
    if (exists) {
      toast.success(`Removed "${workshop.title}" from selections.`, {
        position: "bottom-right",
      });
      setSelectedWorkshops((prev) => prev.filter((w) => w.id !== workshop.id));
    } else {
      toast((t) => (
        <div className="flex flex-col gap-2 font-mono text-xs text-white">
          <span className="font-bold text-red-500">// ADDED: "{workshop.title}"</span>
          <span className="text-gray-400">Select events and proceed or proceed with registration.</span>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setActiveSection("events");
              }}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer"
            >
              Add Events
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setActiveSection("register");
              }}
              className="px-2.5 py-1 bg-white hover:bg-gray-200 text-black rounded text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer"
            >
              Register Now
            </button>
          </div>
        </div>
      ), {
        position: "bottom-right",
        duration: 6000,
        style: {
          background: "rgba(10, 10, 10, 0.95)",
          border: "1px solid rgba(239, 68, 68, 0.5)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.3)",
          backdropFilter: "blur(8px)",
        }
      });
      setSelectedWorkshops((prev) => [...prev, { id: workshop.id, title: workshop.title }]);
    }
  }, []);

  const handleSelectNonTechEvent = useCallback((event: Event) => {
    const exists = selectedNonTechEventsRef.current.some((e) => e.id === event.id);
    if (exists) {
      toast.success(`Removed "${event.title}" from selections.`, {
        position: "bottom-right",
      });
      setSelectedNonTechEvents((prev) => prev.filter((e) => e.id !== event.id));
    } else {
      toast((t) => (
        <div className="flex flex-col gap-2 font-mono text-xs text-white">
          <span className="font-bold text-red-500">// ADDED: "{event.title}"</span>
          <span className="text-gray-400">Select workshops and proceed or proceed with registration.</span>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setActiveSection("workshops");
              }}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer"
            >
              Add Workshops
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setActiveSection("register");
              }}
              className="px-2.5 py-1 bg-white hover:bg-gray-200 text-black rounded text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer"
            >
              Register Now
            </button>
          </div>
        </div>
      ), {
        position: "bottom-right",
        duration: 6000,
        style: {
          background: "rgba(10, 10, 10, 0.95)",
          border: "1px solid rgba(239, 68, 68, 0.5)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.3)",
          backdropFilter: "blur(8px)",
        }
      });
      setSelectedNonTechEvents((prev) => [...prev, { id: event.id, title: event.title }]);
    }
  }, []);

  const handleClearCart = useCallback(() => {
    setSelectedEvents([]);
    setSelectedWorkshops([]);
    setSelectedNonTechEvents([]);
  }, []);

  const totalSelectionCount = selectedEvents.length + selectedWorkshops.length + selectedNonTechEvents.length;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
  }, []);

  // Robustly pin page to top during loading transitions, section changes, and GSAP animations
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.scrollTo(0, 0);

    const timeouts = [50, 150, 300, 600, 1000].map((delay) =>
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isLoading, showAnimatedText, activeSection]);

  useEffect(() => {
    if (!isSelfDestructing) return;
    
    const playSiren = (count: number) => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = "sawtooth";
        osc2.type = "sine";
        
        osc1.frequency.setValueAtTime(330, ctx.currentTime);
        osc2.frequency.setValueAtTime(440, ctx.currentTime);
        
        osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
        
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        
        osc1.stop(ctx.currentTime + 0.8);
        osc2.stop(ctx.currentTime + 0.8);
      } catch (err) {}
    };

    playSiren(selfDestructCount);

    const timer = setInterval(() => {
      setSelfDestructCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.reload();
          return 0;
        }
        playSiren(prev - 1);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSelfDestructing]);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
    // Start the animated text after the loading is complete and clock is visible
    setTimeout(() => {
      setShowAnimatedText(true);
    }, 1000); // Show text 1 second after clock becomes visible
  }, []);

  const handleClockCollectionReady = useCallback(() => {
    setClockCollectionReady(true);
  }, []);
  const handleTextAnimationComplete = useCallback(() => {
    // Show NavBar immediately (no delay)
    setShowNavBar(true);

    console.log("Text animation completed");
  }, []);
  // Define loading tasks to track
  const loadingTasks = [
    { name: "Odyssey Background", completed: clockCollectionReady },
  ];

  return (
    <>
      <style jsx global>{`
        html,
        body {
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
          scrollbar-width: none; /* Hide scrollbar for Firefox */
        }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none;
        }

        /* Ensure mobile scrolling works properly */
        @media (max-width: 768px) {
          body {
            position: relative;
            height: auto;
            min-height: 100vh;
          }
        }
      `}</style>
      {isLoading && (
        <LoadingScreen
          onLoadingComplete={handleLoadingComplete}
          loadingTasks={loadingTasks}
        />
      )}{" "}
      <div
        className={`relative min-h-screen w-full p-0 m-0 overflow-x-hidden ${
          isLoading ? "opacity-0 pointer-events-none" : "opacity-100"
        } transition-opacity duration-500`}
      >
        {/* Fixed background with Vintage Map and PixelBlast */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-black">
          <div 
            className="absolute inset-0 opacity-55 max-sm:opacity-50 bg-cover bg-center max-sm:mix-blend-normal mix-blend-luminosity" 
            style={{ backgroundImage: "url('/vintage_map.png')" }}
          />
          {/* Secret Coding Brackets watermark (large, centered, very low opacity) */}
          <div 
            className="absolute inset-0 opacity-[0.02] bg-no-repeat bg-center mix-blend-screen scale-150 sm:scale-100" 
            style={{ 
              backgroundImage: "url('/secret_brackets.jpg')",
              filter: "invert(1) brightness(0.9)"
            }}
          />
          <PixelBlast
            variant="square"
            pixelSize={4}
            color="#DC2626"
            patternScale={2.5}
            patternDensity={1.2}
            pixelSizeJitter={0.1}
            enableRipples
            rippleSpeed={0.4}
            rippleThickness={0.15}
            rippleIntensityScale={2.0}
            liquid={true}
            liquidStrength={0.08}
            liquidRadius={1.2}
            liquidWobbleSpeed={4.0}
            speed={0.4}
            edgeFade={0.3}
            transparent
            onReady={handleClockCollectionReady}
          />
          <div 
            className="absolute inset-0"
            style={{ background: "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.85) 100%)" }}
          />
        </div>

        {/* Content layer - scrollable */}
        <div
          className="relative z-10 touch-pan-y"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* NavBar appears after animated text completes */}
          {showNavBar && (
            <NavBar 
              activeSection={activeSection} 
              onSectionChange={setActiveSection} 
              selectionCount={totalSelectionCount}
            />
          )}

          {/* Animated text that appears after clock is visible */}
          {showAnimatedText && (
            <div className="w-full pt-20 sm:pt-24 min-h-screen flex flex-col justify-between">
              <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-12 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {activeSection === "home" && (
                    <motion.div
                      key="home"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-4 sm:py-8 relative px-4 gap-12"
                    >
                      {/* Cyberpunk corner brackets */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/40 pointer-events-none" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500/40 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500/40 pointer-events-none" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500/40 pointer-events-none" />

                      <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 lg:gap-16">
                        {/* Left side: Heading Logo */}
                        <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start select-none md:pl-4 lg:pl-10">
                          <motion.img
                            src="/tech_fiesta_odyssey.png"
                            alt="Tech Fiesta: The Odyssey 2.0"
                            initial={{ opacity: 0, scale: 0.92, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            onAnimationComplete={handleTextAnimationComplete}
                            className="w-full max-w-[240px] sm:max-w-[280px] md:max-w-[260px] lg:max-w-[360px] h-auto object-contain drop-shadow-[0_0_30px_rgba(239,68,68,0.2)] mb-4"
                          />
                          <CountdownTimer />
                        </div>
                        
                        {/* Center Column: Original Tech HUD divider (visible on xl and up) */}
                        <div className="hidden xl:flex flex-col items-center justify-center gap-5 text-red-500/40 font-mono text-[9px] tracking-[0.25em] uppercase select-none px-4 relative min-w-[120px] animate-fade-in anim-delay-1000">
                          <div className="text-[10px] text-red-500 animate-pulse font-bold tracking-[0.1em]">[ SYSTEM ]</div>
                          <div className="w-px h-12 bg-gradient-to-b from-transparent via-red-500/30 to-transparent" />
                          <div className="flex flex-col gap-1 items-center leading-normal">
                            <span>SEC: ODY-2.0</span>
                            <span>LAT: 12.8256° N</span>
                            <span>LON: 80.0398° E</span>
                          </div>
                          <div className="relative w-8 h-8 flex items-center justify-center my-1">
                            <div className="absolute inset-0 border border-red-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                            <div className="absolute inset-1 border border-dashed border-red-500/40 rounded-full animate-[spin_5s_linear_infinite_reverse]" />
                            <span className="text-[8px] text-red-500/60">+</span>
                          </div>
                          <div className="flex flex-col gap-1 items-center leading-normal">
                            <span>STATUS: ONLINE</span>
                            <span>LOAD: 98.4%</span>
                            <span>PORT: 3002</span>
                          </div>
                          <div className="w-px h-12 bg-gradient-to-b from-transparent via-red-500/30 to-transparent" />
                          <div className="text-[10px] text-red-500 animate-pulse font-bold tracking-[0.1em]">[ TELEMETRY ]</div>
                        </div>

                        {/* Right side: Spartan Poster */}
                        <div className="flex-1 min-w-[140px] sm:min-w-[220px] md:min-w-[280px] lg:min-w-[320px] max-w-[170px] sm:max-w-[260px] md:max-w-[340px] lg:max-w-[420px] relative z-10 select-none animate-fade-in">
                          <div className="character-float w-full h-full relative">
                            {/* Outer glowing backlight red aura */}
                            <div className="absolute inset-0 bg-red-600/15 blur-[60px] rounded-2xl scale-95" />
                            <img
                              src="/odyssey_poster.png"
                              alt="Tech Fiesta 2.0: The Odyssey Poster"
                              className="w-full h-auto object-contain rounded-2xl border border-red-500/20 shadow-[0_20px_50px_rgba(220,38,38,0.3)] pointer-events-none"
                            />
                            
                            {/* Techy block overlay to cover the diamond symbol */}
                            <div className="absolute bottom-[4.2%] right-[4.2%] bg-black border border-red-500/40 rounded px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-red-500 font-mono text-[8px] sm:text-[9px] tracking-[0.15em] uppercase select-none flex items-center gap-1 sm:gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.8)] pointer-events-auto hover:border-red-500 transition-all duration-300">
                              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500 animate-ping" />
                              SYS ACTIVE
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Journey Map Navigation */}
                      <JourneyMap activeSection={activeSection} onSectionChange={setActiveSection} />
                    </motion.div>
                  )}

                  {activeSection === "about" && (
                    <motion.div
                      key="about"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="w-full flex items-center justify-center min-h-[calc(100vh-200px)] py-8"
                    >
                      <div className="text-center text-white max-w-4xl px-5 py-8 sm:p-10 rounded-2xl bg-black/75 border border-red-500/20 backdrop-blur-sm shadow-[0_0_25px_rgba(220,38,38,0.15)]">
                        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 font-[family-name:var(--font-bebas-neue)] tracking-wider">
                          About Tech Fiesta 2.0
                        </h2>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-red-500 mb-6 font-mono tracking-widest uppercase">
                          Theme: The Odyssey
                        </h3>
                        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 leading-relaxed text-gray-300">
                          TECH FIESTA&apos;26 is the flagship annual technical festival of the Asymmetric Club, hosted at Chennai Institute of Technology. This electrifying one-day event brings together innovators, developers, creators, and tech enthusiasts to explore the latest advancements in technology. With exciting workshops, competitions, keynote sessions, and hands-on experiences, Tech Fiesta&apos;26 is designed to inspire innovation, foster collaboration, and empower the next generation of tech leaders.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
                          <GlareHover
                            width="100%"
                            height="auto"
                            background="rgba(10, 10, 10, 0.7)"
                            borderRadius="0.5rem"
                            borderColor="rgba(239, 68, 68, 0.3)"
                            glareColor="#DC2626"
                            glareOpacity={0.4}
                            glareAngle={-45}
                            transitionDuration={600}
                          >
                            <div className="rounded-lg p-6">
                              <div className="text-4xl font-bold text-red-500 mb-2 font-[family-name:var(--font-bebas-neue)] tracking-wider">
                                1000+
                              </div>
                              <div className="text-gray-300 font-medium">Attendees Expected</div>
                            </div>
                          </GlareHover>
                          <GlareHover
                            width="100%"
                            height="auto"
                            background="rgba(10, 10, 10, 0.7)"
                            borderRadius="0.5rem"
                            borderColor="rgba(239, 68, 68, 0.3)"
                            glareColor="#DC2626"
                            glareOpacity={0.4}
                            glareAngle={-45}
                            transitionDuration={600}
                          >
                            <div className="rounded-lg p-6">
                              <div className="text-4xl font-bold text-red-500 mb-2 font-[family-name:var(--font-bebas-neue)] tracking-wider">
                                20+
                              </div>
                              <div className="text-gray-300 font-medium">Industry Speakers</div>
                            </div>
                          </GlareHover>
                          <GlareHover
                            width="100%"
                            height="auto"
                            background="rgba(10, 10, 10, 0.7)"
                            borderRadius="0.5rem"
                            borderColor="rgba(239, 68, 68, 0.3)"
                            glareColor="#DC2626"
                            glareOpacity={0.4}
                            glareAngle={-45}
                            transitionDuration={600}
                          >
                            <div className="rounded-lg p-6">
                              <div className="text-4xl font-bold text-red-500 mb-2 font-[family-name:var(--font-bebas-neue)] tracking-wider">
                                1
                              </div>
                              <div className="text-gray-300 font-medium">Days of Innovation</div>
                            </div>
                          </GlareHover>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeSection === "events" && (
                    <motion.div
                      key="events"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="w-full min-h-[calc(100vh-200px)] py-4 sm:py-8"
                    >
                      <div className="max-w-7xl mx-auto">
                        <EventGrid
                          events={events}
                          title="Featured Events"
                          showFilter={true}
                          selectedEvents={selectedEvents}
                          selectedNonTechEvents={selectedNonTechEvents}
                          onSelectEvent={handleSelectEvent}
                          onSelectNonTechEvent={handleSelectNonTechEvent}
                        />
                      </div>
                    </motion.div>
                  )}

                  {activeSection === "workshops" && (
                    <motion.div
                      key="workshops"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="w-full min-h-[calc(100vh-200px)] py-4 sm:py-8"
                    >
                      <div className="max-w-7xl mx-auto">
                        <WorkshopGrid
                          workshops={workshops.map((w) => ({
                            ...w,
                            level:
                              w.level === "Beginner" ||
                              w.level === "Intermediate" ||
                              w.level === "Advanced"
                                ? w.level
                                : undefined,
                          }))}
                          title="Hands-On Workshops"
                          showFilter={true}
                          selectedWorkshops={selectedWorkshops}
                          onSelectWorkshop={handleSelectWorkshop}
                        />
                      </div>
                    </motion.div>
                  )}

                  {activeSection === "contact" && (
                    <motion.div
                      key="contact"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="w-full min-h-[calc(100vh-200px)] py-4 sm:py-8 flex items-center justify-center"
                    >
                      <div className="w-full max-w-4xl px-5 py-8 sm:p-10 rounded-2xl bg-black/75 border border-red-500/20 backdrop-blur-sm shadow-[0_0_25px_rgba(220,38,38,0.15)]">
                        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 font-[family-name:var(--font-bebas-neue)] tracking-wider text-center text-white">
                          Contact Command Center
                        </h2>
                        <h3 className="text-xl sm:text-2xl font-semibold text-red-500 mb-8 font-mono tracking-widest uppercase text-center">
                          // ESTABLISHING CONNECTION PROTOCOL
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start w-full">
                          {/* Info Card */}
                          <div className="md:col-span-5 space-y-6 text-left border-r border-white/10 pr-0 md:pr-8">
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">General</h4>
                                  <a href="mailto:asymmetric@citchennai.net" className="text-white hover:text-red-400 text-sm font-semibold break-all">
                                    asymmetric@citchennai.net
                                  </a>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Helpline</h4>
                                  <a href="tel:+918667846929" className="text-white hover:text-red-400 text-sm font-semibold">
                                    +91 86678 46929
                                  </a>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Headquarters</h4>
                                  <p className="text-white text-xs leading-relaxed font-semibold">
                                    The Chennai Institute of Technology (CIT),<br />
                                    Sarathy Nagar, Kundrathur,<br />
                                    Chennai-600069, Tamil Nadu, India
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                              <h4 className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-3">// SOC_CHANNELS</h4>
                              <div className="flex gap-2">
                                <a href="https://www.instagram.com/clubasymmetric/" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/10 hover:border-red-500/50 hover:text-red-400 rounded-lg text-gray-300 transition-all duration-300">
                                  <FaInstagram className="w-4 h-4" />
                                </a>
                                <a href="https://www.linkedin.com/company/club-asymmetric/" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/10 hover:border-red-500/50 hover:text-red-400 rounded-lg text-gray-300 transition-all duration-300">
                                  <FaLinkedin className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Form */}
                          <div className="md:col-span-7 w-full">
                            <ContactForm />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeSection === "register" && (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="w-full min-h-[calc(100vh-200px)] py-4 sm:py-8"
                    >
                      <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
                        <div className="w-full px-4 py-6 sm:p-8 rounded-2xl bg-black/75 border border-red-500/20 backdrop-blur-sm shadow-[0_0_25px_rgba(220,38,38,0.15)]">
                          <RegistrationForm
                            selectedEvents={selectedEvents}
                            selectedWorkshops={selectedWorkshops}
                            selectedNonTechEvents={selectedNonTechEvents}
                            onUpdateEvents={setSelectedEvents}
                            onUpdateWorkshops={setSelectedWorkshops}
                            onUpdateNonTechEvents={setSelectedNonTechEvents}
                            onClearCart={handleClearCart}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Footer */}
              <Footer 
                onSectionChange={setActiveSection}
                onTriggerMatrix={() => setIsMatrixActive((prev) => !prev)}
                onTriggerSelfDestruct={() => setIsSelfDestructing(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Secret Matrix Overlay — dynamically imported easter egg */}
      {isMatrixActive && (
        <MatrixRain onClose={() => setIsMatrixActive(false)} />
      )}

      {/* Secret Self-Destruct Overlay */}
      {isSelfDestructing && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono p-6 select-none animate-[pulse_1.5s_infinite]">
          <div className="absolute inset-4 border border-red-600 animate-[ping_1.5s_infinite_ease-in-out]" />
          <div className="absolute inset-0 bg-red-950/15 pointer-events-none" />
          
          <div className="text-red-600 font-bold text-lg sm:text-2xl tracking-[0.2em] mb-4 text-center">
            ⚠️ CRITICAL SYSTEM FAILURE ⚠️
          </div>
          
          <div className="text-gray-400 text-xs sm:text-sm max-w-md text-center leading-relaxed mb-8">
            SECURITY BREACH OR VOLUNTARY BYPASS OVERRIDE DETECTED. ALL LOCAL TERMINAL MEMORY BUFFERS ARE BEING PURGED.
          </div>

          <div className="relative flex items-center justify-center w-32 h-32 border-2 border-dashed border-red-500 rounded-full mb-6">
            <div className="absolute inset-2 border border-red-500/30 rounded-full" />
            <span className="text-white text-5xl sm:text-6xl font-black tracking-tighter drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]">
              0{selfDestructCount}
            </span>
          </div>

          <div className="text-red-500 text-[10px] sm:text-xs tracking-wider animate-pulse">
            EMERGENCY KERNEL REBOOT INITIATED
          </div>
        </div>
      )}


    </>
  );
}
