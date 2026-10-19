"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getInterviewHistoryAll } from "@/lib/api";
import {
  FaBrain,
  FaCode,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaSyncAlt,
  FaSearch,
  FaFilter,
  FaClock,
  FaCopy,
  FaCheck,
  FaTerminal,
  FaLaptopCode,
  FaLightbulb,
  FaChevronDown,
  FaChevronUp,
  FaAward,
  FaBookOpen,
} from "react-icons/fa";

export default function InterviewHistoryPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyData, setHistoryData] = useState({
    technical_history: [],
    coding_history: [],
  });

  const [activeTab, setActiveTab] = useState("all"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [expandedCards, setExpandedCards] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("User parse error:", e);
        }
      }
    }
    return { id: 1, name: "Candidate" };
  });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = user?.id || 1;
      const data = await getInterviewHistoryAll(userId);
      const techList =
        (data && (data.technical_history || data.technical_interviews)) || [];
      const codingList =
        (data && (data.coding_history || data.coding_interviews)) || [];

      setHistoryData({
        technical_history: techList,
        coding_history: codingList,
      });
    } catch (err) {
      console.error("Error fetching interview history:", err);
      setError(err.message || "Failed to load interview history records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleExpand = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTechnical = useMemo(() => {
    return (historyData.technical_history || []).filter((item) => {
      const qText = (item.question || "").toLowerCase();
      const aText = (item.candidate_answer || "").toLowerCase();
      const cText = (item.correct_answer || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        qText.includes(query) ||
        aText.includes(query) ||
        cText.includes(query);

      const matchesDiff =
        selectedDifficulty === "all" ||
        (item.difficulty || "Easy").toLowerCase() ===
        selectedDifficulty.toLowerCase();

      return matchesSearch && matchesDiff;
    });
  }, [historyData.technical_history, searchQuery, selectedDifficulty]);

  const filteredCoding = useMemo(() => {
    return (historyData.coding_history || []).filter((item) => {
      const tText = (item.title || "").toLowerCase();
      const dText = (item.description || "").toLowerCase();
      const lText = (item.language || "").toLowerCase();
      const codeText = (item.candidate_code || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        tText.includes(query) ||
        dText.includes(query) ||
        lText.includes(query) ||
        codeText.includes(query);

      const matchesDiff =
        selectedDifficulty === "all" ||
        (item.difficulty || "Easy").toLowerCase() ===
        selectedDifficulty.toLowerCase();

      const matchesLang =
        selectedLanguage === "all" ||
        (item.language || "").toLowerCase() === selectedLanguage.toLowerCase();

      return matchesSearch && matchesDiff && matchesLang;
    });
  }, [
    historyData.coding_history,
    searchQuery,
    selectedDifficulty,
    selectedLanguage,
  ]);

  const stats = useMemo(() => {
    const techCount = historyData.technical_history.length;
    const codingCount = historyData.coding_history.length;

    let techScoreSum = 0;
    let techScoreCount = 0;
    historyData.technical_history.forEach((t) => {
      if (t.score !== null && t.score !== undefined) {
        techScoreSum += Number(t.score);
        techScoreCount++;
      }
    });
    const avgTechScore =
      techScoreCount > 0 ? (techScoreSum / techScoreCount).toFixed(1) : "N/A";

    let codingPassedSum = 0;
    let codingTotalSum = 0;
    historyData.coding_history.forEach((c) => {
      codingPassedSum += Number(c.test_cases_passed || 0);
      codingTotalSum += Number(c.total_test_cases || 0);
    });
    const codingPassRate =
      codingTotalSum > 0
        ? `${Math.round((codingPassedSum / codingTotalSum) * 100)}%`
        : "N/A";

    return {
      techCount,
      codingCount,
      totalCount: techCount + codingCount,
      avgTechScore,
      codingPassRate,
    };
  }, [historyData]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recent session";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getDifficultyBadge = (diff) => {
    const d = (diff || "Easy").toLowerCase();
    if (d === "easy") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (d === "medium") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-slate-800 relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-200/40 rounded-full blur-3xl" />
        <div className="absolute top-[20%] right-[-10%] w-[450px] h-[450px] bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-purple-200/25 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/80 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => router.push("/profile")}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0 active:scale-95"
              title="Back to Dashboard"
            >
              <FaArrowLeft className="text-xs sm:text-sm" />
            </button>
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md shadow-violet-200 shrink-0">
                AI
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                  Interview History
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block truncate">
                  Technical & Coding Q&A Archive with Correct Answers
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white/80 hover:bg-white text-xs font-semibold text-slate-700 transition shadow-sm active:scale-95"
              title="Refresh Records"
            >
              <FaSyncAlt
                className={`text-violet-600 text-xs ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold transition shadow-md shadow-violet-200 active:scale-95"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        <section className="bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-xl shadow-indigo-900/10 relative overflow-hidden">
          <div className="absolute right-[-40px] top-[-40px] w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/15 backdrop-blur text-violet-200 text-[11px] sm:text-xs font-semibold">
                <FaAward className="text-amber-300 text-xs" />
                <span>Candidate Performance Archive</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight">
                Review Your Interview Questions & Answers
              </h2>
              <p className="text-violet-100 text-xs sm:text-sm leading-relaxed">
                Analyze your responses side-by-side with verified correct answers
                generated by the RAG knowledge base. Learn optimal solutions, code
                implementations, and complexity breakdowns.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full lg:w-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/15 text-center flex flex-col justify-center items-center">
                <div className="flex items-center gap-1.5 text-violet-200 mb-0.5">
                  <FaBookOpen className="text-xs" />
                  <span className="text-[10px] sm:text-[11px] font-medium">Total</span>
                </div>
                <span className="text-xl sm:text-2xl font-black block">
                  {stats.totalCount}
                </span>
                <span className="text-[10px] sm:text-[11px] text-violet-200 font-medium hidden sm:inline">
                  Questions
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/15 text-center flex flex-col justify-center items-center">
                <div className="flex items-center gap-1.5 text-violet-200 mb-0.5">
                  <FaBrain className="text-xs" />
                  <span className="text-[10px] sm:text-[11px] font-medium">Technical</span>
                </div>
                <span className="text-xl sm:text-2xl font-black block">
                  {stats.techCount}
                </span>
                <span className="text-[10px] sm:text-[11px] text-violet-200 font-medium hidden sm:inline">
                  Q&A
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/15 text-center flex flex-col justify-center items-center">
                <div className="flex items-center gap-1.5 text-violet-200 mb-0.5">
                  <FaCode className="text-xs" />
                  <span className="text-[10px] sm:text-[11px] font-medium">Coding</span>
                </div>
                <span className="text-xl sm:text-2xl font-black block">
                  {stats.codingCount}
                </span>
                <span className="text-[10px] sm:text-[11px] text-violet-200 font-medium hidden sm:inline">
                  Problems
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/15 text-center flex flex-col justify-center items-center">
                <div className="flex items-center gap-1.5 text-violet-200 mb-0.5">
                  <FaAward className="text-xs text-amber-300" />
                  <span className="text-[10px] sm:text-[11px] font-medium">Pass Rate</span>
                </div>
                <span className="text-xl sm:text-2xl font-black block">
                  {stats.codingPassRate}
                </span>
                <span className="text-[10px] sm:text-[11px] text-violet-200 font-medium hidden sm:inline">
                  Accuracy
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/90 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto no-scrollbar scroll-smooth">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 shrink-0 ${activeTab === "all"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <FaBookOpen />
                <span className="hidden sm:inline">All History</span>
                <span className="sm:hidden">All</span>
                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px]">
                  {stats.totalCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("technical")}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 shrink-0 ${activeTab === "technical"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <FaBrain className="text-violet-600" />
                <span className="hidden sm:inline">Technical Interview</span>
                <span className="sm:hidden">Technical</span>
                <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full text-[10px]">
                  {stats.techCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("coding")}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 shrink-0 ${activeTab === "coding"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <FaCode className="text-indigo-600" />
                <span className="hidden sm:inline">Coding Interview</span>
                <span className="sm:hidden">Coding</span>
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
                  {stats.codingCount}
                </span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-56 md:w-64 lg:w-72">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search questions, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 bg-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="flex-1 sm:flex-initial px-2.5 py-2 sm:py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                {(activeTab === "all" || activeTab === "coding") && (
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="flex-1 sm:flex-initial px-2.5 py-2 sm:py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Languages</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin mx-auto" />
            <p className="text-slate-500 text-sm font-medium">
              Loading interview history records...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
            <FaTimesCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-rose-900">
              Failed to Load History
            </h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchHistory}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          stats.totalCount === 0 && (
            <div className="py-20 text-center space-y-5 bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-sm max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto text-2xl">
                <FaBrain />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  No Interview History Yet
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  You haven&apos;t taken any technical or coding interviews yet.
                  Start an interview to see your questions, submitted answers,
                  and verified correct solutions here.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <button
                  onClick={() => router.push("/interview")}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-md shadow-violet-200 flex items-center justify-center gap-2"
                >
                  <FaBrain />
                  <span>Start Technical Interview</span>
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <FaLaptopCode />
                  <span>Go to Dashboard</span>
                </button>
              </div>
            </div>
          )}

        {!loading && !error && stats.totalCount > 0 && (
          <div className="space-y-8">
            {(activeTab === "all" || activeTab === "technical") && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center text-sm">
                      <FaBrain />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Technical Interview Q&A
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Candidate responses evaluated against RAG Knowledge Base
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {filteredTechnical.length} Question
                    {filteredTechnical.length === 1 ? "" : "s"}
                  </span>
                </div>

                {filteredTechnical.length === 0 ? (
                  <div className="p-8 bg-white/60 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No technical questions match your current search/filter.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {filteredTechnical.map((item, idx) => {
                      const cardId = `tech-${item.id ?? "item"}-${idx}`;
                      const isExpanded = expandedCards[cardId] ?? true;

                      return (
                        <div
                          key={cardId}
                          className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/90 p-5 shadow-sm space-y-4 hover:shadow-md transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 rounded-md bg-violet-100 text-violet-700 font-bold text-xs">
                                Question {item.question_number || idx + 1}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getDifficultyBadge(
                                  item.difficulty
                                )}`}
                              >
                                {item.difficulty || "Easy"}
                              </span>
                              {item.score !== null && item.score !== undefined && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  Score: {item.score}/10
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2 text-slate-400 text-[11px] w-full sm:w-auto pt-1 sm:pt-0">
                              <div className="flex items-center gap-1.5">
                                <FaClock className="text-violet-500 shrink-0" />
                                <span>{formatDate(item.created_at)}</span>
                              </div>
                              <button
                                onClick={() => toggleExpand(cardId)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                                title={isExpanded ? "Collapse" : "Expand"}
                              >
                                {isExpanded ? (
                                  <FaChevronUp />
                                ) : (
                                  <FaChevronDown />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-violet-600 block mb-1">
                              Question Prompt
                            </span>
                            <h4 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                              {item.question}
                            </h4>
                          </div>

                          {isExpanded && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 pt-1">
                              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 sm:p-4 space-y-2 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                                      <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                                      <span className="hidden sm:inline truncate">Candidate Answer</span>
                                      <span className="sm:hidden truncate">Your Answer</span>
                                    </span>

                                  </div>
                                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed break-words">
                                    {item.candidate_answer ||
                                      "(No candidate answer recorded)"}
                                  </p>
                                </div>
                              </div>

                              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 sm:p-4 space-y-2 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 min-w-0">
                                      <FaCheckCircle className="text-emerald-600 shrink-0" />
                                      <span className="hidden sm:inline truncate">
                                        Correct Answer (RAG Knowledge Base)
                                      </span>
                                      <span className="sm:hidden truncate">
                                        Correct Answer
                                      </span>
                                    </span>

                                  </div>
                                  <p className="text-xs text-emerald-950 whitespace-pre-wrap leading-relaxed break-words">
                                    {item.correct_answer ||
                                      "Verified correct answer synthesized from technical knowledge base."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {isExpanded && item.evaluation && (
                            <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3.5 space-y-2 text-xs">
                              <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                                <FaLightbulb className="text-indigo-600" />
                                <span>AI Feedback & Criteria</span>
                              </span>
                              {typeof item.evaluation === "string" ? (
                                <p className="text-slate-700">{item.evaluation}</p>
                              ) : (
                                <div className="space-y-1.5 text-slate-700">
                                  {item.evaluation.feedback && (
                                    <p>{item.evaluation.feedback}</p>
                                  )}
                                  {Array.isArray(item.evaluation.strengths) &&
                                    item.evaluation.strengths.length > 0 && (
                                      <p className="text-emerald-700">
                                        <strong>Strengths:</strong>{" "}
                                        {item.evaluation.strengths.join(", ")}
                                      </p>
                                    )}
                                  {Array.isArray(item.evaluation.weaknesses) &&
                                    item.evaluation.weaknesses.length > 0 && (
                                      <p className="text-amber-800">
                                        <strong>Areas to Improve:</strong>{" "}
                                        {item.evaluation.weaknesses.join(", ")}
                                      </p>
                                    )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {(activeTab === "all" || activeTab === "coding") && (
              <section className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">
                      <FaCode />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Coding Interview Submissions
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Candidate source code vs Verified RAG reference
                        solutions
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {filteredCoding.length} Problem
                    {filteredCoding.length === 1 ? "" : "s"}
                  </span>
                </div>

                {filteredCoding.length === 0 ? (
                  <div className="p-8 bg-white/60 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No coding interview submissions match your current
                    search/filter.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredCoding.map((item, idx) => {
                      const cardId = `code-${item.id ?? "item"}-${idx}`;
                      const isExpanded = expandedCards[cardId] ?? true;

                      return (
                        <div
                          key={cardId}
                          className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/90 p-4 sm:p-5 shadow-sm space-y-4 hover:shadow-md transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm sm:text-base font-bold text-slate-900">
                                {item.title || `Coding Challenge #${idx + 1}`}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getDifficultyBadge(
                                  item.difficulty
                                )}`}
                              >
                                {item.difficulty || "Easy"}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200 flex items-center gap-1">
                                <FaTerminal className="text-[10px]" />
                                <span className="uppercase">
                                  {item.language || "python"}
                                </span>
                              </span>
                              {item.test_cases_passed !== undefined && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Tests: {item.test_cases_passed}/
                                  {item.total_test_cases ||
                                    item.test_cases_passed}{" "}
                                  Passed
                                </span>
                              )}
                              {item.overall_score !== null &&
                                item.overall_score !== undefined && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Score: {item.overall_score}/10
                                  </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2 text-slate-400 text-[11px] w-full sm:w-auto pt-1 sm:pt-0">
                              <div className="flex items-center gap-1.5">
                                <FaClock className="text-violet-500 shrink-0" />
                                <span>{formatDate(item.created_at)}</span>
                              </div>
                              <button
                                onClick={() => toggleExpand(cardId)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                                title={isExpanded ? "Collapse" : "Expand"}
                              >
                                {isExpanded ? (
                                  <FaChevronUp />
                                ) : (
                                  <FaChevronDown />
                                )}
                              </button>
                            </div>
                          </div>

                          {item.description && (
                            <div className="bg-slate-50/70 p-3 sm:p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-2">
                              <span className="font-bold text-slate-900 block">
                                Problem Description:
                              </span>
                              <p className="whitespace-pre-wrap leading-relaxed break-words">
                                {item.description}
                              </p>
                              {item.constraints && (
                                <div className="pt-1 text-[11px] text-slate-500 break-words">
                                  <strong>Constraints:</strong>{" "}
                                  {item.constraints}
                                </div>
                              )}
                            </div>
                          )}

                          {isExpanded && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 pt-1">
                              <div className="rounded-xl bg-slate-900 text-slate-100 p-3.5 sm:p-4 border border-slate-800 space-y-2 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                                    <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5 min-w-0">
                                      <FaCode className="text-violet-400 shrink-0" />
                                      <span className="hidden sm:inline truncate">Candidate Answer (Your Code)</span>
                                      <span className="sm:hidden truncate">Your Code</span>
                                    </span>

                                  </div>
                                  <pre className="font-mono text-[11px] sm:text-xs overflow-x-auto code-scroll max-h-56 sm:max-h-72 p-2 pt-3 leading-relaxed text-slate-200 touch-pan-x">
                                    <code>
                                      {item.candidate_code ||
                                        "// No code submitted"}
                                    </code>
                                  </pre>
                                </div>

                                {item.candidate_explanation && (
                                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 break-words">
                                    <strong className="text-slate-300">
                                      Candidate Notes:
                                    </strong>{" "}
                                    {item.candidate_explanation}
                                  </div>
                                )}
                              </div>

                              <div className="rounded-xl bg-slate-950 text-emerald-400 p-3.5 sm:p-4 border border-emerald-900/40 space-y-2 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-900/40">
                                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 min-w-0">
                                      <FaCheckCircle className="text-emerald-400 shrink-0" />
                                      <span className="hidden sm:inline truncate">
                                        Correct Answer (Reference Solution)
                                      </span>
                                      <span className="sm:hidden truncate">
                                        Reference Solution
                                      </span>
                                      <span className="hidden xs:inline-block text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                                        RAG Verified
                                      </span>
                                    </span>

                                  </div>
                                  <pre className="font-mono text-[11px] sm:text-xs overflow-x-auto code-scroll max-h-56 sm:max-h-72 p-2 pt-3 leading-relaxed text-emerald-300 touch-pan-x">
                                    <code>
                                      {item.correct_answer ||
                                        item.reference_solution ||
                                        "// Optimal reference solution retrieved from RAG coding base."}
                                    </code>
                                  </pre>
                                </div>

                                <div className="pt-2 border-t border-emerald-900/40 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
                                  {item.time_complexity &&
                                    item.time_complexity !== "N/A" && (
                                      <span className="text-emerald-200">
                                        <strong>Time:</strong>{" "}
                                        {item.time_complexity}
                                      </span>
                                    )}
                                  {item.space_complexity &&
                                    item.space_complexity !== "N/A" && (
                                      <span className="text-emerald-200">
                                        <strong>Space:</strong>{" "}
                                        {item.space_complexity}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>
                          )}

                          {isExpanded && item.feedback && (
                            <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3.5 text-xs text-slate-700 space-y-1">
                              <span className="font-bold text-indigo-900 block">
                                AI Evaluator Feedback:
                              </span>
                              <p className="leading-relaxed">{item.feedback}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-5 right-5 z-40 p-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/30 transition-all active:scale-95 flex items-center justify-center text-sm border border-violet-400/30"
            title="Scroll to Top"
          >
            <FaChevronUp />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
