"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { uploadResume } from "@/lib/api";
import UserQueryModal from "../components/UserQueryModal";
import { MessageSquarePlus, ShieldCheck } from "lucide-react";
import {
    FaRegFileAlt,
    FaCode,
    FaArrowRight,
    FaBrain,
    FaCheckCircle,
    FaCloudUploadAlt,
    FaSignOutAlt,
    FaUserCircle,
    FaHistory,
    FaLock,
    FaTerminal,
    FaLaptopCode,
} from "react-icons/fa";

export default function Dashboard() {
    const router = useRouter();

    const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
    const [resumeFile, setResumeFile] = useState(null);

    const [existingResumeName, setExistingResumeName] = useState(() => {
        if (typeof window !== "undefined") {
            return sessionStorage.getItem("resumeFileName") || "";
        }
        return "";
    });

    const [hasExistingResume, setHasExistingResume] = useState(() => {
        if (typeof window !== "undefined") {
            const storedResume = sessionStorage.getItem("resumeData");
            const storedName = sessionStorage.getItem("resumeFileName");
            return Boolean(storedResume && storedName);
        }
        return false;
    });

    const [difficulty, setDifficulty] = useState(() => {
        if (typeof window !== "undefined") {
            const storedDiff = sessionStorage.getItem("difficulty");

            if (
                storedDiff &&
                ["Easy", "Medium", "Hard"].includes(storedDiff)
            ) {
                return storedDiff;
            }
        }

        return "Easy";
    });

    const [loading, setLoading] = useState(false);
    const [activeAction, setActiveAction] = useState("");
    const [error, setError] = useState("");

    const [selectedLanguage, setSelectedLanguage] = useState(() => {
        if (typeof window !== "undefined") {
            return sessionStorage.getItem("selectedLanguage") || "python";
        }
        return "python";
    });

    const [codingEligibility, setCodingEligibility] = useState({
        isEligible: true,
        langs: [],
        checked: false,
    });

    const checkSkillsEligibility = (rdata) => {
        if (!rdata) return { isEligible: false, langs: [] };
        const skillsList = [
            ...(Array.isArray(rdata.skills) ? rdata.skills : []),
            ...(Array.isArray(rdata.programming_languages) ? rdata.programming_languages : []),
            ...(Array.isArray(rdata.technologies) ? rdata.technologies : []),
        ].map((s) => String(s).toLowerCase().trim());
        const text = skillsList.join(" ");

        const detected = [];
        if (/\bpython\b/.test(text)) detected.push("Python");
        const noJs = text.replace(/\bjavascript\b|\bjs\b/g, "");
        if (/\bjava\b/.test(noJs)) detected.push("Java");
        if (/\bjavascript\b|\bjs\b|\becmascript\b|\bnode(?:\.js)?\b/.test(text)) detected.push("JavaScript");
        if (/\bc\+\+|\bcpp\b/.test(text)) detected.push("C++");
        if (
            /\bc\s*programming|\blanguage\s*c\b|\bc\s*language\b|\bansi\s*c\b/.test(text) ||
            skillsList.some((s) => s === "c")
        )
            detected.push("C");

        return {
            isEligible: detected.length > 0,
            langs: Array.from(new Set(detected)),
        };
    };

    const [user, setUser] = useState(() => {
        if (typeof window !== "undefined") {
            const storedUser = localStorage.getItem("user");

            if (storedUser) {
                try {
                    return JSON.parse(storedUser);
                } catch (e) {
                    console.error("User parse error:", e);
                }
            }
        }

        return null;
    });




    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const storedResume =
                    sessionStorage.getItem("resumeData");

                const storedName =
                    sessionStorage.getItem("resumeFileName");

                if (storedResume && storedName) {
                    setExistingResumeName(storedName);
                    setHasExistingResume(true);
                    try {
                        const parsedResume = JSON.parse(storedResume);
                        const elig = checkSkillsEligibility(parsedResume);
                        setCodingEligibility({ ...elig, checked: true });
                    } catch (pe) {
                        console.error(pe);
                    }
                }

                const storedDiff =
                    sessionStorage.getItem("difficulty");

                if (
                    storedDiff &&
                    ["Easy", "Medium", "Hard"].includes(storedDiff)
                ) {
                    setDifficulty(storedDiff);
                }

                const storedUser =
                    localStorage.getItem("user");

                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error("Dashboard init error:", e);
            }
        }, 0);

        return () => clearTimeout(timer);
    }, []);




    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "application/pdf",
        ];

        if (
            !allowedTypes.includes(file.type) &&
            !file.name.toLowerCase().endsWith(".pdf")
        ) {
            setError(
                "Please upload a valid PDF file. (Backend requires PDF format)."
            );

            setResumeFile(null);
            return;
        }

        setError("");
        setResumeFile(file);
    };




    const handleClearResume = () => {
        setResumeFile(null);
        setHasExistingResume(false);
        setExistingResumeName("");

        sessionStorage.removeItem("resumeData");
        sessionStorage.removeItem("resumeFileName");
    };




    




    const handleStartInterview = async (
        interviewType = "coding"
    ) => {
        setActiveAction(interviewType);
        setError("");

        if (!resumeFile && !hasExistingResume) {
            setError(
                "Please upload your resume before starting the interview."
            );

            return;
        }

        try {
            setLoading(true);

            if (resumeFile) {
                const data = await uploadResume(resumeFile, user?.id || 1);

                console.log(
                    "RESUME UPLOAD RESPONSE:",
                    data
                );

                if (!data?.resume_data) {
                    throw new Error(
                        "Backend did not return resume_data"
                    );
                }

                sessionStorage.setItem(
                    "resumeData",
                    JSON.stringify(data.resume_data)
                );

                sessionStorage.setItem(
                    "resumeFileName",
                    data.filename || resumeFile.name
                );

                setExistingResumeName(
                    data.filename || resumeFile.name
                );

                setHasExistingResume(true);

                const elig = checkSkillsEligibility(data.resume_data);
                setCodingEligibility({ ...elig, checked: true });
            } else {
                const storedResume =
                    sessionStorage.getItem("resumeData");

                if (!storedResume) {
                    throw new Error(
                        "Resume session expired. Please upload your resume again."
                    );
                }

                try {
                    const parsedResume = JSON.parse(storedResume);
                    const elig = checkSkillsEligibility(parsedResume);
                    setCodingEligibility({ ...elig, checked: true });
                } catch (pe) {
                    console.error(pe);
                }
            }

            sessionStorage.setItem(
                "difficulty",
                difficulty
            );

            const storedUser =
                localStorage.getItem("user");

            let currentUser = null;

            if (storedUser) {
                try {
                    currentUser = JSON.parse(storedUser);
                } catch (e) {
                    console.error(
                        "User parse error:",
                        e
                    );
                }
            }

            if (!currentUser || !currentUser.id) {
                currentUser = {
                    id: 1,
                    name: "Candidate",
                };

                localStorage.setItem(
                    "user",
                    JSON.stringify(currentUser)
                );
            }

            
            if (interviewType === "coding") {
                const currentResumeData = JSON.parse(
                    sessionStorage.getItem("resumeData") || "{}"
                );
                const elig = checkSkillsEligibility(currentResumeData);
                setCodingEligibility({ ...elig, checked: true });

                if (!elig.isEligible) {
                    setError(
                        "You are not skilled in Python, Java, JavaScript, C++, or C programming. You cannot attend the coding interview."
                    );
                    setLoading(false);
                    return;
                }

                sessionStorage.setItem("selectedLanguage", selectedLanguage);
                router.push("/coding-interview");
            } else {
                router.push("/interview");
            }
        } catch (err) {
            console.error(
                "START INTERVIEW ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to start interview. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const hasResumeReady = Boolean(
        resumeFile || hasExistingResume
    );

    return (
        <main className="relative min-h-screen w-full overflow-x-hidden bg-[#f8f7ff] text-slate-900">



            <motion.div
                className="
                    pointer-events-none
                    fixed
                    -left-24
                    -top-24
                    h-56
                    w-56
                    rounded-full
                    bg-violet-300/30
                    blur-3xl

                    sm:-left-32
                    sm:-top-32
                    sm:h-80
                    sm:w-80

                    lg:h-96
                    lg:w-96
                "
                animate={{
                    x: [0, 60, 0],
                    y: [0, 40, 0],
                    scale: [1, 1.12, 1],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="
                    pointer-events-none
                    fixed
                    -right-24
                    top-24
                    h-56
                    w-56
                    rounded-full
                    bg-indigo-300/30
                    blur-3xl

                    sm:-right-32
                    sm:top-40
                    sm:h-80
                    sm:w-80

                    lg:h-96
                    lg:w-96
                "
                animate={{
                    x: [0, -60, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="
                    pointer-events-none
                    fixed
                    bottom-0
                    left-1/2
                    h-52
                    w-52
                    -translate-x-1/2
                    rounded-full
                    bg-purple-300/20
                    blur-3xl

                    sm:h-72
                    sm:w-72

                    lg:left-1/3
                    lg:h-80
                    lg:w-80
                    lg:translate-x-0
                "
                animate={{
                    y: [0, -50, 0],
                    x: [0, 30, 0],
                }}
                transition={{
                    duration: 11,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />



            <motion.nav
                initial={{
                    opacity: 0,
                    y: -20,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.6,
                }}
                className="
                    relative
                    z-30
                    border-b
                    border-white/70
                    bg-white/75
                    backdrop-blur-xl
                "
            >
                <div
                    className="
                        mx-auto
                        flex
                        min-h-16
                        max-w-7xl
                        items-center
                        justify-between
                        gap-3
                        px-4
                        py-3

                        sm:min-h-20
                        sm:px-6
                        sm:py-4

                        lg:px-8
                    "
                >


                    <div className="flex min-w-0 items-center gap-2.5">

                        <motion.div
                            whileHover={{
                                rotate: 5,
                                scale: 1.05,
                            }}
                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-gradient-to-br
                                from-violet-600
                                to-indigo-600
                                text-xs
                                font-bold
                                text-white
                                shadow-lg
                                shadow-violet-200

                                sm:h-10
                                sm:w-10
                                sm:text-sm
                            "
                        >
                            AI
                        </motion.div>

                        <div className="min-w-0">
                            <h1
                                className="
                                    truncate
                                    text-sm
                                    font-bold
                                    text-slate-900

                                    sm:text-base
                                    lg:text-lg
                                "
                            >
                                AI Interview Preparation
                            </h1>

                            <p
                                className="
                                    hidden
                                    text-xs
                                    text-slate-500

                                    sm:block
                                "
                            >
                                Practice Dashboard & Interview Setup
                            </p>
                        </div>
                    </div>


                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
                        

                       

                        {user ? (
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={() => router.push("/profile")}
                                    className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0 active:scale-95"
                                    title="View Profile & Reports"
                                >
                                    <FaArrowRight className="text-xs sm:text-sm" />
                                </button>
                                

                            </div>
                        ) : (
                            <button
                                onClick={() => router.push("/login")}
                                className="
            rounded-xl
            border
            border-slate-200
            bg-white
            px-3
            py-2
            text-xs
            font-semibold
            text-slate-700
            shadow-sm
            transition

            hover:border-violet-300
            hover:text-violet-600

            sm:px-3.5
            sm:text-sm
        "
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </motion.nav>



            <section
                className="
                    relative
                    z-10
                    mx-auto
                    w-full
                    max-w-7xl
                    px-4
                    py-7

                    sm:px-6
                    sm:py-10

                    lg:px-8
                    lg:py-12
                "
            >



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
                    className="mb-7 sm:mb-10"
                >

                    <span
                        className="
                            inline-flex
                            max-w-full
                            rounded-full
                            border
                            border-violet-200
                            bg-violet-50
                            px-3
                            py-1.5
                            text-[10px]
                            font-bold
                            tracking-wide
                            text-violet-600

                            sm:px-4
                            sm:py-2
                            sm:text-xs

                            md:text-sm
                        "
                    >
                        AI-POWERED INTERVIEW DASHBOARD
                    </span>

                    <h2
                        className="
                            mt-4
                            text-3xl
                            font-bold
                            leading-tight
                            tracking-tight
                            text-slate-900

                            sm:mt-5
                            sm:text-4xl

                            md:text-5xl
                        "
                    >
                        Prepare smarter.{" "}

                        <span
                            className="
                                bg-gradient-to-r
                                from-violet-600
                                to-indigo-600
                                bg-clip-text
                                text-transparent
                            "
                        >
                            Interview better.
                        </span>
                    </h2>

                    <p
                        className="
                            mt-4
                            max-w-3xl
                            text-sm
                            leading-6
                            text-slate-500

                            sm:text-base
                            sm:leading-7

                            md:text-lg
                            md:leading-relaxed
                        "
                    >
                        Upload your resume once, select your
                        difficulty level, and start either a{" "}
                        <strong className="text-violet-700">
                            Coding Interview
                        </strong>{" "}
                        or a{" "}
                        <strong className="text-indigo-700">
                            Technical Interview
                        </strong>{" "}
                        directly from this dashboard.
                    </p>
                </motion.div>



                <div
                    className="
                        grid
                        grid-cols-1
                        gap-5

                        sm:gap-6

                        lg:grid-cols-3
                        lg:gap-8
                    "
                >



                    <motion.div
                        initial={{
                            opacity: 0,
                            x: -30,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                        }}
                        transition={{
                            delay: 0.15,
                            duration: 0.6,
                        }}
                        className="min-w-0 lg:col-span-2"
                    >

                        <div
                            className="
                                rounded-3xl
                                border
                                border-white/80
                                bg-white/85
                                p-4
                                shadow-xl
                                shadow-violet-200/20
                                backdrop-blur-xl

                                sm:p-6

                                md:p-7

                                lg:p-8
                            "
                        >


                            <div
                                className="
                                    flex
                                    flex-col
                                    gap-4

                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-between
                                "
                            >

                                <div className="min-w-0">

                                    <h3
                                        className="
                                            text-xl
                                            font-bold
                                            text-slate-900

                                            sm:text-2xl
                                        "
                                    >
                                        Resume Information
                                    </h3>

                                    <p className="mt-1 text-sm leading-5 text-slate-500">
                                        PDF files are supported.
                                        AI extracts your skills
                                        to tailor questions.
                                    </p>
                                </div>

                                {hasResumeReady && (
                                    <span
                                        className="
                                            inline-flex
                                            w-fit
                                            shrink-0
                                            items-center
                                            gap-1.5
                                            rounded-full
                                            border
                                            border-green-200
                                            bg-green-50
                                            px-3
                                            py-1.5
                                            text-xs
                                            font-semibold
                                            text-green-700
                                        "
                                    >
                                        <FaCheckCircle className="text-green-500" />

                                        Resume Ready
                                    </span>
                                )}
                            </div>



                            {hasExistingResume &&
                                !resumeFile && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            scale: 0.98,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                        }}
                                        className="
                                            mt-5
                                            rounded-2xl
                                            border-2
                                            border-violet-200
                                            bg-gradient-to-br
                                            from-violet-50/70
                                            via-white
                                            to-violet-200/50
                                            p-4
                                            shadow-sm

                                            sm:mt-6
                                            sm:p-5

                                            md:p-6
                                        "
                                    >

                                        <div
                                            className="
                                                flex
                                                flex-col
                                                gap-4

                                                sm:flex-row
                                                sm:items-center
                                                sm:justify-between
                                            "
                                        >

                                            <div
                                                className="
                                                    flex
                                                    min-w-0
                                                    items-start
                                                    gap-3

                                                    sm:items-center
                                                    sm:gap-4
                                                "
                                            >

                                                <div
                                                    className="
                                                        flex
                                                        h-12
                                                        w-12
                                                        shrink-0
                                                        items-center
                                                        justify-center
                                                        rounded-2xl
                                                        bg-violet-100
                                                        text-xl
                                                        text-violet-600
                                                        shadow-sm

                                                        sm:h-14
                                                        sm:w-14
                                                        sm:text-2xl
                                                    "
                                                >
                                                    <FaRegFileAlt />
                                                </div>

                                                <div className="min-w-0">

                                                    <span
                                                        className="
                                                            text-[10px]
                                                            font-bold
                                                            uppercase
                                                            tracking-wider
                                                            text-violet-700

                                                            sm:text-xs
                                                        "
                                                    >
                                                        Active Uploaded Resume
                                                    </span>

                                                    <p
                                                        className="
                                                            mt-0.5
                                                            truncate
                                                            text-sm
                                                            font-bold
                                                            text-slate-900

                                                            sm:text-base
                                                        "
                                                    >
                                                        {existingResumeName}
                                                    </p>

                                                    <p
                                                        className="
                                                            mt-1
                                                            text-xs
                                                            leading-5
                                                            text-slate-500
                                                        "
                                                    >
                                                        Ready for Coding
                                                        or Technical
                                                        interview.
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={
                                                    handleClearResume
                                                }
                                                className="
                                                    w-full
                                                    shrink-0
                                                    rounded-xl
                                                    border
                                                    border-red-200
                                                    bg-white
                                                    px-3.5
                                                    py-2.5
                                                    text-xs
                                                    font-semibold
                                                    text-red-600
                                                    shadow-sm
                                                    transition

                                                    hover:bg-red-50

                                                    sm:w-auto
                                                "
                                            >
                                                Remove Resume
                                            </button>
                                        </div>
                                    </motion.div>
                                )}



                            {resumeFile && (
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        y: 10,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    className="
                                        mt-5
                                        flex
                                        flex-col
                                        gap-4
                                        rounded-2xl
                                        border-2
                                        border-violet-300
                                        bg-violet-50/60
                                        p-4

                                        sm:mt-6
                                        sm:flex-row
                                        sm:items-center
                                        sm:justify-between
                                        sm:p-5
                                    "
                                >

                                    <div
                                        className="
                                            flex
                                            min-w-0
                                            items-center
                                            gap-3
                                        "
                                    >

                                        <div
                                            className="
                                                flex
                                                h-11
                                                w-11
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-xl
                                                bg-violet-600
                                                text-lg
                                                text-white
                                                shadow-md

                                                sm:h-12
                                                sm:w-12
                                                sm:text-xl
                                            "
                                        >
                                            <FaRegFileAlt />
                                        </div>

                                        <div className="min-w-0">

                                            <p
                                                className="
                                                    truncate
                                                    text-sm
                                                    font-bold
                                                    text-slate-900
                                                "
                                            >
                                                {resumeFile.name}
                                            </p>

                                            <p
                                                className="
                                                    mt-0.5
                                                    text-xs
                                                    font-medium
                                                    text-violet-700
                                                "
                                            >
                                                {(
                                                    resumeFile.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(2)}{" "}
                                                MB • Ready to upload
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setResumeFile(null)
                                        }
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3.5
                                            py-2.5
                                            text-xs
                                            font-semibold
                                            text-slate-600
                                            transition

                                            hover:bg-slate-100

                                            sm:w-auto
                                        "
                                    >
                                        {hasExistingResume
                                            ? "Keep Previous Resume"
                                            : "Remove"}
                                    </button>
                                </motion.div>
                            )}



                            <label
                                className={`
                                    mt-5
                                    flex
                                    min-h-[190px]
                                    cursor-pointer
                                    flex-col
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    border-2
                                    border-dashed
                                    px-4
                                    py-7
                                    text-center
                                    transition

                                    sm:mt-6
                                    sm:min-h-[220px]
                                    sm:py-8

                                    ${hasResumeReady
                                        ? "border-slate-300 bg-slate-50/50 hover:border-violet-400 hover:bg-violet-50/30"
                                        : "border-violet-300 bg-gradient-to-br from-violet-50/90 to-indigo-50/90 hover:border-violet-500 hover:bg-violet-50"
                                    }
                                `}
                            >

                                <motion.div
                                    whileHover={{
                                        scale: 1.1,
                                        rotate: 4,
                                    }}
                                    className="
                                        mb-3
                                        flex
                                        h-14
                                        w-14
                                        items-center
                                        justify-center
                                        rounded-2xl
                                        bg-white
                                        text-2xl
                                        text-violet-600
                                        shadow-md

                                        sm:h-16
                                        sm:w-16
                                        sm:text-3xl
                                    "
                                >
                                    <FaCloudUploadAlt />
                                </motion.div>

                                <p
                                    className="
                                        max-w-full
                                        px-2
                                        text-sm
                                        font-bold
                                        leading-5
                                        text-slate-800

                                        sm:text-base
                                    "
                                >
                                    {hasResumeReady
                                        ? "Choose a different PDF resume to replace"
                                        : "Click or drag to upload your PDF resume"}
                                </p>

                                <p
                                    className="
                                        mt-1.5
                                        text-xs
                                        text-slate-500

                                        sm:text-sm
                                    "
                                >
                                    Supported format:
                                    Text-based PDF (Max 10 MB)
                                </p>

                                <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    className="hidden"
                                    onChange={
                                        handleFileChange
                                    }
                                />
                            </label>
                        </div>
                    </motion.div>



                    <motion.div
                        initial={{
                            opacity: 0,
                            x: 30,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                        }}
                        transition={{
                            delay: 0.25,
                            duration: 0.6,
                        }}
                        className="min-w-0 space-y-5 sm:space-y-6"
                    >



                        <div
                            className="
                                rounded-3xl
                                border
                                border-white/80
                                bg-white/85
                                p-4
                                shadow-xl
                                shadow-violet-200/20
                                backdrop-blur-xl

                                sm:p-6

                                md:p-7
                            "
                        >

                            <h3
                                className="
                                    text-lg
                                    font-bold
                                    text-slate-900

                                    sm:text-xl
                                "
                            >
                                Starting Difficulty
                            </h3>

                            <p
                                className="
                                    mt-1
                                    text-xs
                                    leading-5
                                    text-slate-500
                                "
                            >
                                Difficulty adapts dynamically
                                as you solve problems.
                            </p>

                            <div className="mt-4 space-y-2.5">

                                {[
                                    {
                                        level: "Easy",
                                        desc: "Basic concepts & clean fundamentals",
                                    },
                                    {
                                        level: "Medium",
                                        desc: "Data structures & practical logic",
                                    },
                                    {
                                        level: "Hard",
                                        desc: "Complex algorithms & edge-case mastery",
                                    },
                                ].map(
                                    ({
                                        level,
                                        desc,
                                    }) => (
                                        <motion.button
                                            key={level}
                                            type="button"
                                            whileHover={{
                                                scale: 1.01,
                                            }}
                                            whileTap={{
                                                scale: 0.98,
                                            }}
                                            onClick={() =>
                                                setDifficulty(
                                                    level
                                                )
                                            }
                                            className={`
                                                w-full
                                                rounded-2xl
                                                border
                                                p-3.5
                                                text-left
                                                transition

                                                ${difficulty ===
                                                    level
                                                    ? "border-violet-500 bg-gradient-to-r from-violet-50 to-indigo-50 shadow-sm"
                                                    : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                                                }
                                            `}
                                        >

                                            <div className="flex items-center justify-between gap-3">

                                                <span
                                                    className={`
                                                        text-sm
                                                        font-bold

                                                        ${difficulty ===
                                                            level
                                                            ? "text-violet-700"
                                                            : "text-slate-800"
                                                        }
                                                    `}
                                                >
                                                    {level}
                                                </span>

                                                {difficulty ===
                                                    level && (
                                                        <span
                                                            className="
                                                            flex
                                                            h-5
                                                            w-5
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            bg-gradient-to-r
                                                            from-violet-600
                                                            to-indigo-600
                                                            text-xs
                                                            font-bold
                                                            text-white
                                                        "
                                                        >
                                                            ✓
                                                        </span>
                                                    )}
                                            </div>

                                            <p
                                                className="
                                                    mt-0.5
                                                    text-[11px]
                                                    leading-4
                                                    text-slate-500
                                                "
                                            >
                                                {desc}
                                            </p>
                                        </motion.button>
                                    )
                                )}
                            </div>
                        </div>


                        <div
                            className="
                                rounded-3xl
                                border
                                border-white/80
                                bg-white/85
                                p-4
                                shadow-xl
                                shadow-violet-200/20
                                backdrop-blur-xl

                                sm:p-6

                                md:p-7
                            "
                        >

                            <h3
                                className="
                                    text-lg
                                    font-bold
                                    text-slate-900
                                "
                            >
                                Start Your Interview
                            </h3>

                            <p
                                className="
                                    mt-1
                                    text-xs
                                    leading-5
                                    text-slate-500
                                "
                            >
                                Choose an interview mode
                                below to begin immediately.
                            </p>



                            {hasResumeReady && codingEligibility.checked && (
                                <div className="mt-3">
                                    {codingEligibility.isEligible ? (
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800 shadow-sm flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FaCheckCircle className="text-emerald-600 shrink-0 text-sm" />
                                                <span className="truncate">
                                                    Verified Skills: <strong>{codingEligibility.langs.join(", ")}</strong>
                                                </span>
                                            </div>
                                            <span className="shrink-0 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                                Coding Ready ✓
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 shadow-sm flex items-start gap-2.5">
                                            <FaLock className="text-amber-600 shrink-0 mt-0.5 text-sm" />
                                            <div>
                                                <p className="font-bold">Coding Interview Locked</p>
                                                <p className="mt-0.5 text-[11px] leading-4 text-amber-700">
                                                    You are not skilled in Python, Java, JavaScript, C++, or C programming. You cannot attend the coding interview.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 space-y-3">


                                <motion.button
                                    type="button"
                                    whileHover={
                                        !loading &&
                                            hasResumeReady
                                            ? {
                                                scale: 1.02,
                                            }
                                            : {}
                                    }
                                    whileTap={
                                        !loading &&
                                            hasResumeReady
                                            ? {
                                                scale: 0.98,
                                            }
                                            : {}
                                    }
                                    onClick={() =>
                                        handleStartInterview(
                                            "coding"
                                        )
                                    }
                                    disabled={
                                        loading ||
                                        !hasResumeReady
                                    }
                                    className="
                                        group
                                        relative
                                        w-full
                                        overflow-hidden
                                        rounded-2xl
                                        bg-gradient-to-r
                                        from-violet-600
                                        via-indigo-600
                                        to-purple-600
                                        p-4
                                        text-left
                                        font-semibold
                                        text-white
                                        shadow-lg
                                        shadow-violet-500/25
                                        transition

                                        disabled:cursor-not-allowed
                                        disabled:opacity-40
                                    "
                                >

                                    <div className="flex items-center justify-between gap-3">

                                        <div className="flex min-w-0 items-center gap-3">

                                            <div
                                                className="
                                                    flex
                                                    h-10
                                                    w-10
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-xl
                                                    bg-white/20
                                                    text-white
                                                    backdrop-blur
                                                "
                                            >
                                                {hasResumeReady && codingEligibility.checked && !codingEligibility.isEligible ? (
                                                    <FaLock size={18} className="text-amber-300" />
                                                ) : (
                                                    <FaCode size={18} />
                                                )}
                                            </div>

                                            <div className="min-w-0">

                                                <span
                                                    className="
                                                        block
                                                        truncate
                                                        text-sm
                                                        font-bold
                                                        text-white

                                                        sm:text-base
                                                    "
                                                >
                                                    Start Coding Interview
                                                </span>

                                                <span
                                                    className="
                                                        mt-0.5
                                                        block
                                                        text-[10px]
                                                        font-normal
                                                        leading-4
                                                        text-violet-200

                                                        sm:text-[11px]
                                                    "
                                                >
                                                    {selectedLanguage.toUpperCase()} compiler environment & live challenge
                                                </span>
                                            </div>
                                        </div>

                                        <span
                                            className="
                                                shrink-0
                                                text-lg
                                                transition-transform
                                                group-hover:translate-x-1
                                            "
                                        >
                                            {loading &&
                                                activeAction ===
                                                "coding"
                                                ? ""
                                                : "→"}
                                        </span>
                                    </div>

                                    {loading &&
                                        activeAction ===
                                        "coding" && (
                                            <p
                                                className="
                                                    mt-2
                                                    text-[11px]
                                                    italic
                                                    leading-4
                                                    text-violet-100
                                                "
                                            >
                                                Processing resume &
                                                preparing coding
                                                challenge...
                                            </p>
                                        )}
                                </motion.button>


                                <motion.button
                                    type="button"
                                    whileHover={
                                        !loading &&
                                            hasResumeReady
                                            ? {
                                                scale: 1.02,
                                            }
                                            : {}
                                    }
                                    whileTap={
                                        !loading &&
                                            hasResumeReady
                                            ? {
                                                scale: 0.98,
                                            }
                                            : {}
                                    }
                                    onClick={() =>
                                        handleStartInterview(
                                            "technical"
                                        )
                                    }
                                    disabled={
                                        loading ||
                                        !hasResumeReady
                                    }
                                    className="
                                        group
                                        w-full
                                        rounded-2xl
                                        border-2
                                        border-indigo-200
                                        bg-white
                                        p-4
                                        text-left
                                        font-semibold
                                        text-slate-800
                                        shadow-sm
                                        transition

                                        hover:border-indigo-400
                                        hover:bg-indigo-50/50

                                        disabled:cursor-not-allowed
                                        disabled:opacity-40
                                    "
                                >

                                    <div className="flex items-center justify-between gap-3">

                                        <div className="flex min-w-0 items-center gap-3">

                                            <div
                                                className="
                                                    flex
                                                    h-10
                                                    w-10
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-xl
                                                    bg-indigo-100
                                                    text-indigo-700
                                                "
                                            >
                                                <FaBrain size={18} />
                                            </div>

                                            <div className="min-w-0">

                                                <span
                                                    className="
                                                        block
                                                        truncate
                                                        text-sm
                                                        font-bold
                                                        text-slate-900

                                                        sm:text-base
                                                    "
                                                >
                                                    Start Technical Interview
                                                </span>

                                                <span
                                                    className="
                                                        mt-0.5
                                                        block
                                                        text-[10px]
                                                        font-normal
                                                        leading-4
                                                        text-slate-500

                                                        sm:text-[11px]
                                                    "
                                                >
                                                    Resume Q&A with
                                                    AI evaluation
                                                </span>
                                            </div>
                                        </div>

                                        <span
                                            className="
                                                shrink-0
                                                text-lg
                                                text-indigo-600
                                                transition-transform
                                                group-hover:translate-x-1
                                            "
                                        >
                                            {loading &&
                                                activeAction ===
                                                "technical"
                                                ? ""
                                                : "→"}
                                        </span>
                                    </div>

                                    {loading &&
                                        activeAction ===
                                        "technical" && (
                                            <p
                                                className="
                                                    mt-2
                                                    text-[11px]
                                                    italic
                                                    leading-4
                                                    text-indigo-600
                                                "
                                            >
                                                Processing resume &
                                                generating first
                                                question...
                                            </p>
                                        )}
                                </motion.button>
                            </div>


                            {!hasResumeReady && (
                                <p
                                    className="
                                        mt-3
                                        text-center
                                        text-[11px]
                                        font-medium
                                        leading-4
                                        text-amber-600

                                        sm:text-xs
                                    "
                                >
                                    Please upload your resume
                                    on the left to activate
                                    interview buttons.
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            <UserQueryModal
                isOpen={isQueryModalOpen}
                onClose={() => setIsQueryModalOpen(false)}
            />
        </main>
    );
}