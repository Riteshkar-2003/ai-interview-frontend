"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Users,
  Brain,
  Code2,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  Send,
  Eye,
  Trash2,
  Layers,
  Sparkles,
  BarChart3,
  Calendar,
  Mail,
  User,
  ArrowUpRight,
  Check,
  LogOut,
  UserCircle,
} from "lucide-react";
import {
  getAdminStats,
  getAdminUsers,
  getAdminUserDetails,
  getAdminInterviews,
  getAdminCodingSubmissions,
  getAdminResumes,
  getAdminQueries,
  updateAdminQuery,
  deleteAdminQuery,
  adminVerifyToken,
  adminLogout,
} from "../../lib/api";


export default function AdminDashboardPage() {
  const router = useRouter();

 
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

 
  const [activeTab, setActiveTab] = useState("queries"); 

  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [codingSubs, setCodingSubs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [queries, setQueries] = useState([]);

 
  const [queryStatusFilter, setQueryStatusFilter] = useState("all");
  const [querySearch, setQuerySearch] = useState("");

 
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [updatingQuery, setUpdatingQuery] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [adminStatusSelect, setAdminStatusSelect] = useState("In Review");
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState("");

  
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  
  const [inspectedCode, setInspectedCode] = useState(null);

 
  const [inspectedResume, setInspectedResume] = useState(null);

 
  const [notification, setNotification] = useState("");


  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          router.replace("/admin/login");
          return;
        }
        const res = await adminVerifyToken(token);
        if (!res?.valid) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          router.replace("/admin/login");
          return;
        }
        
        try {
          const storedAdmin = localStorage.getItem("admin_user");
          if (storedAdmin) setAdminUser(JSON.parse(storedAdmin));
        } catch { }
        setAuthChecked(true);
        loadAllData();
      } catch (err) {
        console.error("Admin auth check failed:", err);
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        router.replace("/admin/login");
      }
    };
    checkAdminAuth();
  }, []);

 
  const handleAdminLogout = async () => {
    try {
      await adminLogout();
    } catch { }
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.replace("/admin/login");
  };


  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, interviewsRes, codingRes, resumesRes, queriesRes] = await Promise.allSettled([
        getAdminStats(),
        getAdminUsers(),
        getAdminInterviews(),
        getAdminCodingSubmissions(),
        getAdminResumes(),
        getAdminQueries(),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.success) {
        setStats(statsRes.value.stats);
        setRecentActivity(statsRes.value.recent_activity || []);
      }
      if (usersRes.status === "fulfilled" && usersRes.value?.success) {
        setUsers(usersRes.value.users || []);
      }
      if (interviewsRes.status === "fulfilled" && interviewsRes.value?.success) {
        setInterviews(interviewsRes.value.interviews || []);
      }
      if (codingRes.status === "fulfilled" && codingRes.value?.success) {
        setCodingSubs(codingRes.value.submissions || []);
      }
      if (resumesRes.status === "fulfilled" && resumesRes.value?.success) {
        setResumes(resumesRes.value.resumes || []);
      }
      if (queriesRes.status === "fulfilled" && queriesRes.value?.success) {
        setQueries(queriesRes.value.queries || []);
      }
    } catch (err) {
      console.error("Admin dashboard load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setNotification("Admin dashboard updated with latest database entries.");
    setTimeout(() => setNotification(""), 4000);
  };


  const filteredQueries = queries.filter((q) => {
    const matchStatus =
      queryStatusFilter === "all" ||
      (q.status || "").toLowerCase() === queryStatusFilter.toLowerCase();
    const matchSearch =
      !querySearch.trim() ||
      (q.subject || "").toLowerCase().includes(querySearch.toLowerCase()) ||
      (q.description || "").toLowerCase().includes(querySearch.toLowerCase()) ||
      (q.user_name || "").toLowerCase().includes(querySearch.toLowerCase()) ||
      (q.user_email || "").toLowerCase().includes(querySearch.toLowerCase());
    return matchStatus && matchSearch;
  });

 
  const openQueryModal = (query) => {
    setSelectedQuery(query);
    setAdminReplyText(query.admin_response || "");
    setAdminStatusSelect(query.status || "In Review");
    setUpdateSuccessMsg("");
  };

 
  const handleSaveQueryUpdate = async () => {
    if (!selectedQuery) return;
    try {
      setUpdatingQuery(true);
      const res = await updateAdminQuery(selectedQuery.id, {
        status: adminStatusSelect,
        admin_response: adminReplyText.trim(),
      });

      if (res && res.success) {
        setUpdateSuccessMsg("Concern updated! Candidate can view the response in their profile.");
      
        setQueries((prev) =>
          prev.map((q) => (q.id === selectedQuery.id ? res.query : q))
        );
        setSelectedQuery(res.query);
       
        const statsRes = await getAdminStats();
        if (statsRes?.success) setStats(statsRes.stats);
      }
    } catch (err) {
      alert("Failed to update query: " + err.message);
    } finally {
      setUpdatingQuery(false);
    }
  };

 
  const applyTemplate = (text) => {
    setAdminReplyText((prev) => (prev ? prev + "\n" + text : text));
  };

  
  const handleDeleteQuery = async (queryId) => {
    if (!confirm("Are you sure you want to delete this concern record?")) return;
    try {
      await deleteAdminQuery(queryId);
      setQueries((prev) => prev.filter((q) => q.id !== queryId));
      if (selectedQuery?.id === queryId) setSelectedQuery(null);
    } catch (err) {
      alert("Failed to delete query: " + err.message);
    }
  };

  
  const handleViewUser = async (userId) => {
    try {
      setLoadingUserDetail(true);
      const res = await getAdminUserDetails(userId);
      if (res?.success) {
        setSelectedUserDetail(res);
      }
    } catch (err) {
      alert("Failed to load user details: " + err.message);
    } finally {
      setLoadingUserDetail(false);
    }
  };

  
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0d0e15] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Verifying admin session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e15] text-slate-100 font-sans selection:bg-violet-600 selection:text-white">
      {/* Top Gradient Background */}
      <div className="pointer-events-none fixed -top-40 left-1/4 h-[500px] w-[600px] rounded-full bg-violet-600/10 blur-[130px]" />
      <div className="pointer-events-none fixed top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[130px]" />

      {/* ADMIN NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 border-b border-gray-800/80 bg-[#12131d]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 font-black text-white shadow-lg shadow-violet-900/30 sm:h-10 sm:w-10">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-sm font-bold text-white tracking-tight sm:text-base lg:text-lg">
                  AI Interview Platform
                </h1>
                <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-violet-300 border border-violet-500/30">
                  Admin Portal
                </span>
              </div>
              <p className="hidden text-[11px] text-gray-400 sm:block">
                Candidate Management, Oversight &amp; Concern Resolution
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/80 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-gray-800 hover:text-white disabled:opacity-50"
              title="Refresh database entries"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-violet-400" : ""}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-900/80 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-gray-800 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Candidate View</span>
            </button>

            {/* Admin identity badge */}
            {adminUser && (
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-violet-700/40 bg-violet-950/40 px-3 py-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-[11px] font-extrabold text-white">
                  {(adminUser.username || "A")[0].toUpperCase()}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[11px] font-bold text-violet-200">{adminUser.username}</span>
                  <span className="text-[9px] text-violet-400/70 uppercase tracking-wider">Admin</span>
                </div>
              </div>
            )}

            {/* Logout button */}
            <button
              id="admin-logout-btn"
              onClick={handleAdminLogout}
              title="Sign out of admin portal"
              className="flex items-center gap-1.5 rounded-xl border border-red-800/50 bg-red-950/30 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-900/50 hover:text-red-100 hover:border-red-700/60"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8 border-t border-gray-800/60 scrollbar-none">
          <div className="flex space-x-1 py-2">
            {[
              { id: "overview", label: "Overview & Analytics", icon: TrendingUp },
              { id: "queries", label: "User Queries & Concerns", icon: MessageSquare, badge: stats?.pending_queries },
              { id: "users", label: "Candidates / Users", icon: Users, badge: users.length },
              { id: "interviews", label: "Technical Reports", icon: Brain, badge: interviews.length },
              { id: "coding", label: "Coding Submissions", icon: Code2, badge: codingSubs.length },
              { id: "resumes", label: "Uploaded Resumes", icon: FileText, badge: resumes.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition whitespace-nowrap sm:px-4 ${isActive
                      ? "bg-violet-600 text-white shadow-md shadow-violet-900/50"
                      : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
                    }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${isActive
                          ? "bg-white/20 text-white"
                          : tab.id === "queries"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-gray-800 text-gray-300"
                        }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* NOTIFICATION TOAST */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 rounded-2xl bg-emerald-950/90 border border-emerald-700/60 px-4 py-3 text-xs font-semibold text-emerald-200 shadow-xl backdrop-blur-xl flex items-center gap-2.5"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* KPI METRIC CARDS ROW */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard
              title="Registered Candidates"
              value={stats.total_users}
              icon={Users}
              color="text-violet-400"
              bg="bg-violet-500/10 border-violet-500/20"
            />
            <MetricCard
              title="Technical Interviews"
              value={stats.total_interviews}
              subtitle={`Avg: ${stats.avg_tech_score}/10`}
              icon={Brain}
              color="text-indigo-400"
              bg="bg-indigo-500/10 border-indigo-500/20"
            />
            <MetricCard
              title="Coding Submissions"
              value={stats.total_coding_submissions}
              subtitle={`Avg: ${stats.avg_coding_score}/10`}
              icon={Code2}
              color="text-cyan-400"
              bg="bg-cyan-500/10 border-cyan-500/20"
            />
            <MetricCard
              title="Pending Concerns"
              value={stats.pending_queries}
              subtitle={`${stats.total_queries} Total Queries`}
              icon={AlertCircle}
              color="text-amber-400"
              bg="bg-amber-500/10 border-amber-500/20"
            />
            <MetricCard
              title="Resolved Concerns"
              value={stats.resolved_queries}
              subtitle="Closed Issues"
              icon={CheckCircle2}
              color="text-emerald-400"
              bg="bg-emerald-500/10 border-emerald-500/20"
            />
            <MetricCard
              title="Resumes Uploaded"
              value={stats.total_resumes}
              icon={FileText}
              color="text-purple-400"
              bg="bg-purple-500/10 border-purple-500/20"
            />
          </div>
        )}

        {activeTab === "queries" && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="rounded-3xl border border-gray-800 bg-[#141522] p-6 shadow-xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400">
                    <MessageSquare className="h-4 w-4" />
                    <span>User Support & Issue Resolution</span>
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    Candidate Queries & Reported Concerns
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Whenever candidates submit a query from the user interface, it appears here in real-time.
                    You can update the status and provide resolution notes, which immediately synchronize to the user’s profile.
                  </p>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: "all", label: "All Concerns", count: queries.length },
                    { id: "pending", label: "Pending", count: queries.filter((q) => q.status === "Pending").length, color: "text-amber-400" },
                    { id: "in review", label: "In Review", count: queries.filter((q) => q.status === "In Review").length, color: "text-blue-400" },
                    { id: "resolved", label: "Resolved", count: queries.filter((q) => q.status === "Resolved").length, color: "text-emerald-400" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setQueryStatusFilter(f.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${queryStatusFilter === f.id
                          ? "bg-gray-700 text-white shadow-inner"
                          : "bg-gray-900/80 text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-gray-800"
                        }`}
                    >
                      <span>{f.label}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-gray-900 ${f.color || "text-gray-300"}`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="mt-5 relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={querySearch}
                  onChange={(e) => setQuerySearch(e.target.value)}
                  placeholder="Search queries by candidate name, email, subject, or issue keyword..."
                  className="w-full rounded-2xl border border-gray-800 bg-[#0d0e15] pl-10 pr-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 transition focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Queries Table / List */}
            <div className="rounded-3xl border border-gray-800 bg-[#141522] overflow-hidden shadow-xl">
              {filteredQueries.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-800/80 text-gray-400">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-300">No Queries Found</h3>
                  <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                    {querySearch || queryStatusFilter !== "all"
                      ? "No concerns match your current filters. Try resetting the search or status filter."
                      : "No user queries have been recorded yet. When candidates raise concerns via the modal, they will appear here."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-gray-800 bg-gray-900/60 font-mono text-[11px] uppercase tracking-wider text-gray-400">
                      <tr>
                        <th className="px-5 py-3.5">ID & Candidate</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5">Subject & Concern</th>
                        <th className="px-5 py-3.5">Urgency</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Admin Response</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 font-sans">
                      {filteredQueries.map((q, qIdx) => (
                        <tr key={`query-${q.id}-${qIdx}`} className="transition hover:bg-gray-800/30">
                          {/* ID & Candidate */}
                          <td className="px-5 py-4">
                            <div className="font-mono text-violet-400 font-bold">#{q.id}</div>
                            <div className="mt-0.5 font-bold text-white text-xs">{q.user_name || `User #${q.user_id}`}</div>
                            <div className="text-[11px] text-gray-400">{q.user_email || "N/A"}</div>
                            <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1 font-mono">
                              <Calendar className="h-3 w-3" />
                              {q.created_at ? new Date(q.created_at).toLocaleDateString() : ""}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-gray-800/80 px-2.5 py-1 text-[11px] font-semibold text-gray-300 border border-gray-700/60">
                              {q.category}
                            </span>
                          </td>

                          {/* Subject & Concern */}
                          <td className="px-5 py-4 max-w-xs">
                            <div className="font-bold text-white text-xs line-clamp-1">{q.subject}</div>
                            <div className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {q.description}
                            </div>
                          </td>

                          {/* Urgency */}
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${q.urgency === "High"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : q.urgency === "Medium"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                }`}
                            >
                              {q.urgency}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <StatusBadge status={q.status} />
                          </td>

                          {/* Admin Response Status */}
                          <td className="px-5 py-4 max-w-xs">
                            {q.admin_response ? (
                              <div className="rounded-xl bg-violet-950/30 border border-violet-800/40 p-2.5 text-[11px] text-violet-200">
                                <div className="font-bold flex items-center gap-1 text-[10px] text-violet-400 mb-0.5">
                                  <Check className="h-3 w-3 text-emerald-400" />
                                  Replied {q.admin_updated_at ? new Date(q.admin_updated_at).toLocaleDateString() : ""}
                                </div>
                                <p className="line-clamp-2 text-gray-300">{q.admin_response}</p>
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-500 italic">No response sent yet</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openQueryModal(q)}
                                className="flex items-center gap-1.5 rounded-xl bg-violet-600/90 hover:bg-violet-600 px-3 py-1.5 font-bold text-white shadow-md shadow-violet-950 transition text-xs"
                              >
                                <span>Respond</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuery(q.id)}
                                className="rounded-xl p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition"
                                title="Delete query"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column: Quick Insights */}
              <div className="rounded-3xl border border-gray-800 bg-[#141522] p-6 shadow-xl lg:col-span-2">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400">
                    <BarChart3 className="h-4 w-4" />
                    <span>System Performance Overview</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">Live Sync</span>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-800/80 bg-gray-900/50 p-5">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Technical Interview Performance</div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white">{stats?.avg_tech_score || "0"}</span>
                      <span className="text-xs text-gray-500">/ 10 Avg Score</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      Calculated across {stats?.total_interviews || 0} completed technical interview evaluations.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-800/80 bg-gray-900/50 p-5">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Coding Challenge Performance</div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white">{stats?.avg_coding_score || "0"}</span>
                      <span className="text-xs text-gray-500">/ 10 Avg Score</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      Calculated across {stats?.total_coding_submissions || 0} candidate test submissions.
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-800 bg-[#0d0e15] p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Concern Resolution Velocity
                  </h4>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Resolution Rate</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {stats?.total_queries
                        ? Math.round((stats.resolved_queries / stats.total_queries) * 100)
                        : 100}
                      %
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      style={{
                        width: `${stats?.total_queries
                            ? Math.round((stats.resolved_queries / stats.total_queries) * 100)
                            : 100
                          }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Live Activity Feed */}
              <div className="rounded-3xl border border-gray-800 bg-[#141522] p-6 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400 border-b border-gray-800 pb-4">
                  <Clock className="h-4 w-4" />
                  <span>Recent Candidate Activity</span>
                </div>

                <div className="mt-4 divide-y divide-gray-800/60 max-h-[420px] overflow-y-auto pr-1">
                  {recentActivity.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-500">
                      No recent events recorded.
                    </div>
                  ) : (
                    recentActivity.map((act, idx) => (
                      <div key={idx} className="py-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{act.user}</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </span>
                        </div>
                        <p className="text-gray-400 mt-0.5">{act.title}</p>
                        <span className="mt-1 inline-block text-[10px] font-mono text-violet-400">
                          {act.meta}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

       
        {activeTab === "users" && (
          <div className="rounded-3xl border border-gray-800 bg-[#141522] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Registered Candidate Directory</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Full list of candidates registered on the platform with participation statistics.
                </p>
              </div>
              <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs font-bold text-violet-300">
                {users.length} Candidates
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-800 bg-gray-900/60 font-mono text-[11px] uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Candidate Name</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Technical Interviews</th>
                    <th className="px-5 py-3.5">Coding Tests</th>
                    <th className="px-5 py-3.5">Concerns Raised</th>
                    <th className="px-5 py-3.5">Joined Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-sans">
                  {users.map((u, uIdx) => (
                    <tr key={`user-${u.id}-${uIdx}`} className="transition hover:bg-gray-800/30">
                      <td className="px-5 py-4 font-mono font-bold text-violet-400">#{u.id}</td>
                      <td className="px-5 py-4 font-bold text-white text-xs">{u.name}</td>
                      <td className="px-5 py-4 text-gray-300 font-mono">{u.email}</td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-indigo-400">{u.technical_interviews_count || 0}</span>
                        {u.avg_technical_score && (
                          <span className="text-[10px] text-gray-400 ml-1">({u.avg_technical_score}/10 avg)</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-cyan-400">{u.coding_submissions_count || 0}</span>
                        {u.avg_coding_score && (
                          <span className="text-[10px] text-gray-400 ml-1">({u.avg_coding_score}/10 avg)</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-amber-400">{u.queries_count || 0}</span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 font-mono text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleViewUser(u.id)}
                          className="flex items-center gap-1 rounded-xl bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-200 transition ml-auto"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect History</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      
        {activeTab === "interviews" && (
          <div className="rounded-3xl border border-gray-800 bg-[#141522] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Technical Interview Evaluations</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Complete logs of technical AI interview sessions and generated reports.
                </p>
              </div>
              <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300">
                {interviews.length} Evaluations
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-800 bg-gray-900/60 font-mono text-[11px] uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-5 py-3.5">Report ID</th>
                    <th className="px-5 py-3.5">Candidate</th>
                    <th className="px-5 py-3.5">Overall Score</th>
                    <th className="px-5 py-3.5">Technical</th>
                    <th className="px-5 py-3.5">Skills</th>
                    <th className="px-5 py-3.5">Projects</th>
                    <th className="px-5 py-3.5">Experience</th>
                    <th className="px-5 py-3.5">Assigned Level</th>
                    <th className="px-5 py-3.5">Evaluated Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-sans">
                  {interviews.map((rep, rIdx) => (
                    <tr key={`interview-${rep.report_id}-${rIdx}`} className="transition hover:bg-gray-800/30">
                      <td className="px-5 py-4 font-mono font-bold text-indigo-400">#{rep.report_id}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{rep.user_name || `User #${rep.user_id}`}</div>
                        <div className="text-[11px] text-gray-400">{rep.user_email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-indigo-950/60 border border-indigo-700/60 px-2.5 py-1 text-xs font-bold text-indigo-300 font-mono">
                          {rep.overall_score}/10
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-300 font-mono">{rep.technical_score || 0}</td>
                      <td className="px-5 py-4 text-gray-300 font-mono">{rep.skills_score || 0}</td>
                      <td className="px-5 py-4 text-gray-300 font-mono">{rep.projects_score || 0}</td>
                      <td className="px-5 py-4 text-gray-300 font-mono">{rep.experience_score || 0}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-gray-800 px-2.5 py-1 text-[11px] font-bold text-gray-300">
                          {rep.final_level || "Junior"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 font-mono text-[11px]">
                        {rep.created_at ? new Date(rep.created_at).toLocaleString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

       
        {activeTab === "coding" && (
          <div className="rounded-3xl border border-gray-800 bg-[#141522] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Coding Interview Submissions & Reports</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  All candidate code executions, test cases pass rates, and evaluation metrics.
                </p>
              </div>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
                {codingSubs.length} Submissions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-800 bg-gray-900/60 font-mono text-[11px] uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-5 py-3.5">Sub ID</th>
                    <th className="px-5 py-3.5">Candidate</th>
                    <th className="px-5 py-3.5">Problem</th>
                    <th className="px-5 py-3.5">Language</th>
                    <th className="px-5 py-3.5">Execution Status</th>
                    <th className="px-5 py-3.5">Test Cases</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Complexity</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-sans">
                  {codingSubs.map((sub, sIdx) => (
                    <tr key={`coding-${sub.submission_id}-${sIdx}`} className="transition hover:bg-gray-800/30">
                      <td className="px-5 py-4 font-mono font-bold text-cyan-400">#{sub.submission_id}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{sub.user_name || `User #${sub.user_id}`}</div>
                        <div className="text-[11px] text-gray-400">{sub.user_email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-200">{sub.question_title || "Coding Challenge"}</div>
                        <span className="text-[10px] text-gray-400 uppercase font-mono">{sub.question_difficulty || "Easy"}</span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold uppercase text-violet-400">
                        {sub.language}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${sub.execution_status === "Passed"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                            }`}
                        >
                          {sub.execution_status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold">
                        {sub.test_cases_passed} / {sub.total_test_cases} Passed
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-white">
                        {sub.overall_score !== null && sub.overall_score !== undefined
                          ? `${sub.overall_score}/10`
                          : "N/A"}
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-gray-400">
                        {sub.time_complexity || "O(N)"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setInspectedCode(sub)}
                          className="flex items-center gap-1 rounded-xl bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-200 transition ml-auto"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          <span>View Code</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

     
        {activeTab === "resumes" && (
          <div className="rounded-3xl border border-gray-800 bg-[#141522] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Uploaded Candidate Resumes</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Resumes processed by the platform with detected skills and experience level.
                </p>
              </div>
              <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300">
                {resumes.length} Resumes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-800 bg-gray-900/60 font-mono text-[11px] uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Candidate</th>
                    <th className="px-5 py-3.5">Filename</th>
                    <th className="px-5 py-3.5">Detected Skills</th>
                    <th className="px-5 py-3.5">Experience</th>
                    <th className="px-5 py-3.5">Uploaded Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-sans">
                  {resumes.map((res, rIdx) => (
                    <tr key={`resume-${res.id}-${rIdx}`} className="transition hover:bg-gray-800/30">
                      <td className="px-5 py-4 font-mono font-bold text-purple-400">#{res.id}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{res.user_name || `User #${res.user_id}`}</div>
                        <div className="text-[11px] text-gray-400">{res.user_email}</div>
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold text-gray-300">
                        {res.filename}
                      </td>
                      <td className="px-5 py-4 max-w-sm">
                        <div className="flex flex-wrap gap-1">
                          {(res.skills_detected || "General").split(",").slice(0, 5).map((sk, i) => (
                            <span key={i} className="rounded-md bg-gray-800 px-2 py-0.5 text-[10px] text-gray-300">
                              {sk.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-violet-400">
                        {res.experience_level || "Junior"}
                      </td>
                      <td className="px-5 py-4 text-gray-400 font-mono text-[11px]">
                        {res.uploaded_at ? new Date(res.uploaded_at).toLocaleString() : "N/A"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setInspectedResume(res)}
                          className="flex items-center gap-1 rounded-xl bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-200 transition ml-auto"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

    
      <AnimatePresence>
        {selectedQuery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuery(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-800 bg-[#151624] p-6 shadow-2xl sm:p-8"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-gray-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-violet-400">
                      Query #{selectedQuery.id}
                    </span>
                    <span className="rounded-md bg-gray-800 px-2 py-0.5 text-[10px] text-gray-300">
                      {selectedQuery.category}
                    </span>
                    <StatusBadge status={selectedQuery.status} />
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-white">
                    {selectedQuery.subject}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Raised by <strong>{selectedQuery.user_name || "User"}</strong> ({selectedQuery.user_email || "N/A"}) on{" "}
                    {selectedQuery.created_at ? new Date(selectedQuery.created_at).toLocaleString() : ""}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedQuery(null)}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Success Message Banner */}
              {updateSuccessMsg && (
                <div className="mt-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 p-3.5 text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{updateSuccessMsg}</span>
                </div>
              )}

              {/* User Concern Content */}
              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Candidate Issue Description
                  </label>
                  <div className="mt-1.5 rounded-2xl border border-gray-800 bg-[#0d0e15] p-4 text-xs text-gray-200 leading-relaxed max-h-48 overflow-y-auto">
                    {selectedQuery.description}
                  </div>
                </div>

                {/* Status Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Update Concern Status
                    </label>
                    <select
                      value={adminStatusSelect}
                      onChange={(e) => setAdminStatusSelect(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-gray-800 bg-[#0d0e15] px-3.5 py-2.5 text-xs font-bold text-white transition focus:border-violet-500 focus:outline-none"
                    >
                      <option value="Pending">Pending (Awaiting Action)</option>
                      <option value="In Review">In Review (Investigating)</option>
                      <option value="Resolved">Resolved (Resolution Provided)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Quick Response Templates
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyTemplate("We have verified your interview evaluation and updated your record.")}
                        className="rounded-lg bg-gray-800 hover:bg-gray-700 px-2 py-1 text-[10px] text-gray-300"
                      >
                        + Report Verified
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate("The technical sandbox compiler issue has been patched.")}
                        className="rounded-lg bg-gray-800 hover:bg-gray-700 px-2 py-1 text-[10px] text-gray-300"
                      >
                        + Bug Resolved
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate("Our team is currently reviewing your submission log.")}
                        className="rounded-lg bg-gray-800 hover:bg-gray-700 px-2 py-1 text-[10px] text-gray-300"
                      >
                        + Investigating
                      </button>
                    </div>
                  </div>
                </div>

                {/* Admin Official Response */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Official Admin Response / Resolution Note *
                    </label>
                    <span className="text-[10px] text-violet-400 font-semibold">
                      Synchronizes to User's Profile
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    placeholder="Type official response or explanation here. The user will see this directly under their profile..."
                    className="mt-1.5 w-full rounded-2xl border border-gray-800 bg-[#0d0e15] p-3.5 text-xs text-gray-200 transition focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-gray-800 pt-4">
                <button
                  type="button"
                  onClick={() => handleDeleteQuery(selectedQuery.id)}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Query</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedQuery(null)}
                    className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveQueryUpdate}
                    disabled={updatingQuery}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-violet-900/50 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
                  >
                    {updatingQuery ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Update & Sync to User Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    
      <AnimatePresence>
        {selectedUserDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserDetail(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-gray-800 bg-[#151624] p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedUserDetail.user.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    {selectedUserDetail.user.email} &bull; Member since{" "}
                    {new Date(selectedUserDetail.user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Candidate History Tabs */}
              <div className="mt-5 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-2">
                    Technical Evaluations ({selectedUserDetail.technical_reports.length})
                  </h4>
                  {selectedUserDetail.technical_reports.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No technical interviews completed.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedUserDetail.technical_reports.map((r, rIdx) => (
                        <div key={`tech-${r.id}-${rIdx}`} className="rounded-xl border border-gray-800 bg-[#0d0e15] p-3 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-white">Score: {r.overall_score}/10</span>
                            <span className="text-violet-400">{r.final_level}</span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-1">
                            Tech: {r.technical_score} &bull; Skills: {r.skills_score} &bull; Projects: {r.projects_score}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                    Coding Submissions ({selectedUserDetail.coding_submissions.length})
                  </h4>
                  {selectedUserDetail.coding_submissions.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No coding challenges attempted.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedUserDetail.coding_submissions.map((s, sIdx) => (
                        <div key={`sub-${s.id}-${sIdx}`} className="rounded-xl border border-gray-800 bg-[#0d0e15] p-3 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-white">{s.question_title || "Coding Problem"}</span>
                            <span className="ml-2 font-mono uppercase text-violet-400 text-[10px]">({s.language})</span>
                            <div className="text-[11px] text-gray-400">{s.test_cases_passed}/{s.total_test_cases} Tests Passed</div>
                          </div>
                          <StatusBadge status={s.execution_status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    Concerns Raised ({selectedUserDetail.queries.length})
                  </h4>
                  {selectedUserDetail.queries.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No queries or concerns raised.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedUserDetail.queries.map((q, qIdx) => (
                        <div key={`uq-${q.id}-${qIdx}`} className="rounded-xl border border-gray-800 bg-[#0d0e15] p-3 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">{q.subject}</span>
                            <StatusBadge status={q.status} />
                          </div>
                          <p className="text-gray-400 mt-1">{q.description}</p>
                          {q.admin_response && (
                            <div className="mt-2 text-violet-300 bg-violet-950/40 p-2 rounded-lg border border-violet-800/40">
                              <strong>Admin Response:</strong> {q.admin_response}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      
      <AnimatePresence>
        {inspectedCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectedCode(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-gray-800 bg-[#151624] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {inspectedCode.question_title || "Candidate Code Submission"}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Language: <span className="uppercase text-violet-400">{inspectedCode.language}</span> &bull; Status: {inspectedCode.execution_status} &bull; Passed: {inspectedCode.test_cases_passed}/{inspectedCode.total_test_cases}
                  </p>
                </div>
                <button
                  onClick={() => setInspectedCode(null)}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4">
                <pre className="p-4 rounded-2xl bg-[#0d0e15] border border-gray-800 text-xs font-mono text-gray-200 overflow-x-auto max-h-[380px]">
                  {inspectedCode.code}
                </pre>

                {inspectedCode.feedback && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-gray-900 border border-gray-800 text-xs text-gray-300">
                    <span className="font-bold text-violet-400 block mb-1">AI Evaluator Feedback:</span>
                    {inspectedCode.feedback}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

     
      <AnimatePresence>
        {inspectedResume && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectedResume(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-gray-800 bg-[#151624] p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {inspectedResume.filename}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Candidate: {inspectedResume.user_name} ({inspectedResume.user_email}) &bull; Level: {inspectedResume.experience_level}
                  </p>
                </div>
                <button
                  onClick={() => setInspectedResume(null)}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Skills Detected</label>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(inspectedResume.skills_detected || "N/A").split(",").map((s, i) => (
                      <span key={i} className="rounded-lg bg-violet-950/60 border border-violet-800/40 px-2.5 py-1 text-xs font-semibold text-violet-300">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Parsed Raw Text Snippet</label>
                  <pre className="mt-1 p-4 rounded-2xl bg-[#0d0e15] border border-gray-800 text-xs font-mono text-gray-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {inspectedResume.raw_text || "No raw text available."}
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helper UI Components ─────────────────────────────────────────────────────

function MetricCard({ title, value, subtitle, icon: Icon, color, bg }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition hover:scale-[1.02] ${bg}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{title}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="mt-2 text-2xl font-black text-white font-mono">{value || 0}</div>
      {subtitle && <div className="mt-0.5 text-[10px] text-gray-400 font-medium">{subtitle}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const norm = (status || "").toLowerCase();
  if (norm === "resolved" || norm === "passed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="h-3 w-3" />
        <span>Resolved</span>
      </span>
    );
  }
  if (norm === "in review") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/20 px-2.5 py-1 text-[11px] font-bold text-blue-300 border border-blue-500/30">
        <RefreshCw className="h-3 w-3" />
        <span>In Review</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-amber-500/30">
      <Clock className="h-3 w-3" />
      <span>Pending</span>
    </span>
  );
}
