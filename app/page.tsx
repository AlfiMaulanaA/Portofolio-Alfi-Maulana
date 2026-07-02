"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Code2,
  Cpu,
  Download,
  ExternalLink,
  Github,
  GraduationCap,
  GitFork,
  Mail,
  MapPin,
  Menu,
  Moon,
  Network,
  Phone,
  ShieldCheck,
  Star,
  Sun,
  Wrench,
  X,
} from "lucide-react";
import {
  SiAmazonwebservices,
  SiC,
  SiCplusplus,
  SiDotnet,
  SiFlutter,
  SiJavascript,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiPython,
  SiReact,
  SiSharp,
  SiTailwindcss,
  SiTypescript,
} from "react-icons/si";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const navItems = [
  { label: "Work", href: "#work" },
  { label: "GitHub", href: "#github" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Experience", href: "#experience" },
  { label: "Skills", href: "#skills" },
  { label: "Certificates", href: "#certificates" },
  { label: "Contact", href: "#contact" },
];

const metrics = [
  { value: "25+", label: "Delivered projects" },
  { value: "5+", label: "Years engineering" },
  { value: "100+", label: "Client interactions" },
  { value: "26", label: "Mapped skill areas" },
];

const selectedWorks = [
  {
    title: "PROMIE - Procurement Management System",
    type: "Procurement Platform",
    description:
      "Procurement management interface for handling purchasing workflows, request tracking, vendor coordination, and approval visibility.",
    image: "/images/Promise.png",
    tags: ["Procurement", "Management", "Workflow"],
    href: "https://github.com/AlfiMaulanaA",
  },
  {
    title: "Document Management System",
    type: "Enterprise Web App",
    description:
      "Document workflow interface for organizing, tracking, and managing operational files in a structured business system.",
    image: "/images/DocumentManagementSystem.png",
    tags: ["Document", "Workflow", "Dashboard"],
    href: "https://github.com/AlfiMaulanaA",
  },
  {
    title: "Indoor Tracking APTWR - UWB",
    type: "Indoor Positioning",
    description:
      "UWB-based indoor tracking interface for visualizing device position, zone activity, and realtime asset movement.",
    image: "/images/IndoorTrackingAPTWR-UWB.png",
    tags: ["UWB", "IoT", "Tracking"],
    href: "https://github.com/AlfiMaulanaA",
  },
  {
    title: "Containment Monitoring",
    type: "Data Center IoT",
    description:
      "Monitoring interface for containment environments with operational status, hardware signals, and field-ready dashboards.",
    image: "/images/Containment.png",
    tags: ["IoT", "Dashboard", "Monitoring"],
    href: "https://github.com/AlfiMaulanaA/Palm-Containment",
  },
  {
    title: "Biometrics Palm & Face Recognition",
    type: "Security System",
    description:
      "Biometric access concept combining palm and face recognition workflows for secure identity verification.",
    image: "/images/BiometricsPalm&FaceRecognition.png",
    tags: ["Security", "Computer Vision", "Integration"],
    href: "https://github.com/AlfiMaulanaA/SecurityDoorPYZK",
  },
  {
    title: "OCR Apps",
    type: "Document Processing",
    description:
      "OCR-focused application interface for converting image documents into structured text and reviewable outputs.",
    image: "/images/OCR-Apps.png",
    tags: ["OCR", "Web App", "Automation"],
    href: "https://github.com/AlfiMaulanaA",
  },
  {
    title: "POS Coffee Shop Cafe",
    type: "Business Application",
    description:
      "Point-of-sale interface for cafe operations with product, order, and transaction-oriented screens.",
    image: "/images/POS-CoffeeShopCafe.png",
    tags: ["POS", "Operations", "UI"],
    href: "https://github.com/AlfiMaulanaA",
  },
  {
    title: "NextNode Apps",
    type: "Full-Stack Platform",
    description:
      "Full-stack application work using modern web architecture for front-end experiences and backend services.",
    image: "/images/NextNode-Apps.png",
    tags: ["Next.js", "Node.js", "API"],
    href: "https://github.com/AlfiMaulanaA/Next-NodeApps",
  },
  {
    title: "Landing Experience",
    type: "Product Interface",
    description:
      "Polished landing page interface used as a front door for products, portfolios, or technical service offerings.",
    image: "/images/Landing.png",
    tags: ["Frontend", "Responsive", "Design"],
    href: "https://github.com/AlfiMaulanaA/Portofolio-Alfi-Maulana",
  },
];

const capabilities = [
  {
    icon: Cpu,
    title: "IoT System Development",
    description:
      "Sensor integration, gateways, realtime telemetry, and dashboards for industrial and smart environments.",
    points: ["Hardware-software integration", "MQTT and realtime data", "Monitoring dashboards"],
  },
  {
    icon: Code2,
    title: "Full-Stack Web Development",
    description:
      "Responsive applications with clear information architecture, API integration, and maintainable frontend systems.",
    points: ["React and Next.js", "TypeScript and REST APIs", "Database-backed workflows"],
  },
  {
    icon: Wrench,
    title: "Industrial Automation",
    description:
      "Automation foundations from PLC, SCADA, HMI, wiring, and field troubleshooting for operational systems.",
    points: ["PLC and HMI workflows", "Electrical systems", "Control system support"],
  },
  {
    icon: ShieldCheck,
    title: "Custom Software Solutions",
    description:
      "Purpose-built software for business operations, security use cases, and systems that connect teams with equipment.",
    points: ["Enterprise tools", "System integration", "Security-aware implementation"],
  },
];

const experiences = [
  {
    role: "Lead, IoT Department / Software Engineer",
    company: "PT Graha Sumber Prima Elektronik",
    period: "2022 - Present",
    description:
      "Leading IoT software development, system architecture, hardware-software integration, and solution delivery for operational environments.",
  },
  {
    role: "Data Center Project Contributor",
    company: "Containment Systems & Lithium Battery Monitoring",
    period: "Project Experience",
    description:
      "Hands-on experience across data center projects, especially containment monitoring, lithium battery monitoring, and automation integration.",
  },
  {
    role: "Warehouse Operations Intern",
    company: "PT Gajah Tunggal",
    period: "Internship",
    description:
      "Supported logistics and administrative processes, building practical awareness of operational workflows.",
  },
];

const education = [
  {
    school: "Vocational High School State 1 Cimahi",
    period: "2018 - 2022",
    focus: "Industrial Automation Engineering: PLC, electrical systems, and SCADA.",
  },
  {
    school: "South Tangerang Institute of Technology",
    period: "2023 - Present",
    focus: "Information Systems: software development and architecture.",
  },
];

const technicalSkills = [
  { name: "React", value: 90, icon: SiReact },
  { name: "Next.js", value: 85, icon: SiNextdotjs },
  { name: "TypeScript", value: 80, icon: SiTypescript },
  { name: "JavaScript", value: 85, icon: SiJavascript },
  { name: "Node.js", value: 75, icon: SiNodedotjs },
  { name: "Python", value: 85, icon: SiPython },
  { name: "C#", value: 80, icon: SiSharp },
  { name: ".NET", value: 85, icon: SiDotnet },
  { name: "PostgreSQL", value: 70, icon: SiPostgresql },
  { name: "AWS", value: 65, icon: SiAmazonwebservices },
  { name: "C", value: 70, icon: SiC },
  { name: "C++", value: 75, icon: SiCplusplus },
  { name: "Flutter", value: 65, icon: SiFlutter },
  { name: "Tailwind CSS", value: 90, icon: SiTailwindcss },
];

const engineeringSkills = [
  "PLC",
  "HMI",
  "Electrical",
  "Networking",
  "Hardware",
  "Technical Drawing",
  "Wiring",
  "Measuring Electrical Tools",
  "Excel",
  "PowerPoint",
  "Google Docs",
  "English",
  "Indonesian",
];

const certificates = [
  {
    title: "Raspberry Pi Certificate",
    issuer: "Johns Hopkins University",
    image: "/certificate/image/RaspberyPi Johns Hopkins University.jpeg",
    href: "https://coursera.org/share/f7cb3bef6f7d3456b602425de5a2a36d",
  },
  {
    title: "Cyber Security Certificate",
    issuer: "Google",
    image: "/certificate/image/CyberSecuriity.jpeg",
    href: "https://coursera.org/share/62a32afce41e0f8325632a0a3eb1c0ea",
  },
  {
    title: "UX Designer Certificate",
    issuer: "Google",
    image: "/certificate/image/UX Designer Google.jpeg",
    href: "https://coursera.org/share/3c65b6d4add64d427e8d9cafe17b5a68",
  },
  {
    title: "Computer Vision Azure Cognitive Service",
    issuer: "Microsoft",
    image: "/certificate/image/Computer Vision Azure Cognitive Service MIcrosoft.jpeg",
    href: "https://coursera.org/share/08555c8c95a622a87305b1e700fe203e",
  },
  {
    title: "Azure IoT Hub Certificate",
    issuer: "Coursera",
    image: "/certificate/image/Azure_IOT_HUB_Coursera.jpeg",
    href: "https://coursera.org/share/2fa261f01fdc698d3a269a8fb4b8a00f",
  },
];

const repositories = [
  ["QuickBom", "TypeScript", "https://github.com/AlfiMaulanaA/QuickBom"],
  ["KiniBusApps", "Java", "https://github.com/AlfiMaulanaA/KiniBusApps"],
  ["RentCarApps-Java", "Java", "https://github.com/AlfiMaulanaA/RentCarApps-Java"],
  ["ESP32-MicroStation-Box", "C", "https://github.com/AlfiMaulanaA/ESP32-MicroStation-Box"],
  ["E-Attendace", "Vue", "https://github.com/AlfiMaulanaA/E-Attendace"],
  ["motor_payment_app", "PHP", "https://github.com/AlfiMaulanaA/motor_payment_app"],
];

type GitHubRepository = {
  name: string;
  description: string | null;
  language: string;
  stars: number;
  forks: number;
  url: string;
  updatedAt: string;
};

type ContributionDay = {
  date: string;
  count: number;
  level: "NONE" | "FIRST_QUARTILE" | "SECOND_QUARTILE" | "THIRD_QUARTILE" | "FOURTH_QUARTILE";
  color: string;
};

type GitHubData = {
  profile: {
    name: string;
    username: string;
    bio: string;
    avatar: string;
    location: string | null;
    website: string | null;
    url: string;
  };
  repositories: GitHubRepository[];
  contributions: {
    year: number;
    total: number;
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
    calendar: ContributionDay[];
  };
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10 max-w-3xl">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-300">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-md bg-zinc-950 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
              AM
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                Portfolio
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Preparing experience</p>
            </div>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Alfi Maulana Al-Farisi
          </h1>
          <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full w-2/3 rounded-full bg-emerald-700 dark:bg-emerald-300"
              style={{ animation: "loading-bar 1s ease-in-out infinite" }}
            />
          </div>
          <style jsx global>{`
            @keyframes loading-bar {
              0% {
                transform: translateX(-110%);
              }
              100% {
                transform: translateX(170%);
              }
            }
          `}</style>
        </div>
      </div>
    </main>
  );
}

