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
  FileCheck
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

  // Modern browser-print helper
  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-xs no-print">
        <div className="flex items-center gap-3">
          <button
            id="back-to-input-btn"
            onClick={onBack}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-full text-4xs font-mono font-bold">
              {assessment.examType}
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
              {assessment.title}
            </h2>
          </div>
        </div>

        {/* Exporter Suite Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Print PDF standard */}
          <button
            id="results-print-btn"
            onClick={handleBrowserPrint}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold text-slate-700 dark:text-slate-350 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Cetak Dokumen (Ctrl+P)</span>
          </button>

          {/* Download ZIP */}
          <button
            id="results-zip-download-btn"
            onClick={() => downloadAllAsZip(assessment)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-900 text-white dark:text-indigo-100 rounded-xl hover:scale-103 active:scale-97 text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Paket ZIP (Semua DOCX)</span>
          </button>
        </div>
      </div>

      {/* 2. Watermark Jelas Muh. Asriwadi AP warning */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-3 shadow-md border border-blue-600/30 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <Sparkles className="h-5 w-5 text-indigo-300 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-display font-bold">Dokumen Berhasil Difasilitasi AI</h4>
            <p className="text-4xs text-slate-300">
              Dokumen disinkronisasi standar Kurikulum Merdeka & K13 dengan pedoman Taksonomi Bloom.
            </p>
          </div>
        </div>
        {/* Main clearly visible watermark display */}
        <div className="bg-black/20 border border-white/20 rounded-xl px-4 py-1.5 text-center shadow-inner">
          <span className="text-3xs font-mono text-slate-300 block leading-tight font-semibold uppercase">Platform Creator Watermark:</span>
          <span className="text-xs font-mono text-white tracking-wide font-bold uppercase">
            By Muh. Asriwadi AP
          </span>
        </div>
      </div>

      {/* 3. Document View Port & Tabs (No-Print) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left: Tab selectors & Individual downloads */}
        <div className="md:col-span-3 space-y-4 no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 p-3 shadow-xs space-y-1.5">
            <button
              id="tab-kisi-trigger"
              onClick={() => setActiveTab("kisi")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "kisi"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              <TableIcon className="h-4 w-4" />
              <span>Kisi-kisi Soal</span>
            </button>

            <button
              id="tab-soal-trigger"
              onClick={() => setActiveTab("soal")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "soal"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Naskah Soal Ujian</span>
            </button>

            <button
              id="tab-kunci-trigger"
              onClick={() => setActiveTab("kunci")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "kunci"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>Kunci & Pembahasan</span>
            </button>

            <button
              id="tab-pedoman-trigger"
              onClick={() => setActiveTab("pedoman")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "pedoman"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Pedoman Penskoran</span>
            </button>
          </div>

          {/* Individual downloads */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 p-4 shadow-xs space-y-3">
            <h5 className="text-[10px] font-mono uppercase text-slate-450 tracking-wider font-semibold">
              Unduh Berkas Mandiri (Word)
            </h5>

            <button
              id="dl-docx-kisi-btn"
              onClick={() => handleDocxDownload("kisi")}
              disabled={isDownloading === "kisi"}
              className="w-full flex items-center justify-between text-left p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800 text-[11px] font-medium transition-all"
            >
              <span className="truncate">1. Kisi-kisi.docx</span>
              <Download className="h-3.5 w-3.5 text-slate-405" />
            </button>

            <button
              id="dl-docx-soal-btn"
              onClick={() => handleDocxDownload("soal")}
              disabled={isDownloading === "soal"}
              className="w-full flex items-center justify-between text-left p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800 text-[11px] font-medium transition-all"
            >
              <span className="truncate">2. Naskah_Soal.docx</span>
              <Download className="h-3.5 w-3.5 text-slate-405" />
            </button>

            <button
              id="dl-docx-key-btn"
              onClick={() => handleDocxDownload("kunci")}
              disabled={isDownloading === "kunci"}
              className="w-full flex items-center justify-between text-left p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800 text-[11px] font-medium transition-all"
            >
              <span className="truncate">3. Kunci_Pembahasan.docx</span>
              <Download className="h-3.5 w-3.5 text-slate-405" />
            </button>

            <div className="relative pt-2 flex items-center">
              <div className="flex-grow border-t border-slate-100 dark:border-slate-850"></div>
              <span className="flex-shrink mx-2 text-[8px] font-mono text-slate-400 uppercase font-semibold">Dokument PDF</span>
              <div className="flex-grow border-t border-slate-100 dark:border-slate-850"></div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                id="dl-pdf-kisi"
                onClick={() => downloadPdfFile("kisi", assessment)}
                className="py-1 px-2 border border-slate-250/60 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-center text-3xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Kisi-kisi
              </button>
              <button
                id="dl-pdf-soal"
                onClick={() => downloadPdfFile("soal", assessment)}
                className="py-1 px-2 border border-slate-250/60 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-center text-3xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Naskah
              </button>
              <button
                id="dl-pdf-kunci"
                onClick={() => downloadPdfFile("kunci", assessment)}
                className="py-1 px-2 border border-slate-250/60 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-center text-3xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Kunci
              </button>
            </div>
          </div>
        </div>

        {/* Right Content Pane (Printable context area) */}
        <div className="md:col-span-9 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
          
          {/* Printable Header Area (Visible ONLY on print and inside preview tab for naskah) */}
          <div className="border-b-4 border-double border-slate-900 dark:border-slate-100 pb-4 text-center space-y-1">
            <h3 className="text-xs uppercase tracking-widest font-mono text-slate-450 dark:text-slate-550 no-print">
              Fase Pratinjau Lembar Dokumen
            </h3>
            
            {/* National Academic Header style */}
            <p className="text-xs font-bold leading-none uppercase">
              Kementerian Pendidikan, Kebudayaan, Riset, Dan Teknologi
            </p>
            <p className="text-4xs font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-slate-450 leading-none">
              REPUBLIK INDONESIA
            </p>
            <p className="text-sm font-display font-extrabold uppercase mt-1">
              Satuan Pendidikan {meta.level.split(" ")[0]}
            </p>
            <div className="text-4xs font-mono text-slate-400 dark:text-slate-500 flex flex-wrap justify-center gap-x-4">
              <span>Kurikulum: {meta.curriculum}</span>
              <span>•</span>
              <span>Fase/Kelas: {meta.phase} / {meta.className}</span>
              <span>•</span>
              <span>Tahun Pelajaran: {meta.academicYear}</span>
            </div>
          </div>

          {/* TAB 1: KISI-KISI TABLE */}
          {activeTab === "kisi" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl no-print text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-400" />
                  <span>Petakan capaian indikator soal dengan kunci jawaban secara presisi.</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-3xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-650 dark:text-slate-350 border-b border-slate-200 dark:border-slate-850">
                      <th className="py-2.5 px-2 font-semibold">No</th>
                      <th className="py-2.5 px-2 font-semibold">Topik/Bahan</th>
                      <th className="py-2.5 px-2 font-semibold">Tujuan Pembelajaran</th>
                      <th className="py-2.5 px-2 font-semibold">Indikator Soal</th>
                      <th className="py-2.5 px-2 font-semibold">Kognitif</th>
                      <th className="py-2.5 px-2 font-semibold">Bentuk</th>
                      <th className="py-2.5 px-2 font-semibold">No Soal</th>
                      <th className="py-2.5 px-2 font-semibold">Kunci</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessment.kisiKisi.map((item) => (
                      <tr
                        key={item.no}
                        className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/20"
                      >
                        <td className="py-2 px-2 font-mono font-medium text-slate-400">{item.no}</td>
                        <td className="py-2 px-2 font-medium">{item.material}</td>
                        <td className="py-2 px-2 text-slate-600 dark:text-slate-400">{item.tp}</td>
                        <td className="py-2 px-2 text-slate-60s dark:text-slate-400 font-sans">{item.indicator}</td>
                        <td className="py-2 px-2 font-mono text-4xs">{item.cognitiveLevel}</td>
                        <td className="py-2 px-2 text-slate-500">{item.questionType}</td>
                        <td className="py-2 px-2 font-mono font-bold text-center text-blue-600 dark:text-blue-400">
                          {item.questionNumber}
                        </td>
                        <td className="py-2 px-2 font-mono text-center font-bold">{item.answerKey}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: NASKAH SOAL */}
          {activeTab === "soal" && (
            <div className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 no-print">
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
              <div className="space-y-5">
                {assessment.questions.map((q) => (
                  <div key={q.no} className="relative group pl-0.5">
                    {/* Header Question */}
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-indigo-400 min-w-4 text-right">
                        {q.no}.
                      </span>
                      <div className="space-y-1.5 flex-1">
                        <p className="text-slate-850 dark:text-slate-100 leading-relaxed font-sans font-medium">
                          {q.question}
                        </p>

                        {/* Image Illustration placeholder if activated */}
                        {q.illustrationDescription && (
                          <div className="p-3 my-2 border border-sky-200 dark:border-sky-950/40 bg-sky-50/50 dark:bg-sky-950/20 text-sky-850 dark:text-sky-300 rounded-xl text-3xs flex items-center gap-2.5">
                            <Sparkles className="h-4 w-4 text-sky-500 animate-pulse flex-shrink-0" />
                            <div>
                              <p className="font-sans font-bold">[Lembar Ilustrasi/Gambar Guru]</p>
                              <p className="font-sans mt-0.5 opacity-80 leading-snug">
                                {q.illustrationDescription}
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
                                  className="flex items-start gap-2 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl hover:bg-slate-100 transition-colors border border-slate-150 dark:border-slate-850"
                                >
                                  <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-3xs">
                                    {label}.
                                  </span>
                                  <span className="text-3xs text-slate-700 dark:text-slate-300">
                                    {option}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // Essay response space helper
                          <div className="pt-2 pl-4">
                            <div className="border border-dashed border-slate-200 dark:border-slate-800 p-3 bg-slate-50/40 dark:bg-slate-950/20 rounded-xl italic text-slate-400 text-4xs">
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
              <div className="flex items-center justify-between no-print bg-slate-50 dark:bg-slate-950 p-3 rounded-xl text-3xs text-slate-450 leading-relaxed font-mono">
                <span>NOMOR SOAL & KUNCI</span>
                <span>DESKRIPSI PEMBAHASAN RASIONAL</span>
                <span>BOBOT</span>
              </div>

              <div className="space-y-4">
                {assessment.answers.map((ans) => {
                  return (
                    <div
                      key={ans.no}
                      className="p-4 bg-slate-50/40 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2"
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-indigo-750 dark:text-indigo-400 text-xs">
                            Nomor {ans.no}
                          </span>
                          <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-4xs font-mono font-bold">
                            Jawaban Benar: {ans.correctAnswer}
                          </span>
                        </div>
                        <span className="text-3xs font-mono text-slate-500 font-bold">
                          Skor Bobot: {ans.score} Poin
                        </span>
                      </div>

                      <div className="text-3xs text-slate-650 dark:text-slate-300 leading-relaxed pl-1 font-sans">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          Rasional Pembahasan:
                        </p>
                        <p className="mt-0.5">{ans.explanation}</p>
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
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/40 p-4 rounded-xl no-print text-[11px] text-indigo-700 dark:text-indigo-300">
                <Info className="h-4 w-4" />
                <span>Pedoman ini membantu guru melakukan penilaian objektif terhadap seluruh instrumen ujian.</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-3xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
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

          {/* Core Footer Sign-off Watermark (Always visible, crucially printed) */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3 text-4xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-500" />
              <span>Verifikasi Dokumen Akademik: Sinkronisasi Sinkron</span>
            </div>
            {/* Signature Watermark clearly printed */}
            <div className="text-center md:text-right font-semibold text-slate-700 dark:text-slate-300 text-3xs border border-slate-150 dark:border-slate-800 px-3 py-1 rounded-lg">
              Instrumen Asesmen By Muh. Asriwadi AP
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
