import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ImageRun } from "docx";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { GeneratedAssessment } from "../types";

// Standard browser anchor download helper
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Helper to safely convert base64 image data to an ArrayBuffer
const base64ToUint8Array = (base64String: string): ArrayBuffer | null => {
  try {
    if (!base64String) return null;
    const parts = base64String.split(",");
    const base64Data = parts[1] || parts[0];
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error("Gagal menstandardisasi base64 data untuk logo:", e);
    return null;
  }
};

// Generates the official letterhead table for DOCX
const createDocxKopTable = (meta: any) => {
  let logoChildren: any[] = [];
  const buffer = meta.uploadedLogoUrl ? base64ToUint8Array(meta.uploadedLogoUrl) : null;

  if (buffer) {
    logoChildren = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: buffer,
            transformation: {
              width: 60,
              height: 60,
            },
            type: "png",
          } as any),
        ],
      }),
    ];
  } else {
    // Elegant fallback shape if logo is absent
    logoChildren = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "★", size: 30, bold: true, color: "111111" }),
        ],
      }),
    ];
  }

  const textChildren = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: (meta.kopHeader1 || "PEMERINTAH KABUPATEN / DINAS PENDIDIKAN").toUpperCase(),
          bold: true,
          size: 18,
          font: "Arial",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: (meta.kopHeader2 || "UPTD SATUAN PENDIDIKAN SD NEGERI CERDAS BANGSA").toUpperCase(),
          bold: true,
          size: 22,
          font: "Arial",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Alamat: ${meta.kopAddress || "Jl. Diponegoro No. 10, Kecamatan Nusantara"}`,
          italics: true,
          size: 16,
          font: "Arial",
          color: "444444",
        }),
      ],
    }),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.DOUBLE, size: 18, color: "000000" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: logoChildren,
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: textChildren,
            width: { size: 85, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ],
  });
};

// Generates the official signatures table for DOCX
const createDocxSignaturesTable = (meta: any) => {
  const currentDateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const leftChildren = [
    new Paragraph({
      children: [
        new TextRun({ text: "Mengetahui,\n", font: "Arial", size: 20 }),
        new TextRun({ text: "Kepala Sekolah\n\n\n\n\n", font: "Arial", size: 20 }),
        new TextRun({ text: meta.headmasterName || "Kepala Sekolah", bold: true, font: "Arial", size: 20 }),
        new TextRun({ text: `\nNIP. ${meta.headmasterNip || "-"}`, font: "Arial", size: 20 }),
      ],
    }),
  ];

  const rightChildren = [
    new Paragraph({
      children: [
        new TextRun({ text: `Disahkan di: ${meta.schoolName || "Sekolah"}, ${currentDateStr}\n`, font: "Arial", size: 20 }),
        new TextRun({ text: "Guru Mata Pelajaran\n\n\n\n\n", font: "Arial", size: 20 }),
        new TextRun({ text: meta.teacherName || "Guru Mata Pelajaran", bold: true, font: "Arial", size: 20 }),
        new TextRun({ text: `\nNIP. ${meta.teacherNip || "-"}`, font: "Arial", size: 20 }),
      ],
    }),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: leftChildren,
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: rightChildren,
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ],
  });
};

// Parses potential markdown tables from a question string into actual DOCX Paragraph/Table elements
const parseCustomQuestionToDocx = (qText: string) => {
  if (!qText.includes("|")) {
    return [
      new Paragraph({
        children: [new TextRun({ text: qText, font: "Arial", size: 22 })],
      }),
    ];
  }

  const lines = qText.split("\n");
  const elements: any[] = [];
  const tableLines: string[][] = [];
  let inTable = false;

  for (const line of lines) {
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
        const headerRow = new TableRow({
          children: tableLines[0].map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h, bold: true, font: "Arial", size: 20 })],
                  }),
                ],
              })
          ),
        });
        const bodyRows = tableLines.slice(1).map((row) => {
          return new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: cell, font: "Arial", size: 20 })],
                    }),
                  ],
                })
            ),
          });
        });
        elements.push(
          new Table({
            rows: [headerRow, ...bodyRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
        tableLines.length = 0;
        inTable = false;
      }
      if (trimmed.length > 0) {
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: line, font: "Arial", size: 22 })],
          })
        );
      }
    }
  }

  if (tableLines.length > 0) {
    const headerRow = new TableRow({
      children: tableLines[0].map(
        (h) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: h, bold: true, font: "Arial", size: 20 })],
              }),
            ],
          })
      ),
    });
    const bodyRows = tableLines.slice(1).map((row) => {
      return new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cell, font: "Arial", size: 20 })],
                }),
              ],
            })
        ),
      });
    });
    elements.push(
      new Table({
        rows: [headerRow, ...bodyRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );
  }

  return elements;
};

/**
 * Generates DOCX for Kisi-Kisi
 */
export const generateKisiKisiDocx = async (assessment: GeneratedAssessment) => {
  const meta = assessment.metadata;

  const kopTable = createDocxKopTable(meta);

  const titlePara = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "\nKISI-KISI SELEKSI SOAL UJIAN", bold: true, size: 26, font: "Arial" }),
      new TextRun({ text: `\n${assessment.title.toUpperCase()}`, bold: true, size: 22, font: "Arial" }),
    ],
  });

  const spacePara = new Paragraph({ children: [new TextRun({ text: "" })] });

  // Class Meta Table
  const metaRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Mata Pelajaran")], width: { size: 30, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph(`: ${meta.subject}`)], width: { size: 70, type: WidthType.PERCENTAGE } }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Fase / Kelas")], width: { size: 30, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph(`: ${meta.phase || "N/A"} / ${meta.className}`)], width: { size: 70, type: WidthType.PERCENTAGE } }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Semester / Kurikulum")], width: { size: 30, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph(`: ${meta.semester} / ${meta.curriculum}`)], width: { size: 70, type: WidthType.PERCENTAGE } }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Alokasi Waktu")], width: { size: 30, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph(`: ${meta.timeAllocation}`)], width: { size: 70, type: WidthType.PERCENTAGE } }),
      ],
    }),
  ];

  const metaTable = new Table({
    rows: metaRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
    },
  });

  // Blueprints Table
  const tableHeader = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true, size: 18 })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Materi/Topik", bold: true, size: 18 })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tujuan Pembelajaran", bold: true, size: 18 })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Indikator Soal", bold: true, size: 18 })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Level Kognitif", bold: true, size: 18 })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Bentuk", bold: true, size: 18 })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No Soal", bold: true, size: 18 })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Kunci", bold: true, size: 18 })] })] }),
    ],
  });

  const tableBodyRows = assessment.kisiKisi.map((k) => {
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(k.no), size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.material, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.tp, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.indicator, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.cognitiveLevel, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.questionType, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(k.questionNumber), size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.answerKey, size: 18 })] })] }),
      ],
    });
  });

  const kisiTable = new Table({
    rows: [tableHeader, ...tableBodyRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const signatures = createDocxSignaturesTable(meta);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [kopTable, titlePara, spacePara, metaTable, spacePara, kisiTable, spacePara, signatures],
      },
    ],
  });

  return doc;
};

/**
 * Generates DOCX for Questions (Soal)
 */
export const generateSoalDocx = async (assessment: GeneratedAssessment) => {
  const meta = assessment.metadata;

  const kopTable = createDocxKopTable(meta);

  const titlePara = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "\nLEMBAR NASKAH SOAL UJIAN", bold: true, size: 26, font: "Arial" }),
      new TextRun({ text: `\n${assessment.title.toUpperCase()}`, bold: true, size: 22, font: "Arial" }),
    ],
  });

  const spacePara = new Paragraph({ children: [new TextRun({ text: "" })] });

  // Class Meta Table
  const metaRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Mata Pelajaran")], width: { size: 25, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph(`: ${meta.subject}`)], width: { size: 75, type: WidthType.PERCENTAGE } }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Fase / Kelas")], width: { size: 25, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph(`: ${meta.phase || "N/A"} / ${meta.className}`)], width: { size: 75, type: WidthType.PERCENTAGE } }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Semester / Kurikulum")], width: { size: 25, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph(`: ${meta.semester} / ${meta.curriculum}`)], width: { size: 75, type: WidthType.PERCENTAGE } }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Alokasi Waktu")], width: { size: 25, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph(`: ${meta.timeAllocation}`)], width: { size: 75, type: WidthType.PERCENTAGE } }),
      ],
    }),
  ];

  const metaTable = new Table({
    rows: metaRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
    },
  });

  const listItems: any[] = [];

  assessment.questions.forEach((q) => {
    // 1. Render question statement nicely
    listItems.push(
      new Paragraph({
        children: [
          new TextRun({ text: `\n${q.no}. `, bold: true, size: 22, font: "Arial" }),
        ],
      })
    );

    // Call dynamic parser to catch markdown tables inside question statement
    const parsedQuestionElements = parseCustomQuestionToDocx(q.question);
    parsedQuestionElements.forEach((el) => {
      listItems.push(el);
    });

    // 2. Render picture visual instructions box if required
    if (q.illustrationDescription) {
      listItems.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: "cccccc" },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: "cccccc" },
            left: { style: BorderStyle.SINGLE, size: 6, color: "cccccc" },
            right: { style: BorderStyle.SINGLE, size: 6, color: "cccccc" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "★ [GAMBAR/DIAGRAM INSTRUMEN UJIAN] ★\n", bold: true, size: 18, font: "Arial", color: "444444" }),
                        new TextRun({ text: q.illustrationDescription, italics: true, size: 18, font: "Arial", color: "666666" }),
                      ],
                    }),
                  ],
                  shading: { fill: "f9fafb" },
                }),
              ],
            }),
          ],
        })
      );
    }

    // 3. Render options with perfect indentation & styling
    if (q.options && q.options.length > 0) {
      const optionLabels = ["A", "B", "C", "D", "E"];
      q.options.forEach((opt, idx) => {
        listItems.push(
          new Paragraph({
            children: [
              new TextRun({ text: `      ${optionLabels[idx]}. `, bold: true, size: 21, font: "Arial", color: "333333" }),
              new TextRun({ text: opt, size: 21, font: "Arial", color: "444444" }),
            ],
          })
        );
      });
    } else {
      listItems.push(
        new Paragraph({
          children: [
            new TextRun({ text: `      [Tuliskan Jawaban Uraian Anda - Bobot: ${q.scoreWeight} Poin]`, italics: true, size: 18, color: "888888" }),
          ],
        })
      );
    }
  });

  const divider = new Paragraph({ text: "\n----------------------- Akhir dari Soal Ujian -----------------------", alignment: AlignmentType.CENTER });

  const signatures = createDocxSignaturesTable(meta);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [kopTable, titlePara, spacePara, metaTable, spacePara, ...listItems, divider, spacePara, signatures],
      },
    ],
  });

  return doc;
};

/**
 * Generates DOCX for Answer Key (Kunci Jawaban & Bobot)
 */
export const generateKunciDocx = async (assessment: GeneratedAssessment) => {
  const meta = assessment.metadata;

  const kopTable = createDocxKopTable(meta);

  const titlePara = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "\nKUNCI JAWABAN & RASIONAL PEMBAHASAN", bold: true, size: 26, font: "Arial" }),
      new TextRun({ text: `\n${assessment.title.toUpperCase()}`, bold: true, size: 22, font: "Arial" }),
    ],
  });

  const spacePara = new Paragraph({ children: [new TextRun({ text: "" })] });

  const items: any[] = [];

  assessment.answers.forEach((ans) => {
    items.push(
      new Paragraph({
        children: [
          new TextRun({ text: `\nNo ${ans.no}. Kunci Jawaban: `, bold: true, font: "Arial", size: 22 }),
          new TextRun({ text: `${ans.correctAnswer}\n`, bold: true, font: "Arial", size: 22, color: "0055ff" }),
          new TextRun({ text: "Pembahasan Rasional: ", bold: true, italics: true, font: "Arial", size: 20 }),
          new TextRun({ text: `${ans.explanation}\n`, font: "Arial", size: 20, color: "444444" }),
          new TextRun({ text: `Skor Bobot: ${ans.score} Poin`, font: "Arial", size: 18, color: "666666" }),
        ],
      })
    );
  });

  const guideTitle = new Paragraph({
    children: [
      new TextRun({ text: "\nPEDOMAN PENSKORAN PENILAIAN", bold: true, size: 20, font: "Arial" }),
    ],
  });

  const guideItems = assessment.scoringGuideline.map((g) => {
    return new Paragraph({
      children: [
        new TextRun({ text: `- Tipe Soal: ${g.questionType}\n`, bold: true, font: "Arial", size: 18 }),
        new TextRun({ text: `  Bobot per butir: ${g.weightPerQuestion} | Cara penskoran: ${g.description}`, font: "Arial", size: 18 }),
      ],
    });
  });

  const signatures = createDocxSignaturesTable(meta);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [kopTable, titlePara, spacePara, ...items, spacePara, guideTitle, ...guideItems, spacePara, signatures],
      },
    ],
  });

  return doc;
};

/**
 * Trigger immediate browser download for DOCX files
 */
export const downloadDocxFile = async (doc: Document, filename: string) => {
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
};

/**
 * Generates client jsPDF with Kop & signatures for printing
 */
export const downloadPdfFile = (type: "kisi" | "soal" | "kunci", assessment: GeneratedAssessment) => {
  const doc = new jsPDF();
  const meta = assessment.metadata;

  // Let's draw Kop in PDF first
  let y = 15;

  if (meta.uploadedLogoUrl) {
    try {
      doc.addImage(meta.uploadedLogoUrl, "PNG", 15, y, 18, 18);
    } catch (e) {
      console.warn("Gagal render logo di PDF:", e);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text((meta.kopHeader1 || "PEMERINTAH KABUPATEN / DINAS PENDIDIKAN").toUpperCase(), 105, y + 4, { align: "center" });
  doc.setFontSize(12);
  doc.text((meta.kopHeader2 || "UPTD SATUAN PENDIDIKAN SD NEGERI CERDAS BANGSA").toUpperCase(), 105, y + 10, { align: "center" });
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(`Alamat: ${meta.kopAddress || "Jl. Diponegoro No. 10, Kecamatan Nusantara"}`, 105, y + 15, { align: "center" });

  doc.setLineWidth(0.8);
  doc.line(15, y + 18, 195, y + 18);
  doc.setLineWidth(0.2);
  doc.line(15, y + 19, 195, y + 19);

  y += 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);

  if (type === "kisi") {
    doc.text("KISI-KISI SELEKSI SOAL UJIAN", 105, y, { align: "center" });
    doc.setFontSize(11);
    doc.text(assessment.title, 105, y + 6, { align: "center" });

    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Mata Pelajaran: ${meta.subject}`, 20, y);
    doc.text(`Fase/Kelas: ${meta.phase || "Disesuaikan"} / ${meta.className}`, 20, y + 6);
    doc.text(`Semester/Kurikulum: ${meta.semester} / ${meta.curriculum}`, 20, y + 12);
    doc.text(`Alokasi Waktu: ${meta.timeAllocation}`, 120, y);

    y += 22;
    doc.setFont("helvetica", "bold");
    doc.text("Matriks Butir Kisi-kisi Soal:", 20, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    assessment.kisiKisi.forEach((k) => {
      if (y > 250) {
        doc.addPage();
        y = 25;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`No ${k.no}. Topik: ${k.material}`, 20, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.text(`   TP: ${k.tp.substring(0, 85)}...`, 20, y);
      y += 5;
      doc.text(`   Indikator: ${k.indicator.substring(0, 95)}...`, 20, y);
      y += 5;
      doc.text(`   Jenis Soal: ${k.questionType} | Kognitif: ${k.cognitiveLevel} | No Soal: ${k.questionNumber} | Kunci: ${k.answerKey}`, 20, y);
      y += 8;
    });

  } else if (type === "soal") {
    doc.text("LEMBAR NASKAH SOAL UJIAN", 105, y, { align: "center" });
    doc.setFontSize(11);
    doc.text(assessment.title, 105, y + 6, { align: "center" });

    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Mapel: ${meta.subject} | Semester: ${meta.semester}`, 20, y);
    doc.text(`Kelas: ${meta.className} | Kurikulum: ${meta.curriculum}`, 20, y + 6);
    doc.text(`Alokasi Waktu: ${meta.timeAllocation} | Th Pelajaran: ${meta.academicYear}`, 20, y + 12);

    y += 24;
    assessment.questions.forEach((q) => {
      if (y > 245) {
        doc.addPage();
        y = 25;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      
      // Print question wrapping
      const questionLines = doc.splitTextToSize(`${q.no}. ${q.question}`, 170);
      doc.text(questionLines, 20, y);
      y += (questionLines.length * 4.5) + 1;

      if (q.illustrationDescription) {
        const illLines = doc.splitTextToSize(`[Gambar/Diagram Stimulus: ${q.illustrationDescription}]`, 160);
        doc.setFont("helvetica", "italic");
        doc.setFillColor(245, 245, 245);
        doc.rect(23, y - 1, 164, (illLines.length * 4.5) + 3, "F");
        doc.text(illLines, 25, y + 3);
        y += (illLines.length * 4.5) + 8;
        doc.setFont("helvetica", "bold");
      }

      if (q.options && q.options.length > 0) {
        doc.setFont("helvetica", "normal");
        const labels = ["A", "B", "C", "D", "E"];
        q.options.forEach((opt, oIdx) => {
          if (y > 270) {
            doc.addPage();
            y = 25;
          }
          doc.text(`   ${labels[oIdx]}. ${opt}`, 25, y);
          y += 5;
        });
      } else {
        doc.setFont("helvetica", "italic");
        doc.text(`   [Ruang Jawaban Uraian - Bobot: ${q.scoreWeight} Poin]`, 25, y);
        y += 6;
      }
      y += 3;
    });

  } else {
    doc.text("KUNCI JAWABAN & RASIONAL PEMBAHASAN", 105, y, { align: "center" });
    doc.setFontSize(11);
    doc.text(assessment.title, 105, y + 6, { align: "center" });

    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Mapel: ${meta.subject} | Semester: ${meta.semester}`, 20, y);
    doc.text(`Penyusun: ${meta.teacherName || "Guru Mata Pelajaran"}`, 20, y + 6);

    y += 18;
    assessment.answers.forEach((ans) => {
      if (y > 250) {
        doc.addPage();
        y = 25;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`No ${ans.no}. Kunci Jawaban: ${ans.correctAnswer}`, 20, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const expLines = doc.splitTextToSize(`Pembahasan Rasional: ${ans.explanation}`, 170);
      doc.text(expLines, 20, y);
      y += (expLines.length * 4.5) + 6;
    });
  }

  // Draw Signatures on PDF
  if (y > 230) {
    doc.addPage();
    y = 30;
  }
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Mengetahui,", 25, y);
  doc.text("Kepala Sekolah", 25, y + 5);
  doc.text("___________________________________", 25, y + 25);
  doc.setFont("helvetica", "bold");
  doc.text(meta.headmasterName || "Kepala Sekolah", 25, y + 30);
  doc.setFont("helvetica", "normal");
  doc.text(`NIP. ${meta.headmasterNip || "-"}`, 25, y + 35);

  const currentDateText = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`Disahkan di: ${meta.schoolName || "Sekolah"}, ${currentDateText}`, 125, y);
  doc.text("Guru Mata Pelajaran,", 125, y + 5);
  doc.text("___________________________________", 125, y + 25);
  doc.setFont("helvetica", "bold");
  doc.text(meta.teacherName || "Guru Mata Pelajaran", 125, y + 30);
  doc.setFont("helvetica", "normal");
  doc.text(`NIP. ${meta.teacherNip || "-"}`, 125, y + 35);

  // Watermark
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text("Generated by Generator Soal AI - By Muh. Asriwadi AP", 105, 285, { align: "center" });

  doc.save(`${type}_${assessment.title.toLowerCase().replace(/\s+/g, "_")}.pdf`);
};

/**
 * Downloads all assessment documents bundled together inside a ZIP file
 */
export const downloadAllAsZip = async (assessment: GeneratedAssessment) => {
  const zip = new JSZip();

  // 1. Generate Kisi-Kisi
  const kisiDoc = await generateKisiKisiDocx(assessment);
  const kisiBlob = await Packer.toBlob(kisiDoc);
  zip.file("1_Kisi_Kisi_Soal.docx", kisiBlob);

  // 2. Generate Lembar Soal
  const soalDoc = await generateSoalDocx(assessment);
  const soalBlob = await Packer.toBlob(soalDoc);
  zip.file("2_Lembar_Soal_Ujian.docx", soalBlob);

  // 3. Generate Kunci & Pedoman
  const kunciDoc = await generateKunciDocx(assessment);
  const kunciBlob = await Packer.toBlob(kunciDoc);
  zip.file("3_Kunci_Jawaban_dan_Pembahasan.docx", kunciBlob);

  // Generate complete package
  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, `Asesmen_Lengkap_${assessment.title.replace(/\s+/g, "_")}.zip`);
};
