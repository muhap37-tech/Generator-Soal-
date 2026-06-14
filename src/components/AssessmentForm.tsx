import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Brain,
  UploadCloud,
  FileText,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Clock,
  BookOpen,
  Image,
  Award
} from "lucide-react";
import {
  ExamType,
  EducationLevel,
  DifficultyLevel,
  CognitiveLevel,
  QuestionFormat,
  RefSourceType,
  TopicItem,
  ClassMetadata,
  QuestionSetting,
  SpecialFeatureConfig,
} from "../types";

interface AssessmentFormProps {
  onGenerate: (data: {
    metadata: ClassMetadata;
    examType: ExamType;
    difficulty: DifficultyLevel;
    cognitiveLevels: CognitiveLevel[];
    topics: TopicItem[];
    specialFeatures: SpecialFeatureConfig;
    questionSettings: QuestionSetting[];
    uploadedMaterialText: string;
  }) => void;
  isLoading: boolean;
}

const COMMON_SUBJECTS = [
  "Ilmu Pengetahuan Alam (IPA)",
  "Matematika",
  "Bahasa Indonesia",
  "Ilmu Pengetahuan Sosial (IPS)",
  "Pendidikan Pancasila (PPKn)",
  "Bahasa Inggris",
  "Informatika",
  "Pendidikan Jasmani (PJOK)",
  "Pendidikan Agama Islam (PAI)",
  "Seni Budaya"
];

const CLASS_OPTIONS: Record<EducationLevel, string[]> = {
  [EducationLevel.SD]: ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"],
  [EducationLevel.SMP]: ["Kelas 7", "Kelas 8", "Kelas 9"],
  [EducationLevel.SMA]: ["Kelas 10", "Kelas 11", "Kelas 12"]
};

const PHASE_OPTIONS: Record<EducationLevel, string[]> = {
  [EducationLevel.SD]: ["Fase A", "Fase B", "Fase C"],
  [EducationLevel.SMP]: ["Fase D"],
  [EducationLevel.SMA]: ["Fase E", "Fase F"]
};

