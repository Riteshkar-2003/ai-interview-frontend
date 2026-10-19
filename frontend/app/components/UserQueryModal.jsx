"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquarePlus,
  X,
  AlertCircle,
  CheckCircle2,
  Send,
  HelpCircle,
  Bug,
  FileQuestion,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { submitUserQuery } from "../../lib/api";

const CATEGORIES = [
  { id: "Interview Report Query", label: "Interview Report Query", icon: FileQuestion },
  { id: "Coding Sandbox Issue", label: "Coding Sandbox / Execution Bug", icon: Bug },
  { id: "Speech / Audio Problem", label: "Speech / Audio Recognition Issue", icon: HelpCircle },
  { id: "Website Bug", label: "Website UI or Loading Bug", icon: ShieldAlert },
  { id: "Account & Resume", label: "Account & Resume Upload", icon: Sparkles },
  { id: "General Inquiry", label: "General Feedback or Question", icon: MessageSquarePlus },
];

export default function UserQueryModal({ isOpen: externalIsOpen, onClose: externalOnClose, onQuerySubmitted }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = externalIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (isControlled && externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleOpen = () => {
    setInternalIsOpen(true);
  };

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Interview Report Query");
  const [urgency, setUrgency] = useState("Medium");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!subject.trim()) {
      setError("Please provide a subject for your query.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError("Please provide a detailed description (minimum 10 characters).");
      return;
    }

    let userId = 1;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          if (u.id) userId = Number(u.id);
        }
      } catch (err) {
        console.warn("Could not read user session for query:", err);
      }
    }

    try {
      setLoading(true);
      const res = await submitUserQuery({
        user_id: userId,
        subject: subject.trim(),
        category,
        urgency,
        description: description.trim(),
      });

      if (res && res.success) {
        setSubmittedQuery(res.query);
        if (onQuerySubmitted) {
          onQuerySubmitted(res.query);
        }
      } else {
        throw new Error(res?.message || "Failed to submit query.");
      }
    } catch (err) {
      setError(err.message || "Failed to submit query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubject("");
    setCategory("Interview Report Query");
    setUrgency("Medium");
    setDescription("");
    setError("");
    setSubmittedQuery(null);
  };

  return (
    <>
      {!isControlled && (
        <motion.button
          onClick={handleOpen}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 px-5 py-3.5 font-bold text-white shadow-xl shadow-violet-500/30 transition hover:shadow-2xl hover:shadow-violet-500/40"
          title="Facing issues or have a query? Click to contact support."
        >
          <div className="relative">
            <MessageSquarePlus className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-sm font-semibold tracking-wide">Have a Query / Facing Issue?</span>
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200">
                    <MessageSquarePlus className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
                      Raise a Query or Concern
                    </h3>
                    <p className="text-xs text-slate-500 sm:text-sm">
                      Facing an issue or need report clarification? Our team will review and update you.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6">
                {submittedQuery ? (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-4 text-center"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>

                    <h4 className="mt-4 text-2xl font-bold text-slate-900">
                      Query Submitted Successfully!
                    </h4>

                    <div className="mx-auto mt-2 max-w-md rounded-2xl bg-emerald-50/80 p-4 border border-emerald-100 text-xs text-emerald-800">
                      <p className="font-semibold">Concern Reference ID: #{submittedQuery.id}</p>
                      <p className="mt-1 text-slate-600">
                        Status is currently marked as <span className="font-bold text-amber-600">Pending</span>.
                        Once reviewed, administrators will post resolution notes visible directly in your <strong>Profile &rarr; Concerns</strong> section.
                      </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          handleReset();
                          handleClose();
                        }}
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700"
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Submit Another Query
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Subject / Brief Title *
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Question about technical score or coding test execution"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                          Concern Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 transition focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 cursor-pointer"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                          Urgency Level
                        </label>
                        <div className="mt-1.5 flex gap-2">
                          {["Low", "Medium", "High"].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setUrgency(lvl)}
                              className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                                urgency === lvl
                                  ? lvl === "High"
                                    ? "bg-red-600 text-white shadow-md shadow-red-200"
                                    : lvl === "Medium"
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                          Detailed Description / Explanation *
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {description.length} chars
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please describe the issue or query in detail so our administrators can inspect and help you promptly..."
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 transition focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <p className="text-[11px] text-slate-500">
                        Admin replies will appear in your <strong>Profile &rarr; Concerns</strong>.
                      </p>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={loading}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5" />
                              <span>Submit Concern</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
