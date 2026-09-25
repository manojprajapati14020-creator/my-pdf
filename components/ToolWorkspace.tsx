import React, { useState, useEffect } from "react";
import {
  FileText,
  Trash2,
  Eye,
  GripVertical,
  ArrowRight,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Lock,
  Scissors,
  Layers,
  Settings2,
  Copy,
  Check,
  Languages,
  ScanText,
  FileSpreadsheet,
  Shield,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolDefinition, UploadedFileItem, ProcessingState } from "../types";
import { FileUploadZone } from "./FileUploadZone";
import { PDFViewer } from "./PDFViewer";
import { SignatureModal } from "./SignatureModal";
import { AIChatPanel } from "./AIChatPanel";
import {
  mergePdfs,
  splitPdf,
  organizePdf,
  rotatePdf,
  addPageNumbers,
  addWatermark,
  stampSignature,
  imagesToPdf,
  textOrHtmlToPdf,
  excelToPdf,
  protectPdf,
  unlockPdf,
  repairPdf,
  compressPdf,
  comparePdfs,
  convertPdfToWord,
  convertWordToPdf,
  convertPdfToExcel,
  convertExcelToPdf,
  convertPdfToPowerPoint,
  convertPowerPointToPdf,
  convertPdfToJpg,
  convertPdfToPng,
  convertPdfToMarkdown,
  convertPdfToPdfA,
  redactPdf,
  cropPdf,
  extractPdfStructure,
  renderPageToImageBase64,
  inspectPdfForm,
  fillPdfFormReal,
  applyPdfEdits,
  ocrPagesToPdf,
} from "../services/pdfEngine";
import {
  requestAISummary,
  requestAITranslate,
  requestAIOCR,
  AISummaryResult,
} from "../services/aiService";

interface Props {
  tool: ToolDefinition;
  onBack: () => void;
  onRecordOperation?: (toolId: string, toolName: string, fileName: string) => void;
}

