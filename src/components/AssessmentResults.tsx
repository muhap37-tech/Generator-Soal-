import React, { useState } from "react";
import {
  FileText,
  Table as TableIcon,
  CheckSquare,
  Award,
  Download,
  Printer,
  ChevronDown,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowLeft,
  FileCheck,
  MapPin,
  Image as ImageIcon
} from "lucide-react";
import { GeneratedAssessment, QuestionFormat } from "../types";
import {
  generateKisiKisiDocx,
  generateSoalDocx,
  generateKunciDocx,
  downloadDocxFile,
  downloadPdfFile,
  downloadAllAsZip
} from "../utils/exporters";

interface AssessmentResultsProps {
  assessment: GeneratedAssessment;
  onBack: () => void;
}

export default function AssessmentResults({ assessment, onBack }: AssessmentResultsProps) {
  const [activeTab, setActiveTab] = useState<"kisi" | "soal" | "kunci" | "pedoman">("kisi");
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [examFont, setExamFont] = useState<"times" | "arial">("times");
  const [examFontSize, setExamFontSize] = useState<"small" | "medium" | "large">("medium");

  const meta = assessment.metadata;

  const handleDocxDownload = async (type: "kisi" | "soal" | "kunci") => {
    setIsDownloading(type);
    try {
      let doc;
      let name = "";
      if (type === "kisi") {
        doc = await generateKisiKisiDocx(assessment);
        name = `Kisi_Kisi_${meta.subject.replace(/\s+/g, "_")}.docx`;
      } else if (type === "soal") {
        doc = await generateSoalDocx(assessment);
        name = `Soal_${meta.subject.replace(/\s+/g, "_")}.docx`;
      } else {
        doc = await generateKunciDocx(assessment);
        name = `Kunci_Jawaban_${meta.subject.replace(/\s+/g, "_")}.docx`;
      }
      await downloadDocxFile(doc, name);
    } catch (e) {
      alert("Gagal mengunduh DOCX: " + e);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  // Helper parser that transforms markdown-style tables into clean responsive HTML tables
  const parseQuestionContentToHtml = (qText: string) => {
    if (!qText.includes("|")) {
      return <p className="leading-relaxed whitespace-pre-line text-slate-850 dark:text-slate-100">{qText}</p>;
    }

    const lines = qText.split("\n");
    const contents: React.ReactNode[] = [];
    const tableLines: string[][] = [];
    let inTable = false;

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        inTable = true;
        const cols = trimmed
          .split("|")
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        if (!cols.every((c) => c.startsWith("-"))) {
          tableLines.push(cols);
        }
      } else {
        if (inTable && tableLines.length > 0) {
          contents.push(
            <div key={`table-${lineIdx}`} className="overflow-x-auto my-3 not-prose">
              <table className="border-collapse border-2 border-slate-400 dark:border-slate-700 text-xs font-sans w-full max-w-2xl bg-white dark:bg-slate-950">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b-2 border-slate-400 dark:border-slate-700">
                    {tableLines[0].map((col, idx) => (
                      <th key={idx} className="border border-slate-350 dark:border-slate-800 px-4 py-2 font-bold text-left text-slate-900 dark:text-white">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableLines.slice(1).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 border-b border-slate-300 dark:border-slate-800">
                      {row.map((col, cIdx) => (
                        <td key={cIdx} className="border border-slate-300 dark:border-slate-800 px-4 py-1.5 text-slate-800 dark:text-slate-300">
                          {col}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          tableLines.length = 0;
          inTable = false;
        }
        if (trimmed.length > 0) {
          contents.push(
            <p key={`text-${lineIdx}`} className="leading-relaxed whitespace-pre-line text-slate-850 dark:text-slate-100">
              {line}
            </p>
          );
        }
      }
    });

    if (tableLines.length > 0) {
      contents.push(
        <div key="table-end" className="overflow-x-auto my-3 not-prose">
          <table className="border-collapse border-2 border-slate-400 dark:border-slate-700 text-xs font-sans w-full max-w-2xl bg-white dark:bg-slate-950">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 border-b-2 border-slate-400 dark:border-slate-700">
                {tableLines[0].map((col, idx) => (
                  <th key={idx} className="border border-slate-350 dark:border-slate-800 px-4 py-2 font-bold text-left text-slate-900 dark:text-white">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableLines.slice(1).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 border-b border-slate-300 dark:border-slate-800">
                  {row.map((col, cIdx) => (
                    <td key={cIdx} className="border border-slate-300 dark:border-slate-800 px-4 py-1.5 text-slate-800 dark:text-slate-300">
                      {col}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return <div className="space-y-2">{contents}</div>;
  };

  const fontClass = examFont === "times" ? "font-serif" : "font-sans";
  const sizeClass = 
    examFontSize === "small" ? "text-2xs leading-relaxed" :
    examFontSize === "large" ? "text-sm leading-normal" : "text-xs leading-relaxed";

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-xs no-print">
        <div className="flex items-center gap-3">
          <button
            id="back-to-input-btn"
            onClick={onBack}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-slate-500 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-705 dark:text-blue-350 rounded-full text-4xs font-mono font-bold">
              {assessment.examType}
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
              {assessment.title}
            </h2>
          </div>
        </div>

        {/* Exporter Suite Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Print Action */}
          <button
            id="results-print-btn"
            onClick={handleBrowserPrint}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-750 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-550" />
            <span>Cetak Dokumen (Ctrl+P)</span>
          </button>

          {/* Download ZIP */}
          <button
            id="results-zip-download-btn"
            onClick={() => downloadAllAsZip(assessment)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl hover:scale-[1.02] active:scale-[0.98] text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Unduh Paket ZIP (Semua DOCX)</span>
          </button>
        </div>
      </div>

      {/* 2. Platform Metadata Display */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-3 shadow-md border border-white/10 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <Sparkles className="h-5 w-5 text-indigo-200 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-xs font-bold">Dokumen Berhasil Difasilitasi AI</h4>
            <p className="text-4xs text-slate-300 mt-0.5">
              Kelola cetak, sesuaikan tata letak font, dan kustomisasi tanda tangan sebelum mengunduh berkas formal.
            </p>
          </div>
        </div>
        {/* Creator Identity */}
        <div className="bg-black/20 border border-white/20 rounded-xl px-4 py-1.5 text-center shadow-inner">
          <span className="text-4xs font-mono text-slate-300 block leading-tight font-semibold uppercase">Platform Creator Watermark:</span>
          <span className="text-xs font-mono text-white tracking-wide font-bold uppercase">
            By Muh. Asriwadi AP
          </span>
        </div>
      </div>

      {/* 3. Document View Port & Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left pane: Tab selection, download details */}
        <div className="md:col-span-3 space-y-4 no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 p-3 shadow-xs space-y-1.5">
            <button
              id="tab-kisi-trigger"
              onClick={() => setActiveTab("kisi")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "kisi"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              <TableIcon className="h-4 w-4" />
              <span>Kisi-kisi Soal</span>
            </button>

            <button
              id="tab-soal-trigger"
              onClick={() => setActiveTab("soal")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "soal"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Naskah Soal Ujian</span>
            </button>

            <button
              id="tab-kunci-trigger"
              onClick={() => setActiveTab("kunci")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "kunci"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>Kunci & Pembahasan</span>
            </button>

            <button
              id="tab-pedoman-trigger"
              onClick={() => setActiveTab("pedoman")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "pedoman"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Pedoman Penskoran</span>
            </button>
          </div>

          {/* Download individual items */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 p-4 shadow-xs space-y-3">
            <h5 className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              Unduh Berkas Mandiri (Word)
            </h5>

            <button
              onClick={() => handleDocxDownload("kisi")}
              disabled={isDownloading === "kisi"}
              className="w-full flex items-center justify-between text-left p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] font-medium transition-all cursor-pointer"
            >
              <span className="truncate text-slate-700 dark:text-slate-300">1_Kisi-kisi_Soal.docx</span>
              <Download className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            </button>

            <button
              onClick={() => handleDocxDownload("soal")}
              disabled={isDownloading === "soal"}
              className="w-full flex items-center justify-between text-left p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] font-medium transition-all cursor-pointer"
            >
              <span className="truncate text-slate-700 dark:text-slate-300">2_Naskah_Soal.docx</span>
              <Download className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            </button>

            <button
              onClick={() => handleDocxDownload("kunci")}
              disabled={isDownloading === "kunci"}
              className="w-full flex items-center justify-between text-left p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] font-medium transition-all cursor-pointer"
            >
              <span className="truncate text-slate-700 dark:text-slate-300">3_Kunci_&_Rasional.docx</span>
              <Download className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            </button>

            <div className="relative pt-2 flex items-center">
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              <span className="flex-shrink mx-2 text-[8px] font-mono text-slate-400 uppercase font-semibold">Dokumen PDF</span>
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => downloadPdfFile("kisi", assessment)}
                className="py-1 px-1 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center text-[10px] font-semibold text-slate-655 dark:text-slate-400 cursor-pointer"
              >
                Kisi PDF
              </button>
              <button
                onClick={() => downloadPdfFile("soal", assessment)}
                className="py-1 px-1 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center text-[10px] font-semibold text-slate-655 dark:text-slate-400 cursor-pointer"
              >
                Soal PDF
              </button>
              <button
                onClick={() => downloadPdfFile("kunci", assessment)}
                className="py-1 px-1 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center text-[10px] font-semibold text-slate-655 dark:text-slate-400 cursor-pointer"
              >
                Kunci PDF
              </button>
            </div>
          </div>
        </div>

        {/* Right Content Pane (Printable context area styled like a true piece of document paper) */}
        <div className="md:col-span-9 space-y-4">
          
          {/* Customizer Panel */}
          <div className="bg-slate-105 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex flex-wrap gap-4 items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <span className="text-3xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">⚙️ FORMAT TAMPILAN</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-4xs font-mono text-slate-450 uppercase">Gaya Font:</span>
                <select
                  value={examFont}
                  onChange={(e) => setExamFont(e.target.value as "times" | "arial")}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl px-2 py-1 text-4xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="times">Times New Roman (Kearsipan Formal)</option>
                  <option value="arial">Arial Standard (Sederhana & Bersih)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-4xs font-mono text-slate-455 uppercase">Ukuran Font:</span>
                <select
                  value={examFontSize}
                  onChange={(e) => setExamFontSize(e.target.value as "small" | "medium" | "large")}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl px-2 py-1 text-4xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="small">Kecil (10pt)</option>
                  <option value="medium">Sedang (11pt)</option>
                  <option value="large">Besar (12pt)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Printable container A4 Sheet layout simulation */}
          <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 md:p-12 shadow-sm text-slate-900 dark:text-slate-100 ${fontClass} ${sizeClass} break-words`}>
            
            {/* 1. Official Letterhead (KOP SURAT SEKOLAH) */}
            <div className="flex items-center gap-5 border-b-4 border-double border-slate-900 dark:border-slate-100 pb-3.5 mb-6 text-slate-900 dark:text-slate-100">
              {meta.uploadedLogoUrl ? (
                <img
                  src={meta.uploadedLogoUrl}
                  alt="School Logo"
                  className="h-16 w-16 md:h-20 md:w-20 object-contain flex-shrink-0 bg-white p-1 rounded-lg border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-16 w-16 md:h-18 md:w-18 bg-slate-100 dark:bg-slate-900 rounded-xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-400 flex-shrink-0 shadow-inner">
                  <Award className="h-7 w-7 text-indigo-500" />
                  <span className="text-[7px] font-mono leading-none mt-1 uppercase font-bold text-slate-450">School Logo</span>
                </div>
              )}
              
              <div className="flex-1 text-center pr-10">
                <h3 className="text-3xs md:text-2xs font-extrabold uppercase tracking-widest text-slate-650 dark:text-slate-350 leading-tight">
                  {meta.kopHeader1 || "PEMERINTAH KABUPATEN / DINAS PENDIDIKAN"}
                </h3>
                <h2 className="text-2xs md:text-xs font-black uppercase tracking-wide text-slate-900 dark:text-white mt-0.5 leading-snug">
                  {meta.kopHeader2 || "UPTD SATUAN PENDIDIKAN SD NEGERI CERDAS BANGSA"}
                </h2>
                <div className="flex items-center justify-center gap-1.5 mt-1 text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                  <MapPin className="h-3 w-3 text-red-500" />
                  <span>Alamat: {meta.kopAddress || "Jl. Diponegoro No. 10, Kecamatan Nusantara"}</span>
                </div>
              </div>
            </div>

            {/* Title display */}
            <div className="text-center mb-6">
              <h1 className="text-xs md:text-sm font-black uppercase tracking-wide">
                {activeTab === "kisi" && "KISI-KISI SELEKSI SOAL INSTURMEN UJIAN"}
                {activeTab === "soal" && "LEMBAR NASKAH SOAL UJIAN"}
                {activeTab === "kunci" && "KUNCI JAWABAN & RASIONAL PEMBAHASAN"}
                {activeTab === "pedoman" && "PEDOMAN PENSKORAN ASESMEN"}
              </h1>
              <p className="text-4xs font-mono font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-0.5 leading-none">
                {assessment.title}
              </p>
            </div>

            {/* TAB 1: KISI-KISI TABLE */}
            {activeTab === "kisi" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl no-print text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-indigo-505" />
                    <span>Matriks kisi-kisi berikut terpetakan secara otomatis dengan nomor butir soal.</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-3xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-300 border-b border-slate-300 dark:border-slate-800">
                        <th className="py-2.5 px-2 font-bold">No</th>
                        <th className="py-2.5 px-2 font-bold">Materi/Topik</th>
                        <th className="py-2.5 px-2 font-bold">Tujuan Pembelajaran</th>
                        <th className="py-2.5 px-2 font-bold">Indikator Soal</th>
                        <th className="py-2.5 px-2 font-bold text-center">Kognitif</th>
                        <th className="py-2.5 px-2 font-bold">Bentuk</th>
                        <th className="py-2.5 px-2 font-bold text-center">No Soal</th>
                        <th className="py-2.5 px-2 font-bold text-center">Kunci</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessment.kisiKisi.map((item) => (
                        <tr
                          key={item.no}
                          className="border-b border-slate-200 dark:border-slate-900 hover:bg-slate-50/20"
                        >
                          <td className="py-2 px-2 font-mono font-bold text-slate-400">{item.no}</td>
                          <td className="py-2 px-2 font-bold text-slate-800 dark:text-slate-205">{item.material}</td>
                          <td className="py-2 px-2 text-slate-650 dark:text-slate-400">{item.tp}</td>
                          <td className="py-2 px-2 text-slate-600 dark:text-slate-400 font-sans">{item.indicator}</td>
                          <td className="py-2 px-2 font-mono text-4xs text-center font-bold">{item.cognitiveLevel}</td>
                          <td className="py-2 px-2 text-slate-500 dark:text-slate-450">{item.questionType}</td>
                          <td className="py-2 px-2 font-mono font-bold text-center text-blue-600 dark:text-blue-400">
                            {item.questionNumber}
                          </td>
                          <td className="py-2 px-2 font-mono text-center font-bold text-slate-800 dark:text-slate-200">{item.answerKey}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: NASKAH SOAL */}
            {activeTab === "soal" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-150 dark:border-slate-850 no-print">
                  <div>
                    <p className="text-4xs font-semibold text-slate-400">ALOKASI WAKTU</p>
                    <p className="text-xs font-bold">{meta.timeAllocation}</p>
                  </div>
                  <div>
                    <p className="text-4xs font-semibold text-slate-400">SEMESTER</p>
                    <p className="text-xs font-bold">{meta.semester}</p>
                  </div>
                </div>

                {/* Questions Loop */}
                <div className="space-y-6">
                  {assessment.questions.map((q) => (
                    <div key={q.no} className="relative group pl-1">
                      {/* Flex layout aligning question number precisely */}
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono font-black text-slate-900 dark:text-indigo-400 min-w-4 text-left">
                          {q.no}.
                        </span>
                        
                        <div className="space-y-2 flex-1">
                          
                          {/* Parse markdown tables if any in the statement */}
                          <div className="text-slate-850 dark:text-slate-100 font-medium">
                            {parseQuestionContentToHtml(q.question)}
                          </div>

                          {/* Image Illustration placeholder with beautiful SVG representation */}
                          {q.illustrationDescription && (
                            <div className="p-4 my-3 rounded-2xl border-2 border-dashed border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 select-none">
                              <div className="max-w-md mx-auto py-2.5 text-center flex flex-col items-center justify-center gap-2">
                                <div className="p-2.5 bg-blue-50 dark:bg-indigo-950/40 text-blue-500 rounded-full">
                                  <ImageIcon className="h-6 w-6 animate-pulse" />
                                </div>
                                <p className="font-extrabold text-[10px] uppercase tracking-widest text-slate-500">
                                  Lembar Lampiran Ilustrasi / Diagram Siswa
                                </p>
                                <p className="text-3xs italic opacity-85 leading-relaxed max-w-sm">
                                  "{q.illustrationDescription}"
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Options list for Multiple Choice */}
                          {q.options && q.options.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 pl-1">
                              {q.options.map((option, oIdx) => {
                                const label = ["A", "B", "C", "D", "E"][oIdx];
                                return (
                                  <div
                                    key={oIdx}
                                    className="flex items-start gap-2.5 px-3 py-1.5 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-150 dark:border-slate-850 transition-colors"
                                  >
                                    <span className="font-mono font-black text-blue-600 dark:text-indigo-455 text-3xs">
                                      {label}.
                                    </span>
                                    <span className="text-3xs text-slate-800 dark:text-slate-300">
                                      {option}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            // Essay response space helper
                            <div className="pt-1.5 pl-3">
                              <div className="border border-dashed border-slate-200 dark:border-slate-800 p-3 bg-slate-50/30 dark:bg-slate-950/25 rounded-xl italic text-slate-400 dark:text-slate-500 text-4xs">
                                [Tembusan Uraian - Sediakan Lembar Jawaban Guru dengan Bobot Nilai: {q.scoreWeight} Poin]
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: KUNCI JAWABAN */}
            {activeTab === "kunci" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between no-print bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-3xs text-slate-450 font-mono leading-relaxed">
                  <span>NOMOR SOAL & KUNCI</span>
                  <span>PEMBAHASAN BENAR</span>
                  <span>SKOR</span>
                </div>

                <div className="space-y-4">
                  {assessment.answers.map((ans) => {
                    return (
                      <div
                        key={ans.no}
                        className="p-4 bg-slate-50/40 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2"
                      >
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                              Nomor {ans.no}
                            </span>
                            <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-lg text-4xs font-mono font-bold">
                              Kunci: {ans.correctAnswer}
                            </span>
                          </div>
                          <span className="text-3xs font-mono text-slate-500 font-bold">
                            Skor Bobot: {ans.score} Poin
                          </span>
                        </div>

                        <div className="text-3xs text-slate-650 dark:text-slate-300 leading-relaxed pl-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            Rasional Pembahasan:
                          </p>
                          <p className="mt-0.5 italic">{ans.explanation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: PEDOMAN PENSKORAN */}
            {activeTab === "pedoman" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/40 p-4 rounded-xl no-print text-[11px] text-indigo-700 dark:text-indigo-300">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span>Pedoman ini membantu guru melakukan penilaian objektif terhadap seluruh instrumen ujian.</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-3xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-3 font-semibold">Tipe Formatter Soal</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Skor Tiap Butir</th>
                        <th className="py-2.5 px-3 font-semibold">Kriteria Penilaian / Aturan Penskoran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessment.scoringGuideline.map((guide, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/20"
                        >
                          <td className="py-2.5 px-3 font-bold text-slate-850 dark:text-slate-200">{guide.questionType}</td>
                          <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400 text-center font-bold">
                            {guide.weightPerQuestion}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                            {guide.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Indonesian Signature Block Area */}
            <div className="grid grid-cols-2 gap-6 pt-10 mt-10 border-t border-slate-250 dark:border-slate-800 text-xs text-slate-850 dark:text-slate-200 break-inside-avoid shadow-neutral-100 leading-relaxed">
              <div>
                <p className="text-[11px] font-medium tracking-wide">Mengetahui,</p>
                <p className="text-[11px] font-extrabold uppercase mt-0.5">Kepala Sekolah</p>
                <div className="h-16"></div>
                <p className="text-[11px] font-black underline uppercase">
                  {meta.headmasterName || "Kepala Sekolah"}
                </p>
                <p className="text-3xs font-mono font-medium text-slate-500 mt-0.5">
                  NIP. {meta.headmasterNip || "_______________________"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-500">
                  Disahkan di: {meta.schoolName || "Sekolah"}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <p className="text-[11px] font-extrabold uppercase mt-0.5">Guru Mata Pelajaran,</p>
                <div className="h-16"></div>
                <p className="text-[11px] font-black underline uppercase">
                  {meta.teacherName || "Guru Mata Pelajaran"}
                </p>
                <p className="text-3xs font-mono font-medium text-slate-500 mt-0.5">
                  NIP. {meta.teacherNip || "_______________________"}
                </p>
              </div>
            </div>

            {/* Core Footer Sign-off Watermark (Always visible, crucially printed) */}
            <div className="mt-10 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3 text-4xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-500" />
                <span>Verifikasi Dokumen Akademik: Sinkronisasi Sinkron</span>
              </div>
              <div className="text-center md:text-right font-semibold text-slate-700 dark:text-slate-300 text-3xs border border-slate-150 dark:border-slate-800 px-3 py-1 rounded-lg">
                Instrumen Asesmen By Muh. Asriwadi AP
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
