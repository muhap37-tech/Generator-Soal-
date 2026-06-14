import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Ensure server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Helper check
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features might fail.");
  }

  // Helper to call Gemini with robust retries, backoff, and fallback model to handle overload/503/Timeout
  async function generateContentWithRetry(params: any, maxRetries = 3) {
    let attempt = 0;
    const originalModel = params.model;
    while (true) {
      try {
        return await ai.models.generateContent(params);
      } catch (error: any) {
        attempt++;
        const errorMessage = error.message || "";
        const isUnavailable = 
          errorMessage.includes("503") || 
          errorMessage.includes("UNAVAILABLE") || 
          errorMessage.includes("high demand") || 
          errorMessage.includes("temporarily") ||
          error.status === 503;
        
        const isTimeout = 
          error.name === "TimeoutError" || 
          errorMessage.includes("Timeout") || 
          errorMessage.includes("timeout") || 
          errorMessage.includes("fetch failed") || 
          errorMessage.includes("UND_ERR") || 
          errorMessage.includes("HeadersTimeoutError");

        if ((isUnavailable || isTimeout) && attempt < maxRetries) {
          // Fallback to gemini-3.1-flash-lite if the original gemini-3.5-flash is temporarily unavailable
          if (originalModel === "gemini-3.5-flash" && attempt === maxRetries - 1) {
            console.warn(`[Gemini] Switching model from 'gemini-3.5-flash' to fallback 'gemini-3.1-flash-lite' due to overload/timeout.`);
            params.model = "gemini-3.1-flash-lite";
          }
          
          const delay = attempt * 2000;
          console.warn(`[Gemini] API Call failed (${isUnavailable ? "503/Unavailable" : "Timeout"}). Retrying attempt ${attempt}/${maxRetries} in ${delay}ms... Error:`, errorMessage);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }
    }
  }

  /**
   * 1. Endpoint, generate TP (Tujuan Pembelajaran) and Indikator Soal
   */
  app.post("/api/generate-tp-indicator", async (req, res) => {
    try {
      const { subject, level, className, topicName, curriculum } = req.body;

      if (!topicName || !subject) {
        return res.status(400).json({ error: "Mata pelajaran dan topik wajib diisi." });
      }

      const systemInstruction = `Anda adalah seorang ahli kurikulum pendidikan Indonesia (Kurikulum Merdeka & K13). Tugas Anda adalah membuat Tujuan Pembelajaran (TP) yang terukur dan satu buah Indikator Soal yang spesifik dan relavan berdasarkan topik yang diberikan oleh guru.
Gunakan Bahasa Indonesia formal yang baik dan benar. Sesuaikan kedalaman materi tingkat ${level} / ${className}.`;

      const prompt = `Mata Pelajaran: ${subject}
Jenjang/Kelas: ${level} - ${className}
Kurikulum: ${curriculum}
Topik Pembelajaran: ${topicName}

Buatkan 1 Tujuan Pembelajaran (TP) yang ringkas dan padat, serta 1 Indikator Soal yang spesifik yang mencerminkan cara mengukur TP tersebut dalam asesmen.`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tp: {
                type: Type.STRING,
                description: "Tujuan Pembelajaran yang ringkas dan logis.",
              },
              indicator: {
                type: Type.STRING,
                description: "Indikator Soal spesifik (misal: 'Disajikan narasi, siswa dapat menyebutkan...').",
              },
            },
            required: ["tp", "indicator"],
          },
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Gagal menerima respons dari Gemini.");
      }

      const data = JSON.parse(resultText.trim());
      return res.json(data);
    } catch (error: any) {
      console.error("Error in /api/generate-tp-indicator:", error);
      return res.status(500).json({ error: error.message || "Gagal membuat TP dan indikator." });
    }
  });

  /**
   * 1b. Endpoint, suggest topics, TP and indicators based on selected subject, curriculum and class
   */
  app.post("/api/suggest-topics", async (req, res) => {
    try {
      const { subject, level, className, curriculum } = req.body;

      if (!subject) {
        return res.status(400).json({ error: "Mata pelajaran wajib diisi." });
      }

      const systemInstruction = `Anda adalah seorang ahli perancang kurikulum pendidikan Indonesia (Kurikulum Merdeka & K13). Tugas Anda adalah merumuskan 3 topik/materi pelajaran utama yang paling sering diajarkan dan diujikan untuk parameter mata pelajaran dan kelas yang dikirimkan.
Untuk setiap topik, rancang 1 buah Tujuan Pembelajaran (TP) yang terarah serta 1 buah Indikator Soal yang spesifik dan relevan.
Gunakan Bahasa Indonesia formal yang baik, benar, ramah guru dan siswa.`;

      const prompt = `Mata Pelajaran: ${subject}
Jenjang/Kelas: ${level} - ${className}
Kurikulum: ${curriculum}

Buatkan daftar 3 topik pembelajaran terpopuler untuk kelas tersebut sesuai kurikulum yang dipilih. Berikan respon dalam bentuk JSON dengan list 3 topik.`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topics: {
                type: Type.ARRAY,
                description: "Daftar 3 topik rekomendasi.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topicName: {
                      type: Type.STRING,
                      description: "Nama pokok bahasan/topik secara literal dan ringkas (contoh: 'Operasi Hitung Pecahan' atau 'Struktur Tulang Hewan')."
                    },
                    tp: {
                      type: Type.STRING,
                      description: "Tujuan Pembelajaran (TP) ringkas, spesifik, dan terukur."
                    },
                    indicator: {
                      type: Type.STRING,
                      description: "Indikator Soal spesifik, diawali dengan kondisi stimulus siswa (contoh: 'Disajikan tabel data, siswa dapat menghitung...')."
                    }
                  },
                  required: ["topicName", "tp", "indicator"]
                }
              }
            },
            required: ["topics"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Gagal menerima respons rekomendasi topik dari Gemini.");
      }

      const data = JSON.parse(resultText.trim());
      return res.json(data);
    } catch (error: any) {
      console.error("Error in /api/suggest-topics:", error);
      return res.status(500).json({ error: error.message || "Gagal membuat rekomendasi topik." });
    }
  });

  /**
   * 2. Endpoint, generate full assessment suite (Kisi-kisi, Soal, Kunci Jawaban, Pedoman Penskoran)
   */
  app.post("/api/generate-assessment", async (req, res) => {
    try {
      const {
        metadata,
        examType,
        difficulty,
        cognitiveLevels,
        topics,
        specialFeatures,
        questionSettings,
        uploadedMaterialText,
      } = req.body;

      if (!metadata || !topics || topics.length === 0 || !questionSettings || questionSettings.length === 0) {
        return res.status(400).json({ error: "Parameter masukan tidak lengkap." });
      }

      const formattedTopics = topics
        .map((t: any, index: number) => {
          return `Topik ${index + 1}: ${t.topicName}
- Tujuan Pembelajaran: ${t.tp || "Disesuaikan AI"}
- Indikator Soal: ${t.indicator || "Disesuaikan AI"}`;
        })
        .join("\n\n");

      const formattedSettings = questionSettings
        .map((s: any) => {
          return `- Format Soal: ${s.format}, Jumlah Soal: ${s.count} butir${
            s.format === "Pilihan Ganda" || s.format === "Pilihan Ganda Kompleks"
              ? `, Jumlah Opsi Jawaban: ${s.optionsCount || 4} opsi`
              : ""
          }`;
        })
        .join("\n");

      const systemInstruction = `Anda adalah platform "Generator Soal AI" tangguh yang digunakan oleh Guru Indonesia untuk merancang asesmen sekolah profesional. Anda menguasai Kurikulum Merdeka (atau K13), Capaian Pembelajaran, Taksonomi Bloom (C1-C6), dan pembuatan soal HOTS (Higher Order Thinking Skills).
Anda harus membuat sebuah dokumen ujian lengkap yang berisi:
1. Title/Judul Ujian yang profesional (misal: "Asesmen Sumatif Akhir Semester Ganjil IPA Kelas VII")
2. Kisi-kisi asesmen dalam format terstruktur yang rapi.
3. Soal Ujian yang mematuhi kurikulum, menggunakan bahasa Indonesia formal yang ramah anak sesuai jenjang usia (${metadata.level}, ${metadata.className}).
4. Kunci Jawaban lengkap dilengkapi pembahasan ringkas, logis, dan akurat untuk tiap nomor soal.
5. Pedoman Penskoran untuk masing-masing tipe soal.

Ketentuan Penting:
- KISI-KISI: Tiap soal harus terpetakan ke kisi-kisi dengan nomor soal yang sinkron, TP, Indikator Soal, Level Kognitif, Bentuk Soal, dan Kunci Jawaban.
- KUALITAS BAHASA: JANGAN ada typo. Gunakan Bahasa Indonesia baku yang jelas, mudah dipahami siswa, bebas dari bias SARA.
- SOAL BERBASIS GAMBAR: Jika opsi 'imageBased' bernilai true, Anda wajib menambahkan instruksi visual mendalam pada properti 'illustrationDescription' (misalnya: "Gambar diagram tumbuhan dengan bagian daun ditunjuk huruf X" atau "Tabel data hasil percobaan reaksi kimia") sehingga guru dapat melampirkan gambar tersebut di kelas.
- FITUR KHUSUS: Integrasikan tuntutan fitur khusus jika diaktifkan (literasi, numerasi, profil pelajar pancasila, kontekstual) ke dalam stimulus soal.
- FORMAT KHUSUS SOAL:
  * Pilihan Ganda Kompleks: Buatlah agar siswa harus memilih lebih dari 1 opsi jawaban yang benar (sediakan 4 atau 5 opsi pilihan di 'options'). Di dalam 'correctAnswer' kunci jawaban, tampilkan semua opsi alfabet yang benar (contoh: "A dan C" atau "B, D").
  * Menjodohkan (Matching): Tuliskan stimulus yang berisi daftar pernyataan sebelah kiri dan daftar pilihan jodoh di sebelah kanan. Di dalam 'correctAnswer' kunci jawaban, berikan pasangan jodohnya yang benar secara rinci (contoh: "1-B, 2-C, 3-A").
- JANGAN ada soal yang sama atau berulang.`;

      const prompt = `BUATLAH ASESMEN UJIAN DENGAN DETAIL BERIKUT:

INFORMASI KELAS & SEKOLAH:
- Jenjang Pendidikan: ${metadata.level}
- Kelas: ${metadata.className}
- Fase: ${metadata.phase || "Disesuaikan otomatis"}
- Mata Pelajaran: ${metadata.subject}
- Semester: ${metadata.semester}
- Kurikulum: ${metadata.curriculum}
- Alokasi Waktu: ${metadata.timeAllocation}
- Tahun Pelajaran: ${metadata.academicYear}

JENIS UJIAN:
- Jenis Ujian: ${examType}
- Tingkat Kesulitan: ${difficulty}
- Level Kognitif yang Diinginkan: ${cognitiveLevels.join(", ")}

TOPIK / MATERI PEMBELAJARAN:
${formattedTopics}

PENGATURAN JENIS DAN JUMLAH SOAL:
${formattedSettings}

FITUR KHUSUS YANG DIAKTIFKAN:
- Literasi (fokus ke pemahaman teks menarik/studi kasus): ${specialFeatures.literacy ? "YA" : "TIDAK"}
- Numerasi (fokus ke pemecahan masalah matematika/data): ${specialFeatures.numeracy ? "YA" : "TIDAK"}
- Terintegrasi Profil Pelajar Pancasila: ${specialFeatures.profilPancasila ? "YA" : "TIDAK"}
- Kontekstual (terkait kehidupan sehari-hari siswa di Indonesia): ${specialFeatures.contextual ? "YA" : "TIDAK"}
- Berbasis Gambar/Sajian Data visual: ${specialFeatures.imageBased ? "YA (Tambahkan deskripsi ilustrasi pada setiap soal yang sesuai)" : "TIDAK"}

${
  uploadedMaterialText
    ? `SUMBER REFERENSI TAMBAHAN (Gunakan materi teks di bawah ini sebagai acuan utama pembuatan soal):\n---\n${uploadedMaterialText}\n---`
    : ""
}

Hasilkan output yang terstruktur rapi sesuai dengan JSON schema yang telah ditentukan. Pastikan sinkronisasi nomor soal antara Kisi-kisi, daftar Soal, dan Kunci Jawaban 100% akurat! Gunakan penomoran berurutan mulai dari angka 1 hingga total jumlah soal yang diminta.`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Judul lengkap asesmen yang formal dan representatif.",
              },
              kisiKisi: {
                type: Type.ARRAY,
                description: "Tabel kisi-kisi soal yang mendetail.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    no: { type: Type.INTEGER, description: "Nomor urut kisi-kisi." },
                    subject: { type: Type.STRING, description: "Mata pelajaran." },
                    classPhase: { type: Type.STRING, description: "Kelas/Fase." },
                    material: { type: Type.STRING, description: "Topik/Materi pembelajaran." },
                    tp: { type: Type.STRING, description: "Tujuan Pembelajaran (TP)." },
                    indicator: { type: Type.STRING, description: "Indikator Soal." },
                    cognitiveLevel: { type: Type.STRING, description: "Level kognitif (C1-C6)." },
                    questionType: { type: Type.STRING, description: "Bentuk Soal." },
                    questionNumber: { type: Type.INTEGER, description: "Nomor Soal." },
                    answerKey: { type: Type.STRING, description: "Kunci Jawaban singkat." },
                  },
                  required: [
                    "no",
                    "subject",
                    "classPhase",
                    "material",
                    "tp",
                    "indicator",
                    "cognitiveLevel",
                    "questionType",
                    "questionNumber",
                    "answerKey",
                  ],
                },
              },
              questions: {
                type: Type.ARRAY,
                description: "Daftar butir soal ujian.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    no: { type: Type.INTEGER, description: "Nomor Soal." },
                    type: { type: Type.STRING, description: "Tipe Soal (Pilihan Ganda, Uraian, dll)." },
                    question: { type: Type.STRING, description: "Pertanyaan lengkap beserta stimulus teks jika ada." },
                    options: {
                      type: Type.ARRAY,
                      description: "Pilihan jawaban (A, B, C, D atau E) jika bertipe Pilihan Ganda. Biarkan kosong jika bertipe Uraian/Isian.",
                      items: { type: Type.STRING },
                    },
                    scoreWeight: { type: Type.INTEGER, description: "Bobot nilai/skor maksimal untuk soal ini." },
                    illustrationDescription: {
                      type: Type.STRING,
                      description: "Penjelasan gambar, diagram, atau ilustrasi yang diperlukan untuk soal ini (jika ada).",
                    },
                  },
                  required: ["no", "type", "question", "scoreWeight"],
                },
              },
              answers: {
                type: Type.ARRAY,
                description: "Daftar kunci jawaban lengkap beserta pembahasan.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    no: { type: Type.INTEGER, description: "Nomor Soal." },
                    correctAnswer: { type: Type.STRING, description: "Jawaban benar (A/B/C/D/E atau deskripsi kunci uraian)." },
                    explanation: { type: Type.STRING, description: "Pembahasan singkat dan rasional mengapa jawaban tersebut benar." },
                    score: { type: Type.INTEGER, description: "Skor bobot soal." },
                  },
                  required: ["no", "correctAnswer", "explanation", "score"],
                },
              },
              scoringGuideline: {
                type: Type.ARRAY,
                description: "Pedoman penskoran penilai untuk masing-masing format soal.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionType: { type: Type.STRING, description: "Jenis format soal." },
                    weightPerQuestion: { type: Type.INTEGER, description: "Skor bobot rata-rata per soal." },
                    description: { type: Type.STRING, description: "Kriteria penilaian atau cara penskoran secara ringkas." },
                  },
                  required: ["questionType", "weightPerQuestion", "description"],
                },
              },
            },
            required: ["title", "kisiKisi", "questions", "answers", "scoringGuideline"],
          },
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Gagal menerima hasil asesmen dari Gemini AI.");
      }

      const data = JSON.parse(resultText.trim());
      // Append temporary unique identifier
      const parsedData = {
        ...data,
        id: "assess-" + Date.now(),
        examType,
        difficulty,
        metadata,
        createdAt: new Date().toISOString()
      };
      
      return res.json(parsedData);
    } catch (error: any) {
      console.error("Error in /api/generate-assessment:", error);
      return res.status(500).json({ error: error.message || "Gagal menghasilkan soal ujian." });
    }
  });

  // For development and production serving
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Generator Soal AI] Server running on http://localhost:${PORT}`);
  });
}

startServer();
