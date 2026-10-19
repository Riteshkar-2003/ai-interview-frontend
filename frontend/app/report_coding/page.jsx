// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function CodingReportPage() {

//   const router = useRouter();

//   const [report, setReport] =
//     useState(null);

//   const [loading, setLoading] =
//     useState(true);


//   useEffect(() => {

//     try {

//       const storedReport =
//         sessionStorage.getItem(
//           "codingReport"
//         );


//       if (!storedReport) {

//         router.push(
//           "/coding-interview"
//         );

//         return;
//       }


//       const parsedReport =
//         JSON.parse(storedReport);


//       console.log(
//         "CODING REPORT:",
//         parsedReport
//       );


//       /*
//        * Backend response:
//        *
//        * {
//        *   success: true,
//        *   user_id: 1,
//        *   report: {...}
//        * }
//        */

//       setReport(
//         parsedReport.report ||
//         parsedReport
//       );

//     } catch (error) {

//       console.error(
//         "Report loading error:",
//         error
//       );

//     } finally {

//       setLoading(false);
//     }

//   }, [router]);


//   // =====================================================
//   // LOADING
//   // =====================================================

//   if (loading) {

//     return (

//       <div className="min-h-screen flex items-center justify-center bg-slate-50">

//         <p className="text-lg">
//           Loading your report...
//         </p>

//       </div>

//     );
//   }


//   if (!report) {
//     return null;
//   }


//   return (

//     <div className="min-h-screen bg-slate-50 p-6">

//       <div className="max-w-6xl mx-auto">


//         {/* =================================================
//             HEADER
//         ================================================= */}

//         <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

//             <div>

//               <h1 className="text-3xl font-bold">
//                 Coding Interview Report
//               </h1>

//               <p className="text-gray-500 mt-2">
//                 AI-generated evaluation of your coding interview
//               </p>

//             </div>


//             <button
//               onClick={() =>
//                 router.push(
//                   "/dashboard"
//                 )
//               }
//               className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition shadow-sm"
//             >
//               Back to Dashboard
//             </button>

//           </div>

//         </div>


//         {/* =================================================
//             SCORE CARDS
//         ================================================= */}

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">


//           <Score
//             title="Overall"
//             value={
//               report.overall_score
//             }
//           />


//           <Score
//             title="Correctness"
//             value={
//               report.correctness_score
//             }
//           />


//           <Score
//             title="Code Quality"
//             value={
//               report.code_quality_score
//             }
//           />


//           <Score
//             title="Explanation"
//             value={
//               report.explanation_score
//             }
//           />


//           <Score
//             title="Problem Solving"
//             value={
//               report.problem_solving_score
//             }
//           />

//         </div>


//         {/* =================================================
//             COMPLEXITY
//         ================================================= */}

//         <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">

//           <h2 className="text-2xl font-bold">
//             Complexity Analysis
//           </h2>


//           <div className="grid md:grid-cols-2 gap-4 mt-5">


//             <div className="bg-gray-50 rounded-xl p-5">

//               <p className="text-gray-500">
//                 Time Complexity
//               </p>

//               <p className="text-xl font-bold mt-2">
//                 {report.time_complexity ||
//                   "Not available"}
//               </p>

//             </div>


//             <div className="bg-gray-50 rounded-xl p-5">

//               <p className="text-gray-500">
//                 Space Complexity
//               </p>

//               <p className="text-xl font-bold mt-2">
//                 {report.space_complexity ||
//                   "Not available"}
//               </p>

//             </div>

//           </div>

//         </div>


//         {/* =================================================
//             FEEDBACK
//         ================================================= */}

//         <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">

//           <h2 className="text-2xl font-bold">
//             AI Feedback
//           </h2>


//           <p className="text-gray-600 mt-4 leading-7 whitespace-pre-line">

//             {report.feedback ||
//               "No feedback available."}

//           </p>

//         </div>


//         {/* =================================================
//             STRENGTHS
//         ================================================= */}

