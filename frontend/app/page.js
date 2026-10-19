
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Code2,
  FileText,
  BarChart3,
  Database,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Play,
  Menu,
  X,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Heading animation

  const firstText = "Prepare smarter.";
  const secondText = "Interview better.";

  const letterVariants = {
    hidden: {
      opacity: 0,
      x: -20,
      filter: "blur(6px)",
    },
    visible: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.08,
        ease: "easeOut",
      },
    },
  };

  const headingContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.055,
      },
    },
  };


  // Feature cards

  const features = [
    {
      icon: FileText,
      title: "Resume-Based Questions",
      description:
        "Upload your resume and let AI generate personalized interview questions based on your skills and experience.",
    },
    {
      icon: Brain,
      title: "Adaptive AI Interview",
      description:
        "The AI analyzes your answers and dynamically adjusts the interview difficulty.",
    },
    {
      icon: Code2,
      title: "Coding Challenges",
      description:
        "Practice coding problems generated according to your programming skills and interview level.",
    },
    {
      icon: BarChart3,
      title: "AI Performance Report",
      description:
        "Get detailed feedback about technical skills, coding ability, problem solving and communication.",
    },
    {
      icon: Database,
      title: "RAG-Powered Knowledge",
      description:
        "Retrieve relevant coding and technical interview knowledge using a vector-based knowledge system.",
    },
    {
      icon: Sparkles,
      title: "Personalized Preparation",
      description:
        "Build an interview experience tailored to your resume, skills, answers and performance.",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f7ff] text-slate-900">


      {/* BACKGROUND ANIMATED BLOBS  */}


      <motion.div
        className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl"
        animate={{
          x: [0, 80, 0],
          y: [0, 50, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="pointer-events-none fixed -right-32 top-40 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl"
        animate={{
          x: [0, -70, 0],
          y: [0, 60, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="pointer-events-none fixed bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-300/20 blur-3xl"
        animate={{
          y: [0, -70, 0],
          x: [0, 50, 0],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* NAVBAR */}

      <motion.nav
        initial={{
          opacity: 0,
          y: -30,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
        }}
        className="fixed left-1/2 top-5 z-50 w-[92%] max-w-6xl -translate-x-1/2"
      >
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-lg shadow-slate-900/5 backdrop-blur-xl overflow-hidden">

          {/* Main bar */}
          <div className="flex items-center justify-between px-4 py-3 md:px-7">

            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="flex cursor-pointer items-center gap-2.5"
              onClick={() => { router.push("/"); setMobileMenuOpen(false); }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-black text-white shadow-lg shadow-violet-500/20 sm:h-10 sm:w-10 sm:text-sm">
                AI
              </div>
              <div className="hidden xs:block">
                <p className="text-sm font-bold text-slate-900">AI Interview</p>
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Preparation</p>
              </div>
            </motion.div>

            {/* Desktop navigation */}
            <div className="hidden items-center gap-8 md:flex">
              <NavLink href="#home">Home</NavLink>
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#how-it-works">How It Works</NavLink>
            </div>

            {/* Right side: Buttons + Hamburger */}
            <div className="flex items-center gap-2">

              {/* Login / Get Started – visible on all sizes */}
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/login")}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                Login
              </motion.button>

              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => router.push("/signup")}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-500/20 transition sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </motion.button>

              {/* Hamburger – only on mobile/tablet (< md) */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 md:hidden"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileMenuOpen ? (
                    <motion.span
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <X size={18} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Menu size={18} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

            </div>
          </div>

          {/* Mobile drawer menu */}
          <AnimatePresence initial={false}>
            {mobileMenuOpen && (
              <motion.div
                key="mobile-menu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden border-t border-slate-200/70 md:hidden"
              >
                <div className="flex flex-col gap-1 px-4 py-3">
                  {[
                    { href: "#home", label: "Home" },
                    { href: "#features", label: "Features" },
                    { href: "#how-it-works", label: "How It Works" },
                  ].map((link) => (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      whileTap={{ scale: 0.97 }}
                      className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 active:bg-violet-100"
                    >
                      {link.label}
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.nav>

      {/* HERO SECTION */}

      <section
        id="home"
        className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 sm:px-8 lg:px-10 lg:pb-32 lg:pt-44"
      >

        <div className="grid items-center gap-16 lg:grid-cols-2">

          {/* LEFT HERO CONTENT */}

          <div>

            {/* Small badge */}

            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.2,
              }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 shadow-sm"
            >
              <motion.span
                animate={{
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="h-2 w-2 rounded-full bg-violet-500"
              />

              <span className="text-xs font-bold uppercase tracking-widest text-violet-600">
                AI-Powered Interview Platform
              </span>
            </motion.div>

            {/* ANIMATED MAIN HEADING */}

            <motion.h1
              variants={headingContainer}
              initial="hidden"
              animate="visible"
              className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-6xl"
            >

              {/* Prepare smarter. */}

              <span className="block">

                {Array.from(firstText).map((char, index) => (
                  <motion.span
                    key={`${char}-${index}`}
                    variants={letterVariants}
                    className="inline-block"
                    style={{
                      whiteSpace: char === " " ? "pre" : "normal",
                    }}
                  >
                    {char}
                  </motion.span>
                ))}

              </span>

              {/* Interview better. */}

              <span className="block bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">

                {Array.from(secondText).map((char, index) => (
                  <motion.span
                    key={`${char}-${index}`}
                    variants={letterVariants}
                    className="inline-block"
                    style={{
                      whiteSpace: char === " " ? "pre" : "normal",
                    }}
                  >
                    {char}
                  </motion.span>
                ))}

              </span>

            </motion.h1>

            {/* Description */}

            <motion.p
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.8,
                delay: 1.6,
              }}
              className="mt-7 max-w-xl text-lg leading-8 text-slate-500"
            >
              Upload your resume, practice personalized technical
              interviews, and receive AI-powered feedback based on
              your skills, projects, and experience.
            </motion.p>

            {/* CTA buttons */}

            <motion.div
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.8,
                delay: 1.9,
              }}
              className="mt-9 flex flex-col gap-4 sm:flex-row"
            >

              <motion.button
                whileHover={{
                  scale: 1.04,
                  y: -3,
                  boxShadow: "0px 15px 30px rgba(124,58,237,0.25)",
                }}
                whileTap={{
                  scale: 0.96,
                }}
                onClick={() => router.push("/signup")}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-4 font-bold text-white shadow-xl shadow-violet-500/20"
              >
                Start Interview
                <span className="ml-2">→</span>
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.04,
                  y: -3,
                }}
                whileTap={{
                  scale: 0.96,
                }}
                onClick={() => {
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                }}
                className="rounded-2xl border border-slate-200 bg-white px-7 py-4 font-bold text-slate-700 shadow-sm"
              >
                See How It Works
              </motion.button>

            </motion.div>

            {/* Trust information */}

            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                duration: 0.8,
                delay: 2.2,
              }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400"
            >

              <div className="flex items-center gap-2">
                <span className="text-violet-600">✓</span>
                Resume-based questions
              </div>

              <div className="flex items-center gap-2">
                <span className="text-violet-600">✓</span>
                Adaptive difficulty
              </div>

              <div className="flex items-center gap-2">
                <span className="text-violet-600">✓</span>
                AI feedback
              </div>

            </motion.div>

          </div>

          {/* RIGHT SIDE INTERVIEW DASHBOARD */}

          <motion.div
            initial={{
              opacity: 0,
              x: 80,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 1,
              delay: 0.5,
              ease: "easeOut",
            }}
            className="relative"
          >

            {/* Main dashboard */}

            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-violet-900/10 sm:p-7"
            >

              {/* Dashboard header */}

              <div className="flex items-center justify-between border-b border-slate-100 pb-5">

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Interview Session
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    Technical Interview
                  </h3>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600">
                    Live
                  </span>
                </div>

              </div>

              {/* Progress */}

              <div className="mt-6">

                <div className="mb-2 flex justify-between text-xs">
                  <span className="font-medium text-slate-400">
                    Interview Progress
                  </span>

                  <span className="font-bold text-violet-600">
                    65%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: "65%",
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 1,
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  />

                </div>

              </div>

              {/* Question card */}

              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.8,
                  delay: 1.2,
                }}
                className="mt-6 rounded-2xl bg-slate-50 p-5"
              >

                <div className="flex items-center justify-between">

                  <span className="rounded-lg bg-violet-100 px-3 py-1 text-xs font-bold text-violet-600">
                    Question 7
                  </span>

                  <span className="text-xs font-medium text-slate-400">
                    Medium
                  </span>

                </div>

                <p className="mt-4 text-sm font-semibold leading-6 text-slate-800">
                  Explain the difference between SQL and NoSQL
                  databases and when you would use each.
                </p>

                {/* Answer lines */}

                <div className="mt-5 space-y-2">

                  <div className="h-2 w-full rounded-full bg-slate-200" />

                  <div className="h-2 w-11/12 rounded-full bg-slate-200" />

                  <div className="h-2 w-4/5 rounded-full bg-slate-200" />

                </div>

              </motion.div>

              {/* Score cards */}

              <div className="mt-5 grid grid-cols-3 gap-3">

                <ScoreCard
                  label="Technical"
                  score="82"
                />

                <ScoreCard
                  label="Skills"
                  score="76"
                />

                <ScoreCard
                  label="Overall"
                  score="80"
                />

              </div>

            </motion.div>

            {/* FLOATING FEEDBACK CARD */}

            {/* =====================================================
    FLOATING AI FEEDBACK CARD
===================================================== */}

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.7,
                delay: 1.8,
              }}
              whileHover={{
                scale: 1.05,
              }}
              className="
    absolute
    -bottom-6
    left-2
    z-20
    w-52
    rounded-2xl
    border
    border-white
    bg-white
    p-3
    shadow-xl

    sm:-bottom-7
    sm:-left-3
    sm:w-56
    sm:p-4

    md:-bottom-8
    md:-left-5
    md:w-64
  "
            >
              <div className="flex items-center gap-2 sm:gap-3">

                {/* Check icon */}

                <div
                  className="
        flex
        h-8
        w-8
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-emerald-50
        text-sm
        font-bold
        text-emerald-600

        sm:h-10
        sm:w-10
        sm:text-base
      "
                >
                  ✓
                </div>

                {/* Feedback text */}

                <div className="min-w-0">
                  <p
                    className="
          text-[10px]
          font-bold
          text-slate-400
          sm:text-xs
        "
                  >
                    AI Feedback
                  </p>

                  <p
                    className="
          truncate
          text-xs
          font-bold
          text-slate-800
          sm:text-sm
        "
                  >
                    Strong technical answer
                  </p>
                </div>

              </div>

              {/* Feedback progress */}

              <div
                className="
      mt-2
      h-1.5
      overflow-hidden
      rounded-full
      bg-slate-100
      sm:mt-3
    "
              >
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: "85%",
                  }}
                  transition={{
                    duration: 1.2,
                    delay: 2,
                  }}
                  className="h-full rounded-full bg-emerald-500"
                />
              </div>
            </motion.div>


            {/* Floating AI badge */}

            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "linear",
              }}
              className="
    absolute
    -top-5
    -right-5
    z-20
    h-14
    w-14
    rounded-full
    border-[4px]
    border-violet-200
    border-t-violet-600

    sm:-top-6
    sm:-right-6
    sm:h-16
    sm:w-16
    sm:border-[5px]

    md:-top-7
    md:-right-7
    md:h-18
    md:w-18
    md:border-[5px]

    lg:-top-8
    lg:-right-8
    lg:h-20
    lg:w-20
    lg:border-[6px]
  "
            />

          </motion.div>



        </div>
      </section>

      {/* FEATURES SECTION */}

      <section
        id="features"
        className="relative bg-white px-6 py-24 lg:px-10"
      >

        <div className="mx-auto max-w-7xl">

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >

            <span className="text-sm font-bold uppercase tracking-widest text-violet-600">
              Powerful Features
            </span>

            <h3 className="mt-3 text-4xl font-extrabold text-slate-900">
              Everything you need to prepare
            </h3>

            <p className="mt-5 text-slate-600">
              A complete AI-powered environment for practicing technical,
              coding and personalized interviews.
            </p>

          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {features.map((feature, index) => {

              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -7 }}
                  className="group rounded-3xl border border-slate-100 bg-[#fafaff] p-7 shadow-sm transition hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100"
                >

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">

                    <Icon size={27} />

                  </div>

                  <h4 className="mt-6 text-xl font-bold text-slate-900">
                    {feature.title}
                  </h4>

                  <p className="mt-3 leading-7 text-slate-600">
                    {feature.description}
                  </p>

                </motion.div>
              );
            })}

          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}

      <section
        id="how-it-works"
        className="relative overflow-hidden bg-[#f8f7ff] px-6 py-24 sm:px-8"
      >

        <div className="mx-auto max-w-7xl">

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.7,
            }}
            className="text-center"
          >

            <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
              Simple process
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              How it works
            </h2>

          </motion.div>

          {/* Steps */}

          <div className="mt-16 grid gap-8 md:grid-cols-4">

            <StepCard
              number="01"
              title="Upload Resume"
              description="Upload your PDF resume and let AI understand your skills and experience."
              index={0}
            />

            <StepCard
              number="02"
              title="Technical Interview"
              description="Answer AI-generated technical and coding interview questions."
              index={1}
            />

            <StepCard
              number="03"
            title="coding Interview"
            description="Your answers and coding solutions are analyzed using AI."
            index={2}
            />

            <StepCard
              number="04"
              title="Get Feedback"
              description="Receive a detailed performance report with strengths and areas to improve."
              index={3}
            />

          </div>

        </div>

      </section>

      {/* FINAL CTA */}

      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-6 py-24 text-white sm:px-8">

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
          }}
          className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
          }}
          className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-white blur-3xl"
        />

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.8,
          }}
          className="relative mx-auto max-w-3xl text-center"
        >

          <p className="text-sm font-bold uppercase tracking-widest text-violet-200">
            Start practicing today
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Turn your preparation into confidence.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-violet-100">
            Practice realistic interviews, improve your answers,
            and understand exactly where you can improve.
          </p>

          <motion.button
            whileHover={{
              scale: 1.05,
              y: -3,
            }}
            whileTap={{
              scale: 0.96,
            }}
            onClick={() => router.push("/signup")}
            className="mt-8 rounded-2xl bg-white px-8 py-4 font-bold text-violet-700 shadow-xl"
          >
            Create Your Account
            <span className="ml-2">→</span>
          </motion.button>

        </motion.div>

      </section>

      {/* FOOTER */}

      <footer className="border-t border-slate-200 bg-white px-6 py-8 sm:px-8">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-black text-white">
              AI
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                AI Interview Preparation
              </p>

              <p className="text-xs text-slate-400">
                Practice smarter with AI
              </p>
            </div>

          </div>

          <p className="text-sm text-slate-400">
            © 2026 AI Interview Preparation. All rights reserved.
          </p>

        </div>

      </footer>

    </main >
  );
}


