
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfilePage, getUserQueries } from "../../lib/api";
import UserQueryModal from "../components/UserQueryModal";
import { motion, AnimatePresence } from "framer-motion";

import {
  Brain,
  User,
  LogOut,
  FileText,
  Code2,
  BarChart3,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Target,
  Code,
  MessageSquare,
  Lightbulb,
  MessageSquarePlus,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Send,
  Calendar,
  ChevronRight,
  Check,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  // ==========================================
  // TECHNICAL INTERVIEW REPORT
  // ==========================================

  const [report, setReport] = useState({
    overall_score: null,
    technical_score: null,
    skills_score: null,
    projects_score: null,
    experience_score: null,
    final_level: null,
    created_at: null,
  });

  const [hasReport, setHasReport] = useState(false);

  // ==========================================
  // CODING INTERVIEW REPORT
  // ==========================================

  const [codingReport, setCodingReport] = useState({
    overall_score: null,
    correctness_score: null,
    code_quality_score: null,
    explanation_score: null,
    problem_solving_score: null,
    time_complexity: null,
    space_complexity: null,
    feedback: null,
    strengths: null,
    improvements: null,
    difficulty: null,
    language: null,
    created_at: null,
  });

  const [hasCodingReport, setHasCodingReport] = useState(false);

  // ==========================================
  // USER QUERIES & CONCERNS
  // ==========================================
  const [queries, setQueries] = useState([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [queryFilter, setQueryFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUserQueries(uid) {
    try {
      setLoadingQueries(true);
      const res = await getUserQueries(uid);
      if (res && res.success) {
        setQueries(res.queries || []);
      }
    } catch (err) {
      console.warn("Could not load user queries:", err);
    } finally {
      setLoadingQueries(false);
    }
  }

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setError("User session not found. Please login again.");
        setLoading(false);
        return;
      }

      const userData = JSON.parse(storedUser);

      if (!userData.id) {
        setError("User ID not found in login session.");
        setLoading(false);
        return;
      }

      setUser(userData);

      const userId = Number(userData.id);

      if (!Number.isInteger(userId)) {
        setError("Invalid user ID.");
        setLoading(false);
        return;
      }

      console.log("Logged-in User ID:", userId);

      // Load both report data and raised concerns
      loadUserQueries(userId);

      const data = await getProfilePage(userId);

      console.log("Dashboard API response:", data);

      if (!data || !data.success) {
        setHasReport(false);
        setHasCodingReport(false);
        return;
      }

      // ==========================================
      // TECHNICAL REPORT
      // ==========================================

      setHasReport(
        Boolean(data.has_previous_report)
      );

      if (data.report) {
        setReport(data.report);
      }

      // ==========================================
      // CODING REPORT
      // ==========================================

      let codingRep = data.coding_report || null;
      let hasCoding = Boolean(data.has_previous_coding_report && data.coding_report);

      if (!codingRep && typeof window !== "undefined") {
        const storedCodingReport = sessionStorage.getItem("codingReport");
        if (storedCodingReport) {
          try {
            codingRep = JSON.parse(storedCodingReport);
            hasCoding = true;
          } catch (e) {
            console.error("Error parsing stored coding report:", e);
          }
        }
      }

      if (codingRep) {
        if (!codingRep.difficulty || codingRep.difficulty === "-") {
          codingRep.difficulty = (typeof window !== "undefined" ? sessionStorage.getItem("difficulty") : null) || "Easy";
        }
        if (!codingRep.language || codingRep.language === "-") {
          codingRep.language = "Python";
        }
        setCodingReport(codingRep);
        setHasCodingReport(true);
      } else {
        setHasCodingReport(false);
      }

    } catch (error) {
      console.error("Dashboard error:", error);

      setError(
        error.message || "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleStartInterview = () => {
    router.push("/dashboard");
  };

  // ==========================================
  // DISPLAY VALUE
  // ==========================================

  function displayValue(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    return value;
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  function handleLogout() {
    localStorage.removeItem("user");

    sessionStorage.removeItem("resumeData");
    sessionStorage.removeItem("resumeFileName");
    sessionStorage.removeItem("difficulty");
    sessionStorage.removeItem("codingReport");

    router.push("/");
  }

  // ==========================================
  // LOADING
  // ==========================================

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
          className="relative z-10 rounded-2xl border border-slate-800 bg-slate-900 px-10 py-8 shadow-2xl"
        >
          <div className="flex items-center gap-4">

            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              className="h-8 w-8 rounded-full border-4 border-slate-700 border-t-violet-500"
            />

            <p className="text-lg font-semibold text-white">
              Loading Dashboard...
            </p>

          </div>
        </motion.div>

      </main>
    );
  }

  // ==========================================
  // USER NOT FOUND
  // ==========================================

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f7ff]">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading your profile...
          </p>

        </div>

      </main>
    );
  }

  const firstName =
    user.name?.split(" ")[0] || "User";

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f7ff]">

      {/* ====================================== */}
      {/* BACKGROUND */}
      {/* ====================================== */}

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

      {/* ====================================== */}
      {/* NAVBAR */}
      {/* ====================================== */}

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl"
      >
          <div className="mx-auto flex min-h-[64px] w-full max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-5 sm:py-4 lg:px-8">

            {/* ==================== LOGO ==================== */}

            <div className="flex min-w-0 items-center gap-2 sm:gap-3">

              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-violet-200 sm:h-10 sm:w-10 sm:text-sm"
              >
                AI
              </motion.div>

              {/* Platform Name */}
              <div className="min-w-0">

                <h1 className="truncate text-xs font-bold text-slate-900 sm:text-sm md:text-base lg:text-lg">
                  AI Interview
                </h1>

                <p className="hidden text-[10px] text-slate-500 sm:block md:text-xs">
                  Preparation Platform
                </p>

              </div>

            </div>


            {/* ==================== USER SECTION ==================== */}

            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 md:gap-3">

              {/* ADMIN DASHBOARD BUTTON – icon-only on mobile, full on md+ */}
              

              {/* INTERVIEW HISTORY BUTTON – icon-only on mobile, text on sm+ */}
              <button
                type="button"
                onClick={() => router.push("/history")}
                className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/80 px-2 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 shadow-sm sm:px-3"
              >
                <span className="hidden sm:inline">Interview History</span>
                <span className="sm:hidden text-violet-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                </span>
              </button>

              <div className="min-w-0 max-w-[90px] text-right sm:max-w-[150px] md:max-w-[220px] lg:max-w-[280px]">

                {/* Username */}
                <p className="truncate text-[11px] font-bold text-slate-800 sm:text-sm md:text-base">
                  {user?.name || "User"}
                </p>

                {/* Email */}
                <p className="hidden truncate text-[9px] text-slate-500 sm:block sm:text-xs md:text-sm">
                  {user?.email || ""}
                </p>

              </div>


              {/* User Icon */}

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 sm:h-10 sm:w-10 md:h-11 md:w-11"
              >
                <User size={18} className="sm:h-5 sm:w-5" />
              </motion.div>


              {/* Logout */}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600 sm:h-10 sm:w-10"
                title="Logout"
              >
                <LogOut size={17} className="sm:h-[19px] sm:w-[19px]" />
              </motion.button>

            </div>

          </div>
      </motion.header>

      {/* ====================================== */}
      {/* CONTENT */}
      {/* ====================================== */}

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">

        {/* ====================================== */}
        {/* HERO */}
        {/* ====================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white shadow-xl shadow-violet-200 md:p-10"
        >
          {/* Background decoration */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

          <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

          {/* Content */}
          <div className="relative max-w-3xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles size={16} />

              AI INTERVIEW PREPARATION
            </div>

            {/* Heading */}
            <h2 className="mt-5 text-3xl font-extrabold md:text-4xl">
              Welcome back, {firstName}!
            </h2>

            {/* Description */}
            <p className="mt-4 max-w-2xl leading-7 text-violet-100">
              Practice technical and coding interviews with AI
              and receive personalized feedback based on your
              performance.
            </p>

            {/* Start Interview Button */}
            <button
              onClick={handleStartInterview}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-violet-700 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-violet-50 hover:shadow-xl active:translate-y-0"
            >
              Start Interview
              <ArrowRight size={18} />
            </button>

          </div>
        </motion.section>

        {/* ====================================== */}
        {/* STAT CARDS */}
        {/* ====================================== */}

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            icon={FileText}
            title="Resume"
            value="Ready"
            description="Upload your resume"
          />

          <StatCard
            icon={Brain}
            title="AI Interview"
            value="Available"
            description="Adaptive questions"
          />

          <StatCard
            icon={Code2}
            title="Coding"
            value="Available"
            description="Practice coding"
          />

          <StatCard
            icon={BarChart3}
            title="Reports"
            value={
              hasReport || hasCodingReport
                ? "Updated"
                : "Track"
            }
            description="View performance"
          />

        </section>

       
        {/* ================================================= */}
        {/* TECHNICAL INTERVIEW REPORT */}
        {/* ================================================= */}

        <ReportSection
          title="Previous Technical Interview Report"
          subtitle={
            hasReport
              ? "Your latest technical interview performance"
              : "Complete a technical interview to generate your report"
          }
          completed={hasReport}
        >

          {!hasReport ? (

            /* ============================================= */
            /* NO TECHNICAL INTERVIEW */
            /* ============================================= */

            <EmptyReport
              icon={Brain}
              title="No Technical Interview Yet"
              description="Attend your first AI technical interview to generate your personalized technical performance report."
              buttonText="Start Technical Interview"
              onClick={() =>
                router.push("/dashboard")
              }
            />

          ) : (

            /* ============================================= */
            /* TECHNICAL REPORT */
            /* ============================================= */

            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                <ReportCard
                  icon={Target}
                  title="Overall Score"
                  value={displayValue(
                    report.overall_score
                  )}
                />

                <ReportCard
                  icon={Brain}
                  title="Technical Score"
                  value={displayValue(
                    report.technical_score
                  )}
                />

                <ReportCard
                  icon={Lightbulb}
                  title="Skills Score"
                  value={displayValue(
                    report.skills_score
                  )}
                />

                <ReportCard
                  icon={Code}
                  title="Projects Score"
                  value={displayValue(
                    report.projects_score
                  )}
                />

                <ReportCard
                  icon={FileText}
                  title="Experience Score"
                  value={displayValue(
                    report.experience_score
                  )}
                />

                <ReportCard
                  icon={BarChart3}
                  title="Final Level"
                  value={displayValue(
                    report.final_level
                  )}
                />

              </div>

              {report.created_at && (
                <ReportDate
                  date={report.created_at}
                />
              )}
            </>

          )}

        </ReportSection>

        {/* ================================================= */}
        {/* CODING INTERVIEW REPORT */}
        {/* ================================================= */}

        <ReportSection
          title="Previous Coding Interview Report"
          subtitle={
            hasCodingReport
              ? "Your latest coding interview performance"
              : "Complete a coding interview to generate your report"
          }
          completed={hasCodingReport}
        >

          {!hasCodingReport ? (

            /* ============================================= */
            /* NO CODING INTERVIEW */
            /* ============================================= */

            <EmptyReport
              icon={Code2}
              title="No Coding Interview Yet"
              description="Attend your first AI coding interview to generate your personalized coding performance report."
              buttonText="Start Coding Interview"
              onClick={() => {
                const storedResume = typeof window !== "undefined" ? sessionStorage.getItem("resumeData") : null;
                if (!storedResume) {
                  router.push("/dashboard");
                } else {
                  router.push("/coding-interview");
                }
              }}
            />

          ) : (

            /* ============================================= */
            /* CODING REPORT */
            /* ============================================= */

            <>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                <CodingReportCard
                  icon={Target}
                  title="Overall Score"
                  value={displayValue(
                    codingReport.overall_score
                  )}
                />

                <CodingReportCard
                  icon={CheckCircle2}
                  title="Correctness"
                  value={displayValue(
                    codingReport.correctness_score
                  )}
                />

                <CodingReportCard
                  icon={Code}
                  title="Code Quality"
                  value={displayValue(
                    codingReport.code_quality_score
                  )}
                />

                <CodingReportCard
                  icon={MessageSquare}
                  title="Explanation"
                  value={displayValue(
                    codingReport.explanation_score
                  )}
                />

                <CodingReportCard
                  icon={Lightbulb}
                  title="Problem Solving"
                  value={displayValue(
                    codingReport.problem_solving_score
                  )}
                />

                <CodingReportCard
                  icon={BarChart3}
                  title="Difficulty"
                  value={displayValue(
                    codingReport.difficulty
                  )}
                />

              </div>

              {/* CODING INFORMATION */}

              <div className="mt-6 grid gap-5 md:grid-cols-3">

                <InfoCard
                  icon={Code}
                  title="Programming Language"
                  value={displayValue(
                    codingReport.language
                  )}
                />

                

              </div>

              {codingReport.created_at && (
                <ReportDate
                  date={codingReport.created_at}
                />
              )}

            </>

          )}

        </ReportSection>

        {/* ====================================== */}
        {/* CONCERNS & USER QUERIES SECTION */}
        {/* ====================================== */}
        <motion.section
          id="concerns-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-10 rounded-3xl border border-white/70 bg-white/75 p-7 shadow-xl backdrop-blur-xl md:p-8"
        >
          {/* Header */}
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <MessageSquarePlus size={18} />
                </span>
                <h2 className="text-2xl font-bold text-slate-900">
                  My Raised Concerns & Support Queries
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Track real-time resolution status and official administrative replies for issues or report questions you submitted.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => user?.id && loadUserQueries(user.id)}
                disabled={loadingQueries}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 shadow-sm"
                title="Refresh concern status"
              >
                <RefreshCw size={14} className={loadingQueries ? "animate-spin text-violet-600" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQueryModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700"
              >
                <MessageSquarePlus size={15} />
                <span>+ Raise New Concern</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          {queries.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "All Concerns", count: queries.length },
                { id: "pending", label: "Pending", count: queries.filter((q) => (q.status || "").toLowerCase() === "pending").length, color: "text-amber-600 bg-amber-50 border-amber-200" },
                { id: "in review", label: "In Review", count: queries.filter((q) => (q.status || "").toLowerCase() === "in review").length, color: "text-blue-600 bg-blue-50 border-blue-200" },
                { id: "resolved", label: "Resolved", count: queries.filter((q) => (q.status || "").toLowerCase() === "resolved").length, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setQueryFilter(f.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition border ${queryFilter === f.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${f.color || "bg-slate-100 text-slate-600"}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Queries List or Empty State */}
          {queries.length === 0 ? (
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/60 to-indigo-50/60 p-8 text-center sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-md">
                <MessageSquare size={26} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No Queries or Concerns Raised Yet
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
                Have questions about your technical interview score, coding sandbox execution, or encountered a platform bug? Raise a query and our team will inspect and respond promptly.
              </p>
              <button
                type="button"
                onClick={() => setIsQueryModalOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700"
              >
                <MessageSquarePlus size={16} />
                <span>Submit Your First Query</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {queries
                .filter((q) => queryFilter === "all" || (q.status || "").toLowerCase() === queryFilter.toLowerCase())
                .map((q) => {
                  const statusNorm = (q.status || "").toLowerCase();
                  const isResolved = statusNorm === "resolved";
                  const isInReview = statusNorm === "in review";

                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`overflow-hidden rounded-2xl border transition hover:shadow-md ${isResolved
                          ? "border-emerald-200/80 bg-white"
                          : isInReview
                            ? "border-blue-200/80 bg-white"
                            : "border-slate-200 bg-white"
                        }`}
                    >
                      {/* Top Bar of Card */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-violet-700">
                            Concern #{q.id}
                          </span>
                          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-2xs">
                            {q.category}
                          </span>
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${q.urgency === "High"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : q.urgency === "Medium"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                          >
                            {q.urgency} Urgency
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {isResolved ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                              <CheckCircle2 size={13} />
                              <span>Resolved</span>
                            </span>
                          ) : isInReview ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Under Review</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                              <Clock size={13} />
                              <span>Pending Admin Review</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-5 sm:p-6 space-y-4">
                        <div>
                          <h4 className="text-base font-bold text-slate-900 sm:text-lg">
                            {q.subject}
                          </h4>
                          <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                            {q.description}
                          </p>
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Calendar size={12} />
                            <span>Submitted: {q.created_at ? new Date(q.created_at).toLocaleString() : ""}</span>
                          </div>
                        </div>

                        {/* Official Admin Response Box */}
                        {q.admin_response ? (
                          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white">
                                  <ShieldCheck size={14} />
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                                  Official Administration Response & Resolution
                                </span>
                              </div>
                              {q.admin_updated_at && (
                                <span className="text-[10px] text-emerald-700 font-mono">
                                  Updated: {new Date(q.admin_updated_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <p className="mt-3 text-xs leading-relaxed text-slate-800 sm:text-sm whitespace-pre-wrap font-sans">
                              {q.admin_response}
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs text-slate-500 flex items-center gap-2">
                            <Clock size={14} className="text-amber-500 shrink-0" />
                            <span>
                              Awaiting response. Our support administration will inspect your query and post resolution details here.
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </motion.section>

      </div>

      {/* Query Submission Modal */}
      <UserQueryModal
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
        onQuerySubmitted={() => {
          if (user?.id) loadUserQueries(user.id);
        }}
      />

    </main>
  );
}



function ReportSection({
  title,
  subtitle,
  completed,
  children,
}) {
  return (
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
      className="mt-10 rounded-3xl border border-white/70 bg-white/75 p-7 shadow-xl backdrop-blur-xl md:p-8"
    >

      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>

          <h2 className="text-2xl font-bold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-slate-500">
            {subtitle}
          </p>

        </div>

        {completed && (
          <span className="w-fit rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-600">
            ✓ Completed
          </span>
        )}

      </div>

      {children}

    </motion.section>
  );
}



function EmptyReport({
  icon: Icon,
  title,
  description,
  buttonText,
  onClick,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-10 text-center"
    >

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-violet-600 shadow-md">

        <Icon size={30} />

      </div>

      <h3 className="mt-5 text-xl font-bold text-slate-900">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-slate-500">
        {description}
      </p>

      <motion.button
        whileHover={{
          scale: 1.03,
        }}
        whileTap={{
          scale: 0.97,
        }}
        onClick={onClick}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/20"
      >

        {buttonText}

        <ArrowRight size={18} />

      </motion.button>

    </motion.div>
  );
}



function ReportCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <motion.div
      whileHover={{
        y: -5,
        scale: 1.01,
      }}
      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 transition-shadow hover:shadow-lg"
    >

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <Icon size={20} />
        </div>

        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />

      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

    </motion.div>
  );
}



function CodingReportCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <motion.div
      whileHover={{
        y: -5,
        scale: 1.01,
      }}
      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 transition-shadow hover:shadow-lg"
    >

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <Icon size={20} />
        </div>

        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />

      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

    </motion.div>
  );
}



function InfoCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <Icon size={19} />
        </div>

        <div>

          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}



function FeedbackBox({
  title,
  value,
}) {
  return (
    <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/60 p-6">

      <h3 className="font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
        {value}
      </p>

    </div>
  );
}



function ReportDate({
  date,
}) {
  return (
    <div className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-500">

      Interview Completed:{" "}

      <span className="font-medium text-slate-700">
        {new Date(date).toLocaleString()}
      </span>

    </div>
  );
}



function StatCard({
  icon: Icon,
  title,
  value,
  description,
}) {
  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-lg"
    >

      <div className="flex items-center justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <Icon size={21} />
        </div>

        <CheckCircle2
          size={18}
          className="text-green-500"
        />

      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-xl font-extrabold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>

    </motion.div>
  );
}



function InterviewCard({
  icon: Icon,
  title,
  description,
  features,
  buttonText,
  onClick,
}) {
  return (
    <motion.div
      whileHover={{
        y: -5,
      }}
      className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-7 shadow-sm transition hover:shadow-xl"
    >

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">

        <Icon size={27} />

      </div>

      <h4 className="mt-6 text-2xl font-extrabold text-slate-900">
        {title}
      </h4>

      <p className="mt-3 leading-7 text-slate-600">
        {description}
      </p>

      <div className="mt-6 space-y-3">

        {features.map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-3 text-sm font-medium text-slate-600"
          >

            <CheckCircle2
              size={17}
              className="shrink-0 text-violet-600"
            />

            {feature}

          </div>
        ))}

      </div>

      <button
        onClick={onClick}
        className="group mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 font-bold text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 hover:shadow-xl"
      >

        {buttonText}

        <ArrowRight
          size={18}
          className="transition-transform group-hover:translate-x-1"
        />

      </button>

    </motion.div>
  );
}