//         <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">

//           <h2 className="text-2xl font-bold">
//             Strengths
//           </h2>


//           {Array.isArray(
//             report.strengths
//           ) &&
//           report.strengths.length > 0 ? (

//             <ul className="list-disc ml-6 mt-4 space-y-2">

//               {report.strengths.map(
//                 (item, index) => (

//                   <li
//                     key={index}
//                     className="text-gray-700"
//                   >
//                     {item}
//                   </li>

//                 )
//               )}

//             </ul>

//           ) : (

//             <p className="text-gray-500 mt-4">
//               No strengths available.
//             </p>

//           )}

//         </div>


//         {/* =================================================
//             IMPROVEMENTS
//         ================================================= */}

//         <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">

//           <h2 className="text-2xl font-bold">
//             Areas for Improvement
//           </h2>


//           {Array.isArray(
//             report.improvements
//           ) &&
//           report.improvements.length > 0 ? (

//             <ul className="list-disc ml-6 mt-4 space-y-2">

//               {report.improvements.map(
//                 (item, index) => (

//                   <li
//                     key={index}
//                     className="text-gray-700"
//                   >
//                     {item}
//                   </li>

//                 )
//               )}

//             </ul>

//           ) : (

//             <p className="text-gray-500 mt-4">
//               No improvement suggestions available.
//             </p>

//           )}

//         </div>


//         {/* =================================================
//             BUTTONS
//         ================================================= */}

//         <div className="flex flex-wrap gap-4 mt-6 mb-10">


//           <button
//             onClick={() => {

//               sessionStorage.removeItem(
//                 "codingReport"
//               );

//               router.push(
//                 "/coding-interview"
//               );

//             }}
//             className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
//           >
//             Start New Interview
//           </button>


//           <button
//             onClick={() =>
//               router.push(
//                 "/dashboard"
//               )
//             }
//             className="px-6 py-3 bg-white hover:bg-slate-50 border border-gray-300 font-semibold rounded-xl text-slate-700 transition"
//           >
//             Back to Dashboard
//           </button>

//         </div>

//       </div>

//     </div>
//   );
// }


// /* =========================================================
//    SCORE COMPONENT
// ========================================================= */

// function Score({
//   title,
//   value
// }) {

//   return (

//     <div className="bg-white rounded-2xl shadow-sm p-5">

//       <p className="text-gray-500">
//         {title}
//       </p>


//       <p className="text-3xl font-bold mt-2">

//         {value ?? 0}/10

//       </p>

//     </div>

//   );
// }







"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  Trophy,
  Code2,
  Sparkles,
  Brain,
  CheckCircle2,
  Gauge,
  Clock3,
  Boxes,
  ArrowLeft,
  RotateCcw,
  TrendingUp,
  Target,
} from "lucide-react";