/* NAV LINK */

function NavLink({ href, children }) {
  return (
    <motion.a
      href={href}
      whileHover={{
        y: -1,
      }}
      className="relative text-sm font-semibold text-slate-500 transition hover:text-violet-600"
    >
      {children}

      <motion.span
        initial={{
          width: 0,
        }}
        whileHover={{
          width: "100%",
        }}
        className="absolute -bottom-1 left-0 h-0.5 rounded-full bg-violet-600"
      />
    </motion.a>
  );
}


/* SCORE CARD */

function ScoreCard({ label, score }) {
  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-sm"
    >

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-slate-900">
        {score}
        <span className="text-xs font-medium text-slate-400">
          /100
        </span>
      </p>

    </motion.div>
  );
}



//  FEATURE CARD


function FeatureCard({ feature, index }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 50,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.7,
        delay: index * 0.15,
      }}
      whileHover={{
        y: -8,
      }}
      className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-xl hover:shadow-violet-500/10"
    >

      <div className="flex items-center justify-between">

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl transition group-hover:scale-110">
          {feature.icon}
        </div>

        <span className="text-sm font-black text-slate-200">
          {feature.number}
        </span>

      </div>

      <h3 className="mt-7 text-xl font-black text-slate-900">
        {feature.title}
      </h3>

      <p className="mt-3 leading-7 text-slate-500">
        {feature.description}
      </p>

      <div className="mt-6 flex items-center gap-2 text-sm font-bold text-violet-600">

        Learn more

        <motion.span
          initial={{
            x: 0,
          }}
          whileHover={{
            x: 5,
          }}
        >
          →
        </motion.span>

      </div>

    </motion.div>
  );
}



//  STEP CARD


function StepCard({
  number,
  title,
  description,
  index,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 40,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.7,
        delay: index * 0.12,
      }}
      className="relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
    >

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-black text-white shadow-lg shadow-violet-500/20">
        {number}
      </div>

      <h3 className="mt-6 text-xl font-black text-slate-900">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-slate-500">
        {description}
      </p>

    </motion.div>
  );
}