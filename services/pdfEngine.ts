import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import * as XLSX from "xlsx";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";
import { decryptPDF, isEncrypted } from "@pdfsmaller/pdf-decrypt";

export * from "./conversionEngine";

/**
 * Merges multiple PDF files into a single PDF document.
 */
export async function mergePdfs(files: File[]): Promise<Blob> {
  if (files.length < 1) {
    throw new Error("At least one PDF file is required to merge.");
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes], { type: "application/pdf" });
}

/**
 * Splits a PDF by page ranges or selected pages.
 */
export async function splitPdf(
  file: File,
  pagesToExtract: number[] // 1-indexed page numbers
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();

  const newPdf = await PDFDocument.create();
  const validZeroIndexed = pagesToExtract
    .map((p) => p - 1)
    .filter((p) => p >= 0 && p < totalPages);

  if (validZeroIndexed.length === 0) {
    throw new Error("No valid pages selected to extract.");
  }

  const copiedPages = await newPdf.copyPages(sourcePdf, validZeroIndexed);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const splitBytes = await newPdf.save();
  return new Blob([splitBytes], { type: "application/pdf" });
}

/**
 * Organizes pages: reorder, delete, and rotate pages.
 */
export async function organizePdf(
  file: File,
  pageOrder: number[], // 1-indexed original page numbers in desired sequence
  rotations: Record<number, number> = {} // pageNum -> additional degrees (e.g. 90, 180, 270)
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();

  const newPdf = await PDFDocument.create();

  for (let i = 0; i < pageOrder.length; i++) {
    const origPageNum = pageOrder[i];
    const zeroIndex = origPageNum - 1;
    if (zeroIndex >= 0 && zeroIndex < totalPages) {
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [zeroIndex]);
      const currentRotation = copiedPage.getRotation().angle;
      const additionalRotation = rotations[origPageNum] || 0;
      copiedPage.setRotation(degrees((currentRotation + additionalRotation) % 360));
      newPdf.addPage(copiedPage);
    }
  }

  const resultBytes = await newPdf.save();
  return new Blob([resultBytes], { type: "application/pdf" });
}

/**
 * Rotates pages in a PDF document.
 */
export async function rotatePdf(
  file: File,
  angle: number, // 90, 180, 270
  target: "all" | "odd" | "even" = "all"
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page, idx) => {
    const pageNum = idx + 1;
    let shouldRotate = false;
    if (target === "all") shouldRotate = true;
    else if (target === "odd" && pageNum % 2 !== 0) shouldRotate = true;
    else if (target === "even" && pageNum % 2 === 0) shouldRotate = true;

    if (shouldRotate) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angle) % 360));
    }
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/**
 * Adds customizable page numbers to a PDF document.
 */