export const ToolWorkspace: React.FC<Props> = ({ tool, onBack, onRecordOperation }) => {
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({
    status: "idle",
    progress: 0,
    message: "",
  });

  // Tool-specific configurations
  const [splitMode, setSplitMode] = useState<"range" | "extract" | "every">("range");
  const [splitRange, setSplitRange] = useState("1-2");
  const [rotateAngle, setRotateAngle] = useState<number>(90);
  const [rotateTarget, setRotateTarget] = useState<"all" | "odd" | "even">("all");
  const [compressTier, setCompressTier] = useState<"low" | "recommended" | "high">("recommended");
  const [pageNumberPos, setPageNumberPos] = useState<"bottom-center" | "bottom-right" | "top-right">("bottom-center");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.4);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [targetLang, setTargetLang] = useState("Spanish");
  const [ocrLang, setOcrLang] = useState("English");
  const [htmlInput, setHtmlInput] = useState("<h1>Enterprise Agreement</h1><p>This document certifies verification of standard terms.</p>");

  // Modals & previews
  const [previewFile, setPreviewFile] = useState<File | Blob | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signaturePlacement, setSignaturePlacement] = useState<"bottom-right" | "bottom-left" | "bottom-center" | "top-right">("bottom-right");
  const [signaturePageNum, setSignaturePageNum] = useState<number>(1);
  const [aiSummaryOutput, setAiSummaryOutput] = useState<AISummaryResult | null>(null);
  const [aiTranslatedText, setAiTranslatedText] = useState<string | null>(null);
  const [ocrExtractedText, setOcrExtractedText] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // New configuration states for genuine tool operation
  const [chatDocumentText, setChatDocumentText] = useState<string>("");
  const [isExtractingChatText, setIsExtractingChatText] = useState<boolean>(false);
  const [redactKeywords, setRedactKeywords] = useState<string>("confidential, secret, private, ssn");
  const [redactEmail, setRedactEmail] = useState<boolean>(true);
  const [redactPhone, setRedactPhone] = useState<boolean>(true);
  const [redactSsn, setRedactSsn] = useState<boolean>(true);
  const [redactCreditCard, setRedactCreditCard] = useState<boolean>(true);
  const [redactZone, setRedactZone] = useState<"none" | "header" | "footer" | "signature">("none");

  // Visual Directional Crop state
  const [cropTop, setCropTop] = useState<number>(5);
  const [cropBottom, setCropBottom] = useState<number>(5);
  const [cropLeft, setCropLeft] = useState<number>(5);
  const [cropRight, setCropRight] = useState<number>(5);
  const [cropScope, setCropScope] = useState<"all" | "selected">("all");
  const [cropSelectedPage, setCropSelectedPage] = useState<number>(1);
  const [cropMargin, setCropMargin] = useState<number>(25);
  const [editAnnotationText, setEditAnnotationText] = useState<string>("CERTIFIED & APPROVED");
  const [editAnnotationType, setEditAnnotationType] = useState<"text" | "highlight" | "stamp">("text");
  const [editAnnotationPosition, setEditAnnotationPosition] = useState<"header" | "stamp" | "footer">("header");
  const [editAnnotationColor, setEditAnnotationColor] = useState<string>("#4f46e5");
  const [editAnnotationFontSize, setEditAnnotationFontSize] = useState<number>(16);
  const [formFields, setFormFields] = useState<Array<{ name: string; type: string; value?: string | boolean }>>([]);

  // Organize PDF page reordering state
  const [pageList, setPageList] = useState<number[]>([1, 2, 3]);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});

  useEffect(() => {
    // Reset state on tool change
    setFiles([]);
    setProcessing({ status: "idle", progress: 0, message: "" });
    setAiSummaryOutput(null);
    setAiTranslatedText(null);
    setOcrExtractedText(null);
    setCompareResult(null);
    setChatDocumentText("");
    setFormFields([]);
  }, [tool.id]);

  // Extract actual document text whenever a file is uploaded in AI Chat mode
  useEffect(() => {
    if (tool.id === "ai-chat-pdf" && files.length > 0 && files[0].file) {
      let active = true;
      setIsExtractingChatText(true);
      extractPdfStructure(files[0].file)
        .then((struct) => {
          if (!active) return;
          const text = struct.pages
            .map((p) => `[Page ${p.pageNumber}]\n${p.rawText.trim()}`)
            .join("\n\n")
            .trim();
          setChatDocumentText(
            text ||
              `Document: ${files[0].name} (${struct.numPages} pages).\n\nNotice: No selectable text layer was detected in this document. If this is a scanned image, please use the OCR PDF tool first.`
          );
        })
        .catch((err) => {
          if (!active) return;
          setChatDocumentText(`Document: ${files[0].name}.\nError reading text content: ${err.message}`);
        })
        .finally(() => {
          if (active) setIsExtractingChatText(false);
        });

      return () => {
        active = false;
      };
    }
  }, [tool.id, files[0]?.file]);

  const handleFilesSelected = (newFiles: File[]) => {
    const fileItems: UploadedFileItem[] = newFiles.map((file, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type || "application/pdf",
      pageCount: 1,
      status: "ready",
      progress: 100,
    }));

    // Asynchronously detect genuine PDF page counts
    Promise.all(
      newFiles.map(async (file) => {
        if (file.name.toLowerCase().endsWith(".pdf") || file.type.includes("pdf")) {
          try {
            const buf = await file.arrayBuffer();
            const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
            return doc.getPageCount();
          } catch {
            return 1;
          }
        }
        return 1;
      })
    ).then((counts) => {
      setFiles((prev) =>
        prev.map((item) => {
          const matchIdx = newFiles.findIndex((nf) => nf.name === item.name);
          if (matchIdx !== -1 && counts[matchIdx]) {
            return { ...item, pageCount: counts[matchIdx] };
          }
          return item;
        })
      );
      if (counts[0] && counts[0] > 0) {
        setPageList(Array.from({ length: counts[0] }, (_, i) => i + 1));
        setSplitRange(`1-${Math.min(counts[0], 2)}`);
      }
    });

    if (tool.maxFiles === 1) {
      setFiles(fileItems.slice(0, 1));
      // Inspect form fields if in pdf-form tool
      if (tool.id === "pdf-form" && newFiles[0]) {
        inspectPdfForm(newFiles[0])
          .then((detected) => {
            setFormFields(detected.map((d) => ({ name: d.name, type: d.type, value: d.value || "" })));
          })
          .catch(() => setFormFields([]));
      }
    } else {
      setFiles((prev) => [...prev, ...fileItems]);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= files.length) return;
    const next = [...files];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setFiles(next);
  };

  const executeToolOperation = async () => {
    if (files.length === 0 && tool.id !== "html-to-pdf") {
      setProcessing({
        status: "error",
        progress: 0,
        message: "Please upload at least one document to proceed.",
      });
      return;
    }

    setProcessing({
      status: "uploading",
      progress: 25,
      message: "Validating and reading document streams...",
    });

    try {
      await new Promise((r) => setTimeout(r, 400));
      setProcessing({
        status: "processing",
        progress: 60,
        message: `Executing ${tool.name}...`,
      });

      let resultBlob: Blob | null = null;
      let outputFileName = `${files[0]?.name.replace(/\.[^/.]+$/, "") || "Document"}_processed.pdf`;
      let extraMeta: Record<string, any> = {};

      const primaryFile = files[0]?.file;

      // 1. MERGE PDF
      if (tool.id === "merge-pdf") {
        resultBlob = await mergePdfs(files.map((f) => f.file));
        outputFileName = `Merged_${files.length}_Documents.pdf`;
      }
      // 2. SPLIT PDF
      else if (tool.id === "split-pdf") {
        const pages = splitRange
          .split(",")
          .flatMap((part) => {
            const rangeParts = part.trim().split("-");
            if (rangeParts.length === 2) {
              const start = parseInt(rangeParts[0], 10);
              const end = parseInt(rangeParts[1], 10);
              const list: number[] = [];
              for (let i = start; i <= end; i++) list.push(i);
              return list;
            }
            return [parseInt(part.trim(), 10)];
          })
          .filter((n) => !isNaN(n) && n > 0);

        resultBlob = await splitPdf(primaryFile, pages.length > 0 ? pages : [1]);
        outputFileName = `Split_Pages_${splitRange}.pdf`;
      }
      // 3. ORGANIZE PDF
      else if (tool.id === "organize-pdf") {
        resultBlob = await organizePdf(primaryFile, pageList, pageRotations);
        outputFileName = `Organized_${primaryFile.name}`;
      }
      // 4. ROTATE PDF
      else if (tool.id === "rotate-pdf") {
        resultBlob = await rotatePdf(primaryFile, rotateAngle, rotateTarget);
        outputFileName = `Rotated_${rotateAngle}deg_${primaryFile.name}`;
      }
      // 5. PAGE NUMBERS
      else if (tool.id === "page-numbers") {
        resultBlob = await addPageNumbers(primaryFile, {
          position: pageNumberPos,
          format: "Page {n} of {total}",
          startNumber: 1,
          fontSize: 10,
        });
        outputFileName = `Numbered_${primaryFile.name}`;
      }
      // 6. COMPRESS PDF
      else if (tool.id === "compress-pdf") {
        const comp = await compressPdf(primaryFile, compressTier);
        resultBlob = comp.blob;
        extraMeta = {
          ratio: comp.ratio,
          outputSize: comp.outputSize,
          originalSize: comp.originalSize,
          strategyApplied: comp.strategyApplied,
        };
        outputFileName = comp.fileName || `Compressed_${primaryFile.name}`;
      }
      // 7. WATERMARK PDF
      else if (tool.id === "watermark-pdf") {
        resultBlob = await addWatermark(primaryFile, {
          text: watermarkText || "CONFIDENTIAL",
          opacity: watermarkOpacity,
          fontSize: 38,
          rotationAngle: watermarkAngle,
        });
        outputFileName = `Watermarked_${primaryFile.name}`;
      }
      // 8. SIGN PDF
      else if (tool.id === "sign-pdf") {
        if (!signatureDataUrl) {
          throw new Error("Please draw or upload your signature first using the 'Create Signature' button.");
        }
        let xPercent = 65;
        let yPercent = 80;
        if (signaturePlacement === "bottom-left") {
          xPercent = 10;
          yPercent = 80;
        } else if (signaturePlacement === "bottom-center") {
          xPercent = 40;
          yPercent = 80;
        } else if (signaturePlacement === "top-right") {
          xPercent = 65;
          yPercent = 12;
        }

        resultBlob = await stampSignature(primaryFile, signatureDataUrl, {
          pageNumber: signaturePageNum || 1,
          xPercent,
          yPercent,
          width: 160,
          height: 60,
        });
        outputFileName = `Signed_${primaryFile.name}`;
      }
      // 9. PROTECT PDF
      else if (tool.id === "protect-pdf") {
        const pass = passwordInput ? passwordInput.trim() : "";
        const confirmPass = confirmPasswordInput ? confirmPasswordInput.trim() : "";
        if (!pass) {
          throw new Error("Please enter a password to encrypt this document.");
        }
        if (pass !== confirmPass) {
          throw new Error("Encryption passwords do not match. Please ensure both passwords match.");
        }
        resultBlob = await protectPdf(primaryFile, pass);
        outputFileName = `Protected_${primaryFile.name}`;
      }
      // 10. REPAIR PDF
      else if (tool.id === "repair-pdf") {
        resultBlob = await repairPdf(primaryFile);
        outputFileName = `Repaired_${primaryFile.name}`;
      }
      // 11. COMPARE PDF
      else if (tool.id === "compare-pdf") {
        if (files.length < 2) {
          throw new Error("Please upload 2 PDF documents to compare.");
        }
        const comp = await comparePdfs(files[0].file, files[1].file);
        setCompareResult(comp);

        const reportTitle = `Document Comparison Report`;
        const reportContent = `MY PDF - DOCUMENT COMPARISON AUDIT
Document 1: ${files[0].name} (${comp.pageCount1} pages, ${(files[0].file.size / 1024).toFixed(1)} KB)
Document 2: ${files[1].name} (${comp.pageCount2} pages, ${(files[1].file.size / 1024).toFixed(1)} KB)
Overall Content Similarity: ${comp.similarityScore}%
Payload Difference: ${comp.sizeDiff >= 0 ? `+${(comp.sizeDiff / 1024).toFixed(1)} KB` : `${(comp.sizeDiff / 1024).toFixed(1)} KB`}

KEY AUDIT FINDINGS:
${comp.differences.map((d: any, i: number) => `${i + 1}. [${d.type.toUpperCase()}] ${d.title}\n   ${d.desc}`).join("\n\n")}

Document verified and generated by My PDF Engine.`;

        resultBlob = await textOrHtmlToPdf(reportTitle, reportContent);
        outputFileName = `Comparison_Report_${files[0].name.replace(/\.[^/.]+$/, "")}_vs_${files[1].name.replace(/\.[^/.]+$/, "")}.pdf`;
      }
      // 12. IMAGE TO PDF
      else if (tool.id === "jpg-to-pdf" || tool.id === "png-to-pdf" || tool.id === "scan-to-pdf") {
        resultBlob = await imagesToPdf(files.map((f) => f.file));
        outputFileName = `Images_Combined.pdf`;
      }
      // 13. EXCEL TO PDF
      else if (tool.id === "excel-to-pdf") {
        const conv = await convertExcelToPdf(primaryFile);
        resultBlob = conv.blob;
        outputFileName = conv.fileName;
      }
      // 14. WORD TO PDF
      else if (tool.id === "word-to-pdf") {
        const conv = await convertWordToPdf(primaryFile);
        resultBlob = conv.blob;
        outputFileName = conv.fileName;
      }
      // 15. POWERPOINT TO PDF
      else if (tool.id === "powerpoint-to-pdf") {
        const conv = await convertPowerPointToPdf(primaryFile);
        resultBlob = conv.blob;
        outputFileName = conv.fileName;
      }
      // 16. PDF TO WORD
      else if (tool.id === "pdf-to-word") {
        const conv = await convertPdfToWord(primaryFile);
        resultBlob = conv.blob;
        outputFileName = conv.fileName;
      }
      // 17. PDF TO EXCEL
      else if (tool.id === "pdf-to-excel") {
        const conv = await convertPdfToExcel(primaryFile);
        resultBlob = conv.blob;
        outputFileName = conv.fileName;
      }
      // 18. PDF TO POWERPOINT
      else if (tool.id === "pdf-to-powerpoint") {
        const conv = await convertPdfToPowerPoint(primaryFile);
        resultBlob = conv.blob;
        outputFileName = conv.fileName;
      }
      // 19. PDF TO JPG
      else if (tool.id === "pdf-to-jpg") {
        const conv = await convertPdfToJpg(primaryFile);
        resultBlob = conv.blob;
        outputFileName = conv.fileName;
      }
      // 20. PDF TO PNG
      else if (tool.id === "pdf-to-png") {
        const conv = await convertPdfToPng(primaryFile);
        resultBlob = conv.blob;
        outputFileName = conv.fileName;
      }
      // 21. PDF TO MARKDOWN
      else if (tool.id === "pdf-to-markdown") {
        const conv = await convertPdfToMarkdown(primaryFile);
        resultBlob = conv.blob;
        outputFileName = conv.fileName;
      }
      // 22. PDF TO PDF/A
      else if (tool.id === "pdf-to-pdfa") {
        const conv = await convertPdfToPdfA(primaryFile);
        resultBlob = conv.blob;
        outputFileName = conv.fileName;
      }
      // 23. REDACT PDF
      else if (tool.id === "redact-pdf") {
        setProcessing({
          status: "processing",
          progress: 45,
          message: "Scanning document stream and applying permanent opaque raster redactions...",
        });
        const terms = redactKeywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const patterns = {
          email: redactEmail,
          phone: redactPhone,
          ssn: redactSsn,
          creditCard: redactCreditCard,
        };
        const manualAreas: Array<{
          pageNumber: number;
          xPercent: number;
          yPercent: number;
          widthPercent: number;
          heightPercent: number;
        }> = [];
        if (redactZone === "header") {
          manualAreas.push({ pageNumber: 1, xPercent: 5, yPercent: 2, widthPercent: 90, heightPercent: 10 });
        } else if (redactZone === "footer") {
          manualAreas.push({ pageNumber: 1, xPercent: 5, yPercent: 88, widthPercent: 90, heightPercent: 10 });
        } else if (redactZone === "signature") {
          manualAreas.push({ pageNumber: 1, xPercent: 58, yPercent: 75, widthPercent: 37, heightPercent: 20 });
        }
        const conv = await redactPdf(primaryFile, {
          terms: terms.length > 0 ? terms : undefined,
          patterns,
          manualAreas: manualAreas.length > 0 ? manualAreas : undefined,
        });
        resultBlob = conv.blob;
        outputFileName = conv.fileName;
        extraMeta = { redactedMatchesCount: conv.redactedMatchesCount };
      }
      // 24. CROP PDF
      else if (tool.id === "crop-pdf") {
        setProcessing({
          status: "processing",
          progress: 45,
          message: "Applying directional crop margins and adjusting viewport coordinate bounds...",
        });
        const conv = await cropPdf(primaryFile, {
          scope: cropScope,
          selectedPages: cropScope === "selected" ? [cropSelectedPage] : undefined,
          topPercent: cropTop,
          bottomPercent: cropBottom,
          leftPercent: cropLeft,
          rightPercent: cropRight,
        });
        resultBlob = conv.blob;
        outputFileName = conv.fileName;
      }
      // 25. UNLOCK PDF
      else if (tool.id === "unlock-pdf") {
        const pass = passwordInput ? passwordInput.trim() : "";
        if (!pass) {
          throw new Error("Please enter the document password to unlock this file.");
        }
        resultBlob = await unlockPdf(primaryFile, pass);
        outputFileName = `Unlocked_${primaryFile.name}`;
      }
      // 26. EDIT PDF
      else if (tool.id === "edit-pdf") {
        let x = 50;
        let y = 50;
        if (editAnnotationPosition === "header") {
          x = 50;
          y = 8;
        } else if (editAnnotationPosition === "footer") {
          x = 50;
          y = 92;
        } else if (editAnnotationPosition === "stamp") {
          x = 50;
          y = 50;
        }

        const annotations: any[] = [];
        if (editAnnotationType === "highlight") {
          annotations.push({
            id: `ann-hl-${Date.now()}`,
            pageNumber: 1,
            type: "highlight",
            x: 10,
            y: 12,
            width: 80,
            height: 25,
            color: editAnnotationColor || "#4f46e5",
            opacity: 0.35,
          });
        }

        annotations.push({
          id: `ann-txt-${Date.now()}`,
          pageNumber: 1,
          type: "text",
          x,
          y,
          text: editAnnotationText || "CERTIFIED & APPROVED",
          color: editAnnotationColor || "#4f46e5",
          fontSize: editAnnotationFontSize || 16,
        });

        const editRes = await applyPdfEdits(primaryFile, annotations);
        resultBlob = editRes.blob;
        outputFileName = editRes.fileName;
      }
      // 27. PDF FORM
      else if (tool.id === "pdf-form") {
        setProcessing({
          status: "processing",
          progress: 50,
          message: "Injecting field values into AcroForm and flattening...",
        });
        const formValues: Record<string, string | boolean> = {};
        for (const field of formFields) {
          if (field.value !== undefined) {
            formValues[field.name] = field.value;
          }
        }
        const fillRes = await fillPdfFormReal(primaryFile, formValues, true);
        resultBlob = fillRes.blob;
        outputFileName = fillRes.fileName;
      }
      // 28. HTML TO PDF
      else if (tool.id === "html-to-pdf") {
        resultBlob = await textOrHtmlToPdf("Exported Web Document", htmlInput);
        outputFileName = `Web_Export.pdf`;
      }
      // 29. AI SUMMARIZER
      else if (tool.id === "ai-summarizer") {
        setProcessing({
          status: "processing",
          progress: 35,
          message: "Extracting readable text structure from uploaded PDF...",
        });
        const struct = await extractPdfStructure(primaryFile);
        const textToAnalyze = struct.pages.map((p) => p.rawText).join("\n\n").trim();
        if (!textToAnalyze || textToAnalyze.length === 0) {
          throw new Error(
            "No readable text stream could be extracted from this PDF. If this document is a scanned image or photograph, please run OCR PDF first."
          );
        }
        setProcessing({
          status: "processing",
          progress: 70,
          message: "Analyzing document with Gemini AI...",
        });
        const summary = await requestAISummary(textToAnalyze, primaryFile.name);
        setAiSummaryOutput(summary);
        resultBlob = await textOrHtmlToPdf(
          `AI Summary - ${primaryFile.name}`,
          `EXECUTIVE SUMMARY\n${summary.shortSummary}\n\nDETAILED SUMMARY\n${summary.detailedSummary}\n\nKEY TAKEAWAYS\n${summary.keyPoints.map((k) => `• ${k}`).join("\n")}\n\nTOPICS COVERED\n${summary.importantTopics.join(", ")}\n\nACTION ITEMS\n${summary.actionItems.map((a) => `• ${a}`).join("\n")}`
        );
        outputFileName = `AI_Summary_${primaryFile.name}`;
      }
      // 30. TRANSLATE PDF
      else if (tool.id === "translate-pdf") {
        setProcessing({
          status: "processing",
          progress: 35,
          message: "Extracting document text for translation...",
        });
        const struct = await extractPdfStructure(primaryFile);
        const textToTranslate = struct.pages.map((p) => p.rawText).join("\n\n").trim();
        if (!textToTranslate || textToTranslate.length === 0) {
          throw new Error(
            "No selectable text could be extracted from this PDF to translate. If this is a scanned document, please use OCR PDF first."
          );
        }
        setProcessing({
          status: "processing",
          progress: 70,
          message: `Translating document into ${targetLang}...`,
        });
        const translated = await requestAITranslate(textToTranslate, targetLang);
        setAiTranslatedText(translated.translatedText);
        resultBlob = await textOrHtmlToPdf(`Translated (${targetLang}) - ${primaryFile.name}`, translated.translatedText);
        outputFileName = `Translated_${targetLang}_${primaryFile.name}`;
      }
      // 31. OCR PDF
      else if (tool.id === "ocr-pdf") {
        setProcessing({
          status: "processing",
          progress: 35,
          message: "Rendering uploaded document page to high-resolution image...",
        });
        const base64Img = await renderPageToImageBase64(primaryFile, 1, 2.0);
        setProcessing({
          status: "processing",
          progress: 70,
          message: `Executing visual OCR in ${ocrLang}...`,
        });
        const ocr = await requestAIOCR(base64Img, ocrLang);
        setOcrExtractedText(ocr.extractedText);
        resultBlob = await textOrHtmlToPdf(`Searchable OCR - ${primaryFile.name}`, ocr.extractedText);
        outputFileName = `Searchable_OCR_${primaryFile.name}`;
      }
      // 32. AI CHAT PDF
      else if (tool.id === "ai-chat-pdf") {
        resultBlob = primaryFile;
        outputFileName = primaryFile.name;
      }
      // Explicit error if an unknown tool ID is executed
      else {
        throw new Error(`Tool "${tool.name}" (${tool.id}) has no registered conversion engine.`);
      }

      setProcessing({
        status: "success",
        progress: 100,
        message: "Your document is ready!",
        resultBlob: resultBlob || undefined,
        resultUrl: resultBlob ? URL.createObjectURL(resultBlob) : undefined,
        resultFileName: outputFileName,
        resultMeta: extraMeta,
      });

      if (onRecordOperation && primaryFile) {
        onRecordOperation(tool.id, tool.name, primaryFile.name);
      }
    } catch (err: any) {
      console.error("Tool execution failed:", err);
      setProcessing({
        status: "error",
        progress: 0,
        message: err.message || "Something went wrong while processing your document.",
        errorDetails: err.stack,
      });
    }
  };

  const handleDownloadResult = () => {
    if (!processing.resultBlob) return;
    const url = URL.createObjectURL(processing.resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = processing.resultFileName || "Processed_Document.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartOver = () => {
    setFiles([]);
    setProcessing({ status: "idle", progress: 0, message: "" });
    setAiSummaryOutput(null);
    setAiTranslatedText(null);
    setOcrExtractedText(null);
    setCompareResult(null);
  };

  const handleCopyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-150">
      {/* Back Button & Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-2 inline-flex items-center gap-1"
          >
            ← Back to all tools
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {tool.name}
            </h1>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              {tool.categoryLabel}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {tool.shortDescription}
          </p>
        </div>

        {/* Quick status pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            Max {tool.maxFiles || 10} file{tool.maxFiles === 1 ? "" : "s"}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
            TLS Encrypted
          </span>
        </div>
      </div>

      {/* SPECIAL MODE: AI Chat with PDF (Side-by-side view) */}
      {tool.id === "ai-chat-pdf" && files.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <div className="lg:col-span-7 h-full bg-slate-950/40 p-2 flex flex-col">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 flex items-center justify-between border-b border-slate-800">
              <span>PDF Viewer: {files[0].name}</span>
              <button
                onClick={() => setPreviewFile(files[0].file)}
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Fullscreen
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-2">
              <iframe
                src={`${URL.createObjectURL(files[0].file)}#toolbar=0`}
                title="Chat PDF Preview"
                className="w-full h-full rounded-xl bg-white shadow-inner border border-slate-700"
              />
            </div>
          </div>
          <div className="lg:col-span-5 h-full">
            {isExtractingChatText ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-white dark:bg-slate-900">
                <Sparkles className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Reading document stream...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Extracting actual text from {files[0].name}
                </p>
              </div>
            ) : (
              <AIChatPanel
                documentText={chatDocumentText || `Document: ${files[0].name}. (Empty text stream).`}
                fileName={files[0].name}
              />
            )}
          </div>
        </div>
      ) : null}

      {/* STAGE 1: Uploading / Idle State */}
      {processing.status === "idle" && (
        <div className="space-y-8">
          {/* PRIVACY & SECURITY BANNER */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                100% Secure & Private In-Memory Processing
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Your documents are processed securely in browser memory or via encrypted TLS channels. Files are never stored or used for training.
              </p>
            </div>
          </div>

          {/* File Upload Zone */}
          <FileUploadZone
            acceptedExtensions={tool.acceptedFileTypes}
            maxFiles={tool.maxFiles}
            existingFileNames={files.map((f) => f.name)}
            onFilesSelected={handleFilesSelected}
            title={files.length > 0 ? "Add more files" : "Drop your files here"}
            subtitle="or Browse Files"
          />

          {/* HTML to PDF Special Input */}
          {tool.id === "html-to-pdf" && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                HTML Markup or Web Snippet:
              </label>
              <textarea
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                rows={6}
                className="w-full p-4 font-mono text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Uploaded File Cards List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Uploaded Files ({files.length})
                </h3>
                {tool.maxFiles && tool.maxFiles > 1 && (
                  <span className="text-xs text-slate-400">Drag or use arrows to reorder</span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {files.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span>{(item.size / 1024).toFixed(1)} KB</span>
                          {item.pageCount && <span>• {item.pageCount} Pages</span>}
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Reorder Buttons */}
                      {files.length > 1 && (
                        <div className="flex items-center gap-1 mr-2">
                          <button
                            type="button"
                            onClick={() => moveFile(index, "up")}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 text-xs font-bold"
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFile(index, "down")}
                            disabled={index === files.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 text-xs font-bold"
                            title="Move Down"
                          >
                            ↓
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setPreviewFile(item.file)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                        title="Preview Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TOOL CONFIGURATION PANELS */}
          {files.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Settings2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {tool.name} Settings
                </h4>
              </div>

              {/* SPLIT OPTIONS */}
              {tool.id === "split-pdf" && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSplitMode("range")}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                        splitMode === "range"
                          ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600"
                      }`}
                    >
                      Split by Page Ranges
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode("extract")}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                        splitMode === "extract"
                          ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600"
                      }`}
                    >
                      Extract Selected Pages
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Enter Page Ranges (e.g. 1-2, 3):
                    </label>
                    <input
                      type="text"
                      value={splitRange}
                      onChange={(e) => setSplitRange(e.target.value)}
                      className="w-full max-w-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* ORGANIZE PDF VISUAL PAGE GRID */}
              {tool.id === "organize-pdf" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Reorder, delete, or rotate pages before generating your organized PDF:
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2">
                    {pageList.map((pageNum, idx) => (
                      <div
                        key={pageNum}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-center space-y-2 relative group"
                      >
                        <div
                          className="h-24 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shadow-2xs transition-transform"
                          style={{
                            transform: `rotate(${pageRotations[pageNum] || 0}deg)`,
                          }}
                        >
                          Page {pageNum}
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setPageRotations((prev) => ({
                                ...prev,
                                [pageNum]: ((prev[pageNum] || 0) + 90) % 360,
                              }))
                            }
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]"
                            title="Rotate Page"
                          >
                            ↻ 90°
                          </button>
                          <button
                            type="button"
                            onClick={() => setPageList((prev) => prev.filter((p) => p !== pageNum))}
                            className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 text-[10px]"
                            title="Delete Page"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ROTATE OPTIONS */}
              {tool.id === "rotate-pdf" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rotation Degree:
                    </label>
                    <div className="flex gap-2">
                      {[90, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => setRotateAngle(deg)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                            rotateAngle === deg
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {deg}° Clockwise
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Apply Rotation To:
                    </label>
                    <select
                      value={rotateTarget}
                      onChange={(e) => setRotateTarget(e.target.value as any)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                    >
                      <option value="all">All Pages</option>
                      <option value="odd">Odd Pages Only</option>
                      <option value="even">Even Pages Only</option>
                    </select>
                  </div>
                </div>
              )}

              {/* COMPRESS OPTIONS */}
              {tool.id === "compress-pdf" && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Compression Level:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "low", title: "Low Compression", desc: "High quality, less reduction (~18%)" },
                      { id: "recommended", title: "Recommended", desc: "Good quality, balanced reduction (~38%)" },
                      { id: "high", title: "High Compression", desc: "Smallest size, lower quality (~58%)" },
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setCompressTier(tier.id as any)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          compressTier === tier.id
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{tier.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{tier.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* WATERMARK OPTIONS */}
              {tool.id === "watermark-pdf" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Watermark Text:
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Opacity: {Math.round(watermarkOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Angle: {watermarkAngle}°
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="15"
                      value={watermarkAngle}
                      onChange={(e) => setWatermarkAngle(parseInt(e.target.value, 10))}
                      className="w-full mt-2"
                    />
                  </div>
                </div>
              )}

              {/* SIGN PDF OPTIONS */}
              {tool.id === "sign-pdf" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {signatureDataUrl ? "Signature Created & Ready to Stamp" : "No signature created yet"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Select placement coordinates and target page below.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSignatureModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      {signatureDataUrl ? "Change Signature" : "Create Signature"}
                    </button>
                  </div>
                  {signatureDataUrl && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center h-20">
                      <img src={signatureDataUrl} alt="Signature Preview" className="max-h-16 object-contain" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Placement Position:
                      </label>
                      <select
                        value={signaturePlacement}
                        onChange={(e) => setSignaturePlacement(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                      >
                        <option value="bottom-right">Bottom-Right (Standard Signoff)</option>
                        <option value="bottom-left">Bottom-Left (Initial / Date)</option>
                        <option value="bottom-center">Bottom-Center</option>
                        <option value="top-right">Top-Right (Header Stamp)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Apply to Page:
                      </label>
                      <select
                        value={signaturePageNum}
                        onChange={(e) => setSignaturePageNum(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                      >
                        {Array.from({ length: files[0]?.pageCount || 1 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Page {i + 1} {i + 1 === (files[0]?.pageCount || 1) ? "(Last Page)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* PROTECT PDF OPTIONS */}
              {tool.id === "protect-pdf" && (
                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Encryption Password:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Choose a strong password"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Re-enter password to confirm"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    Protected using AES-256 standard encryption. Passwords are never logged or stored.
                  </p>
                </div>
              )}

              {/* UNLOCK PDF OPTIONS */}
              {tool.id === "unlock-pdf" && (
                <div className="space-y-2 max-w-sm">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enter Current Document Password:
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter document password"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    The document will be verified, decrypted in-memory, and returned with password security removed.
                  </p>
                </div>
              )}

              {/* TRANSLATE OPTIONS */}
              {tool.id === "translate-pdf" && (
                <div className="flex items-center gap-3">
                  <Languages className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Translate to:
                  </label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                    <option value="Chinese">Chinese (Mandarin)</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>
              )}

              {/* OCR LANGUAGE OPTIONS */}
              {tool.id === "ocr-pdf" && (
                <div className="flex items-center gap-3">
                  <ScanText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Document Language Focus:
                  </label>
                  <select
                    value={ocrLang}
                    onChange={(e) => setOcrLang(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="English">English (Latin)</option>
                    <option value="Multilingual">Auto-detect Multilingual</option>
                    <option value="Hindi">Hindi / Devanagari</option>
                    <option value="Spanish">Spanish / European</option>
                    <option value="Japanese">Japanese / Kanji</option>
                  </select>
                </div>
              )}

              {/* REDACT PDF OPTIONS */}
              {tool.id === "redact-pdf" && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sensitive keywords or patterns to permanently black out (comma-separated):
                  </label>
                  <input
                    type="text"
                    value={redactKeywords}
                    onChange={(e) => setRedactKeywords(e.target.value)}
                    placeholder="e.g. confidential, secret, private, ssn, payment"
                    className="w-full max-w-lg px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    Found keywords are physically overwritten by solid black boxes in a rasterized canvas layer to guarantee underlying text streams are completely destroyed.
                  </p>
                </div>
              )}

              {/* CROP PDF OPTIONS */}
              {tool.id === "crop-pdf" && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Crop Margin Inset: {cropMargin} points
                  </label>
                  <div className="flex items-center gap-3">
                    {[10, 25, 40, 60, 80].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setCropMargin(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                          cropMargin === m
                            ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-indigo-300"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {m} pt
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Adjusts CropBox and MediaBox coordinates symmetrically to trim document margins.
                  </p>
                </div>
              )}

              {/* EDIT PDF OPTIONS */}
              {tool.id === "edit-pdf" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Annotation Style:
                      </label>
                      <select
                        value={editAnnotationType}
                        onChange={(e) => setEditAnnotationType(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                      >
                        <option value="text">Certified Text Overlay</option>
                        <option value="highlight">Highlight & Note</option>
                        <option value="stamp">Document Stamp</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Position:
                      </label>
                      <select
                        value={editAnnotationPosition}
                        onChange={(e) => setEditAnnotationPosition(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                      >
                        <option value="header">Top Header Callout</option>
                        <option value="stamp">Center Page Stamp</option>
                        <option value="footer">Bottom Footer Annotation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Font Size:
                      </label>
                      <select
                        value={editAnnotationFontSize}
                        onChange={(e) => setEditAnnotationFontSize(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                      >
                        <option value={12}>12 pt (Small footnote)</option>
                        <option value={16}>16 pt (Standard note)</option>
                        <option value={22}>22 pt (Prominent header)</option>
                        <option value={28}>28 pt (Bold stamp)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Annotation Content:
                    </label>
                    <input
                      type="text"
                      value={editAnnotationText}
                      onChange={(e) => setEditAnnotationText(e.target.value)}
                      placeholder="e.g. CERTIFIED & APPROVED"
                      className="w-full max-w-lg px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500 font-medium">Ink Color:</span>
                    {[
                      { name: "Indigo", hex: "#4f46e5" },
                      { name: "Red", hex: "#dc2626" },
                      { name: "Emerald", hex: "#059669" },
                      { name: "Dark Slate", hex: "#1e293b" },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setEditAnnotationColor(c.hex)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          editAnnotationColor === c.hex
                            ? "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF FORM FILLING OPTIONS */}
              {tool.id === "pdf-form" && (
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    AcroForm Interactive Fields ({formFields.length} detected):
                  </h5>
                  {formFields.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl">
                      {formFields.map((field, idx) => (
                        <div key={field.name} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                          <label className="block text-[11px] font-mono text-slate-500 mb-1 truncate" title={field.name}>
                            {field.name}
                          </label>
                          {field.type.includes("CheckBox") ? (
                            <label className="flex items-center gap-2 text-xs font-semibold">
                              <input
                                type="checkbox"
                                checked={Boolean(field.value)}
                                onChange={(e) => {
                                  const updated = [...formFields];
                                  updated[idx] = { ...field, value: e.target.checked };
                                  setFormFields(updated);
                                }}
                                className="rounded text-indigo-600"
                              />
                              <span>Check</span>
                            </label>
                          ) : (
                            <input
                              type="text"
                              value={String(field.value || "")}
                              onChange={(e) => {
                                const updated = [...formFields];
                                updated[idx] = { ...field, value: e.target.value };
                                setFormFields(updated);
                              }}
                              placeholder="Enter value"
                              className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No interactive form fields detected in this document. Processing will inspect and rebuild the PDF stream.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PRIMARY EXECUTE ACTION BUTTON */}
          <div className="flex justify-end pt-4">
            <button
              id="execute-tool-button"
              type="button"
              disabled={files.length === 0 && tool.id !== "html-to-pdf"}
              onClick={executeToolOperation}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 text-white font-bold text-base shadow-lg shadow-indigo-600/25 active:scale-95 transition-all"
            >
              <span>{tool.name}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: Processing Progress State */}
      {(processing.status === "uploading" || processing.status === "processing") && (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
            <Sparkles className="w-10 h-10 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {processing.message}
            </h3>
            <p className="text-xs text-slate-400">
              Engineered with secure in-memory processing. Please do not close this window.
            </p>
          </div>

          {/* Animated Progress Bar */}
          <div className="max-w-md mx-auto w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${processing.progress}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {processing.progress}% Completed
          </span>
        </div>
      )}

      {/* STAGE 3: Success State */}
      {processing.status === "success" && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-8 animate-in zoom-in-95">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {processing.resultFileName?.endsWith(".docx")
                ? "Your Word Document is ready!"
                : processing.resultFileName?.endsWith(".xlsx")
                ? "Your Excel Spreadsheet is ready!"
                : processing.resultFileName?.endsWith(".pptx")
                ? "Your PowerPoint Presentation is ready!"
                : processing.resultFileName?.endsWith(".zip")
                ? "Your Image Archive (ZIP) is ready!"
                : processing.resultFileName?.endsWith(".jpg")
                ? "Your JPG Image is ready!"
                : processing.resultFileName?.endsWith(".png")
                ? "Your PNG Image is ready!"
                : processing.resultFileName?.endsWith(".md")
                ? "Your Markdown Document is ready!"
                : "Your Document is ready!"}
            </h3>
            <p className="text-xs text-slate-400">
              Output file: <strong className="text-slate-700 dark:text-slate-300">{processing.resultFileName}</strong>
            </p>

            {/* REAL COMPRESSION METRICS DISPLAY */}
            {tool.id === "compress-pdf" && processing.resultMeta && (
              <div className="mt-2 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 max-w-sm w-full text-center space-y-1">
                <span className="text-emerald-700 dark:text-emerald-300 font-bold text-sm block">
                  Saved {processing.resultMeta.ratio}% File Size
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(processing.resultMeta.originalSize / 1024).toFixed(1)} KB → {(processing.resultMeta.outputSize / 1024).toFixed(1)} KB
                </p>
              </div>
            )}
          </div>

          {/* AI SUMMARY OUTPUT DISPLAY */}
          {aiSummaryOutput && (
            <div className="p-6 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-4 text-left text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-purple-900/40">
                <span className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" /> AI Executive Summary
                </span>
                <button
                  onClick={() => handleCopyText(aiSummaryOutput.detailedSummary)}
                  className="hover:underline text-purple-600 flex items-center gap-1 font-semibold"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy
                </button>
              </div>

              <div>
                <strong className="text-slate-900 dark:text-slate-100 block mb-1">Overview:</strong>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{aiSummaryOutput.shortSummary}</p>
              </div>

              <div>
                <strong className="text-slate-900 dark:text-slate-100 block mb-1">Key Takeaways:</strong>
                <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                  {aiSummaryOutput.keyPoints.map((kp, idx) => (
                    <li key={idx}>{kp}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* OCR TEXT OUTPUT DISPLAY */}
          {ocrExtractedText && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ScanText className="w-4 h-4 text-indigo-600" /> Extracted OCR Text:
                </span>
                <button
                  onClick={() => handleCopyText(ocrExtractedText)}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy Text
                </button>
              </div>
              <pre className="text-xs font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto">
                {ocrExtractedText}
              </pre>
            </div>
          )}

          {/* COMPARE RESULTS DISPLAY */}
          {compareResult && (
            <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 text-left space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Document Comparison Matrix:</h4>
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl">
                  <span className="text-slate-400">Doc 1 Pages:</span> <strong>{compareResult.pageCount1}</strong>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl">
                  <span className="text-slate-400">Doc 2 Pages:</span> <strong>{compareResult.pageCount2}</strong>
                </div>
              </div>
              <div className="space-y-2">
                {compareResult.differences.map((diff: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0"></span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{diff.title}: </span>
                      <span className="text-slate-600 dark:text-slate-400">{diff.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS: Download, Preview, Start Over */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              id="download-processed-pdf-button"
              type="button"
              onClick={handleDownloadResult}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>

            {processing.resultBlob && (
              <button
                type="button"
                onClick={() => setPreviewFile(processing.resultBlob!)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Output</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleStartOver}
              className="flex items-center gap-1.5 px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start Over</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: Error State */}
      {processing.status === "error" && (
        <div className="p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200">
              Processing Error
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">
              {processing.message}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setProcessing({ status: "idle", progress: 0, message: "" })}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 transition-colors"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={handleStartOver}
              className="px-5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onConfirmSignature={(dataUrl) => {
          setSignatureDataUrl(dataUrl);
        }}
      />

      {/* Fullscreen PDF Viewer Modal */}
      {previewFile && (
        <PDFViewer
          fileOrBlob={previewFile}
          fileName={files[0]?.name || "Preview.pdf"}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};
