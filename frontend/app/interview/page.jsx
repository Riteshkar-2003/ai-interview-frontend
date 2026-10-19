

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    getFirstQuestion,
    analyzeAnswer,
    getNextQuestion,
} from "../../lib/api";
import {
    Loader2,
    Send,
    ArrowRight,
    Sparkles,
    Brain,
} from "lucide-react";

export default function InterviewPage() {
    const router = useRouter();

    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [difficulty, setDifficulty] = useState("Easy");
    const [evaluation, setEvaluation] = useState(null);
    const [loadingFirstQuestion, setLoadingFirstQuestion] = useState(true);
    const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
    const [generatingNextQuestion, setGeneratingNextQuestion] = useState(false);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [resumeData, setResumeData] = useState(null);
    const [history, setHistory] = useState([]);
    const hasStartedRef = useRef(false);

    useEffect(() => {
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;

        const storedResume =
            sessionStorage.getItem("resumeData");

        const storedDifficulty =
            sessionStorage.getItem("difficulty");

        if (
            !storedResume ||
            storedResume === "undefined" ||
            storedResume === "null"
        ) {
            console.error(
                "RESUME DATA NOT FOUND"
            );

            router.push("/dashboard");
            return;
        }

        try {
            const parsedResume =
                JSON.parse(storedResume);

            if (!parsedResume) {
                throw new Error(
                    "Resume data is empty"
                );
            }

            setResumeData(
                parsedResume
            );

            const selectedDifficulty =
                storedDifficulty || "Easy";

            setDifficulty(
                selectedDifficulty
            );

            generateFirstQuestion(
                parsedResume,
                selectedDifficulty
            );

        } catch (error) {
            console.error(
                "INVALID RESUME DATA:",
                error
            );

            sessionStorage.removeItem(
                "resumeData"
            );

            sessionStorage.removeItem(
                "resumeFileName"
            );

            router.push("/dashboard");
        }
    }, [router]);

    const generateFirstQuestion = async (
        resume,
        selectedDifficulty
    ) => {
        try {
            setLoadingFirstQuestion(true);
            const data = await getFirstQuestion(
                resume,
                selectedDifficulty
            );

            console.log(
                "FIRST QUESTION RESPONSE:",
                data
            );

            if (!data?.question) {
                throw new Error(
                    "Backend did not return a question"
                );
            }

            setQuestion(data.question);

        } catch (error) {
            console.error(
                "FIRST QUESTION ERROR:",
                error
            );

            setQuestion(
                "Unable to generate interview question."
            );
            hasStartedRef.current = false;
        } finally {
            setLoadingFirstQuestion(false);
        }
    };

    const submitAnswer = async () => {
        if (!answer.trim()) {
            return;
        }
        try {
            setEvaluatingAnswer(true);
            const data = await analyzeAnswer(
                question,
                answer,
                difficulty,
                null,
                questionNumber || (history.length + 1)
            );
            const newEvaluation = data.evaluation;
            setEvaluation(newEvaluation);
            setDifficulty(
                newEvaluation.next_difficulty
            );
            setHistory((previous) => [
                ...previous,
                {
                    question,
                    answer,
                    evaluation: newEvaluation,
                },
            ]);
        } catch (error) {
            console.error("Submit answer error:", error);
        } finally {
            setEvaluatingAnswer(false);
        }
    };



    const nextQuestion = async () => {
        try {
            setGeneratingNextQuestion(true);

            const nextDifficulty =
                evaluation?.next_difficulty ||
                difficulty;

            const data = await getNextQuestion(
                resumeData,
                history,
                nextDifficulty,
                evaluation,
                []
            );

            console.log(
                "NEXT QUESTION RESPONSE:",
                data
            );

            if (!data?.question) {
                throw new Error(
                    "Backend did not return the next question."
                );
            }

            setQuestion(
                data.question
            );

            setQuestionNumber(
                (number) => number + 1
            );

            setDifficulty(
                nextDifficulty
            );

            setAnswer("");

            setEvaluation(null);

        } catch (error) {
            console.error(
                "NEXT QUESTION ERROR:",
                error
            );

            alert(
                error?.message ||
                "Failed to generate next question."
            );

        } finally {
            setGeneratingNextQuestion(false);
        }
    };

    const stopInterview = async () => {
        if (history.length < 10) {
            alert(
                `Please answer at least 10 questions before stopping the interview. You have answered ${history.length} question(s).`
            );
            return;
        }

        sessionStorage.setItem(
            "interviewHistory",
            JSON.stringify(history)
        );

        sessionStorage.setItem(
            "resumeData",
            JSON.stringify(resumeData)
        );

        router.push("/report");
    };

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
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 border-b border-white/70 bg-white/70 backdrop-blur-xl"
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">

                    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-black text-white shadow-lg shadow-violet-200 sm:h-10 sm:w-10 sm:text-sm">
                            AI
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base lg:text-lg">
                                AI Interview Preparation
                            </h1>
                            <p className="hidden text-[10px] text-slate-500 sm:block sm:text-xs">
                                Technical Interview
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">

                        <div className="hidden rounded-full border border-violet-200 bg-white/80 px-3 py-1.5 text-xs shadow-sm sm:block sm:px-4 sm:py-2 sm:text-sm">
                            <span className="text-slate-500">Q </span>
                            <span className="font-semibold text-violet-600">{questionNumber}</span>
                        </div>

                        <div className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
                            <span className="hidden text-slate-500 sm:inline">Difficulty: </span>
                            <span className="font-semibold text-indigo-600">{difficulty}</span>
                        </div>

                        <motion.button
                            onClick={stopInterview}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 sm:px-4 sm:py-2 sm:text-sm"
                        >
                            <span className="hidden sm:inline">Stop Interview</span>
                            <span className="sm:hidden">Stop</span>
                        </motion.button>
                    </div>
                </div>
            </motion.header>

            <div className="relative z-10 mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-10">

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
                        delay: 0.15,
                    }}
                    className="mb-4 sm:mb-7 rounded-2xl sm:rounded-3xl border border-white/70 bg-white/75 p-4 sm:p-5 shadow-lg backdrop-blur-xl"
                >
                    <div className="mb-2 sm:mb-3 flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium text-slate-600">
                            Interview Progress
                        </span>

                        <span className="font-semibold text-violet-600">
                            Question {questionNumber}
                        </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600"
                            initial={{
                                width: 0,
                            }}
                            animate={{
                                width: `${Math.min(
                                    questionNumber * 10,
                                    100
                                )}%`,
                            }}
                            transition={{
                                duration: 0.6,
                            }}
                        />
                    </div>

                    <div className="mt-3 flex justify-between text-xs text-slate-400">
                        <span>
                            Question {questionNumber}
                        </span>

                        <span>
                            {Math.min(
                                questionNumber * 10,
                                100
                            )}
                            %
                        </span>
                    </div>
                </motion.div>

                <motion.section
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
                        delay: 0.25,
                    }}
                    whileHover={{
                        y: -2,
                    }}
                    className="rounded-2xl sm:rounded-3xl border border-white/70 bg-white/80 p-4 sm:p-6 md:p-8 shadow-xl backdrop-blur-xl"
                >
                    <div className="mb-4 sm:mb-7 flex items-center gap-3 sm:gap-4">

                      
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                            }}
                            className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xs sm:text-sm font-bold text-white shadow-lg shadow-violet-200"
                        >
                            AI
                        </motion.div>

                        <div>
                            <p className="text-sm sm:text-base font-semibold text-slate-900">
                                AI Interviewer
                            </p>

                            <p className="text-xs sm:text-sm text-slate-500">
                                Technical Interview
                            </p>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {loadingFirstQuestion ? (
                            <motion.div
                                key="loading-first"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                className="rounded-xl sm:rounded-2xl overflow-hidden relative"
                                style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #1e1b4b 100%)" }}
                            >
                                <motion.div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ background: "linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.12) 50%, transparent 100%)", height: "200%" }}
                                    animate={{ y: ["-100%", "0%"] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                />

                                <div className="relative z-10 p-5 sm:p-7">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

                                        <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                                            <motion.div
                                                className="absolute inset-0 rounded-full border-2 border-violet-500/30"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            >
                                                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-violet-400 shadow-[0_0_8px_3px_rgba(167,139,250,0.6)]" />
                                            </motion.div>
                                            <motion.div
                                                className="absolute inset-3 rounded-full border-2 border-indigo-400/40"
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                            >
                                                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-300 shadow-[0_0_6px_2px_rgba(129,140,248,0.7)]" />
                                            </motion.div>
                                            <motion.div
                                                className="absolute inset-6 rounded-full bg-violet-600 flex items-center justify-center shadow-[0_0_20px_6px_rgba(139,92,246,0.4)]"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                            >
                                                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                            </motion.div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="text-sm sm:text-base font-bold text-violet-100 tracking-wide">
                                                    Generating Question 1
                                                </span>
                                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-violet-500/25 text-violet-300 border border-violet-400/30">
                                                    {difficulty}
                                                </span>
                                                <motion.span
                                                    className="inline-block w-0.5 h-4 bg-violet-400 rounded"
                                                    animate={{ opacity: [1, 0, 1] }}
                                                    transition={{ duration: 0.8, repeat: Infinity }}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Analyzing resume · mapping technical skills · calibrating {difficulty} difficulty
                                            </p>

                                            <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{ background: "linear-gradient(90deg, #7c3aed, #6366f1, #7c3aed)" }}
                                                    animate={{ x: ["-100%", "100%"] }}
                                                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="question-content"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="rounded-xl sm:rounded-2xl border border-violet-100 bg-violet-50/60 p-4 sm:p-6"
                            >
                                <p className="mb-2 sm:mb-3 text-xs font-semibold uppercase tracking-wider text-violet-500">
                                    Interview Question
                                </p>

                                <h2 className="text-base sm:text-xl font-semibold leading-relaxed text-slate-800 md:text-2xl">
                                    {question}
                                </h2>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>

                <motion.section
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
                        delay: 0.35,
                    }}
                    className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-white/70 bg-white/80 p-4 sm:p-6 md:p-8 shadow-xl backdrop-blur-xl"
                >
                    <div className="mb-3 sm:mb-4 flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-800">
                            Your Answer
                        </label>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                            {answer.length} characters
                        </span>
                    </div>

                    <textarea
                        value={answer}
                        onChange={(e) =>
                            setAnswer(e.target.value)
                        }
                        disabled={!!evaluation}
                        placeholder="Type your answer here..."
                        className="min-h-[150px] sm:min-h-[220px] w-full resize-none rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />

                    {!evaluation && (
                        <>
                            <AnimatePresence>
                                {evaluatingAnswer && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        className="mt-4 sm:mt-5 rounded-xl sm:rounded-2xl overflow-hidden relative"
                                        style={{ background: "linear-gradient(135deg, #0c0a1e 0%, #0f172a 60%, #140c2a 100%)" }}
                                    >
                                        <motion.div
                                            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                                            style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.9), transparent)", boxShadow: "0 0 12px 4px rgba(139,92,246,0.5)" }}
                                            animate={{ y: [0, 80, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        />

                                        <div className="relative z-10 p-4 sm:p-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 sm:gap-4">

                                                    <div className="flex items-end gap-[3px] h-10 shrink-0">
                                                        {[0.4, 0.8, 0.55, 1, 0.65, 0.9, 0.45, 0.75, 0.5].map((h, i) => (
                                                            <motion.div
                                                                key={i}
                                                                className="w-1 rounded-full"
                                                                style={{ background: `hsl(${255 + i * 5}, 80%, 70%)`, minHeight: 4 }}
                                                                animate={{ scaleY: [h, h * 0.3 + 0.1, h, h * 0.6, h] }}
                                                                transition={{ duration: 0.8 + i * 0.07, repeat: Infinity, ease: "easeInOut", delay: i * 0.06 }}
                                                            />
                                                        ))}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs sm:text-sm font-bold text-violet-100">
                                                                Evaluating Answer
                                                            </span>
                                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/25 uppercase">
                                                                Q#{questionNumber}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 mt-1">
                                                            Scanning technical accuracy · reasoning depth · difficulty calibration
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="relative w-9 h-9 shrink-0">
                                                    <motion.div
                                                        className="absolute inset-0 rounded-full border-2 border-violet-500/40 border-t-violet-400"
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                                                    />
                                                    <motion.div
                                                        className="absolute inset-1.5 rounded-full border border-indigo-400/50 border-b-indigo-300"
                                                        animate={{ rotate: -360 }}
                                                        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                                                    />
                                                    <div className="absolute inset-3 rounded-full bg-violet-600/40" />
                                                </div>
                                            </div>

                                            {/* Multi-step progress dots */}
                                            <div className="mt-3 flex items-center gap-2">
                                                {["Parsing", "Scoring", "Calibrating"].map((label, i) => (
                                                    <motion.div
                                                        key={label}
                                                        className="flex items-center gap-1.5"
                                                        initial={{ opacity: 0, x: -6 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.3 }}
                                                    >
                                                        <motion.div
                                                            className="w-1.5 h-1.5 rounded-full bg-violet-400"
                                                            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
                                                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.35 }}
                                                        />
                                                        <span className="text-[10px] text-slate-500 font-mono">{label}</span>
                                                        {i < 2 && <span className="text-slate-700 text-[10px] ml-1">→</span>}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                onClick={submitAnswer}
                                disabled={
                                    evaluatingAnswer ||
                                    loadingFirstQuestion ||
                                    !answer.trim()
                                }
                                whileHover={{
                                    scale: evaluatingAnswer ? 1 : 1.01,
                                }}
                                whileTap={{
                                    scale: evaluatingAnswer ? 1 : 0.98,
                                }}
                                className={`mt-4 sm:mt-5 w-full rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg shadow-violet-200 transition hover:from-violet-500 hover:to-indigo-500 flex items-center justify-center gap-2 ${
                                    evaluatingAnswer ? "opacity-90 ring-2 ring-violet-400/60 cursor-wait animate-pulse" : "disabled:cursor-not-allowed disabled:opacity-40"
                                }`}
                            >
                                {evaluatingAnswer ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                        <span>Evaluating Answer...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Submit Answer</span>
                                        <Send className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>
                        </>
                    )}
                </motion.section>

                {/* Evaluation */}
                {evaluation && (
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
                        className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-white/70 bg-white/80 p-4 sm:p-6 md:p-8 shadow-xl backdrop-blur-xl"
                    >
                        <div className="mb-6">
                            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
                                AI Evaluation
                            </p>

                            <h3 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">
                                Your answer has been evaluated
                            </h3>
                        </div>

                        {/* Evaluation Details */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">

                            {/* Next Difficulty */}
                            <motion.div
                                whileHover={{
                                    scale: 1.02,
                                }}
                                className="rounded-xl sm:rounded-2xl border border-indigo-100 bg-indigo-50 p-3 sm:p-5"
                            >
                                <p className="text-xs sm:text-sm text-slate-500">
                                    Next difficulty
                                </p>

                                <p className="mt-1 sm:mt-2 text-lg sm:text-xl font-bold text-indigo-600">
                                    {
                                        evaluation.next_difficulty
                                    }
                                </p>
                            </motion.div>

                            {/* Current Question */}
                            <motion.div
                                whileHover={{
                                    scale: 1.02,
                                }}
                                className="rounded-xl sm:rounded-2xl border border-violet-100 bg-violet-50 p-3 sm:p-5"
                            >
                                <p className="text-xs sm:text-sm text-slate-500">
                                    Current question
                                </p>

                                <p className="mt-1 sm:mt-2 text-lg sm:text-xl font-bold text-violet-600">
                                    #{questionNumber}
                                </p>
                            </motion.div>
                        </div>

                        {/* Generating Next Question — Matrix Grid Pulse */}
                        <AnimatePresence>
                            {generatingNextQuestion && (
                                <motion.div
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -14 }}
                                    className="mt-5 rounded-2xl overflow-hidden relative"
                                    style={{ background: "linear-gradient(135deg, #0a0a1f 0%, #0f172a 50%, #0d0a20 100%)" }}
                                >
                                    {/* Grid dot overlay */}
                                    <div
                                        className="absolute inset-0 pointer-events-none opacity-20"
                                        style={{
                                            backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.6) 1px, transparent 1px)",
                                            backgroundSize: "18px 18px",
                                        }}
                                    />

                                    {/* Diagonal sweep */}
                                    <motion.div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: "linear-gradient(45deg, transparent 30%, rgba(99,102,241,0.15) 50%, transparent 70%)",
                                        }}
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    />

                                    <div className="relative z-10 p-5">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

                                            {/* Hexagonal node cluster */}
                                            <div className="relative shrink-0 w-14 h-14">
                                                {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                                                    <motion.div
                                                        key={deg}
                                                        className="absolute w-2.5 h-2.5 rounded-full bg-indigo-400"
                                                        style={{
                                                            top: `calc(50% + ${Math.sin((deg * Math.PI) / 180) * 20}px - 5px)`,
                                                            left: `calc(50% + ${Math.cos((deg * Math.PI) / 180) * 20}px - 5px)`,
                                                        }}
                                                        animate={{
                                                            scale: [0.6, 1.4, 0.6],
                                                            opacity: [0.4, 1, 0.4],
                                                            boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 8px 3px rgba(99,102,241,0.7)", "0 0 0px rgba(99,102,241,0)"],
                                                        }}
                                                        transition={{
                                                            duration: 1.5,
                                                            repeat: Infinity,
                                                            delay: i * 0.25,
                                                            ease: "easeInOut",
                                                        }}
                                                    />
                                                ))}
                                                <motion.div
                                                    className="absolute inset-4 rounded-full bg-indigo-600 shadow-[0_0_16px_5px_rgba(99,102,241,0.5)]"
                                                    animate={{ scale: [1, 1.15, 1] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                    <span className="text-sm font-bold text-indigo-100">
                                                        Synthesizing Question #{questionNumber + 1}
                                                    </span>
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 border border-indigo-400/30 uppercase">
                                                        {evaluation?.next_difficulty || difficulty}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400">
                                                    Adapting context · adjusting {evaluation?.next_difficulty || difficulty} complexity · building next challenge
                                                </p>

                                                <div className="mt-2.5 flex gap-1 flex-wrap">
                                                    {["resume_context", "chat_history", "difficulty_shift", "synthesis"].map((token, i) => (
                                                        <motion.span
                                                            key={token}
                                                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300/70 border border-indigo-700/30"
                                                            initial={{ opacity: 0, x: -4 }}
                                                            animate={{ opacity: [0, 1, 0.6] }}
                                                            transition={{ delay: i * 0.4, duration: 0.8, repeat: Infinity, repeatDelay: 1.6 - i * 0.3 }}
                                                        >
                                                            {token}
                                                        </motion.span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
                            <motion.button
                                onClick={nextQuestion}
                                disabled={generatingNextQuestion}
                                whileHover={{
                                    scale: generatingNextQuestion ? 1 : 1.01,
                                }}
                                whileTap={{
                                    scale: generatingNextQuestion ? 1 : 0.98,
                                }}
                                className={`flex-1 rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg shadow-violet-200 transition hover:from-violet-500 hover:to-indigo-500 flex items-center justify-center gap-2 ${
                                    generatingNextQuestion ? "opacity-90 ring-2 ring-indigo-400/60 cursor-wait animate-pulse" : "disabled:opacity-50"
                                }`}
                            >
                                {generatingNextQuestion ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                        <span>Generating Next Question...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Next Question</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>

                            {history.length >= 10 && (
                                <motion.button
                                    onClick={stopInterview}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center gap-2"
                                >
                                    <span>Finish Interview & View Report</span>
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            )}
                        </div>
                    </motion.section>
                )}

                
            </div>
        </main>
    );
}