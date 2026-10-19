

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Trophy,
    Code2,
    Sparkles,
    FolderGit2,
    BriefcaseBusiness,
    TrendingUp
} from "lucide-react";
import { getFinalFeedback, saveReport } from "../../lib/api";

export default function ReportPage() {
    const router = useRouter();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const generateReport = async () => {
            try {
                const storedResume =
                    sessionStorage.getItem("resumeData");

                const storedHistory =
                    sessionStorage.getItem("interviewHistory");

                if (!storedResume || !storedHistory) {
                    router.push("/dashboard");
                    return;
                }

                const resumeData =
                    JSON.parse(storedResume);

                const history =
                    JSON.parse(storedHistory);

                const storedUser =
                    localStorage.getItem("user");

                if (!storedUser) {
                    router.push("/login");
                    return;
                }

                const user = JSON.parse(storedUser);

                const userId = Number(user.id);

                if (!userId) {
                    console.error(
                        "User ID is missing"
                    );

                    router.push("/login");
                    return;
                }

                const data = await getFinalFeedback(
                    resumeData,
                    history
                );

                const generatedReport = data.report;

                console.log(
                    "Generated report:",
                    generatedReport
                );

                const saveData = await saveReport(
                    userId,
                    generatedReport
                );

                console.log(
                    "REPORT SAVED:",
                    saveData
                );

                setReport(
                    generatedReport
                );
            } catch (error) {
                console.error(
                    "Report error:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [router]);



    if (loading) {
        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f7ff]">



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
                    initial={{
                        opacity: 0,
                        scale: 0.9,
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                    }}
                    className="relative z-10 rounded-3xl border border-white/70 bg-white/80 p-10 text-center shadow-2xl backdrop-blur-xl"
                >
                    <motion.div
                        animate={{
                            rotate: 360,
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        className="mx-auto mb-6 h-14 w-14 rounded-full border-4 border-violet-100 border-t-violet-600"
                    />

                    <h2 className="text-2xl font-bold text-slate-900">
                        Generating your report...
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        AI is analyzing your interview
                        performance.
                    </p>
                </motion.div>
            </main>
        );
    }



    if (!report) {
        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f7ff]">

                <motion.div
                    className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl"
                    animate={{
                        x: [0, 80, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                    }}
                />

                <motion.div
                    initial={{
                        opacity: 0,
                        y: 30,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    className="relative z-10 rounded-3xl border border-white/70 bg-white/80 p-10 text-center shadow-xl backdrop-blur-xl"
                >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-slate-900">
                        Report unavailable
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        We could not generate your
                        interview report.
                    </p>

                    <motion.button
                        onClick={() =>
                            router.push("/dashboard")
                        }
                        whileHover={{
                            scale: 1.03,
                        }}
                        whileTap={{
                            scale: 0.97,
                        }}
                        className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-200"
                    >
                        Back to Dashboard
                    </motion.button>
                </motion.div>
            </main>
        );
    }

    const scores = [
        [
            "Overall",
            report.overall_score,
        ],
        [
            "Technical",
            report.technical_score,
        ],
        [
            "Skills",
            report.skills_score,
        ],
        [
            "Projects",
            report.projects_score,
        ],
        [
            "Experience",
            report.experience_score,
        ],
    ];

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#f8f7ff] text-slate-900">


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
                    x: [0, 50, 0],
                    y: [0, -70, 0],
                }}
                transition={{
                    duration: 11,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />


            <motion.header
                initial={{
                    opacity: 0,
                    y: -30,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                className="relative z-10 border-b border-white/70 bg-white/70 backdrop-blur-xl"
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">

                    {/* Logo + Title */}
                    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-black text-white shadow-lg shadow-violet-200 sm:h-10 sm:w-10 sm:text-sm">
                            AI
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base lg:text-lg">
                                AI Interview Preparation
                            </h1>
                            <p className="hidden text-[10px] text-slate-500 sm:block sm:text-xs">
                                Interview Performance Report
                            </p>
                        </div>
                    </div>

                    <motion.button
                        onClick={() =>
                            router.push("/profile")
                        }
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-600 shadow-sm transition hover:bg-violet-50 sm:px-5 sm:py-2.5 sm:text-sm"
                    >
                        <span className="hidden sm:inline">View Profile</span>
                        <span className="sm:hidden">Profile</span>
                    </motion.button>
                </div>
            </motion.header>



            <main className="relative z-10 mx-auto max-w-6xl px-6 py-12">

                {/* PAGE INTRO */}

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
                        duration: 0.6,
                    }}
                    className="mb-10"
                >
                    <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-violet-600">
                        AI ANALYSIS COMPLETE
                    </p>

                    <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                        Your interview
                        <br />

                        <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            performance report.
                        </span>
                    </h2>

                    <p className="mt-4 max-w-2xl text-slate-500">
                        Review your interview performance,
                        strengths, improvement areas and
                        personalized AI recommendations.
                    </p>
                </motion.div>



                <motion.section
                    initial={{
                        opacity: 0,
                        y: 30,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.7,
                        delay: 0.1,
                    }}
                    className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur-xl"
                >
                    <div className="flex flex-col justify-between gap-10 md:flex-row md:items-center">

                        {/* LEFT */}

                        <div className="max-w-2xl">

                            <p className="text-sm font-medium text-slate-500">
                                Final Candidate Level
                            </p>

                            <h2 className="mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-4xl font-bold text-transparent">
                                {report.final_level}
                            </h2>

                            <p className="mt-5 text-sm leading-7 text-slate-500">
                                {report.performance_summary}
                            </p>

                        </div>



                        <motion.div
                            whileHover={{
                                scale: 1.05,
                            }}
                            className="mx-auto flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 p-2 shadow-xl shadow-violet-200 md:mx-0"
                        >
                            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
                                <p className="text-4xl font-bold text-slate-900">
                                    {report.overall_score}
                                </p>

                                <p className="text-xs text-slate-400">
                                    / 10
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </motion.section>



                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

                    {scores.map(
                        ([title, score], index) => (
                            <motion.div
                                key={title}
                                initial={{
                                    opacity: 0,
                                    y: 25,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    duration: 0.5,
                                    delay:
                                        0.15 +
                                        index * 0.08,
                                }}
                                whileHover={{
                                    y: -5,
                                    scale: 1.02,
                                }}
                                className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur-xl"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-slate-500">
                                        {title}
                                    </p>

                                    <span className="text-lg">
                                        {title ===
                                            "Technical"
                                            ? <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl text-white shadow-lg"> 
                                                <Code2 />
                                            </div>
                                            : title ===
                                                "Skills"
                                                ? <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl text-white shadow-lg"> <Sparkles /> </div>
                                                : title ===
                                                    "Projects"
                                                    ? <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl text-white shadow-lg"> < FolderGit2 /> </div>
                                                    : title ===
                                                        "Experience"
                                                        ?<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl text-white shadow-lg"> <BriefcaseBusiness /> </div> 
                                                        : <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl text-white shadow-lg">  <Trophy /></div>
                                        }
                                    </span>
                                </div>

                                <p className="mt-3 text-3xl font-bold text-slate-900">
                                    {score}

                                    <span className="ml-1 text-sm font-medium text-slate-400">
                                        /10
                                    </span>
                                </p>

                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                    <motion.div
                                        initial={{
                                            width: 0,
                                        }}
                                        animate={{
                                            width: `${score * 10}%`,
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            delay:
                                                0.4 +
                                                index * 0.1,
                                        }}
                                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600"
                                    />
                                </div>
                            </motion.div>
                        )
                    )}
                </div>



                <div className="mt-8 grid gap-6 md:grid-cols-2">



                    <motion.section
                        initial={{
                            opacity: 0,
                            x: -30,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                        }}
                        transition={{
                            duration: 0.6,
                        }}
                        className="rounded-3xl border border-white/70 bg-white/80 p-7 shadow-xl backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                                ✓
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    Strengths
                                </h3>

                                <p className="text-sm text-slate-500">
                                    What you performed well
                                </p>
                            </div>
                        </div>

                        <ul className="mt-6 space-y-3">
                            {report.strengths?.map(
                                (item, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{
                                            opacity: 0,
                                            x: -10,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                        }}
                                        transition={{
                                            delay:
                                                index *
                                                0.08,
                                        }}
                                        className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-slate-600"
                                    >
                                        <span className="mr-2 font-bold text-emerald-600">
                                            ✓
                                        </span>

                                        {item}
                                    </motion.li>
                                )
                            )}
                        </ul>
                    </motion.section>



                    <motion.section
                        initial={{
                            opacity: 0,
                            x: 30,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                        }}
                        transition={{
                            duration: 0.6,
                        }}
                        className="rounded-3xl border border-white/70 bg-white/80 p-7 shadow-xl backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100">
                                !
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    Weaknesses
                                </h3>

                                <p className="text-sm text-slate-500">
                                    Areas that need attention
                                </p>
                            </div>
                        </div>

                        <ul className="mt-6 space-y-3">
                            {report.weaknesses?.map(
                                (item, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{
                                            opacity: 0,
                                            x: 10,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                        }}
                                        transition={{
                                            delay:
                                                index *
                                                0.08,
                                        }}
                                        className="rounded-2xl border border-red-100 bg-red-50/70 p-4 text-sm leading-6 text-slate-600"
                                    >
                                        <span className="mr-2 font-bold text-red-500">
                                            •
                                        </span>

                                        {item}
                                    </motion.li>
                                )
                            )}
                        </ul>
                    </motion.section>
                </div>


                <motion.section
                    initial={{
                        opacity: 0,
                        y: 30,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.6,
                    }}
                    className="mt-8 rounded-3xl border border-white/70 bg-white/80 p-7 shadow-xl backdrop-blur-xl"
                >
                    <div className="flex items-center gap-3">

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl text-white shadow-lg">
                            <TrendingUp/>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-slate-900">
                                Areas for Improvement
                            </h3>

                            <p className="text-sm text-slate-500">
                                Focus on these areas for your
                                next interview
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-2">
                        {report.areas_for_improvement?.map(
                            (item, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{
                                        scale: 1.02,
                                    }}
                                    className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-sm leading-6 text-slate-600"
                                >
                                    <span className="mr-2 font-bold text-violet-600">
                                        {index + 1}.
                                    </span>

                                    {item}
                                </motion.div>
                            )
                        )}
                    </div>
                </motion.section>


                <motion.section
                    initial={{
                        opacity: 0,
                        y: 30,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.6,
                    }}
                    className="relative mt-8 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-8 shadow-xl"
                >


                    <motion.div
                        className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-200/40 blur-2xl"
                        animate={{
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                        }}
                    />

                    <div className="relative">

                        <div className="flex items-center gap-3">

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl text-white shadow-lg">
                                <Sparkles />
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                                    AI INSIGHT
                                </p>

                                <h3 className="text-2xl font-bold text-slate-900">
                                    AI Recommendation
                                </h3>
                            </div>
                        </div>

                        <p className="mt-6 text-sm leading-8 text-slate-600">
                            {report.recommendation}
                        </p>
                    </div>
                </motion.section>


                <motion.div
                    initial={{
                        opacity: 0,
                        y: 30,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.6,
                    }}
                    className="mt-12"
                >
                    <div className="mb-6">

                        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
                            DETAILED ANALYSIS
                        </p>

                        <h3 className="mt-1 text-3xl font-bold text-slate-900">
                            Question-wise Feedback
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Review how you performed on each
                            interview question.
                        </p>
                    </div>

                    <div className="space-y-5">

                        {report.question_wise_feedback?.map(
                            (item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{
                                        opacity: 0,
                                        y: 20,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    transition={{
                                        delay:
                                            index * 0.08,
                                    }}
                                    whileHover={{
                                        y: -3,
                                    }}
                                    className="rounded-3xl border border-white/70 bg-white/80 p-7 shadow-lg backdrop-blur-xl"
                                >

                                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

                                        <div className="flex-1">

                                            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                                                Question{" "}
                                                {index + 1}
                                            </p>

                                            <h4 className="mt-3 text-lg font-semibold leading-7 text-slate-900">
                                                {item.question}
                                            </h4>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-3">

                                            <span className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-600">
                                                {item.topic}
                                            </span>

                                            <div className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 font-bold text-white shadow-md">
                                                {item.score}/10
                                            </div>

                                        </div>
                                    </div>

                                    <div className="mt-6 border-t border-slate-100 pt-5">

                                        <p className="text-sm leading-7 text-slate-500">
                                            {item.evaluation}
                                        </p>

                                    </div>
                                </motion.div>
                            )
                        )}
                    </div>
                </motion.div>



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
                        duration: 0.6,
                    }}
                    className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                    <motion.button
                        onClick={() =>
                            router.push("/dashboard")
                        }
                        whileHover={{
                            scale: 1.03,
                        }}
                        whileTap={{
                            scale: 0.97,
                        }}
                        className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 font-semibold text-white shadow-lg shadow-violet-200 transition hover:from-violet-500 hover:to-indigo-500"
                    >
                        Back to Dashboard →
                    </motion.button>

                    <motion.button
                        onClick={() =>
                            router.push("/dashboard")
                        }
                        whileHover={{
                            scale: 1.03,
                        }}
                        whileTap={{
                            scale: 0.97,
                        }}
                        className="rounded-2xl border border-violet-200 bg-white px-8 py-4 font-semibold text-violet-600 shadow-sm transition hover:bg-violet-50"
                    >
                        Start New Interview
                    </motion.button>
                </motion.div>

            </main>
        </main>
    );
}