export default function AssessmentForm({ onGenerate, isLoading }: AssessmentFormProps) {
  // 1. Exam Type
  const [examType, setExamType] = useState<ExamType>(ExamType.ULANGAN_HARIAN);

  // 2. Class Metadata
  const [metadata, setMetadata] = useState<ClassMetadata>({
    level: EducationLevel.SD,
    className: "Kelas 4",
    phase: "Fase B",
    subject: "Ilmu Pengetahuan Alam (IPA)",
    semester: "Ganjil (1)",
    curriculum: "Kurikulum Merdeka",
    timeAllocation: "2 x 35 Menit",
    academicYear: "2025/2026",
    schoolName: "SD Negeri Cerdas Bangsa",
    kopHeader1: "PEMERINTAH KABUPATEN / DINAS PENDIDIKAN",
    kopHeader2: "UPTD SATUAN PENDIDIKAN SD NEGERI CERDAS BANGSA",
    kopAddress: "Jl. Diponegoro No. 10, Kecamatan Nusantara, 2026",
    uploadedLogoUrl: "",
    headmasterName: "Muh. Asriwadi AP, S.Pd., M.Pd.",
    headmasterNip: "19880102 201201 1 003",
    teacherName: "Guru Mata Pelajaran, S.Pd.",
    teacherNip: "19940304 201903 2 004",
  });

  // Auto-set Phase when Education Level changes to assist teachers
  useEffect(() => {
    let phase = "Fase B";
    let className = "Kelas 4";
    if (metadata.level === EducationLevel.SMP) {
      phase = "Fase D";
      className = "Kelas 7";
    } else if (metadata.level === EducationLevel.SMA) {
      phase = "Fase F";
      className = "Kelas 11";
    } else {
      phase = "Fase B";
      className = "Kelas 4";
    }
    setMetadata((prev) => ({ ...prev, phase, className }));
  }, [metadata.level]);

  // 3. Multiple Topics Configuration
  const [topics, setTopics] = useState<TopicItem[]>([
    {
      id: "1",
      topicName: "Fotosintesis pada Tumbuhan Hijau",
      tp: "Peserta didik mengidentifikasi proses fotosintesis dan mengaitkannya dengan pentingnya tumbuhan bagi kehidupan.",
      indicator: "Disajikan gambar proses fotosintesis, siswa dapat menganalisis zat yang diperlukan dan dihasilkan.",
    },
  ]);

  const [loadingTopicAI, setLoadingTopicAI] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const addTopic = () => {
    const newId = String(Date.now());
    setTopics((prev) => [
      ...prev,
      {
        id: newId,
        topicName: "",
        tp: "",
        indicator: "",
      },
    ]);
  };

  const removeTopic = (id: string) => {
    if (topics.length <= 1) {
      alert("Minimal harus ada 1 topik pembelajaran.");
      return;
    }
    setTopics((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTopicChange = (id: string, field: keyof TopicItem, value: string) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // Generate TP and Indicator automatically via AI
  const handleAutoCreateTP = async (topicId: string, topicName: string) => {
    if (!topicName || !metadata.subject) {
      alert("Harap isi terlebih dahulu nama topik dan mata pelajaran!");
      return;
    }
    setLoadingTopicAI(topicId);
    try {
      const response = await fetch("/api/generate-tp-indicator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: metadata.subject,
          level: metadata.level,
          className: metadata.className,
          topicName: topicName,
          curriculum: metadata.curriculum,
        }),
      });
      const data = await response.json();
      if (data && !data.error) {
        handleTopicChange(topicId, "tp", data.tp);
        handleTopicChange(topicId, "indicator", data.indicator);
      } else {
        alert("Eror memformulasikan TP: " + (data.error || "Gagal"));
      }
    } catch (e: any) {
      alert("Gagal memformulasikan TP dan Indikator via AI: " + e.message);
    } finally {
      setLoadingTopicAI(null);
    }
  };

  // Generate Suggestions for topics
  const handleSuggestTopics = async () => {
    if (!metadata.subject) {
      alert("Harap tentukan atau isi nama mata pelajaran terlebih dahulu!");
      return;
    }
    setLoadingSuggestions(true);
    try {
      const response = await fetch("/api/suggest-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: metadata.subject,
          level: metadata.level,
          className: metadata.className,
          curriculum: metadata.curriculum,
        }),
      });
      const data = await response.json();
      if (data && data.topics && Array.isArray(data.topics)) {
        const formattedTopics = data.topics.map((item: any, idx: number) => ({
          id: String(Date.now() + idx),
          topicName: item.topicName,
          tp: item.tp,
          indicator: item.indicator,
        }));
        setTopics(formattedTopics);
      } else {
        alert("Gagal memformulasikan rekomendasi topik: " + (data.error || "Format tidak sesuai"));
      }
    } catch (e: any) {
      alert("Gagal memanggil rekomendasi topik AI: " + e.message);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // 4. Source Reference Choices
  const [refSource, setRefSource] = useState<RefSourceType>(RefSourceType.AI);
  const [manualText, setManualText] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [extractedPdfText, setExtractedPdfText] = useState("");
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);

  // Client Side PDF Text Extractor using PDFJS loaded in index.html
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf") && !file.type.startsWith("text/")) {
      alert("Harap unggah berkas berbentuk PDF atau teks (.txt)!");
      return;
    }

    setPdfFileName(file.name);
    setIsExtractingDoc(true);

    if (file.type.startsWith("text/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setExtractedPdfText(text);
        setIsExtractingDoc(false);
      };
      reader.readAsText(file);
      return;
    }

    // PDF.js client-side text extractor
    try {
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        try {
          const typedarray = new Uint8Array(fileReader.result as ArrayBuffer);
          const pdfjsLib = (window as any).pdfjsLib;

          if (!pdfjsLib) {
            throw new Error("Pustaka PDF.js belum siap. Harap tunggu beberapa detik.");
          }

          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let pagesText = "";
          const fetchLimit = Math.min(pdf.numPages, 10); // Limit extraction to maximum 10 pages to preserve prompt scope size

          for (let i = 1; i <= fetchLimit; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            pagesText += pageText + "\n";
          }

          if (pdf.numPages > 10) {
            pagesText += "\n... (Materi dilewati untuk optimalisasi batas input AI) ...";
          }

          setExtractedPdfText(pagesText);
        } catch (err: any) {
          console.error("PDF read error", err);
          alert("Gagal membaca dokumen PDF secara langsung: " + err.message + ". Silakan gunakan Input Manual sebagai gantinya.");
        } finally {
          setIsExtractingDoc(false);
        }
      };
      fileReader.readAsArrayBuffer(file);
    } catch (err: any) {
      alert("Perangkat peraba PDF bermasalah: " + err.message);
      setIsExtractingDoc(false);
    }
  };

  // Drag and Drop State
  const [isDragOver, setIsDragOver] = useState(false);

  // 5. Difficulty Level
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.SEDANG);

  // 6. Cognitive Levels Multi-select (Taksonomi Bloom)
  const [selectedCognitive, setSelectedCognitive] = useState<CognitiveLevel[]>([
    CognitiveLevel.C1,
    CognitiveLevel.C2,
    CognitiveLevel.C3,
    CognitiveLevel.C4,
  ]);

  const toggleCognitive = (level: CognitiveLevel) => {
    setSelectedCognitive((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  // 7. Question Formats Settings
  const [questionSettings, setQuestionSettings] = useState<QuestionSetting[]>([
    { format: QuestionFormat.PILGAN, count: 5, optionsCount: 4 },
    { format: QuestionFormat.PILGAN_KOMPLEKS, count: 0, optionsCount: 4 },
    { format: QuestionFormat.MENJODOHKAN, count: 0, optionsCount: 0 },
    { format: QuestionFormat.BENAR_SALAH, count: 0, optionsCount: 2 },
    { format: QuestionFormat.ISIAN_SINGKAT, count: 0, optionsCount: 0 },
    { format: QuestionFormat.URAIAN, count: 2, optionsCount: 0 },
  ]);

  const handleSettingChange = (format: QuestionFormat, field: keyof QuestionSetting, value: number) => {
    setQuestionSettings((prev) =>
      prev.map((s) => (s.format === format ? { ...s, [field]: value } : s))
    );
  };

  // Automatic question items counter sums
  const totalQuestions = questionSettings.reduce((sum, current) => sum + current.count, 0);

  // 8. Special configurations
  const [specialFeatures, setSpecialFeatures] = useState<SpecialFeatureConfig>({
    literacy: false,
    numeracy: false,
    profilPancasila: true,
    contextual: true,
    imageBased: false,
  });

  const handleSpecialToggle = (field: keyof SpecialFeatureConfig) => {
    setSpecialFeatures((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Handle assessment emission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (totalQuestions <= 0) {
      alert("Harap tentukan minimal 1 butir soal pada pengaturan format!");
      return;
    }

    if (selectedCognitive.length === 0) {
      alert("Harap pilih minimal 1 Level Kognitif (Taksonomi Bloom)!");
      return;
    }

    // Combine manual or PDF texts
    let textToUse = "";
    if (refSource === RefSourceType.MANUAL) {
      textToUse = manualText;
    } else if (refSource === RefSourceType.PDF) {
      textToUse = extractedPdfText;
      if (!textToUse && !pdfFileName) {
        alert("Harap pilih atau tunggu unggahan PDF materi Anda!");
        return;
      }
    }

    // Keep active list of settings where question counts are larger than 0
    const activeSettings = questionSettings.filter((s) => s.count > 0);

    onGenerate({
      metadata,
      examType,
      difficulty,
      cognitiveLevels: selectedCognitive,
      topics,
      specialFeatures,
      questionSettings: activeSettings,
      uploadedMaterialText: textToUse,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* SECTION 1: DETIL UJIAN & INFORMASI KELAS */}
      <div className="p-6 rounded-2xl glass-card border border-white/20 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-display font-bold text-slate-930 dark:text-white">
            1. Informasi Kelas & Sesi Ujian
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Jenis Ujian / Asesmen
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamType)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
            >
              {Object.values(ExamType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Kurikulum Nasional
            </label>
            <select
              value={metadata.curriculum}
              onChange={(e) => setMetadata({ ...metadata, curriculum: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
            >
              <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
              <option value="Kurikulum 2013 (K13) revisi">Kurikulum 2013 (K13) revisi</option>
              <option value="Sistem Kredit Semester">Sistem Kredit Semester</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Tahun Pelajaran
            </label>
            <input
              type="text"
              value={metadata.academicYear}
              onChange={(e) => setMetadata({ ...metadata, academicYear: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. 2025/2026"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Mata Pelajaran
            </label>
            <input
              type="text"
              required
              value={metadata.subject}
              onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. Matematika, IPA, PPKn"
            />
            {/* Quick-pill list of standard school subjects */}
            <div className="flex flex-wrap gap-1 mt-2 max-h-24 overflow-y-auto">
              {COMMON_SUBJECTS.map((sub) => {
                const isSelected = metadata.subject.toLowerCase() === sub.toLowerCase();
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setMetadata({ ...metadata, subject: sub })}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                      isSelected
                        ? "bg-blue-100 hover:bg-blue-150 border-blue-300 dark:bg-blue-950 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold"
                        : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {sub.split(" (")[0]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Jenjang Pendidikan
            </label>
            <select
              value={metadata.level}
              onChange={(e) => setMetadata({ ...metadata, level: e.target.value as EducationLevel })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
            >
              {Object.values(EducationLevel).map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Kelas
              </label>
              <select
                value={metadata.className}
                onChange={(e) => setMetadata({ ...metadata, className: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
              >
                {(CLASS_OPTIONS[metadata.level] || []).map((cName) => (
                  <option key={cName} value={cName}>
                    {cName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Fase
              </label>
              <select
                value={metadata.phase}
                onChange={(e) => setMetadata({ ...metadata, phase: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
              >
                {(PHASE_OPTIONS[metadata.level] || []).map((ph) => (
                  <option key={ph} value={ph}>
                    {ph}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Semester
              </label>
              <select
                value={metadata.semester}
                onChange={(e) => setMetadata({ ...metadata, semester: e.target.value })}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
              >
                <option value="Ganjil (1)">Ganjil (1)</option>
                <option value="Genap (2)">Genap (2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Alokasi Waktu
              </label>
              <input
                type="text"
                required
                value={metadata.timeAllocation}
                onChange={(e) => setMetadata({ ...metadata, timeAllocation: e.target.value })}
                className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. 2 x 35 menit"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1.5: PENGATURAN KOP SURAT (DOKUMEN) & LOGO SEKOLAH */}
      <div className="p-6 rounded-2xl glass-card border border-white/20 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-display font-bold text-slate-930 dark:text-white">
              Kop Dokumen & Logo Sekolah (Opsional)
            </h3>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono font-semibold">
            Kop & Tanda Tangan
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
          Konfigurasikan informasi kepala surat resmi (Kop) dan tanda tangan yang akan dicetak di lembar kisi-kisi, naskah soal, dan kunci jawaban. Unggah logo sekolah dalam format JPG/PNG/SVG.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Logo Uploader / Preview column (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Logo Sekolah / Instansi
            </label>
            
            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
              {metadata.uploadedLogoUrl ? (
                <div className="relative group w-full">
                  <img
                    src={metadata.uploadedLogoUrl}
                    alt="Logo Sekolah Preview"
                    className="h-20 w-auto object-contain mx-auto rounded-md shadow-xs bg-white p-1"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setMetadata({ ...metadata, uploadedLogoUrl: "" })}
                    className="mt-2 text-4xs text-red-500 hover:font-bold block w-full text-center hover:underline"
                  >
                    Hapus Logo
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-indigo-500 animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 font-medium">Klik untuk pilih logo</p>
                    <p className="text-[8px] text-slate-400">PNG, JPG, SVG (Maks. 2MB)</p>
                  </div>
                </>
              )}
              
              <input
                id="logo-school-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    alert("Ukuran berkas logo terlalu besar! Maksimal 2MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const result = event.target?.result as string;
                    setMetadata({ ...metadata, uploadedLogoUrl: result });
                  };
                  reader.readAsDataURL(file);
                }}
                className={`w-full text-3xs ${metadata.uploadedLogoUrl ? "hidden" : ""}`}
              />
            </div>
          </div>

          {/* Kop text config inputs (8 cols) */}
          <div className="md:col-span-8 space-y-3">
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                Baris Kop 1 (Instansi Utama)
              </label>
              <input
                type="text"
                value={metadata.kopHeader1}
                onChange={(e) => setMetadata({ ...metadata, kopHeader1: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="PEMERINTAH KABUPATEN / DINAS PENDIDIKAN"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                Baris Kop 2 (Satuan Pendidikan)
              </label>
              <input
                type="text"
                value={metadata.kopHeader2}
                onChange={(e) => setMetadata({ ...metadata, kopHeader2: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="UPTD SATUAN PENDIDIKAN SD NEGERI CERDAS BANGSA"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Nama Sekolah (Singkat)
                </label>
                <input
                  type="text"
                  value={metadata.schoolName}
                  onChange={(e) => setMetadata({ ...metadata, schoolName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="SD Negeri Cerdas Bangsa"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Alamat & Kontak Sekolah
                </label>
                <input
                  type="text"
                  value={metadata.kopAddress}
                  onChange={(e) => setMetadata({ ...metadata, kopAddress: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Jl. Diponegoro No. 10, Kecamatan Nusantara"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Signatures/Penandatangan Block */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <span className="text-xs font-display font-semibold text-slate-800 dark:text-slate-200 block mb-2">
            Identitas Tanda Tangan Dokumen
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-slate-50/40 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400 block pb-1 border-b border-slate-100 dark:border-slate-850">
                Kepala Satuan Pendidikan / Kepala Sekolah
              </span>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">Nama Kepala Sekolah</label>
                  <input
                    type="text"
                    value={metadata.headmasterName}
                    onChange={(e) => setMetadata({ ...metadata, headmasterName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-sans text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="Nama Kepala Sekolah"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">NIP Kepala Sekolah</label>
                  <input
                    type="text"
                    value={metadata.headmasterNip}
                    onChange={(e) => setMetadata({ ...metadata, headmasterNip: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-sans text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="NIP Kepala Sekolah"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/40 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400 block pb-1 border-b border-slate-100 dark:border-slate-850">
                Penyusun Soal / Guru Mata Pelajaran
              </span>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">Nama Guru Penyusun</label>
                  <input
                    type="text"
                    value={metadata.teacherName}
                    onChange={(e) => setMetadata({ ...metadata, teacherName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-sans text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="Nama Guru"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">NIP Guru Penyusun</label>
                  <input
                    type="text"
                    value={metadata.teacherNip}
                    onChange={(e) => setMetadata({ ...metadata, teacherNip: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-sans text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    placeholder="NIP Guru"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TOPIK & TUJUAN PEMBELAJARAN */}
      <div className="p-6 rounded-2xl glass-card border border-white/20 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-display font-bold text-slate-930 dark:text-white">
              2. Cakupan Topik & TP
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="suggest-topics-ai-btn"
              type="button"
              disabled={loadingSuggestions}
              onClick={handleSuggestTopics}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-250/30 dark:border-emerald-800/40 text-xs font-semibold text-emerald-700 dark:text-emerald-300 rounded-xl transition-all"
            >
              {loadingSuggestions ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                  <span>Merumuskan Topik...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                  <span>Rekomendasi Topik AI</span>
                </>
              )}
            </button>
            <button
              id="add-topic-btn"
              type="button"
              onClick={addTopic}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-250/30 dark:border-indigo-800/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300 rounded-xl transition-all"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Tambah Topik</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {topics.map((item, index) => (
            <div
              key={item.id}
              className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-850 rounded-xl space-y-3 relative overflow-hidden"
            >
              {/* Delete Button */}
              {topics.length > 1 && (
                <button
                  id={`remove-topic-${item.id}`}
                  type="button"
                  onClick={() => removeTopic(item.id)}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <div className="flex gap-2 items-center">
                <span className="w-5 h-5 flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full font-mono text-3xs font-bold leading-none">
                  {index + 1}
                </span>
                <span className="text-xs font-semibold text-slate-850 dark:text-slate-350">
                  Pokok Bahasan / Materi Studi
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                <div className="md:col-span-5">
                  <label className="block text-4xs font-mono font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Nama Pokok Bahasan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Energi Alternatif dan Manfaatnya"
                    value={item.topicName}
                    onChange={(e) => handleTopicChange(item.id, "topicName", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  
                  {/* AI assist trigger */}
                  <button
                    id={`ai-assistant-topic-${item.id}`}
                    type="button"
                    disabled={loadingTopicAI === item.id}
                    onClick={() => handleAutoCreateTP(item.id, item.topicName)}
                    className="mt-2 text-3xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {loadingTopicAI === item.id ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Menganalisis Kurikulum...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        <span>Dibuatkan oleh AI (TP & Indikator)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-4xs font-mono font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Tujuan Pembelajaran (TP)
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Fokus capaian pembelajaran materi ini..."
                    value={item.tp}
                    onChange={(e) => handleTopicChange(item.id, "tp", e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-4xs font-mono font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Indikator Soal
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Disajikan teks/pertanyaan, siswa..."
                    value={item.indicator}
                    onChange={(e) => handleTopicChange(item.id, "indicator", e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: SUMBER REFERENSI (AI vs PDF vs Manual) */}
      <div className="p-6 rounded-2xl glass-card border border-white/20 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <UploadCloud className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-lg font-display font-bold text-slate-930 dark:text-white">
            3. Sumber Referensi Materi ajar
          </h3>
        </div>

        {/* Choice Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.values(RefSourceType).map((src) => (
            <button
              id={`ref-src-btn-${src.replace(/\s+/g, "_")}`}
              key={src}
              type="button"
              onClick={() => setRefSource(src)}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                refSource === src
                  ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/70 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/10"
                  : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350"
              }`}
            >
              {src === RefSourceType.AI && (
                <>
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  <span className="text-xs font-semibold">{src}</span>
                  <span className="text-4xs text-slate-400 dark:text-slate-500 leading-tight">
                    AI otomatis mencocokkan silabus nasional
                  </span>
                </>
              )}
              {src === RefSourceType.PDF && (
                <>
                  <UploadCloud className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs font-semibold">{src}</span>
                  <span className="text-4xs text-slate-400 dark:text-slate-500 leading-tight">
                    Membaca RPP / Bab LKS langsung
                  </span>
                </>
              )}
              {src === RefSourceType.MANUAL && (
                <>
                  <FileText className="h-5 w-5 text-amber-500" />
                  <span className="text-xs font-semibold">{src}</span>
                  <span className="text-4xs text-slate-400 dark:text-slate-500 leading-tight">
                    Ketik teks manual rangkuman bab
                  </span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Display Area */}
        {refSource === RefSourceType.PDF && (
          <div className="space-y-3">
            <div
              id="pdf-drop-zone"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const input = document.getElementById("pdf-file-input") as HTMLInputElement;
                  if (input) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    input.files = dataTransfer.files;
                    const changeEvent = new Event("change", { bubbles: true });
                    input.dispatchEvent(changeEvent);
                  }
                }
              }}
              className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragOver
                  ? "border-emerald-500 bg-emerald-50/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-emerald-450 dark:hover:border-emerald-500/50"
              }`}
              onClick={() => document.getElementById("pdf-file-input")?.click()}
            >
              <input
                id="pdf-file-input"
                type="file"
                accept=".pdf,.txt"
                onChange={handlePdfUpload}
                className="hidden"
              />
              <UploadCloud className="h-8 w-8 text-slate-400 mb-2 animate-bounce" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tarik & Lepas berkas (PDF atau TXT rangkuman materi)
              </p>
              <p className="text-4xs text-slate-400 dark:text-slate-500 mt-1 uppercase">
                Atau cari dari komputer Anda (Maks 10 halaman)
              </p>
            </div>

            {/* Status Extraction indicator */}
            {isExtractingDoc && (
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
                <span>Membaca dan menyaring isi berkas PDF secara instan...</span>
              </div>
            )}

            {!isExtractingDoc && pdfFileName && (
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold truncate max-w-sm">{pdfFileName}</span>
                  <span className="text-4xs opacity-80 uppercase">
                    ({extractedPdfText.length} karakter terektraksi)
                  </span>
                </div>
                <button
                  id="reset-pdf-btn"
                  type="button"
                  onClick={() => {
                    setPdfFileName("");
                    setExtractedPdfText("");
                  }}
                  className="text-3xs font-semibold text-red-500 hover:underline"
                >
                  Ganti File
                </button>
              </div>
            )}
          </div>
        )}

        {refSource === RefSourceType.MANUAL && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Rangkuman Pokok Materi / Silabus Lama
            </label>
            <textarea
              rows={5}
              required
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Tempel rincian materi, sub-bab, kumpulan istilah penting, atau kisi-kisi lama di sini agar AI membuat butir soal yang 100% selaras dengan yang Anda ajarkan di kelas..."
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-4xs text-slate-400 dark:text-slate-500 mt-1 leading-normal italic">
              * AI akan membaca inputan lalu merekayasa butir soal (HOTS/kognitif) sesuai rangkuman materi di atas.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 4: TINGKAT KESULITAN & LEVEL KOGNITIF (Taksonomi bloom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Difficulty Select */}
        <div className="p-6 rounded-2xl glass-card border border-white/20 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Award className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-display font-bold text-slate-930 dark:text-white">
              4. Tingkat Kesulitan Soal
            </h3>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Object.values(DifficultyLevel).map((level) => (
              <button
                id={`difficulty-${level}`}
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`py-2 px-1 text-center font-medium border text-xs rounded-xl transition-all ${
                  difficulty === level
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-500/60 text-amber-800 dark:text-amber-300 font-semibold"
                    : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <p className="text-4xs text-slate-400 leading-relaxed italic">
            * Pilihan &rdquo;Campuran&rdquo; otomatis mendistribusikan soal: Mudah (30%), Sedang (50%), Sulit (20%).
          </p>
        </div>

        {/* Cognitive Pills Select (Taksonomi Bloom) */}
        <div className="p-6 rounded-2xl glass-card border border-white/20 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Brain className="h-5 w-5 text-indigo-550" />
            <h3 className="text-lg font-display font-bold text-slate-930 dark:text-white">
              5. Level Kognitif (Taksonomi Bloom)
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {Object.values(CognitiveLevel).map((level) => {
              const isSelected = selectedCognitive.includes(level);
              return (
                <button
                  id={`bloom-pill-${level.substring(0, 2)}`}
                  type="button"
                  key={level}
                  onClick={() => toggleCognitive(level)}
                  className={`py-1.5 px-2.5 text-4xs font-mono font-bold rounded-full transition-all border ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/10"
                      : "bg-slate-100/60 hover:bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-505 dark:text-slate-400"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>

          <p className="text-4xs text-slate-400 leading-relaxed italic">
            * Anda dapat memilih lebih dari satu level kognitif sekaligus untuk komposisi asesmen berimbang.
          </p>
        </div>
      </div>

      {/* SECTION 5: FORMAT DAN JUMLAH SOAL */}
      <div className="p-6 rounded-2xl glass-card border border-white/20 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-display font-bold text-slate-930 dark:text-white">
              6. Matriks Bentuk & Jumlah Soal
            </h3>
          </div>

          {/* TOTAL QUESTION CALCULATOR */}
          <div className="flex items-center gap-2 bg-blue-100/60 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/40 px-3 py-1 rounded-xl shadow-inner">
            <span className="text-3xs font-mono font-bold uppercase text-slate-500 dark:text-slate-450">
              Total Soal:
            </span>
            <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
              {totalQuestions} butir
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questionSettings.map((setting) => {
            return (
              <div
                key={setting.format}
                className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-850 dark:text-slate-200">
                    {setting.format}
                  </h4>
                  {/* Options select only for MC */}
                  {(setting.format === QuestionFormat.PILGAN ||
                    setting.format === QuestionFormat.PILGAN_KOMPLEKS) &&
                    setting.count > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-4xs text-slate-400">Opsi:</span>
                        <select
                          value={setting.optionsCount}
                          onChange={(e) =>
                            handleSettingChange(setting.format, "optionsCount", Number(e.target.value))
                          }
                          className="px-1.5 py-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-4xs text-slate-650 dark:text-slate-350 focus:outline-none"
                        >
                          <option value={4}>4 (A-D) SD</option>
                          <option value={5}>5 (A-E) SMP/SMA</option>
                        </select>
                      </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`decrement-${setting.format.replace(/\s+/g, "_")}`}
                    type="button"
                    onClick={() =>
                      handleSettingChange(setting.format, "count", Math.max(0, setting.count - 1))
                    }
                    className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs hover:scale-105 active:scale-95 transition-all outline-none"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-mono font-bold text-slate-800 dark:text-white">
                    {setting.count}
                  </span>
                  <button
                    id={`increment-${setting.format.replace(/\s+/g, "_")}`}
                    type="button"
                    onClick={() =>
                      handleSettingChange(setting.format, "count", Math.min(25, setting.count + 1))
                    }
                    className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs hover:scale-105 active:scale-95 transition-all outline-none"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 6: FITUR KHUSUS DAN TAMBAHAN */}
      <div className="p-6 rounded-2xl glass-card border border-white/20 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Brain className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-display font-bold text-slate-930 dark:text-white">
            7. Karakteristik & Fitur Khusus Paket Soal
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Feature 1: Literasi */}
          <div
            id="cfg-literacy"
            onClick={() => handleSpecialToggle("literacy")}
            className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all select-none ${
              specialFeatures.literacy
                ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/50 shadow-inner"
                : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/85 border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase text-slate-450 tracking-wider">Literasi</span>
              <input
                id="feat-cb-literation"
                type="checkbox"
                checked={specialFeatures.literacy}
                onChange={() => {}} // Handle on parent div click
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <p className="text-3xs font-semibold text-slate-800 dark:text-white mt-1.5">
              Soal Berbasis Literasi
            </p>
          </div>

          {/* Feature 2: Numerasi */}
          <div
            id="cfg-numeracy"
            onClick={() => handleSpecialToggle("numeracy")}
            className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all select-none ${
              specialFeatures.numeracy
                ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/50 shadow-inner"
                : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/85 border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase text-slate-450 tracking-wider">Numerasi</span>
              <input
                id="feat-cb-numeracy"
                type="checkbox"
                checked={specialFeatures.numeracy}
                onChange={() => {}}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <p className="text-3xs font-semibold text-slate-800 dark:text-white mt-1.5">
              Soal Berbasis Numerasi
            </p>
          </div>

          {/* Feature 3: Profil Pancasila */}
          <div
            id="cfg-profilPancasila"
            onClick={() => handleSpecialToggle("profilPancasila")}
            className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all select-none ${
              specialFeatures.profilPancasila
                ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/50 shadow-inner"
                : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/85 border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase text-slate-450 tracking-wider">Pancasila</span>
              <input
                id="feat-cb-pancasila"
                type="checkbox"
                checked={specialFeatures.profilPancasila}
                onChange={() => {}}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <p className="text-3xs font-semibold text-slate-800 dark:text-white mt-1.5">
              Profil Pelajar Pancasila
            </p>
          </div>

          {/* Feature 4: Kontekstual */}
          <div
            id="cfg-contextual"
            onClick={() => handleSpecialToggle("contextual")}
            className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all select-none ${
              specialFeatures.contextual
                ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/50 shadow-inner"
                : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/85 border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase text-slate-450 tracking-wider">Kontekstual</span>
              <input
                id="feat-cb-context"
                type="checkbox"
                checked={specialFeatures.contextual}
                onChange={() => {}}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <p className="text-3xs font-semibold text-slate-800 dark:text-white mt-1.5">
              Soal Kontekstual Harian
            </p>
          </div>

          {/* Feature 5: ImageBased */}
          <div
            id="cfg-imageBased"
            onClick={() => handleSpecialToggle("imageBased")}
            className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all select-none ${
              specialFeatures.imageBased
                ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/50 shadow-inner rotate-35"
                : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/85 border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono uppercase text-sky-500 tracking-wider">Multimodal</span>
                <Sparkles className="h-2.5 w-2.5 text-indigo-500 animate-pulse" />
              </div>
              <input
                id="feat-cb-image-based"
                type="checkbox"
                checked={specialFeatures.imageBased}
                onChange={() => {}}
                className="rounded border-slate-300 text-sky-500 focus:ring-sky-400"
              />
            </div>
            <p className="text-3xs font-semibold text-slate-800 dark:text-white mt-1.5 flex items-center gap-1.5">
              <Image className="h-3 w-3 text-sky-450" />
              <span>Gambar & Stimulus Visual</span>
            </p>
          </div>
        </div>
      </div>

      {/* ACTION BUTTON WRAPPER */}
      <div className="flex justify-end pt-2">
        <button
          id="generate-button-main"
          type="submit"
          disabled={isLoading}
          className="w-full md:w-auto px-10 py-4 btn-gradient text-white font-display font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-all text-sm outline-none cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Merumuskan Kisi-kisi & Soal via AI (Harap Tunggu)...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
              <span>Buat Soal Sekarang</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
