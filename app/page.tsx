'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Github, ExternalLink, Mail, PersonStanding, Code, Briefcase, MessageCircle, Moon, Sun, Star, Sparkles, Zap, SatelliteDish, Network, Database, Router, Cpu, Battery, Ruler, FileText, Languages, HardDrive, Server, Wrench, BookOpen, Calendar, Award, Target, Quote, Heart, Cpu as Chip, Smartphone, Layers, Cog, Shield, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import {
  SiNodedotjs,
  SiPython,
  SiTypescript,
  SiJavascript,
  SiNextdotjs,
  SiHtml5,
  SiTailwindcss,
  SiCss3,
  SiSharp,
  SiDotnet,
  SiPostgresql,
  SiAmazonwebservices,
  SiReact,
  SiC,
  SiCplusplus,
  SiFlutter
} from "react-icons/si";

// Floating Particles Component
const FloatingParticles = () => {
  const particles = Array.from({ length: 50 }, (_, i) => i);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full opacity-20"
          initial={{
            x: Math.random() * window?.innerWidth || 1920,
            y: Math.random() * window?.innerHeight || 1080,
            scale: 0,
          }}
          animate={{
            x: [null, Math.random() * 100 - 50, Math.random() * 100 - 50],
            y: [null, Math.random() * 100 - 50, Math.random() * 100 - 50],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
};

// Typing Effect Component
const TypingEffect = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [text, delay]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {displayText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-blue-400"
      >
        |
      </motion.span>
    </motion.span>
  );
};

export default function Portfolio() {
  const { theme, setTheme } = useTheme() || {};
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: {
      y: 50,
      opacity: 0,
      scale: 0.9,
      rotateX: -15
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.8
      }
    }
  };

  const heroVariants = {
    hidden: { opacity: 0, y: 100, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 1.2, staggerChildren: 0.3 }
    }
  };

  const techSkills = [
    { name: "React", icon: SiReact, level: 90, color: "text-blue-500" },
    { name: "React Native", icon: SiReact, level: 75, color: "text-blue-500" },
    { name: "Next.js", icon: SiNextdotjs, level: 85, color: "text-black dark:text-white" },
    { name: "JavaScript", icon: SiJavascript, level: 85, color: "text-yellow-500" },
    { name: "TypeScript", icon: SiTypescript, level: 80, color: "text-blue-600" },
    { name: "Node.js", icon: SiNodedotjs, level: 75, color: "text-green-600" },
    { name: "Python", icon: SiPython, level: 85, color: "text-blue-500" },
    { name: "C#", icon: SiSharp, level: 80, color: "text-purple-600" },
    { name: ".NET", icon: SiDotnet, level: 85, color: "text-purple-600" },
    { name: "Tailwind CSS", icon: SiTailwindcss, level: 90, color: "text-cyan-500" },
    { name: "PostgreSQL", icon: SiPostgresql, level: 70, color: "text-blue-700" },
    { name: "AWS", icon: SiAmazonwebservices, level: 65, color: "text-orange-600" },
    { name: "Networking", icon: Router, level: 80, color: "text-green-500" },
    { name: "C", icon: SiC, level: 70, color: "text-blue-600" },
    { name: "C++", icon: SiCplusplus, level: 75, color: "text-blue-700" },
    { name: "Flutter", icon: SiFlutter, level: 65, color: "text-blue-400" },
  ];

  const otherSkills = [
    { name: "Electrical", icon: Battery, level: 75, color: "text-yellow-600" },
    { name: "PLC", icon: Server, level: 80, color: "text-gray-600" },
    { name: "HMI", icon: Server, level: 75, color: "text-indigo-600" },
    { name: "Measuring Electrical Tools", icon: Ruler, level: 70, color: "text-teal-600" },
    { name: "Hardware", icon: HardDrive, level: 80, color: "text-slate-600" },
    { name: "Technical Drawing", icon: Wrench, level: 85, color: "text-orange-600" },
    { name: "Wiring", icon: Zap, level: 80, color: "text-purple-600" },
    { name: "Excel", icon: FileText, level: 85, color: "text-green-600" },
    { name: "PowerPoint", icon: FileText, level: 80, color: "text-red-600" },
    { name: "Google Docs", icon: FileText, level: 85, color: "text-blue-500" },
    { name: "Indonesian", icon: Languages, level: 95, color: "text-red-500" },
    { name: "English", icon: Languages, level: 75, color: "text-blue-600" },
  ];

  const certificates = [
    {
      title: "Raspberry Pi Certificate - Johns Hopkins University",
      image: "/certificate/image/RaspberyPi Johns Hopkins University.jpeg",
      pdf: "/certificate/pdf/Sertificate_RaspberryPi_Johns Hopkins University.pdf",
      courseraLink: "https://coursera.org/share/f7cb3bef6f7d3456b602425de5a2a36d",
    },
    {
      title: "Cyber Security Certificate - Google",
      image: "/certificate/image/CyberSecuriity.jpeg",
      pdf: "#",
      courseraLink: "https://coursera.org/share/62a32afce41e0f8325632a0a3eb1c0ea",
    },
    {
      title: "UX Designer Certificate - Google",
      image: "/certificate/image/CyberSecuriity.jpeg",
      pdf: "#",
      courseraLink: "https://coursera.org/share/3c65b6d4add64d427e8d9cafe17b5a68",
    },
    {
      title: "CV Azure Certificate - Microsoft",
      image: "/certificate/image/Computer Vision Azure Cognitive Service MIcrosoft.jpeg",
      pdf: "#",
      courseraLink: "https://coursera.org/share/08555c8c95a622a87305b1e700fe203e",
    },
    {
      title: "Azure IoT Hub Certificate - Coursera",
      image: "/certificate/image/Azure_IOT_HUB_Coursera.jpeg",
      pdf: "#",
      courseraLink: "https://coursera.org/share/2fa261f01fdc698d3a269a8fb4b8a00f",
    },
    {
      title: "Other Certificate",
      image: "/placeholder.jpg",
      pdf: "#",
      courseraLink: "#",
    },
  ];

  const projects = [
    {
      title: "Landing Page Designs",
      description: "Modern and responsive landing pages for various business applications and websites.",
      tech: ["React", "Tailwind CSS", "Framer Motion", "Design"],
      github: "#",
      demo: "#",
      image: "/images/Landing.png"
    },
    {
      title: "E-Commerce Platform",
      description: "Full-stack e-commerce platform built with Next.js, Prisma, and Stripe integration.",
      tech: ["Next.js", ".Net", "Tailwind"],
      github: "#",
      demo: "#",
      image: "/placeholder.jpg"
    },
    {
      title: "Task Management App",
      description: "Collaborative task management application with real-time updates using WebSockets.",
      tech: ["React", "Node.js", "Socket.io", "MongoDB"],
      github: "#",
      demo: "#",
      image: "/placeholder.jpg"
    },
    {
      title: "AI Chatbot",
      description: "Intelligent chatbot powered by OpenAI GPT with natural language processing capabilities.",
      tech: ["Python", "FastAPI", "OpenAI", "Redis"],
      github: "#",
      demo: "#",
      image: "/placeholder.jpg"
    },
    {
      title: "OCR Applications",
      description: "Optical Character Recognition system for document processing and text extraction with high accuracy.",
      tech: ["Python", "OpenCV", "Tesseract", "Flask"],
      github: "#",
      demo: "#",
      image: "/images/OCR-Apps.png"
    },
    {
      title: "Biometric Palm & Face Recognition",
      description: "IoT-enabled biometric authentication system using palm and face recognition technologies.",
      tech: ["IoT", "Python", "Raspberry Pi", "OpenCV", "MQTT", "AWS"],
      github: "#",
      demo: "#",
      image: "/images/BiometricsPalm&FaceRecognition.png"
    },
    {
      title: "NextNode Apps",
      description: "Node.js-based applications for scalable backend services and API development.",
      tech: ["Next.js", "Python", "JSON", "MQTT", "SNMP"],
      github: "#",
      demo: "#",
      image: "/images/NextNode-Apps.png"
    },
    {
      title: "Containment Systems",
      description: "Advanced containment solutions for industrial and environmental management systems.",
      tech: ["Next.js",".Net" , "IoT", "Sensors", "Control Systems", "Automation"],
      github: "#",
      demo: "#",
      image: "/images/Containment.png"
    },
    {
      title: "POS Coffee Shop Cafe",
      description: "Point of Sale system designed for coffee shops and cafe businesses with inventory management.",
      tech: ["Next.js", "Prisma", "Stripe", "POS"],
      github: "#",
      demo: "#",
      image: "/images/POS-CoffeeShopCafe.png"
    }
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Background Particles */}
      <FloatingParticles />

      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)"
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 w-full bg-background/90 backdrop-blur-lg border-b border-border z-50 shadow-lg"
        style={{
          boxShadow: mousePosition.x > 0 ? `0 0 20px rgba(59, 130, 246, ${mousePosition.x * 0.1})` : undefined
        }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.h1
            whileHover={{
              scale: 1.1,
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.3 }
            }}
            className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent cursor-pointer"
          >
            <motion.span
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text"
            >
              Portfolio
            </motion.span>
          </motion.h1>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              {['About', 'Skills', 'Services', 'Certificates', 'Projects', 'Contact'].map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="hover:text-blue-400 transition-colors relative"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{
                    scale: 1.1,
                    color: "#60a5fa"
                  }}
                >
                  {item}
                  <motion.div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-600 scale-x-0"
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
              ))}
            </nav>
            <motion.div
              whileHover={{
                scale: 1.1,
                rotate: 180,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hover:bg-gradient-to-r hover:from-blue-400/20 hover:to-purple-600/20 transition-all duration-300 rounded-full"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={theme}
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="container mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={heroVariants}
            className="mb-8"
          >
            {/* Animated Avatar */}
            <motion.div
              className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 p-1 relative"
              animate={{
                rotate: 360,
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity }
              }}
            >
              <motion.div
                className="w-full h-full rounded-full bg-background flex items-center justify-center relative overflow-hidden"
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
                }}
              >
                <motion.div
                  animate={{
                    background: [
                      "conic-gradient(from 0deg, #60a5fa, #a855f7, #ec4899, #60a5fa)",
                      "conic-gradient(from 360deg, #60a5fa, #a855f7, #ec4899, #60a5fa)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 opacity-20 rounded-full"
                />
                <motion.div
                  className="relative z-10"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  <PersonStanding className="w-12 h-12 text-blue-400" />
                </motion.div>
              </motion.div>

              {/* Orbiting Elements */}
              <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-yellow-900 m-1" />
              </motion.div>
              <motion.div
                className="absolute -bottom-2 -left-2 w-6 h-6 bg-purple-400 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-4 h-4 text-purple-900 m-1" />
              </motion.div>
            </motion.div>

            {/* Typing Effect Name */}
            <motion.div className="text-4xl md:text-6xl font-bold mb-4 min-h-[80px] flex flex-col items-center">
              <TypingEffect text="Hello, I'm Alfi Maulana Al-Farisi" delay={1000} />
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3, duration: 0.8 }}
                className="text-lg md:text-xl text-muted-foreground mt-2"
              >
                <TypingEffect text="IoT Engineer & Software Developer" delay={4000} />
              </motion.span>
            </motion.div>

            <motion.p
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 1 }}
            >
              Specializing in IoT systems, software development, and innovative technology solutions.
              <motion.span
                className="inline-block ml-2"
                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </motion.span>
            </motion.p>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5, duration: 0.8 }}
          >
            {[
              { icon: MessageCircle, text: "Get In Touch", primary: true },
              { icon: FileText, text: "Download CV", primary: false, href: "/cv/CV 2024.docx", download: true },
              { icon: Github, text: "View GitHub", primary: false },
            ].map((button, index) => (
              <motion.div
                key={button.text}
                whileHover={{
                  scale: 1.1,
                  boxShadow: button.primary
                    ? "0 20px 40px rgba(59, 130, 246, 0.4)"
                    : "0 20px 40px rgba(0, 0, 0, 0.2)"
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 3.5 + index * 0.2,
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100
                }}
              >
                <motion.a
                  href={button.href || "#"}
                  download={button.download}
                  className={
                    button.primary
                      ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-2xl transform hover:-translate-y-1 transition-all duration-300 px-6 py-3 rounded-lg flex items-center gap-2"
                      : "bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:bg-white/20 hover:border-white/40 text-foreground font-semibold transform hover:-translate-y-1 transition-all duration-300 px-6 py-3 rounded-lg flex items-center gap-2"
                  }
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <button.icon className="h-5 w-5" />
                  </motion.div>
                  {button.text}
                  <motion.div
                    className=""
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                </motion.a>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="mt-16"
            animate={{
              y: [0, 20, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-6 h-10 border-2 border-white/20 rounded-full mx-auto flex justify-center">
              <motion.div
                className="w-1 h-3 bg-white/60 rounded-full mt-2"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <motion.section
        id="about"
        className="py-32 px-4 bg-gradient-to-br from-muted/30 via-background to-muted/30 relative overflow-hidden"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)`
        }}
      >
        {/* Animated Background Shapes */}
        <div className="absolute inset-0">
          {Array.from({ length: 3 }, (_, i) => (
            <motion.div
              key={i}
              className={`absolute w-32 h-32 bg-gradient-to-r from-blue-400/10 to-purple-600/10 rounded-full blur-xl`}
              style={{
                left: `${20 + i * 30}%`,
                top: `${10 + i * 30}%`,
              }}
              animate={{
                x: [0, 100, -100, 0],
                y: [0, -50, 50, 0],
                scale: [1, 1.2, 0.8, 1],
              }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 2
              }}
            />
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="container mx-auto max-w-7xl relative z-10"
        >
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
          >
            About Me
          </motion.h2>

          {/* Introduction Section - Full Width */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-12"
          >
            <motion.p
              className="text-lg leading-relaxed text-muted-foreground max-w-4xl mx-auto"
              whileHover={{ color: "rgb(59 130 246)" }}
            >
              Passionate IoT Engineer and Software Developer with a strong foundation in industrial automation and modern web technologies.
              Specializing in creating innovative IoT solutions that bridge the gap between hardware and software through comprehensive systems development.
            </motion.p>
          </motion.div>

          {/* Balanced 3-Column Layout */}
          <motion.div
            variants={itemVariants}
            className="grid lg:grid-cols-3 gap-8"
          >
            {/* Education Column */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="p-6 bg-card/50 rounded-xl border border-border/50 h-full"
                whileHover={{ borderColor: "rgb(59 130 246)" }}
                transition={{ duration: 0.3 }}
              >
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  Education
                </h4>
                <div className="space-y-3 text-muted-foreground">
                  <div>• Vocational High School State 1 Cimahi (2018-2022)</div>
                  <div className="ml-4 text-sm">Industrial Automation Engineering - PLC, Electrical Systems, SCADA</div>
                  <div>• Institut Teknologi Tanggerang Selatan (2023-Present)</div>
                  <div className="ml-4 text-sm">Information Systems - Software Development & Architecture</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Professional Experience Column */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="p-6 bg-card/50 rounded-xl border border-border/50 h-full"
                whileHover={{ borderColor: "rgb(147 51 234)" }}
                transition={{ duration: 0.3 }}
              >
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-500" />
                  Professional Experience
                </h4>
                <div className="space-y-3 text-muted-foreground">
                  <div>• PT Graha Sumber Prima Elektronik (2022-Present)</div>
                  <div className="ml-4 text-sm">IoT Engineer & Software Developer - Commercial IoT solutions & web apps</div>
                  <div>• PT Gajah Tunggal (Internship)</div>
                  <div className="ml-4 text-sm">Warehouse Operations - Logistics & administrative processes</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Stats Column */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="p-6 bg-card/50 rounded-xl border border-border/50 h-full"
                whileHover={{ borderColor: "rgb(16 185 129)" }}
                transition={{ duration: 0.3 }}
              >
                <h4 className="font-semibold text-foreground mb-4 text-center">Career Statistics</h4>
                <div className="grid grid-cols-1 gap-4 text-center">
                  {[
                    { number: "25+", label: "Projects", color: "text-blue-400" },
                    { number: "5+", label: "Years Experience", color: "text-purple-400" },
                    { number: "100+", label: "Happy Clients", color: "text-green-400" },
                    { number: "26", label: "Skills Mastered", color: "text-orange-400" }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className="group"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 200
                      }}
                      whileHover={{
                        scale: 1.1,
                        transition: { duration: 0.3 }
                      }}
                    >
                      <motion.div
                        className={`text-2xl md:text-3xl font-bold ${stat.color} mb-1`}
                        whileHover={{
                          scale: [1, 1.2, 1],
                          transition: { duration: 0.6 }
                        }}
                      >
                        {stat.number}
                      </motion.div>
                      <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Bottom Section - Organization Experience */}
          <motion.div
            variants={itemVariants}
            className="mt-8"
          >
            <motion.div
              className="p-6 bg-card/50 rounded-xl border border-border/50"
              whileHover={{ borderColor: "rgb(16 185 129)" }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-green-500" />
                Organization & Leadership Experience
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3 text-muted-foreground">
                  <div>• Martial Arts Karate-DO (2015-2023)</div>
                  <div className="ml-4 text-sm">Head Coach, Assistant Manager, Athlete</div>
                  <div>• Karang Taruna (2019-2021)</div>
                  <div className="ml-4 text-sm">Public Relations & Event Coordination</div>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <div>• Majelis Permusyawaratan Kelas (2018-2020)</div>
                  <div className="ml-4 text-sm">Creative Team & Cultural Arts</div>
                  <div>• OSIS (2015)</div>
                  <div className="ml-4 text-sm">Student Council Member</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Skills Tags */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            {["IoT Specialist", "Software Developer", "Industrial Automation", "Tech Innovator", "Problem Solver"].map((tag, index) => (
              <motion.div
                key={tag}
                variants={itemVariants}
                whileHover={{
                  scale: 1.1,
                  backgroundColor: ["rgba(59, 130, 246, 0.1)", "rgba(147, 51, 234, 0.1)"]
                }}
                className="px-4 py-2 bg-muted/50 rounded-full text-sm font-medium border border-border/50 hover:border-blue-400/50 transition-colors"
              >
                {tag}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* My Services Section */}
      <motion.section
        id="services"
        className="py-32 px-4 bg-gradient-to-br from-blue-500/5 via-background to-purple-500/5"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="container mx-auto max-w-7xl"
        >
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-blue-400 via-purple-500 to-green-600 bg-clip-text text-transparent"
          >
            What I Do
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-lg text-muted-foreground text-center mb-16 max-w-3xl mx-auto"
          >
            Specialized in IoT solutions and full-stack development, I offer comprehensive services
            that bridge hardware and software to create efficient, scalable systems for businesses.
          </motion.p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Chip,
                title: "IoT System Development",
                description: "Custom IoT solutions including sensors, gateways, and cloud integration for industrial and smart applications.",
                features: ["Hardware Integration", "Sensor Networks", "MQTT Protocols", "Real-time Data"]
              },
              {
                icon: Code,
                title: "Full-Stack Web Development",
                description: "Modern web applications built with cutting-edge technologies for responsive, scalable user experiences.",
                features: ["React/Next.js", "TypeScript", "Node.js", "REST APIs", "Databases"]
              },
              {
                icon: Cog,
                title: "Industrial Automation",
                description: "PLC programming, SCADA systems, and HMI development for manufacturing and process automation.",
                features: ["PLC Programming", "SCADA Systems", "HMI Design", "Control Systems"]
              },
              {
                icon: Shield,
                title: "Custom Software Solutions",
                description: "Tailored software solutions designed to meet specific business requirements with high performance and security.",
                features: ["Enterprise Apps", "System Integration", "API Development", "Security Implementation"]
              }
            ].map((service, index) => (
              <motion.div
                key={service.title}
                variants={itemVariants}
                whileHover={{
                  scale: 1.05,
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <Card className="p-6 hover:bg-card/80 transition-colors duration-300 h-full border-border/50 hover:border-blue-400/50">
                  <div className="mb-6">
                    <motion.div
                      className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4"
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <service.icon className="w-7 h-7 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">{service.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {service.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <motion.div
                        key={feature}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{
                          opacity: 1,
                          x: 0,
                          transition: {
                            delay: featureIndex * 0.1,
                            duration: 0.5
                          }
                        }}
                        viewport={{ once: true }}
                      >
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-16"
          >
            <motion.div
              className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 rounded-2xl p-8 border border-border/20"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold mb-4 text-foreground">Ready to Build Something Amazing?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Let's discuss your project requirements and create innovative solutions that drive your business forward.
              </p>
              <motion.a
                href="#contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mail className="w-5 h-5" />
                Start a Project
              </motion.a>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Skills & Technologies Section */}
      <motion.section
        id="skills"
        className="py-32 px-4 bg-gradient-to-t from-background via-muted/10 to-background"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="container mx-auto max-w-7xl"
        >
          {/* Technical Skills */}
          <motion.div
            className="mb-16"
          >
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-3 mb-12"
            >
              <Code className="w-8 h-8 text-primary" />
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Technical Skills
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
              {techSkills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.05,
                    y: -5,
                    transition: { duration: 0.3 }
                  }}
                >
                  <Card className="p-4 hover:bg-accent/40 transition-colors h-full">
                    <div className="flex items-start gap-3 mb-2">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <skill.icon size={32} className={skill.color} />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{skill.name}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Expert level proficiency with {skill.level}% skill rating
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Other Skills */}
          <motion.div
          >
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-3 mb-12"
            >
              <Wrench className="w-8 h-8 text-primary" />
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-orange-600 bg-clip-text text-transparent">
                Engineering & Other Skills
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {otherSkills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.05,
                    y: -5,
                    transition: { duration: 0.3 }
                  }}
                >
                  <Card className="p-4 hover:bg-accent/40 transition-colors h-full">
                    <div className="flex items-start gap-3 mb-2">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <skill.icon size={32} className={skill.color} />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{skill.name}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Expert level proficiency with {skill.level}% skill rating
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Certificates Section */}
      <motion.section
        id="certificates"
        className="py-32 px-4 bg-gradient-to-br from-yellow-400/5 via-background to-pink-400/5"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="container mx-auto max-w-7xl"
        >
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent"
          >
            Certificates
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {certificates.map((cert, index) => (
              <motion.div
                key={cert.title}
                variants={itemVariants}
                whileHover={{
                  y: -15,
                  rotateY: 5,
                  rotateX: 5,
                  scale: 1.03,
                  boxShadow: "0 25px 50px -12px rgba(255, 193, 7, 0.3)"
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  duration: 0.6
                }}
                style={{
                  transformStyle: "preserve-3d",
                  perspective: "1000px"
                }}
              >
                <Card className="overflow-hidden bg-card/90 backdrop-blur-sm border-border/50 shadow-xl hover:shadow-yellow-500/20 transition-all duration-500 h-full group relative">
                  {/* Hover gradient overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-pink-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.3 }}
                  />

                  {/* Animated background image area */}
                  <motion.div
                    className="aspect-video bg-gradient-to-br from-yellow-400/10 via-pink-500/10 to-purple-600/10 relative overflow-hidden cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setSelectedImage(cert.image)}
                  >
                    <motion.img
                      src={cert.image}
                      alt={cert.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 rounded-full p-3">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>

                  <CardContent className="p-6 relative z-10">
                    <motion.h3
                      className="text-lg font-bold mb-3 group-hover:text-yellow-400 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      {cert.title}
                    </motion.h3>

                    <motion.div
                      className="flex gap-2"
                      variants={containerVariants}
                    >
                      <motion.a
                        href={cert.courseraLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        variants={itemVariants}
                        whileHover={{
                          scale: 1.05,
                          boxShadow: "0 5px 15px rgba(59, 130, 246, 0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-yellow-400/10 hover:border-yellow-400/50"
                        >
                          View Certificate
                        </Button>
                      </motion.a>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* Projects Section */}
      <motion.section
        id="projects"
        className="py-32 px-4 bg-gradient-to-br from-muted/20 via-background to-muted/20"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="container mx-auto max-w-7xl"
        >
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent"
          >
            Featured Projects
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project.title}
                variants={itemVariants}
                whileHover={{
                  y: -20,
                  rotateY: 5,
                  rotateX: 5,
                  scale: 1.05,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)"
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  duration: 0.6
                }}
                style={{
                  transformStyle: "preserve-3d",
                  perspective: "1000px"
                }}
              >
                <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 shadow-xl hover:shadow-purple-500/20 transition-all duration-500 h-full group relative">
                  {/* Hover gradient overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.3 }}
                  />

                  {/* Animated background image area */}
                  {project.image !== "/placeholder.jpg" ? (
                    <motion.div
                      className="aspect-video bg-gradient-to-br from-blue-400/10 via-purple-500/10 to-pink-500/10 relative overflow-hidden cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                      onClick={() => setSelectedImage(project.image)}
                    >
                      <motion.img
                        src={project.image}
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/50 rounded-full p-3">
                          <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="aspect-video bg-gradient-to-br from-blue-400/10 via-purple-500/10 to-pink-500/10 relative overflow-hidden"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                    />
                  )}

                  <CardContent className="p-6 relative z-10">
                    <motion.h3
                      className="text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      {project.title}
                    </motion.h3>

                    <motion.p
                      className="text-muted-foreground mb-4 leading-relaxed group-hover:text-foreground/80 transition-colors"
                      whileHover={{ scale: 1.01 }}
                    >
                      {project.description}
                    </motion.p>

                    <motion.div
                      className="flex flex-wrap gap-2 mb-6"
                      variants={containerVariants}
                    >
                      {project.tech.map((tech, techIndex) => (
                        <motion.div
                          key={tech}
                          variants={itemVariants}
                          whileHover={{
                            scale: 1.1,
                            backgroundColor: ["rgba(59, 130, 246, 0.1)", "rgba(147, 51, 234, 0.1)"]
                          }}
                          className="px-3 py-1 bg-muted/50 rounded-full text-xs font-medium border border-border/50 hover:border-blue-400/50 transition-colors"
                        >
                          {tech}
                        </motion.div>
                      ))}
                    </motion.div>


                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        id="contact"
        className="py-32 px-4 bg-gradient-to-t from-muted/30 via-background to-muted/10 relative overflow-hidden"
        style={{
          background: `radial-gradient(circle at ${50 - mousePosition.x * 20}% ${50 - mousePosition.y * 20}%, rgba(59, 130, 246, 0.05) 0%, transparent 60%)`
        }}
      >
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent"
            >
              Get In Touch
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed"
            >
              I'm always open to discussing new opportunities, interesting projects, or just having a chat about technology.
              Let's connect and create something amazing together!
            </motion.p>

            <div className="flex flex-col items-center gap-8 mb-12">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Direct Contact</h3>
                <div className="flex flex-col sm:flex-row gap-4 text-muted-foreground">
                  <motion.a
                    href="mailto:alfimaulana2003@gmail.com"
                    className="flex items-center gap-2 hover:text-blue-500 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Mail className="w-5 h-5" />
                    <span>alfimaulana2003@gmail.com</span>
                  </motion.a>
                  <motion.a
                    href="https://wa.me/+6283116297507"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-green-500 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">W</span>
                    </div>
                    <span>+62 831-1629-7507</span>
                  </motion.a>
                </div>
              </div>
            </div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              {[
                { icon: Mail, label: "Send Email", href: "mailto:alfimaulana2003@gmail.com", primary: true },
                { icon: Github, label: "GitHub Profile", href: "#", primary: false },
                { icon: Briefcase, label: "LinkedIn", href: "#", primary: false },
                { icon: Smartphone, label: "WhatsApp", href: "https://wa.me/+6283116297507", primary: false },
              ].map((contact, index) => (
                <motion.a
                  key={contact.label}
                  href={contact.href}
                  target={contact.href.startsWith('http') ? '_blank' : '_self'}
                  rel={contact.href.startsWith('http') ? 'noopener noreferrer' : ''}
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.1,
                    boxShadow: contact.primary
                      ? "0 20px 40px rgba(59, 130, 246, 0.4)"
                      : "0 20px 40px rgba(0, 0, 0, 0.2)",
                    y: -5
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.2,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 100
                  }}
                  className={
                    contact.primary
                      ? "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-700 text-white font-semibold shadow-2xl px-8 py-4 text-lg h-auto flex items-center justify-center gap-3 rounded-lg"
                      : "bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:bg-white/20 hover:border-white/40 text-foreground font-semibold px-8 py-4 text-lg h-auto flex items-center justify-center gap-3 rounded-lg hover:shadow-lg transition-all duration-300"
                  }
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <contact.icon className="w-6 h-6" />
                  </motion.div>
                  {contact.label}
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-border/50 bg-gradient-to-t from-muted/10 to-transparent">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="flex justify-center items-center gap-6 mb-8"
              variants={containerVariants}
            >
              {[
                { icon: Github, label: "GitHub", url: "#" },
                { icon: Briefcase, label: "LinkedIn", url: "#" },
                { icon: Mail, label: "Email", url: "#" },
              ].map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.url}
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.2,
                    rotate: [0, -10, 10, 0],
                    transition: { duration: 0.5 }
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="p-4 bg-gradient-to-r from-blue-400/10 to-purple-600/10 rounded-full hover:from-blue-400/20 hover:to-purple-600/20 transition-all duration-300 group"
                >
                  <social.icon className="w-6 h-6 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                </motion.a>
              ))}
            </motion.div>

            <motion.p
              className="text-muted-foreground mb-4"
              whileHover={{ scale: 1.02 }}
            >
              © 2025 Portfolio. Built with{" "}
              <motion.span
                className="text-blue-400 font-semibold"
                whileHover={{ color: "#a855f7" }}
              >
                Next.js
              </motion.span>
              ,{" "}
              <motion.span
                className="text-purple-400 font-semibold"
                whileHover={{ color: "#ec4899" }}
              >
                Tailwind CSS
              </motion.span>
              {" "}and{" "}
              <motion.span
                className="text-pink-400 font-semibold"
                whileHover={{ color: "#60a5fa" }}
              >
                Framer Motion
              </motion.span>
            </motion.p>

            <motion.div
              className="flex justify-center items-center gap-2 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 1 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Heart className="w-4 h-4 text-red-400" />
              </motion.div>
              <span>Made with passion</span>
            </motion.div>
          </motion.div>
        </div>
      </footer>

      {/* Image Fullscreen Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/90 border-0 overflow-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex items-center justify-center"
          >
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Full Size Project Image"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
