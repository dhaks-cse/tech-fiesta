import { Workshop } from "@/types";

// Tech Fiesta 2.0: The Odyssey Workshops
export const workshops: Workshop[] = [
  {
    id: 1,
    title: "Orchestration of Multi-Agent Systems in Production",
    category: "Artificial Intelligence",
    level: "Advanced" as const,
    duration: "2 - 3 hours",
    date: "2026-08-07",
    time: "9:00 AM - 1:00 PM",
    venue: "AI Innovation Lab",
    instructor: "AI Systems Architect",
    description:
      "Explore how modern multi-agent AI systems are designed and operated at scale using distributed systems principles. Learn agent coordination, scheduling, state management, fault tolerance, observability, and production limitations while examining frameworks like Ray for scalable agent workflows.",
    prerequisites: [
      "Basic Python knowledge",
      "Understanding of AI concepts",
      "Interest in distributed systems",
    ],
    materials: ["Laptop", "Python Environment", "Workshop Resources"],
    capacity: 100,
    registrations: 0,
    price: "₹101",
    tags: [
      "Multi-Agent AI",
      "Distributed Systems",
      "Ray",
      "LLM Agents",
      "Production AI",
    ],
    syllabus: [
      "Introduction to Multi-Agent Systems",
      "Agent Coordination and Communication",
      "Task Scheduling and Workflow Management",
      "State Management and Memory Architectures",
      "Fault Tolerance in Agent Ecosystems",
      "Observability and Monitoring",
      "Scaling Agents with Ray Framework",
      "Production Challenges and Best Practices",
    ],
  },

  {
    id: 2,
    title: "Raspberry Pi, Linux and OpenCV: Building Intelligent Vision Systems",
    category: "Computer Vision",
    level: "Beginner" as const,
    duration: "2 - 3 hours",
    date: "2026-08-07",
    time: "9:00 AM - 1:00 PM",
    venue: "Embedded Systems Lab",
    instructor: "Computer Vision Engineer",
    description:
      "Discover how Raspberry Pi, Linux, and OpenCV work together to power intelligent systems. Learn Linux fundamentals, SSH-based remote access, image processing techniques, and practical computer vision applications used in automation and AI-driven solutions.",
    prerequisites: [
      "Basic programming knowledge",
      "Interest in embedded systems",
    ],
    materials: [
      "Laptop",
      "Raspberry Pi Kit",
      "OpenCV Setup",
      "Workshop Manual",
    ],
    capacity: 93,
    registrations: 0,
    price: "₹101",
    tags: [
      "Raspberry Pi",
      "Linux",
      "OpenCV",
      "Computer Vision",
      "Embedded AI",
    ],
    syllabus: [
      "Introduction to Raspberry Pi Ecosystem",
      "Linux Fundamentals and Command Line Operations",
      "Remote Access using SSH",
      "OpenCV Installation and Setup",
      "Image Processing Techniques",
      "Object Detection and Recognition",
      "Building Vision-Based Applications",
      "Industrial Use Cases and AI Integration",
    ],
  },

  {
    id: 3,
    title: "MLOps for RAG Applications",
    category: "AI/ML",
    level: "Intermediate" as const,
    duration: "2 - 3 hours",
    date: "2026-08-07",
    time: "9:00 AM - 1:00 PM",
    venue: "AI & Data Science Lab",
    instructor: "MLOps Engineer",
    description:
      "Dive into the fusion of Retrieval-Augmented Generation, Machine Learning, and DevOps to build production-ready AI systems. Learn embedding pipelines, deployment automation, monitoring, and scalable architectures for real-world applications.",
    prerequisites: [
      "Basic Python knowledge",
      "Fundamentals of Machine Learning",
    ],
    materials: [
      "Laptop",
      "Python Environment",
      "Cloud Access",
      "Workshop Resources",
    ],
    capacity: 100,
    registrations: 0,
    price: "₹101",
    tags: [
      "MLOps",
      "RAG",
      "LLMs",
      "Vector Databases",
      "DevOps",
    ],
    syllabus: [
      "Introduction to RAG Architectures",
      "Embeddings and Vector Databases",
      "Knowledge Retrieval Pipelines",
      "Building End-to-End AI Systems",
      "CI/CD for AI Applications",
      "Automated Deployment Strategies",
      "Monitoring and Observability",
      "Scaling Production RAG Systems",
    ],
  },

  {
    id: 4,
    title: "Building a Private Cloud with OpenStack",
    category: "Cloud Computing",
    level: "Intermediate" as const,
    duration: "2 - 3 hours",
    date: "2026-08-07",
    time: "9:00 AM - 1:00 PM",
    venue: "Cloud Computing Lab",
    instructor: "Cloud Solutions Architect",
    description:
      "Learn cloud computing fundamentals and build a private cloud infrastructure using OpenStack. Gain hands-on experience deploying virtual machines, managing cloud services, and understanding scalable enterprise cloud architectures.",
    prerequisites: [
      "Basic Linux knowledge",
      "Networking fundamentals",
    ],
    materials: [
      "Laptop",
      "Virtualization Environment",
      "Workshop Resources",
    ],
    capacity: 100,
    registrations: 0,
    price: "₹101",
    tags: [
      "OpenStack",
      "Private Cloud",
      "Virtualization",
      "Cloud Infrastructure",
      "DevOps",
    ],
    syllabus: [
      "Introduction to Cloud Computing",
      "OpenStack Architecture Overview",
      "Core Components of OpenStack",
      "Deploying Virtual Machines",
      "Managing Cloud Resources",
      "Storage and Networking Services",
      "Security in Private Clouds",
      "Enterprise Cloud Use Cases",
    ],
  },

  {
    id: 5,
    title: "Blockchains and Smart Contracts: Building the Decentralized Web",
    category: "Blockchain",
    level: "Beginner" as const,
    duration: "2 - 3 hours",
    date: "2026-08-07",
    time: "9:00 AM - 1:00 PM",
    venue: "Blockchain Innovation Lab",
    instructor: "Blockchain Developer",
    description:
      "Gain a practical introduction to blockchain technology and smart contracts. Explore distributed ledgers, consensus mechanisms, cryptographic hashing, and decentralized applications that are transforming industries worldwide.",
    prerequisites: [
      "Basic programming knowledge",
      "Interest in emerging technologies",
    ],
    materials: [
      "Laptop",
      "Blockchain Test Network Access",
      "Workshop Resources",
    ],
    capacity: 100,
    registrations: 0,
    price: "₹101",
    tags: [
      "Blockchain",
      "Smart Contracts",
      "Web3",
      "Cryptography",
      "Decentralized Applications",
    ],
    syllabus: [
      "Introduction to Blockchain Technology",
      "Distributed Ledgers and Consensus Mechanisms",
      "Cryptographic Hashing Fundamentals",
      "Smart Contract Development Concepts",
      "Decentralized Application Architecture",
      "Blockchain Security Best Practices",
      "Industry Applications and Case Studies",
      "Future of Web3 Ecosystems",
    ],
  },
];
// Helper functions
export const getWorkshopsByCategory = (category: string): Workshop[] =>
  workshops.filter((workshop) => workshop.category === category);

export const getWorkshopsByLevel = (
  level: "Beginner" | "Intermediate" | "Advanced"
): Workshop[] => workshops.filter((workshop) => workshop.level === level);

export const getWorkshopById = (id: number): Workshop | undefined =>
  workshops.find((workshop) => workshop.id === id);

export const getAvailableWorkshops = (): Workshop[] =>
  workshops.filter(
    (workshop) => (workshop?.registrations ?? 0) < (workshop.capacity ?? 0)
  );

export const getWorkshopCategories = (): string[] => [
  ...new Set(workshops.map((workshop) => workshop.category)),
];

export const getWorkshopLevels = (): (
  | "Beginner"
  | "Intermediate"
  | "Advanced"
)[] =>
  [...new Set(workshops.map((workshop) => workshop.level))].filter(
    (level): level is "Beginner" | "Intermediate" | "Advanced" =>
      level !== undefined
  );