export default function CodingReportPage() {
  const router = useRouter();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedReport = sessionStorage.getItem("codingReport");

      if (!storedReport) {
        router.push("/coding-interview");
        return;
      }

      const parsedReport = JSON.parse(storedReport);

      console.log("CODING REPORT:", parsedReport);

      setReport(parsedReport.report || parsedReport);
    } catch (error) {
      console.error("Report loading error:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f7ff]">
        <BackgroundBlobs />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 rounded-3xl border border-white/70 bg-white/80 p-10 text-center shadow-2xl backdrop-blur-xl"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="mx-auto mb-6 h-14 w-14 rounded-full border-4 border-violet-100 border-t-violet-600"
          />

          <h2 className="text-2xl font-bold text-slate-900">
            Generating your coding report...
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            AI is analyzing your coding performance.
          </p>
        </motion.div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f7ff]">
        <BackgroundBlobs />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 rounded-3xl border border-white/70 bg-white/80 p-10 text-center shadow-xl backdrop-blur-xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <Code2 size={32} />
          </div>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            Coding Report Unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            We could not load your coding interview report.
          </p>

          <button
            onClick={() => router.push("/coding-interview")}
            className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-200 transition hover:from-violet-500 hover:to-indigo-500"
          >
            Back to Coding Interview
          </button>
        </motion.div>
      </main>
    );
  }

  // =========================================================
  // SCORES
  // =========================================================

  const scores = [
    {
      title: "Overall",
      value: report.overall_score,
      icon: Trophy,
    },
    {
      title: "Correctness",
      value: report.correctness_score,
      icon: CheckCircle2,
    },
    {
      title: "Code Quality",
      value: report.code_quality_score,
      icon: Code2,
    },
    {
      title: "Explanation",
      value: report.explanation_score,
      icon: Brain,
    },
    {
      title: "Problem Solving",
      value: report.problem_solving_score,
      icon: Target,
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f7ff] text-slate-900">
      <BackgroundBlobs />

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 border-b border-white/70 bg-white/70 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200">
              <Code2 size={21} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-xl">
                AI Interview Preparation
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Coding Interview Performance Report
              </p>
            </div>
          </div>

          <motion.button
            onClick={() => router.push("/profile")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-violet-600 shadow-sm transition hover:bg-violet-50 sm:px-5 sm:py-2.5"
          >
            <span className="hidden sm:inline">View Profile</span>
            <span className="sm:hidden">Profile</span>
          </motion.button>
        </div>
      </motion.header>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {/* ===================================================
            PAGE INTRO
        =================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 sm:mb-10"
        >
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Sparkles size={17} />
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 sm:text-sm">
              AI ANALYSIS COMPLETE
            </p>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Your coding interview
            <br />

            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              performance report.
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Review your coding performance, correctness, code quality,
            problem-solving ability, and personalized AI feedback.
          </p>
        </motion.div>

        {/* ===================================================
            HERO SCORE CARD
        =================================================== */}

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur-xl sm:p-8"
        >
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="w-full">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200">
                  <Code2 size={24} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Coding Interview
                  </p>

                  <h3 className="text-xl font-bold text-slate-900">
                    Overall Performance
                  </h3>
                </div>
              </div>

              <p className="mt-6 text-sm font-medium text-slate-500">
                Interview Level
              </p>

              <h2 className="mt-1 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                {report.difficulty || "Completed"}
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                {report.feedback ||
                  "Your coding interview has been evaluated by the AI system."}
              </p>
            </div>

            {/* SCORE CIRCLE */}

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 p-2 shadow-2xl shadow-violet-200 sm:h-44 sm:w-44"
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
                <Trophy className="mb-1 text-violet-600" size={24} />

                <p className="text-4xl font-bold text-slate-900">
                  {report.overall_score ?? 0}
                </p>

                <p className="text-xs font-medium text-slate-400">
                  OUT OF 10
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ===================================================
            SCORE CARDS
        =================================================== */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {scores.map((item, index) => {
            const Icon = item.icon;
            const score = Number(item.value) || 0;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.15 + index * 0.08,
                }}
                whileHover={{
                  y: -5,
                  scale: 1.02,
                }}
                className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200">
                    <Icon size={20} />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {score}
                  <span className="ml-1 text-sm font-medium text-slate-400">
                    /10
                  </span>
                </p>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(score * 10, 100)}%`,
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 0.4 + index * 0.1,
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ===================================================
            CODE DETAILS
        =================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <InfoCard
            icon={<Gauge size={22} />}
            title="Code Quality"
            subtitle="How clean and maintainable your solution was"
          >
            <ScoreBar
              label="Code Quality"
              score={report.code_quality_score}
            />

            <ScoreBar
              label="Correctness"
              score={report.correctness_score}
            />
          </InfoCard>

          <InfoCard
            icon={<Brain size={22} />}
            title="Problem Solving"
            subtitle="How effectively you approached the problem"
          >
            <ScoreBar
              label="Problem Solving"
              score={report.problem_solving_score}
            />

            <ScoreBar
              label="Explanation"
              score={report.explanation_score}
            />
          </InfoCard>
        </div>

        {/* ===================================================
            COMPLEXITY ANALYSIS
        =================================================== */}

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-6 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur-xl sm:p-7"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
              <TrendingUp size={22} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Complexity Analysis
              </h3>

              <p className="text-sm text-slate-500">
                Efficiency of your submitted solution
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ComplexityCard
              icon={<Clock3 size={21} />}
              title="Time Complexity"
              value={report.time_complexity}
            />

            <ComplexityCard
              icon={<Boxes size={21} />}
              title="Space Complexity"
              value={report.space_complexity}
            />
          </div>
        </motion.section>

        {/* ===================================================
            FEEDBACK
        =================================================== */}

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-6 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 shadow-xl sm:p-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
              <Sparkles size={22} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
                AI INSIGHT
              </p>

              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
                AI Feedback
              </h3>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/70 bg-white/70 p-5">
            <p className="text-sm leading-8 text-slate-600">
              {report.feedback || "No feedback available."}
            </p>
          </div>
        </motion.section>

        {/* ===================================================
            STRENGTHS + IMPROVEMENTS
        =================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* STRENGTHS */}

          <motion.section
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur-xl sm:p-7"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={23} />
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

            <div className="mt-6 space-y-3">
              {Array.isArray(report.strengths) &&
              report.strengths.length > 0 ? (
                report.strengths.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.08,
                    }}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-slate-600"
                  >
                    <span className="mr-2 font-bold text-emerald-600">
                      ✓
                    </span>

                    {item}
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No strengths available.
                </p>
              )}
            </div>
          </motion.section>

          {/* IMPROVEMENTS */}

          <motion.section
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur-xl sm:p-7"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <TrendingUp size={23} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Areas for Improvement
                </h3>

                <p className="text-sm text-slate-500">
                  Focus areas for your next interview
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {Array.isArray(report.improvements) &&
              report.improvements.length > 0 ? (
                report.improvements.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.08,
                    }}
                    className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm leading-6 text-slate-600"
                  >
                    <span className="mr-2 font-bold text-amber-600">
                      {index + 1}.
                    </span>

                    {item}
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No improvement suggestions available.
                </p>
              )}
            </div>
          </motion.section>
        </div>

        {/* ===================================================
            ACTION BUTTONS
        =================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"
        >
          <motion.button
            onClick={() => router.push("/dashboard")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-violet-200 transition hover:from-violet-500 hover:to-indigo-500"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </motion.button>

          <motion.button
            onClick={() => {
              sessionStorage.removeItem("codingReport");
              router.push("/coding-interview");
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white px-7 py-3.5 font-semibold text-violet-600 shadow-sm transition hover:bg-violet-50"
          >
            <RotateCcw size={18} />
            Start New Interview
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}


// =========================================================
// BACKGROUND BLOBS
// =========================================================

function BackgroundBlobs() {
  return (
    <>
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
    </>
  );
}


// =========================================================
// INFO CARD
// =========================================================

function InfoCard({ icon, title, subtitle, children }) {
  return (
    <motion.section
      whileHover={{ y: -3 }}
      className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur-xl sm:p-7"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
          {icon}
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {title}
          </h3>

          <p className="text-sm text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {children}
      </div>
    </motion.section>
  );
}


// =========================================================
// SCORE BAR
// =========================================================

function ScoreBar({ label, score }) {
  const value = Number(score) || 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">
          {label}
        </p>

        <p className="text-sm font-bold text-slate-900">
          {value}/10
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${Math.min(value * 10, 100)}%`,
          }}
          transition={{ duration: 0.8 }}
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600"
        />
      </div>
    </div>
  );
}


// =========================================================
// COMPLEXITY CARD
// =========================================================

function ComplexityCard({ icon, title, value }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          {icon}
        </div>

        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>
      </div>

      <p className="mt-4 break-words text-lg font-bold text-slate-900 sm:text-xl">
        {value || "Not available"}
      </p>
    </motion.div>
  );
}