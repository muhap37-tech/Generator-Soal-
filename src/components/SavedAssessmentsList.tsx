import React, { useState } from "react";
import {
  FileText,
  Calendar,
  Layers,
  Trash2,
  Download,
  BookOpen,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { GeneratedAssessment } from "../types";
import { downloadAllAsZip } from "../utils/exporters";

interface SavedAssessmentsListProps {
  assessments: GeneratedAssessment[];
  onSelect: (assessment: GeneratedAssessment) => void;
  onDelete: (id: string) => void;
}

export default function SavedAssessmentsList({ assessments, onSelect, onDelete }: SavedAssessmentsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = assessments.filter((a) => {
    const titleMatch = a.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const subjectMatch = a.metadata?.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || subjectMatch;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          id="search-history-input"
          type="text"
          placeholder="Cari riwayat mata pelajaran atau judul ujian..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
          <FileText className="h-8 w-8 text-slate-350 dark:text-slate-650 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tidak ada dokumen riwayat ditemukan
          </p>
          <p className="text-3xs text-slate-400 mt-1 leading-normal">
            Gunakan pengisi form di atas untuk meluncurkan draft ujian perdana Anda!
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-120 overflow-y-auto pr-1">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50 border border-slate-200/50 dark:border-slate-800/80 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all"
            >
              <div className="space-y-1 w-full md:w-2/3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 rounded-full text-4xs font-mono font-bold">
                    {item.examType}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-4xs font-mono font-semibold">
                    {item.metadata.className} ({item.metadata.phase})
                  </span>
                </div>
                
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {item.title}
                </h4>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-4xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.createdAt)}
                  </span>
                  <span>•</span>
                  <span>{item.questions?.length || 0} Butir Soal</span>
                  <span>•</span>
                  <span className="text-amber-600 dark:text-amber-400">Kompleksitas: {item.difficulty}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full md:w-auto md:justify-end border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100 dark:border-slate-850">
                <button
                  id={`view-history-${item.id}`}
                  onClick={() => onSelect(item)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 text-3xs font-semibold transition-all cursor-pointer"
                  title="Lihat Pratinjau Dokumen"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Lihat / Edit</span>
                </button>

                <button
                  id={`download-zip-history-${item.id}`}
                  onClick={() => downloadAllAsZip(item)}
                  className="p-2 text-slate-500 dark:text-slate-450 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"
                  title="Unduh Paket Dokumen (ZIP)"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button
                  id={`delete-history-${item.id}`}
                  onClick={() => {
                    if (confirm("Apakah Anda yakin ingin menghapus arsip ujian ini?")) {
                      onDelete(item.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                  title="Hapus Arsip"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
