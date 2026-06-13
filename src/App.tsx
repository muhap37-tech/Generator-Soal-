import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Award,
  BookOpen,
  Calendar,
  Layers,
  History,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Clock,
  ChevronRight,
  Plus
} from "lucide-react";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import AssessmentForm from "./components/AssessmentForm";
import SavedAssessmentsList from "./components/SavedAssessmentsList";
import AssessmentResults from "./components/AssessmentResults";
import DashboardStats from "./components/DashboardStats";
import { storageService } from "./lib/firebase";
import { GeneratedAssessment, ExamType } from "./types";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [assessmentsList, setAssessmentsList] = useState<GeneratedAssessment[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<GeneratedAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  // Load active session on mount
  useEffect(() => {
    const activeUser = storageService.getCurrentUser();
    if (activeUser) {
      setUser(activeUser);
    }
    loadAssessments();
  }, [user?.uid]);

  const loadAssessments = async () => {
    const list = await storageService.getAssessments();
    setAssessmentsList(list);
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
    loadAssessments();
  };

  const handleLogout = async () => {
    await storageService.logout();
    setUser(null);
    setAssessmentsList([]);
    loadAssessments();
  };

  const handleAssessmentDelete = async (id: string) => {
    await storageService.deleteAssessment(id);
    if (activeAssessment?.id === id) {
      setActiveAssessment(null);
    }
    loadAssessments();
  };

  // Main generation handler (AI integration with backend server)
  const handleGenerateAssessment = async (configData: any) => {
    setIsLoading(true);
    setLoadingStep("1/3: Menganalisis kurikulum & silabus (Gemini)...");
    
    try {
      // 1. Trigger Express backend endpoint
      const response = await fetch("/api/generate-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });

      setLoadingStep("2/3: Mengharmonisasikan butir soal & kisi-kisi...");
      const result = await response.json();

      if (response.ok && result.id) {
        setLoadingStep("3/3: Meyakinkan kunci jawaban & skor nilai...");
        
        // Save using Storage Service (supports Firebase FireStore standard or local offline localStorage seamlessly)
        await storageService.saveAssessment(result);
        
        // Load the new assessment
        setActiveAssessment(result);
        
        // Reload history lists
        loadAssessments();
      } else {
        alert("Gagal memproses soal ujian: " + (result.error || "Uji coba limitasi model AI"));
      }
    } catch (e: any) {
      console.error("Failed to generate assessment Suite:", e);
      alert("Terjadi kesalahan teknis: " + e.message);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      
      {/* Navbar Brand Panel */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Body container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeAssessment ? (
          /* PREVIEW RESULTS DISPLAY WRAPPER WITH EMBEDDED ACTION EXPORTERS */
          <div className="animate-fade-in">
            <AssessmentResults
              assessment={activeAssessment}
              onBack={() => setActiveAssessment(null)}
            />
          </div>
        ) : (
          /* MAIN MAKER FORM AND HISTORIC DOCUMENT COLLECTIONS */
          <div className="space-y-8 animate-fade-in print:hidden">
            
            {/* HERO BANNER SECTION (Clean layout, modern dark accents) */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-7 md:p-9 shadow-xl">
              {/* Abstract mesh shapes */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative md:max-w-2xl text-left space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/15 border border-blue-500/30 rounded-full">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-4xs font-mono font-bold uppercase text-blue-300 tracking-wider">
                    Asisten Kurikulum Merdeka Terintegrasi
                  </span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
                  Buat Soal Ujian Berkualitas dalam Hitungan Detik
                </h2>
                
                <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed">
                  Bantu Guru menyelesaikan instrumen asesmen lengkap: <strong className="text-white">Kisi-kisi soal, naskah lembar ujian, kunci jawaban tepat, beserta rubrik penskoran</strong> yang 100% selaras dengan kriteria Taksonomi Bloom (HOTS).
                </p>
              </div>
            </div>

            {/* Dashboard Analytics Card stats */}
            <DashboardStats assessments={assessmentsList} />

            {/* TWO-COLUMN GRID: FORM CONFIGURATOR & PROGRESS VS ARSIP/HISTORY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Extensive Setup Form Formatter (Spans 8 columns) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-5 md:p-6 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                    <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                      <Plus className="h-5 w-5 text-blue-600" />
                      <span>Formulir Penyusunan Soal Baru</span>
                    </h3>
                    
                    <span className="text-4xs font-mono font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-full uppercase tracking-widest border border-slate-150 dark:border-slate-850">
                      V3.5 ENGINE
                    </span>
                  </div>

                  {/* Progressive Loading cover when Generating */}
                  {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-950 border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
                        <Sparkles className="h-6 w-6 text-indigo-500 absolute top-5 left-5 animate-bounce" />
                      </div>
                      
                      <div className="space-y-1 max-w-sm">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                          Sedang Memformulasikan Soal Ujian...
                        </p>
                        <p className="text-3xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold uppercase leading-tight animate-pulse bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1.5 rounded-full inline-block">
                          {loadingStep}
                        </p>
                      </div>
                      <p className="text-4xs text-slate-400 max-w-xs leading-normal">
                        Tenang, AI kami sedang mencocokkan Taksonomi Bloom, menyusun naskah, dan merangkum pembahasan kunci secara runut.
                      </p>
                    </div>
                  ) : (
                    <AssessmentForm
                      onGenerate={handleGenerateAssessment}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Historical lists Panel (Spans 4 columns) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-display font-medium text-slate-850 dark:text-white flex items-center gap-2">
                      <History className="h-4.5 w-4.5 text-blue-600" />
                      <span>Arsip & Riwayat Ujian</span>
                    </h3>
                    
                    <span className="text-3xs font-mono text-slate-400">
                      ({assessmentsList.length} berkas)
                    </span>
                  </div>

                  <p className="text-4xs text-slate-400 leading-normal">
                    Pilih dokumen di bawah ini untuk melihat pratinjau lembar naskah, merancang naskah ulang, atau mengunduh ulang dalam format Word/ZIP.
                  </p>

                  <SavedAssessmentsList
                    assessments={assessmentsList}
                    onSelect={(selected) => setActiveAssessment(selected)}
                    onDelete={handleAssessmentDelete}
                  />
                </div>

                {/* Indonesian Curriculum tip component */}
                <div className="p-4 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-2xl space-y-2">
                  <h4 className="text-3xs font-mono font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Konfirmasi Standar HOTS</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal leading-relaxed">
                    Setiap paket butir soal kognitif dirancang dari kata kerja operasional (KKO) adaptasi Anderson & Krathwohl agar merangsang penalaran tingkat tinggi (Higher Order Thinking Skills - HOTS) sesuai visi Asesmen Kompetensi Minimum (AKM) Kemendikburistek RI.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Auth Modal Trigger popup */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Persistent platform creator signature footer */}
      <footer className="mt-auto border-t border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-950/40 py-6 text-center no-print text-[11px] text-slate-400 font-mono flex flex-col sm:flex-row justify-between items-center max-w-7xl w-full mx-auto px-4 gap-3">
        <p className="font-semibold uppercase tracking-wider text-slate-450">
          Generator Soal AI &copy; 2026 • Kurikulum Merdeka
        </p>
        <p className="font-bold text-slate-600 dark:text-slate-350">
          Aplikasi Diprogram Secara Eksklusif: By Muh. Asriwadi AP
        </p>
      </footer>
    </div>
  );
}
