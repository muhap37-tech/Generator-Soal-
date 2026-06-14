export enum ExamType {
  SUMATIF_HARIAN = "Sumatif Harian",
  SUMATIF_TENGAH_SEMESTER = "Sumatif Tengah Semester (STS)",
  SUMATIF_AKHIR_SEMESTER = "Sumatif Akhir Semester (SAS)",
  ASESMEN_DIAGNOSTIK = "Asesmen Diagnostik",
  ASESMEN_FORMATIF = "Asesmen Formatif",
  TRY_OUT = "Try Out",
  ULANGAN_HARIAN = "Ulangan Harian",
  UJIAN_SEKOLAH = "Ujian Sekolah"
}

export enum EducationLevel {
  SD = "SD (Sekolah Dasar)",
  SMP = "SMP (Sekolah Menengah Pertama)",
  SMA = "SMA (Sekolah Menengah Atas / Kejuruan)"
}

export enum DifficultyLevel {
  MUDAH = "Mudah",
  SEDANG = "Sedang",
  SULIT = "Sulit",
  CAMPURAN = "Campuran"
}

export enum CognitiveLevel {
  C1 = "C1 Mengingat",
  C2 = "C2 Memahami",
  C3 = "C3 Menerapkan",
  C4 = "C4 Menganalisis",
  C5 = "C5 Mengevaluasi",
  C6 = "C6 Mencipta"
}

export enum QuestionFormat {
  PILGAN = "Pilihan Ganda",
  PILGAN_KOMPLEKS = "Pilihan Ganda Kompleks",
  MENJODOHKAN = "Menjodohkan",
  BENAR_SALAH = "Benar Salah",
  ISIAN_SINGKAT = "Isian Singkat",
  URAIAN = "Uraian"
}

export enum RefSourceType {
  AI = "Gunakan AI (Otomatis)",
  PDF = "Upload PDF / Dokumen Materi",
  MANUAL = "Input Materi Manual"
}

export interface TopicItem {
  id: string;
  topicName: string;
  tp: string;         // Tujuan Pembelajaran
  indicator: string;  // Indikator Soal
}

export interface ClassMetadata {
  level: EducationLevel;
  className: string;   // kelas e.g. Kelas 4, Kelas 7, dll
  phase: string;       // Fase A - F
  subject: string;     // Mata Pelajaran
  semester: string;    // Semester 1 / 2
  curriculum: string;  // Kurikulum Merdeka atau K13
  timeAllocation: string; // e.g. 2 x 35 menit
  academicYear: string;  // e.g. 2025/2026
  schoolName?: string;
  kopHeader1?: string;
  kopHeader2?: string;
  kopAddress?: string;
  uploadedLogoUrl?: string;
  headmasterName?: string;
  headmasterNip?: string;
  teacherName?: string;
  teacherNip?: string;
}

export interface QuestionSetting {
  format: QuestionFormat;
  count: number;
  optionsCount: number; // e.g. 4 for A-D, 5 for A-E
}

export interface SpecialFeatureConfig {
  literacy: boolean;
  numeracy: boolean;
  profilPancasila: boolean;
  contextual: boolean;
  imageBased: boolean; // Menghasilkan deskripsi gambar / diagram interaktif
}

export interface KisiKisiItem {
  no: number;
  subject: string;
  classPhase: string;
  material: string;
  tp: string;
  indicator: string;
  cognitiveLevel: string;
  questionType: string;
  questionNumber: number;
  answerKey: string;
}

export interface QuestionItem {
  no: number;
  type: QuestionFormat;
  question: string;
  options?: string[]; // For PILGAN or PILGAN_KOMPLEKS
  scoreWeight: number;
  illustrationDescription?: string; // If imageBased is enabled
}

export interface AnswerKeyItem {
  no: number;
  correctAnswer: string;
  explanation: string;
  score: number;
}

export interface ScoringGuideItem {
  questionType: string;
  weightPerQuestion: number;
  description: string;
}

export interface GeneratedAssessment {
  id: string;
  title: string;
  createdAt: string;
  metadata: ClassMetadata;
  examType: ExamType;
  difficulty: DifficultyLevel;
  cognitiveLevels: CognitiveLevel[];
  topics: TopicItem[];
  specialFeatures: SpecialFeatureConfig;
  kisiKisi: KisiKisiItem[];
  questions: QuestionItem[];
  answers: AnswerKeyItem[];
  scoringGuideline: ScoringGuideItem[];
}

export interface UserProfile {
  email: string;
  fullName: string;
  schoolName: string;
  role: string;
}