function AnimatedSection({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.18,
        rootMargin: "-8% 0px -10% 0px",
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`${className ?? ""} transform-gpu transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:blur-0 ${
        isVisible ? "translate-y-0 scale-100 opacity-100 blur-0" : "translate-y-8 scale-[0.985] opacity-0 blur-[2px]"
      }`}
    >
      {children}
    </section>
  );
}

function contributionLevelClass(level: ContributionDay["level"]) {
  switch (level) {
    case "FOURTH_QUARTILE":
      return "bg-emerald-700 dark:bg-emerald-300";
    case "THIRD_QUARTILE":
      return "bg-emerald-600 dark:bg-emerald-400";
    case "SECOND_QUARTILE":
      return "bg-emerald-400 dark:bg-emerald-600";
    case "FIRST_QUARTILE":
      return "bg-emerald-200 dark:bg-emerald-800";
    default:
      return "bg-zinc-100 dark:bg-zinc-800";
  }
}

export default function Portfolio() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [introLoading, setIntroLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [githubData, setGithubData] = useState<GitHubData | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubLoading, setGithubLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const introTimer = window.setTimeout(() => {
      setIntroLoading(false);
    }, 950);

    let ignore = false;
    async function loadGitHub() {
      try {
        const response = await fetch("/api/github", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load GitHub data");
        }
        if (!ignore) {
          setGithubData(payload);
          setGithubError(null);
        }
      } catch (error) {
        if (!ignore) {
          setGithubError(error instanceof Error ? error.message : "Failed to load GitHub data");
        }
      } finally {
        if (!ignore) {
          setGithubLoading(false);
        }
      }
    }

    loadGitHub();

    return () => {
      window.clearTimeout(introTimer);
      ignore = true;
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted || introLoading) {
    return <LoadingScreen />;
  }

  const githubRepositories =
    githubData?.repositories ??
    repositories.map(([name, language, url]) => ({
      name,
      language,
      url,
      description: null,
      stars: 0,
      forks: 0,
      updatedAt: "",
    }));
  const activeContributionDays = githubData?.contributions.calendar.filter((day) => day.count > 0) ?? [];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-zinc-50/92 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/92">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#" className="group flex items-center gap-3" aria-label="Back to top">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-950 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
              AM
            </span>
            <span>
              <span className="block text-sm font-semibold leading-5">Alfi Maulana</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                IoT Engineer / Software Developer
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden rounded-md sm:inline-flex">
              <a href="#contact">Start a Project</a>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-md"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-md lg:hidden"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
            <nav className="mx-auto grid max-w-7xl gap-1" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

      <AnimatedSection className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <Badge className="mb-6 w-fit rounded-md bg-emerald-50 px-3 py-1 text-emerald-800 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-200">
              Available for IoT, automation, and full-stack projects
            </Badge>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-6xl">
              Alfi Maulana Al-Farisi
            </h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-zinc-700 dark:text-zinc-300">
              IoT Engineer and Software Developer building practical systems that connect hardware,
              software, and operational workflows.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-md">
                <a href="mailto:alfimaulana2003@gmail.com">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Me
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-md">
                <a href="/cv/CV 2024.docx" download>
                  <Download className="mr-2 h-4 w-4" />
                  Download CV
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-md">
                <a href="https://github.com/AlfiMaulanaA" target="_blank" rel="noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>

          <div>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <button
                type="button"
                className="block w-full"
                onClick={() => setSelectedImage("/hero.jpeg")}
                aria-label="Open containment project preview"
              >
                <img
                  src="/hero.jpeg"
                  alt="Containment monitoring dashboard preview"
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
              <div className="grid gap-4 border-t border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="text-2xl font-semibold text-zinc-950 dark:text-white">{metric.value}</div>
                    <div className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-400">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="github" className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="GitHub Live Data"
            title="Profile, repositories, and contribution activity from GitHub GraphQL."
            description="Data ini diambil melalui internal API route dari GitHub GraphQL contributionsCollection, sehingga token tetap berada di server."
          />

          {githubError ? (
            <Card className="rounded-lg border-red-200 bg-red-50 shadow-none dark:border-red-900 dark:bg-red-950">
              <CardContent className="p-5 text-sm text-red-700 dark:text-red-200">
                GitHub data belum bisa dimuat: {githubError}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <Card className="rounded-lg border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {githubData?.profile.avatar ? (
                      <img
                        src={githubData.profile.avatar}
                        alt={`${githubData.profile.username} avatar`}
                        className="h-16 w-16 rounded-full border border-zinc-200 dark:border-zinc-700"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-950 dark:text-white">
                        {githubData?.profile.name ?? "Loading GitHub profile"}
                      </h3>
                      <a
                        href={githubData?.profile.url ?? "https://github.com/AlfiMaulanaA"}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                      >
                        <Github className="h-4 w-4" />
                        @{githubData?.profile.username ?? "AlfiMaulanaA"}
                      </a>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {githubData?.profile.bio ?? "Mengambil bio dari GitHub..."}
                  </p>

                  <div className="mt-5 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-zinc-400" />
                      {githubData?.profile.location ?? "Location not set"}
                    </div>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-zinc-400" />
                      {githubData?.profile.website ? (
                        <a href={githubData.profile.website} target="_blank" rel="noreferrer" className="hover:underline">
                          {githubData.profile.website}
                        </a>
                      ) : (
                        "Website not set"
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    ["Total", githubData?.contributions.total, `${githubData?.contributions.year ?? 2026} contributions`],
                    ["Commits", githubData?.contributions.commits, "commit contributions"],
                    ["Pull Requests", githubData?.contributions.pullRequests, "opened PRs"],
                    ["Issues", githubData?.contributions.issues, "opened issues"],
                    ["Reviews", githubData?.contributions.reviews, "PR reviews"],
                  ].map(([label, value, caption]) => (
                    <Card key={label as string} className="rounded-lg border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
                        <p className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">
                          {githubLoading ? "-" : value ?? 0}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{caption}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="rounded-lg border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">Contribution Calendar</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {activeContributionDays.length} active days in {githubData?.contributions.year ?? 2026}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>Less</span>
                        <span className="h-3 w-3 rounded-sm bg-zinc-100 dark:bg-zinc-800" />
                        <span className="h-3 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-800" />
                        <span className="h-3 w-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
                        <span className="h-3 w-3 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
                        <span className="h-3 w-3 rounded-sm bg-emerald-700 dark:bg-emerald-300" />
                        <span>More</span>
                      </div>
                    </div>

                    <div className="mt-5 overflow-x-auto pb-2">
                      <div className="grid min-w-[720px] grid-flow-col grid-rows-7 gap-1">
                        {(githubData?.contributions.calendar ?? Array.from({ length: 365 })).map((day, index) => {
                          const contributionDay = day as ContributionDay | undefined;
                          return (
                            <div
                              key={contributionDay?.date ?? index}
                              title={
                                contributionDay
                                  ? `${contributionDay.date}: ${contributionDay.count} contributions`
                                  : "Loading"
                              }
                              className={`h-3 w-3 rounded-sm ${contributionLevelClass(contributionDay?.level ?? "NONE")}`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {activeContributionDays.length > 0 ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {activeContributionDays.slice(0, 12).map((day) => (
                          <Badge key={day.date} variant="outline" className="rounded-md border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950">
                            {day.date}: {day.count}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </AnimatedSection>

      <AnimatedSection id="work" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div>
          <SectionHeading
            eyebrow="Selected Work"
            title="Project interfaces built around real operational needs."
            description="The portfolio now uses available project screenshots from the app assets, so visitors can inspect actual work instead of generic placeholders."
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {selectedWorks.map((work) => (
              <Card
                key={work.title}
                className="group overflow-hidden rounded-lg border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <button
                  type="button"
                  onClick={() => setSelectedImage(work.image)}
                  className="block w-full overflow-hidden border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <img
                    src={work.image}
                    alt={`${work.title} preview`}
                    className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </button>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{work.type}</p>
                      <h3 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-white">{work.title}</h3>
                    </div>
                    <a
                      href={work.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-zinc-200 p-2 text-zinc-600 transition hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-white dark:hover:text-white"
                      aria-label={`Open ${work.title}`}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{work.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {work.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="rounded-md">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="capabilities" className="border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div>
            <SectionHeading
              eyebrow="Capabilities"
              title="A practical mix of hardware, software, and field delivery."
              description="The page now explains what Alfi can do in business terms, then supports it with concrete technical scope."
            />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {capabilities.map((capability) => (
                <Card key={capability.title} className="rounded-lg border-zinc-200 bg-zinc-50 shadow-none dark:border-zinc-800 dark:bg-zinc-900">
                  <CardContent className="p-6">
                    <capability.icon className="h-8 w-8 text-emerald-700 dark:text-emerald-300" />
                    <h3 className="mt-5 text-lg font-semibold text-zinc-950 dark:text-white">{capability.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{capability.description}</p>
                    <ul className="mt-5 space-y-3">
                      {capability.points.map((point) => (
                        <li key={point} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="experience" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div>
          <SectionHeading
            eyebrow="Experience"
            title="Engineering profile grounded in automation and product delivery."
          />
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              {experiences.map((item) => (
                <Card key={`${item.role}-${item.company}`} className="rounded-lg border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">{item.role}</h3>
                        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                          <Building2 className="h-4 w-4" />
                          {item.company}
                        </p>
                      </div>
                      <Badge variant="outline" className="w-fit rounded-md">
                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                        {item.period}
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="rounded-lg border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-7 w-7 text-emerald-700 dark:text-emerald-300" />
                  <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">Education</h3>
                </div>
                <div className="mt-6 space-y-6">
                  {education.map((item) => (
                    <div key={item.school} className="border-l border-zinc-200 pl-5 dark:border-zinc-700">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.period}</p>
                      <h4 className="mt-1 font-semibold text-zinc-950 dark:text-white">{item.school}</h4>
                      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.focus}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center gap-3">
                    <Award className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
                    <h3 className="font-semibold text-zinc-950 dark:text-white">Leadership</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    Karate-DO Head Coach, Karang Taruna public relations, class representative council creative team, and student council experience.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="skills" className="border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div>
            <SectionHeading
              eyebrow="Skills"
              title="Technical depth with a clear engineering support layer."
            />
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="grid gap-4 sm:grid-cols-2">
                {technicalSkills.map((skill) => (
                  <div key={skill.name} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <skill.icon className="h-6 w-6 text-zinc-800 dark:text-zinc-100" />
                        <span className="font-medium text-zinc-950 dark:text-white">{skill.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{skill.value}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div className="h-full rounded-full bg-emerald-700 dark:bg-emerald-400" style={{ width: `${skill.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <Card className="rounded-lg border-zinc-200 bg-zinc-50 shadow-none dark:border-zinc-800 dark:bg-zinc-900">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Network className="h-7 w-7 text-emerald-700 dark:text-emerald-300" />
                    <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">Engineering & Tools</h3>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {engineeringSkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="rounded-md border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="certificates" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div>
          <SectionHeading
            eyebrow="Certificates"
            title="Credentials that support IoT, security, UX, and cloud work."
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => (
              <Card key={certificate.title} className="group overflow-hidden rounded-lg border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setSelectedImage(certificate.image)}
                  className="block w-full overflow-hidden border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <img
                    src={certificate.image}
                    alt={`${certificate.title} certificate`}
                    className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </button>
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{certificate.issuer}</p>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-white">{certificate.title}</h3>
                  <Button asChild variant="outline" size="sm" className="mt-5 rounded-md">
                    <a href={certificate.href} target="_blank" rel="noreferrer">
                      View Credential
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div>
            <SectionHeading
              eyebrow="Repositories"
              title="Additional code work across web, IoT, and application development."
            />
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {githubRepositories.map((repo) => (
                <a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition hover:border-zinc-950 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-white dark:hover:bg-zinc-950"
                >
                  <span className="flex items-start justify-between gap-4">
                    <span>
                      <span className="block font-medium text-zinc-950 dark:text-white">{repo.name}</span>
                      <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
                        {repo.description || "No repository description"}
                      </span>
                    </span>
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-zinc-500" />
                  </span>
                  <span className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="rounded-md bg-white px-2 py-1 dark:bg-zinc-950">{repo.language}</span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5" />
                      {repo.stars}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GitFork className="h-3.5 w-3.5" />
                      {repo.forks}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="contact" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 rounded-xl border border-zinc-200 bg-zinc-950 p-6 text-white shadow-sm dark:border-zinc-800 md:grid-cols-[1fr_auto] md:p-8 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Contact</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
              Need an engineer who can connect software with real equipment?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              Discuss IoT systems, automation projects, dashboards, full-stack applications, or technical implementation support.
            </p>
          </div>
          <div className="flex min-w-64 flex-col justify-center gap-3">
            <Button asChild size="lg" className="rounded-md bg-white text-zinc-950 hover:bg-zinc-100">
              <a href="mailto:alfimaulana2003@gmail.com">
                <Mail className="mr-2 h-4 w-4" />
                alfimaulana2003@gmail.com
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-md border-zinc-600 bg-transparent text-white hover:bg-white hover:text-zinc-950">
              <a href="https://wa.me/6283116297507" target="_blank" rel="noreferrer">
                <Phone className="mr-2 h-4 w-4" />
                +62 831-1629-7507
              </a>
            </Button>
          </div>
        </div>
      </AnimatedSection>

      <footer className="border-t border-zinc-200 px-4 py-8 dark:border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-zinc-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Alfi Maulana Al-Farisi. Built with Next.js and Tailwind CSS.</p>
          <div className="flex gap-4">
            <a className="hover:text-zinc-950 dark:hover:text-white" href="https://github.com/AlfiMaulanaA" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a className="hover:text-zinc-950 dark:hover:text-white" href="mailto:alfimaulana2003@gmail.com">
              Email
            </a>
            <a className="hover:text-zinc-950 dark:hover:text-white" href="https://wa.me/6283116297507" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        </div>
      </footer>

      <Dialog open={Boolean(selectedImage)} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-6xl border-zinc-800 bg-black p-0">
          {selectedImage ? (
            <img src={selectedImage} alt="Fullscreen preview" className="max-h-[86vh] w-full rounded-md object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