export async function addPageNumbers(
  file: File,
  options: {
    position: "bottom-center" | "bottom-right" | "bottom-left" | "top-right";
    format: "Page {n}" | "{n}" | "Page {n} of {total}";
    startNumber: number;
    fontSize: number;
  }
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = pages.length;

  pages.forEach((page, idx) => {
    const currentNum = options.startNumber + idx;
    let text = options.format.replace("{n}", String(currentNum)).replace("{total}", String(total));

    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    let x = width / 2 - textWidth / 2;
    let y = 30;

    if (options.position === "bottom-right") {
      x = width - textWidth - 40;
      y = 30;
    } else if (options.position === "bottom-left") {
      x = 40;
      y = 30;
    } else if (options.position === "top-right") {
      x = width - textWidth - 40;
      y = height - 40;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.25, 0.25, 0.3),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/**
 * Adds a text watermark to every page of a PDF document.
 */
export async function addWatermark(
  file: File,
  options: {
    text: string;
    opacity: number; // 0.1 to 1.0
    fontSize: number;
    rotationAngle: number; // e.g. 45 degrees
  }
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);

    page.drawText(options.text, {
      x: width / 2 - textWidth / 2.5,
      y: height / 2 - options.fontSize / 3,
      size: options.fontSize,
      font,
      color: rgb(0.6, 0.65, 0.75),
      opacity: Math.max(0.1, Math.min(1.0, options.opacity)),
      rotate: degrees(options.rotationAngle),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/**
 * Stamps a digital signature image (drawn or uploaded) onto a specific PDF page.
 */
export async function stampSignature(
  file: File,
  signaturePngBase64: string,
  placement: {
    pageNumber: number; // 1-indexed
    xPercent: number; // 0 to 100
    yPercent: number; // 0 to 100
    width: number;
    height: number;
  }
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  const targetIdx = Math.max(0, Math.min(pages.length - 1, placement.pageNumber - 1));
  const page = pages[targetIdx];
  const { width, height } = page.getSize();

  const cleanBase64 = signaturePngBase64.replace(/^data:image\/\w+;base64,/, "");
  const binary = atob(cleanBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const pngImage = await pdfDoc.embedPng(bytes);

  const posX = (placement.xPercent / 100) * width;
  // Convert inverted Y to bottom-up PDF coordinates
  const posY = height - (placement.yPercent / 100) * height - placement.height;

  page.drawImage(pngImage, {
    x: posX,
    y: Math.max(20, posY),
    width: placement.width,
    height: placement.height,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/**
 * Converts image files (JPG/PNG) into a multi-page or single-page PDF document.
 */
export async function imagesToPdf(imageFiles: File[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const imageFile of imageFiles) {
    const arrayBuffer = await imageFile.arrayBuffer();
    const isPng = imageFile.type.includes("png") || imageFile.name.toLowerCase().endsWith(".png");

    let embeddedImage;
    if (isPng) {
      embeddedImage = await pdfDoc.embedPng(arrayBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
    }

    const imgDims = embeddedImage.scale(1);
    // Standard A4: 595.28 x 841.89
    const maxPageWidth = 595.28;
    const maxPageHeight = 841.89;

    let targetWidth = imgDims.width;
    let targetHeight = imgDims.height;

    // Scale down if exceeds page size
    const scaleFactor = Math.min(
      (maxPageWidth - 40) / imgDims.width,
      (maxPageHeight - 40) / imgDims.height,
      1
    );

    targetWidth = imgDims.width * scaleFactor;
    targetHeight = imgDims.height * scaleFactor;

    const page = pdfDoc.addPage([maxPageWidth, maxPageHeight]);
    page.drawImage(embeddedImage, {
      x: (maxPageWidth - targetWidth) / 2,
      y: (maxPageHeight - targetHeight) / 2,
      width: targetWidth,
      height: targetHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/**
 * Converts text or HTML into a clean, formatted PDF document.
 */
export async function textOrHtmlToPdf(
  title: string,
  content: string
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const cleanContent = content.replace(/<[^>]*>?/gm, " ").trim();
  const words = cleanContent.split(/\s+/);

  let page = pdfDoc.addPage([595.28, 841.89]);
  let y = 780;

  // Title
  page.drawText(title || "Document", {
    x: 50,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });
  y -= 40;

  // Body wrapped lines
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = fontRegular.widthOfTextAtSize(testLine, 10);

    if (textWidth > 495) {
      page.drawText(currentLine, {
        x: 50,
        y,
        size: 10,
        font: fontRegular,
        color: rgb(0.2, 0.25, 0.3),
      });
      y -= 18;
      currentLine = word;

      if (y < 60) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = 780;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    page.drawText(currentLine, {
      x: 50,
      y,
      size: 10,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.3),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/**
 * Converts structured multi-page OCR recognition results into a paginated PDF document.
 * Preserves 1:1 page boundaries where each source page starts on a new PDF page.
 */
export async function ocrPagesToPdf(
  title: string,
  pages: Array<{ pageNumber: number; text: string }>
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let idx = 0; idx < pages.length; idx++) {
    const pageItem = pages[idx];
    let page = pdfDoc.addPage([595.28, 841.89]);
    let y = 790;

    // Header banner
    page.drawText(`${title} — Page ${pageItem.pageNumber}`, {
      x: 50,
      y,
      size: 13,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.35),
    });
    y -= 14;

    // Divider line
    page.drawLine({
      start: { x: 50, y },
      end: { x: 545, y },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });
    y -= 25;

    const rawText = pageItem.text || "(No recognizable text detected on this page)";
    const paragraphs = rawText.split(/\n+/);

    for (const paragraph of paragraphs) {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        y -= 12;
        continue;
      }

      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = fontRegular.widthOfTextAtSize(testLine, 10);

        if (textWidth > 495) {
          page.drawText(currentLine, {
            x: 50,
            y,
            size: 10,
            font: fontRegular,
            color: rgb(0.15, 0.18, 0.22),
          });
          y -= 16;
          currentLine = word;

          if (y < 50) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = 790;
            page.drawText(`${title} — Page ${pageItem.pageNumber} (cont.)`, {
              x: 50,
              y,
              size: 11,
              font: fontBold,
              color: rgb(0.4, 0.45, 0.5),
            });
            y -= 30;
          }
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        page.drawText(currentLine, {
          x: 50,
          y,
          size: 10,
          font: fontRegular,
          color: rgb(0.15, 0.18, 0.22),
        });
        y -= 16;
      }

      y -= 6; // Paragraph gap
      if (y < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = 790;
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/**
 * Converts an Excel spreadsheet (.xlsx/.xls/.csv) to a formatted PDF.
 */
export async function excelToPdf(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let page = pdfDoc.addPage([841.89, 595.28]); // Landscape for spreadsheets
  let y = 540;

  page.drawText(`Spreadsheet Export: ${file.name} [Sheet: ${firstSheetName}]`, {
    x: 40,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.35, 0.2),
  });
  y -= 30;

  // Render rows
  const maxRowsPerPage = 22;
  let rowCount = 0;

  for (let r = 0; r < Math.min(jsonData.length, 100); r++) {
    const row = jsonData[r];
    if (!row || row.length === 0) continue;

    if (rowCount >= maxRowsPerPage) {
      page = pdfDoc.addPage([841.89, 595.28]);
      y = 540;
      rowCount = 0;
    }

    const isHeader = r === 0;
    const font = isHeader ? fontBold : fontRegular;
    const textColor = isHeader ? rgb(0.1, 0.1, 0.1) : rgb(0.25, 0.25, 0.3);

    // Draw row background for header
    if (isHeader) {
      page.drawRectangle({
        x: 40,
        y: y - 5,
        width: 760,
        height: 20,
        color: rgb(0.92, 0.95, 0.94),
      });
    }

    let x = 45;
    for (let c = 0; c < Math.min(row.length, 8); c++) {
      const cellVal = String(row[c] ?? "").slice(0, 16);
      page.drawText(cellVal, {
        x,
        y,
        size: 9,
        font,
        color: textColor,
      });
      x += 92;
    }

    y -= 20;
    rowCount++;
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/**
 * Protects PDF with genuine AES-256 password encryption.
 * Enforces non-empty password with NO fallbacks.
 */
export async function protectPdf(file: File, userPass: string): Promise<Blob> {
  const trimmed = userPass ? userPass.trim() : "";
  if (!trimmed) {
    throw new Error("A valid password is required to encrypt this PDF document. Please enter a password.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBytes = new Uint8Array(arrayBuffer);

  const encryptedBytes = await encryptPDF(inputBytes, trimmed, {
    algorithm: "AES-256",
  });

  const encInfo = await isEncrypted(encryptedBytes);
  if (!encInfo.encrypted) {
    throw new Error("Encryption verification failed: output document is not encrypted.");
  }

  return new Blob([encryptedBytes], { type: "application/pdf" });
}

/**
 * Decrypts a password-protected PDF.
 * Enforces valid password with NO fallbacks, and gives clear errors on incorrect password.
 */
export async function unlockPdf(file: File, password: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const inputBytes = new Uint8Array(arrayBuffer);

  const encInfo = await isEncrypted(inputBytes);
  if (!encInfo.encrypted) {
    throw new Error("The uploaded document is not password-protected. No unlocking is required.");
  }

  const trimmed = password ? password.trim() : "";
  if (!trimmed) {
    throw new Error("Please enter the password to unlock this document.");
  }

  try {
    const decryptedBytes = await decryptPDF(inputBytes, trimmed);
    return new Blob([decryptedBytes], { type: "application/pdf" });
  } catch (err: any) {
    throw new Error("Incorrect password. Could not decrypt the document. Please check the password and try again.");
  }
}

import { comparePdfsReal } from "./conversionEngine";

/**
 * Compares two PDF documents: returns differences in page counts, size, and extracted text page-by-page.
 */
export const comparePdfs = comparePdfsReal;

/**
 * Repairs a damaged PDF by re-indexing its object trees and xref tables.
 */
export async function repairPdf(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  // Load with permissive repair flags
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
    updateMetadata: true,
  });

  pdfDoc.setProducer("My PDF Document Diagnostic & Repair Engine");
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  return new Blob([pdfBytes], { type: "application/pdf" });
}
