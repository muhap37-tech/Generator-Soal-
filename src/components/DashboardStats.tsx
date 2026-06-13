import React from "react";
import { BookOpen, FileCheck, HelpCircle, Layers, Calendar } from "lucide-react";
import { GeneratedAssessment } from "../types";

interface DashboardStatsProps {
  assessments: GeneratedAssessment[];
}

export default function DashboardStats({ assessments }: DashboardStatsProps) {
  // Compute interesting metrics
  const totalCreated = assessments.length;

  const totalQuestionsList = assessments.reduce((acc, curr) => {
    return acc + (curr.questions?.length || 0);
  }, 0);

  const getLatestSubject = () => {
    if (assessments.length === 0) return "Belum Ada";
    return assessments[0].metadata.subject;
  };

  const getLatestLevel = () => {
    if (assessments.length === 0) return "-";
    return assessments[0].metadata.level.split(" ")[0]; // e.g. SD, SMP, SMA
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Stat 1: Total Exams Blueprint */}
      <div className="relative overflow-hidden rounded-2xl glass-card border border-white/20 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
              Asesmen Dibuat
            </p>
            <h4 className="text-3xl font-display font-bold text-slate-900 dark:text-white mt-1">
              {totalCreated}
            </h4>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
            <FileCheck className="h-5 w-5" />
          </div>
        </div>
        <p className="text-3xs text-slate-400 dark:text-slate-500 mt-2 font-mono">
          Tersimpan aman di cloud / lokal
        </p>
      </div>

      {/* Stat 2: Total Question Items */}
      <div className="relative overflow-hidden rounded-2xl glass-card border border-white/20 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
              Total Butir Soal
            </p>
            <h4 className="text-3xl font-display font-bold text-slate-900 dark:text-white mt-1">
              {totalQuestionsList}
            </h4>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <HelpCircle className="h-5 w-5" />
          </div>
        </div>
        <p className="text-3xs text-slate-400 dark:text-slate-500 mt-2 font-mono">
          Terbagi PILGAN, Isian, & Uraian
        </p>
      </div>

      {/* Stat 3: Last Subject */}
      <div className="relative overflow-hidden rounded-2xl glass-card border border-white/20 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
              Mata Pelajaran Terakhir
            </p>
            <h4 className="text-xl font-sans font-bold text-slate-900 dark:text-white mt-2 truncate w-40">
              {getLatestSubject()}
            </h4>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>
        <p className="text-3xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
          Tingkat Jenjang: {getLatestLevel()}
        </p>
      </div>

      {/* Stat 4: Date Info */}
      <div className="relative overflow-hidden rounded-2xl glass-card border border-white/20 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
              Tahun Ajaran Aktif
            </p>
            <h4 className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-1">
              2025/2026
            </h4>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
        <p className="text-3xs text-slate-400 dark:text-slate-500 mt-2 font-mono">
          Sinkronisasi Kurikulum Merdeka
        </p>
      </div>
    </div>
  );
}
