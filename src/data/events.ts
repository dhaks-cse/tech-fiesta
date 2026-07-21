import { Event } from "@/types";

// Tech Fiesta 2.0: The Odyssey Events
export const events: Event[] = [
  // Technical Events
  {
    id: 1,
    title: "Paper Presentation",
    type: "tech" as const,
    date: "2026-08-07",
    time: "10:00 AM - 4:00 PM",
    venue: "Main Auditorium",
    description:
      "Participants present innovative technical ideas, research work, or project concepts before a panel of judges. Evaluation is based on originality, technical depth, presentation skills, and clarity of explanation.",
    speakers: ["Faculty Panel"],
    capacity: 60,
    registrations: 0,
    tags: ["Presentation", "Research", "Innovation"],
    image: "/images/project-presentation.jpg",
    price: "₹70",
    maxTeamSize: 2,
    rulebookPath: "/rules/events/1.md",
    coordinators: [
      { name: "Coordinator", phone: "+91 73055 04045" }
    ],
  },

  {
    id: 2,
    title: "Tech Survivor – Elimination Arena",
    type: "tech" as const,
    date: "2026-08-07",
    time: "10:00 AM - 4:00 PM",
    venue: "Programming Lab",
    description:
      "A multi-round competition featuring technical quizzes, logical reasoning, debugging tasks, coding rounds, and surprise challenges. Participants are eliminated round by round until only one survivor remains.",
    speakers: ["Technical Mentors"],
    capacity: 60,
    registrations: 0,
    tags: ["Quiz", "Coding", "Debugging", "Logic"],
    image: "/images/prompt-engineering.jpg",
    price: "₹70",
    maxTeamSize: 1,
    coordinators: [
      { name: "Coordinator", phone: "+91 94883 63352" }
    ],
  },
   {
  id: 3,
  title: "UI Challenge – Design the Future",
  type: "tech" as const,
  date: "2026-08-07",
  time: "10:00 AM - 1:00 PM",
  venue: "Design Lab",
  description:
    "UI Challenge is a fast-paced design sprint where participants create a user-friendly and visually appealing interface based on a given problem statement. Using tools such as Figma, teams must design key screens, user flows, and a functional prototype within a limited time. Example challenge: Design a Smart Parking Application for a Smart City.",
  speakers: ["Design Mentors"],
  capacity: 60,
  registrations: 0,
  tags: [
    "UI/UX",
    "Figma",
    "Prototype",
    "User Flow",
    "Design Sprint",
    "Product Thinking"
  ],
  image: "/images/ui-challenge.jpg",
  price: "₹70",
  maxTeamSize: 3,
  minTeamSize: 2,
  coordinators: [
    { name: "Coordinator", phone: "+91 99408 19044" }
  ],
},

  {
    id: 4,
    title: "Common Coding Challenge",
    type: "tech" as const,
    date: "2026-08-07",
    time: "11:00 AM - 1:00 PM",
    venue: "Programming Lab",
    description:
      "A common coding challenge open to all skill levels. Participants solve a curated set of programming problems covering fundamental data structures, algorithms, and logic. Race against time and peers to achieve the highest score and claim the top spot on the leaderboard.",
    speakers: ["Programming Mentors"],
    capacity: 60,
    registrations: 0,
    tags: ["Coding", "Algorithms", "Data Structures", "Competition"],
    image: "/images/reverse-code.jpg",
    price: "₹70",
    maxTeamSize: 1,
    rulebookPath: "/rules/events/4.md",
    coordinators: [
      { name: "Coordinator", phone: "+91 63830 28618" }
    ],
  },

  {
    id: 5,
    title: "Hack The Campus",
    type: "tech" as const,
    date: "2026-08-07",
    time: "9:00 AM - 3:00 PM",
    venue: "Campus Wide",
    description:
      "An AR and QR based cyber treasure hunt where participants solve coding puzzles, encrypted clues, cybersecurity challenges, hidden website tasks, and AR missions across the campus.",
    speakers: ["Event Coordinators"],
    capacity: 60,
    registrations: 0,
    tags: ["Cybersecurity", "AR", "QR", "Treasure Hunt"],
    image: "/images/escape-room.jpg",
    price: "₹70",
    maxTeamSize: 4,
    rulebookPath: "/rules/events/5.md",
    coordinators: [
      { name: "Coordinator", phone: "+91 80156 48112" }
    ],
  },

  {
    id: 6,
    title: "Tech Debate",
    type: "tech" as const,
    date: "2026-08-07",
    time: "2:00 PM - 4:00 PM",
    venue: "Seminar Hall",
    description:
      "Participants debate trending technology topics such as AI, cybersecurity, startups, coding culture, social media, and future technologies. The event focuses on critical thinking, communication, and technical awareness.",
    speakers: ["Moderators"],
    capacity: 60,
    registrations: 0,
    tags: ["Debate", "Technology", "Communication"],
    image: "/images/try-if-you-can.jpg",
    price: "₹70",
    maxTeamSize: 1,
    coordinators: [
      { name: "Coordinator", phone: "+91 81222 03431" }
    ],
  },

  // Non-Technical Events
  {
    id: 7,
    title: "Chess Championship",
    type: "non-tech" as const,
    date: "2026-08-07",
    time: "10:00 AM - 5:00 PM",
    venue: "Seminar Hall",
    description:
      "Individual chess competition featuring an online qualifier round followed by an offline final round using a physical chess board.",
    speakers: ["Event Coordinators"],
    capacity: 60,
    registrations: 0,
    tags: ["Chess", "Strategy", "Competition"],
    image: "/images/photography.jpg",
    price: "₹50",
    maxTeamSize: 1,
    rulebookPath: "/rules/events/7.md",
    coordinators: [
      { name: "Coordinator", phone: "+91 70223 65387" }
    ],
  },

  {
    id: 8,
    title: "Best Meme Creation",
    type: "non-tech" as const,
    date: "2026-08-07",
    time: "2:00 PM - 4:00 PM",
    venue: "Media Hall",
    description:
      "Create the funniest and most creative meme based on the events happening during Tech Fiesta. Originality and relevance matter the most.",
    speakers: ["Judges Panel"],
    capacity: 60,
    registrations: 0,
    tags: ["Meme", "Creativity", "Humor"],
    image: "/images/channel-surfing.jpg",
    price: "₹50",
    maxTeamSize: 1,
    rulebookPath: "/rules/events/8.md",
    coordinators: [
      { name: "Coordinator", phone: "+91 861 099 7831" }
    ],
  },

  {
    id: 9,
    title: "Missing Lyrics",
    type: "non-tech" as const,
    date: "2026-08-07",
    time: "11:00 AM - 1:00 PM",
    venue: "Entertainment Hall",
    description:
      "Teams identify missing lyrics and recognize songs from background music tracks in a fun musical challenge.",
    speakers: ["Music Coordinators"],
    capacity: 60,
    registrations: 0,
    tags: ["Music", "Lyrics", "Team Event"],
    image: "/images/spin-a-yarn.jpg",
    price: "₹50",
    maxTeamSize: 4,
    minTeamSize: 1,
    rulebookPath: "/rules/events/9.md",
    coordinators: [
      { name: "Coordinator", phone: "+91 90946 90330" }
    ],
  },

  {
    id: 10,
    title: "Murder Mystery",
    type: "non-tech" as const,
    date: "2026-08-07",
    time: "2:00 PM - 5:00 PM",
    venue: "Activity Hall",
    description:
      "Teams investigate clues, analyze suspects, and solve a fictional crime scene before time runs out.",
    speakers: ["Event Coordinators"],
    capacity: 60,
    registrations: 0,
    tags: ["Mystery", "Investigation", "Teamwork"],
    image: "/images/channel-surfing.jpg",
    price: "₹50",
    maxTeamSize: 4,
    minTeamSize: 1,
    rulebookPath: "/rules/events/10.md",
    coordinators: [
      { name: "Coordinator 1", phone: "+91 733 890 0963" },
      { name: "Coordinator 2", phone: "+91 96772 32003" }
    ],
  },

  {
    id: 11,
    title: "Wiki Surfers",
    type: "non-tech" as const,
    date: "2026-08-07",
    time: "10:00 AM - 12:00 PM",
    venue: "Computer Lab",
    description:
      "Teams race from one Wikipedia page to another using only internal Wikipedia links. Fastest navigation with the fewest clicks wins.",
    speakers: ["Event Coordinators"],
    capacity: 60,
    registrations: 0,
    tags: ["Wikipedia", "Navigation", "Strategy"],
    image: "/images/photography.jpg",
    price: "₹50",
    maxTeamSize: 2,
    minTeamSize: 1,
    rulebookPath: "/rules/events/11.md",
    coordinators: [
      { name: "Coordinator", phone: "+91 73055 04045" }
    ],
  },

  {
    id: 12,
    title: "Adzap",
    type: "non-tech" as const,
    date: "2026-08-07",
    time: "2:00 PM - 4:00 PM",
    venue: "Main Auditorium",
    description:
      "Teams promote and sell a quirky or imaginary product through a creative advertisement performance filled with humor and innovation.",
    speakers: ["Judges Panel"],
    capacity: 60,
    registrations: 0,
    tags: ["Marketing", "Creativity", "Performance"],
    image: "/images/channel-surfing.jpg",
    price: "₹50",
    maxTeamSize: 4,
    minTeamSize: 4,
    rulebookPath: "/rules/events/12.md",
    coordinators: [
      { name: "Coordinator 1", phone: "+91 8072 246 835" },
      { name: "Coordinator 2", phone: "+91 81222 03431" }
    ],
  },
];

// Helper functions
export const getTechEvents = (): Event[] =>
  events.filter((event) => event.type === "tech");
export const getNonTechEvents = (): Event[] =>
  events.filter((event) => event.type === "non-tech");
export const getEventById = (id: number): Event | undefined =>
  events.find((event) => event.id === id);
export const getUpcomingEvents = (): Event[] => {
  const today = new Date();
  return events.filter((event) => new Date(event.date) >= today);
};
