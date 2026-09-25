import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as XLSX from "xlsx";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";
import mammoth from "mammoth";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";
import { decryptPDF, isEncrypted } from "@pdfsmaller/pdf-decrypt";
import * as pdfjsLib from "pdfjs-dist";

// Initialize pdfjs-dist worker safely for browser environment
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Helper: renders a specific PDF page to an HTML Canvas element.
 */
export async function renderPdfPageToCanvas(
  pdfDoc: any,
  pageNumber: number,
  scale = 1.5
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas context");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { canvas, width: viewport.width, height: viewport.height };
}

/**
 * Helper: renders a PDF page or image directly to a base64 PNG image string.
 * Used for AI OCR and live visual inspection.
 */
export async function renderPageToImageBase64(
  file: File | Blob,
  pageNumber = 1,
  scale = 2.0
): Promise<string> {
  const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test((file as File).name || "");
  if (isImage) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false,
    useWorkerFetch: false,
  });
  const pdfDoc = await loadingTask.promise;
  const targetPage = Math.max(1, Math.min(pdfDoc.numPages, pageNumber));
  const { canvas } = await renderPdfPageToCanvas(pdfDoc, targetPage, scale);
  return canvas.toDataURL("image/png");
}

/**
 * Robust helper: extracts structured text, positions, and lines from any PDF.
 */
export async function extractPdfStructure(file: File | Blob): Promise<{
  numPages: number;
  pages: Array<{
    pageNumber: number;
    lines: Array<{
      text: string;
      y: number;
      fontSize: number;
      isBold: boolean;
      items: Array<{ str: string; x: number; y: number; fontSize: number }>;
    }>;
    rawText: string;
  }>;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false,
    useWorkerFetch: false,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const rawItems: Array<{ str: string; x: number; y: number; fontSize: number; fontName: string }> = [];

    for (const item of content.items as any[]) {
      if (!item.str || item.str.trim() === "") continue;
      const x = item.transform ? item.transform[4] : 0;
      const y = item.transform ? item.transform[5] : 0;
      const fontSize = item.transform ? Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12 : 12;
      const fontName = item.fontName || "";
      rawItems.push({ str: item.str, x, y, fontSize, fontName });
    }

    // Cluster items into lines by Y coordinate (items within 4 points vertically belong to same line)
    // PDF coordinate Y goes from bottom to top
    const lineBuckets: Array<{
      y: number;
      items: Array<{ str: string; x: number; y: number; fontSize: number; fontName: string }>;
    }> = [];

    for (const item of rawItems) {
      const match = lineBuckets.find((b) => Math.abs(b.y - item.y) <= 4);
      if (match) {
        match.items.push(item);
      } else {
        lineBuckets.push({ y: item.y, items: [item] });
      }
    }

    // Sort lines from top to bottom (descending Y)
    lineBuckets.sort((a, b) => b.y - a.y);

    const formattedLines = lineBuckets.map((bucket) => {
      // Sort items within line from left to right (ascending X)
      bucket.items.sort((a, b) => a.x - b.x);

      const text = bucket.items.map((it) => it.str).join(" ").trim();
      const avgFontSize =
        bucket.items.reduce((acc, curr) => acc + curr.fontSize, 0) / (bucket.items.length || 1);
      const isBold = bucket.items.some(
        (it) => it.fontName.toLowerCase().includes("bold") || it.fontName.toLowerCase().includes("black")
      );

      return {
        text,
        y: bucket.y,
        fontSize: Math.round(avgFontSize),
        isBold,
        items: bucket.items.map((it) => ({ str: it.str, x: it.x, y: it.y, fontSize: it.fontSize })),
      };
    });

    const rawText = formattedLines.map((l) => l.text).join("\n");
    pages.push({
      pageNumber: i,
      lines: formattedLines,
      rawText,
    });
  }

  return { numPages, pages };
}

/**
 * 1. PDF TO WORD (.docx)
 * Extracts text, headings, lists, tables, and paragraphs to generate a valid Microsoft Word (.docx) file.
 */
export async function convertPdfToWord(file: File): Promise<{ blob: Blob; fileName: string }> {
  const structure = await extractPdfStructure(file);
  const docxChildren: (Paragraph | Table)[] = [];

  const baseTitle = file.name.replace(/\.[^/.]+$/, "");

  // Document Title
  docxChildren.push(
    new Paragraph({
      text: baseTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 240 },
    })
  );

  for (let pageIdx = 0; pageIdx < structure.pages.length; pageIdx++) {
    const page = structure.pages[pageIdx];
    const isFirstPage = pageIdx === 0;

    let lineIndex = 0;
    while (lineIndex < page.lines.length) {
      const line = page.lines[lineIndex];
      if (!line.text) {
        lineIndex++;
        continue;
      }

      // Check if current and upcoming lines form a table (multiple columns with aligned item gaps)
      const tableLines: typeof page.lines = [];
      let checkIdx = lineIndex;
      while (checkIdx < page.lines.length) {
        const cl = page.lines[checkIdx];
        if (cl.items.length >= 2) {
          // Check for horizontal gap > 20 points
          let hasGap = false;
          for (let k = 0; k < cl.items.length - 1; k++) {
            if (cl.items[k + 1].x - cl.items[k].x > 25) {
              hasGap = true;
              break;
            }
          }
          if (hasGap) {
            tableLines.push(cl);
            checkIdx++;
            continue;
          }
        }
        break;
      }

      // If at least 2 consecutive multi-column lines detected, format as Word Table
      if (tableLines.length >= 2) {
        const rows: TableRow[] = tableLines.map((tLine, rIdx) => {
          // Group items into cells
          const cellsText: string[] = [];
          let currentCell = "";
          let lastX = -1;
          for (const item of tLine.items) {
            if (lastX >= 0 && item.x - lastX > 30) {
              cellsText.push(currentCell.trim());
              currentCell = item.str;
            } else {
              currentCell = currentCell ? `${currentCell} ${item.str}` : item.str;
            }
            lastX = item.x;
          }
          if (currentCell.trim()) cellsText.push(currentCell.trim());

          return new TableRow({
            children: cellsText.map(
              (ct) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: ct,
                          bold: rIdx === 0,
                          size: 20,
                        }),
                      ],
                    }),
                  ],
                  width: { size: 100 / Math.max(1, cellsText.length), type: WidthType.PERCENTAGE },
                })
            ),
          });
        });

        docxChildren.push(
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
        docxChildren.push(new Paragraph({ text: "", spacing: { after: 120 } }));

        lineIndex = checkIdx;
        continue;
      }

      // Heading detection
      if (line.fontSize >= 16) {
        docxChildren.push(
          new Paragraph({
            text: line.text,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
            pageBreakBefore: !isFirstPage && lineIndex === 0,
          })
        );
        lineIndex++;
      } else if (line.fontSize >= 13 && line.isBold) {
        docxChildren.push(
          new Paragraph({
            text: line.text,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 160, after: 80 },
            pageBreakBefore: !isFirstPage && lineIndex === 0,
          })
        );
        lineIndex++;
      } else if (/^[•\-\*]\s+/.test(line.text) || /^\d+[\.\)]\s+/.test(line.text)) {
        // Bullet or numbered list
        docxChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.text.replace(/^[•\-\*]\s+/, ""),
                size: 22, // 11pt
              }),
            ],
            bullet: { level: 0 },
            spacing: { after: 60 },
            pageBreakBefore: !isFirstPage && lineIndex === 0,
          })
        );
        lineIndex++;
      } else {
        // Flowing paragraph: combine consecutive lines that belong to the same paragraph
        let paragraphText = line.text;
        let isParagraphBold = line.isBold;
        let nextIdx = lineIndex + 1;

        while (nextIdx < page.lines.length) {
          const nextLine = page.lines[nextIdx];
          // Stop combining if next line is heading, list item, or has significant vertical gap
          if (
            nextLine.fontSize >= 13 ||
            /^[•\-\*]\s+/.test(nextLine.text) ||
            /^\d+[\.\)]\s+/.test(nextLine.text) ||
            Math.abs(line.y - nextLine.y) > 30 ||
            paragraphText.endsWith(".") ||
            paragraphText.endsWith(":")
          ) {
            break;
          }
          paragraphText += ` ${nextLine.text}`;
          nextIdx++;
        }

        docxChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraphText,
                bold: isParagraphBold,
                size: 22, // 11pt
              }),
            ],
            spacing: { after: 120, line: 276 },
            pageBreakBefore: !isFirstPage && lineIndex === 0,
          })
        );

        lineIndex = nextIdx;
      }
    }
  }

  // If no text was extracted (e.g. scanned PDF)
  if (docxChildren.length <= 1) {
    docxChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Notice: This document contains scanned bitmaps without selectable text streams. Use the AI OCR tool to extract editable text.",
            italics: true,
            color: "666666",
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docxChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${baseTitle}.docx`;

  return { blob, fileName };
}

/**
 * 2. WORD TO PDF (.pdf)
 * Parses DOCX using Mammoth to HTML, preserving headings, lists, tables, and paragraphs across paginated PDF pages.
 */
export async function convertWordToPdf(file: File): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const baseTitle = file.name.replace(/\.[^/.]+$/, "");

  let htmlContent = "";
  let rawLines: string[] = [];

  try {
    const res = await mammoth.convertToHtml({ arrayBuffer });
    htmlContent = res.value || "";
  } catch {
    const textDecoder = new TextDecoder("utf-8");
    const text = textDecoder.decode(arrayBuffer);
    rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  }

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let pageCount = 1;

  const checkNewPage = (neededHeight: number) => {
    if (y - neededHeight < margin + 40) {
      // Draw footer on current page
      page.drawText(`Page ${pageCount}`, {
        x: pageWidth / 2 - 20,
        y: 25,
        size: 9,
        font: fontRegular,
        color: rgb(0.5, 0.55, 0.6),
      });

      page = pdfDoc.addPage([pageWidth, pageHeight]);
      pageCount++;
      y = pageHeight - margin;
    }
  };

  // Header Title
  page.drawText(baseTitle, {
    x: margin,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.12, 0.15, 0.22),
  });
  y -= 30;

  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });
  y -= 25;

  if (htmlContent && typeof window !== "undefined" && window.DOMParser) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    const renderNode = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();

        if (tag === "h1" || tag === "h2" || tag === "h3") {
          const size = tag === "h1" ? 15 : tag === "h2" ? 13 : 11;
          const text = el.textContent?.trim() || "";
          if (text) {
            checkNewPage(size + 20);
            page.drawText(text, {
              x: margin,
              y,
              size,
              font: fontBold,
              color: rgb(0.12, 0.18, 0.28),
            });
            y -= size + 16;
          }
        } else if (tag === "ul" || tag === "ol") {
          const items = Array.from(el.querySelectorAll("li"));
          items.forEach((li, idx) => {
            const liText = li.textContent?.trim() || "";
            if (liText) {
              checkNewPage(24);
              const prefix = tag === "ol" ? `${idx + 1}. ` : "• ";
              page.drawText(prefix, {
                x: margin + 10,
                y,
                size: 10,
                font: fontBold,
                color: rgb(0.2, 0.25, 0.35),
              });
              page.drawText(liText, {
                x: margin + 25,
                y,
                size: 10,
                font: fontRegular,
                color: rgb(0.2, 0.25, 0.35),
              });
              y -= 18;
            }
          });
          y -= 8;
        } else if (tag === "table") {
          const trs = Array.from(el.querySelectorAll("tr"));
          if (trs.length > 0) {
            checkNewPage(40);
            trs.forEach((tr, rIdx) => {
              const tds = Array.from(tr.querySelectorAll("td, th"));
              if (tds.length === 0) return;

              checkNewPage(26);
              const colWidth = contentWidth / tds.length;
              const isHeader = rIdx === 0 || tr.querySelector("th") !== null;

              // Cell backgrounds for header
              if (isHeader) {
                page.drawRectangle({
                  x: margin,
                  y: y - 18,
                  width: contentWidth,
                  height: 22,
                  color: rgb(0.93, 0.95, 0.98),
                });
              }

              tds.forEach((td, cIdx) => {
                const cellText = td.textContent?.trim().slice(0, 35) || "";
                page.drawText(cellText, {
                  x: margin + cIdx * colWidth + 6,
                  y: y - 12,
                  size: 9,
                  font: isHeader ? fontBold : fontRegular,
                  color: rgb(0.15, 0.2, 0.28),
                });
              });

              // Row bottom border
              page.drawLine({
                start: { x: margin, y: y - 18 },
                end: { x: margin + contentWidth, y: y - 18 },
                thickness: 0.5,
                color: rgb(0.8, 0.85, 0.9),
              });

              y -= 22;
            });
            y -= 12;
          }
        } else if (tag === "p") {
          const text = el.textContent?.trim() || "";
          if (text) {
            const words = text.split(/\s+/);
            let currentLine = "";
            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const textWidth = fontRegular.widthOfTextAtSize(testLine, 10);
              if (textWidth > contentWidth) {
                checkNewPage(16);
                page.drawText(currentLine, {
                  x: margin,
                  y,
                  size: 10,
                  font: fontRegular,
                  color: rgb(0.2, 0.25, 0.35),
                });
                y -= 16;
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) {
              checkNewPage(16);
              page.drawText(currentLine, {
                x: margin,
                y,
                size: 10,
                font: fontRegular,
                color: rgb(0.2, 0.25, 0.35),
              });
              y -= 20;
            }
          }
        }
      }
    };

    doc.body.childNodes.forEach(renderNode);
  } else {
    // Plain text fallback
    for (const line of rawLines) {
      checkNewPage(16);
      page.drawText(line.slice(0, 95), {
        x: margin,
        y,
        size: 10,
        font: fontRegular,
        color: rgb(0.2, 0.25, 0.35),
      });
      y -= 16;
    }
  }

  // Footer on final page
  page.drawText(`Page ${pageCount}`, {
    x: pageWidth / 2 - 20,
    y: 25,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.6),
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const fileName = `${baseTitle}.pdf`;

  return { blob, fileName };
}

/**
 * 3. PDF TO EXCEL (.xlsx)
 * Strictly verifies and detects tabular data. If no structured table exists, throws an informative error.
 */
export async function convertPdfToExcel(file: File): Promise<{ blob: Blob; fileName: string }> {
  const structure = await extractPdfStructure(file);
  const wb = XLSX.utils.book_new();
  let totalTableRows = 0;

  structure.pages.forEach((page) => {
    const tableRows: string[][] = [];

    // Analyze lines on the page to find aligned multi-column rows
    const multiColLines = page.lines.filter((line) => {
      if (line.items.length < 2) return false;
      let hasGap = false;
      for (let i = 0; i < line.items.length - 1; i++) {
        if (line.items[i + 1].x - line.items[i].x > 25) {
          hasGap = true;
          break;
        }
      }
      return hasGap;
    });

    if (multiColLines.length >= 2) {
      multiColLines.forEach((line) => {
        const rowCells: string[] = [];
        let currentCell = "";
        let lastX = -1;
        for (const item of line.items) {
          if (lastX >= 0 && item.x - lastX > 30) {
            rowCells.push(currentCell.trim());
            currentCell = item.str;
          } else {
            currentCell = currentCell ? `${currentCell} ${item.str}` : item.str;
          }
          lastX = item.x;
        }
        if (currentCell.trim()) rowCells.push(currentCell.trim());
        if (rowCells.length >= 2) {
          tableRows.push(rowCells);
          totalTableRows++;
        }
      });
    }

    if (tableRows.length > 0) {
      const ws = XLSX.utils.aoa_to_sheet(tableRows);
      XLSX.utils.book_append_sheet(wb, ws, `Page ${page.pageNumber}`);
    }
  });

  if (totalTableRows < 2) {
    throw new Error(
      "No structured tables were detected in this PDF. PDF to Excel requires aligned multi-column tables (such as financial statements, invoices, or spreadsheets). For general narrative text or contracts, please use the PDF to Word tool."
    );
  }

  const wbArray = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbArray], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const baseTitle = file.name.replace(/\.[^/.]+$/, "");
  const fileName = `${baseTitle}.xlsx`;
  return { blob, fileName };
}

/**
 * 4. EXCEL TO PDF (.pdf)
 * Converts spreadsheet sheets to cleanly styled, paginated PDF tables.
 */
export async function convertExcelToPdf(file: File): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Landscape A4 for wide table layouts
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let pageCount = 1;

  const baseTitle = file.name.replace(/\.[^/.]+$/, "");

  // Document Title
  page.drawText(baseTitle, {
    x: margin,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.12, 0.15, 0.22),
  });
  y -= 25;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!data || data.length === 0) continue;

    // Sheet Name Heading
    if (y < margin + 60) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      pageCount++;
      y = pageHeight - margin;
    }

    page.drawText(`Sheet: ${sheetName}`, {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.2, 0.4, 0.8),
    });
    y -= 20;

    // Determine max columns
    let maxCols = 0;
    data.forEach((row) => {
      if (row.length > maxCols) maxCols = row.length;
    });
    maxCols = Math.max(1, Math.min(maxCols, 10)); // Cap columns to 10 for readability

    const colWidth = contentWidth / maxCols;
    const rowHeight = 20;

    for (let rIdx = 0; rIdx < data.length; rIdx++) {
      const row = data[rIdx];
      const isHeader = rIdx === 0;

      if (y < margin + 30) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        pageCount++;
        y = pageHeight - margin;
      }

      // Alternating row background
      page.drawRectangle({
        x: margin,
        y: y - rowHeight + 4,
        width: contentWidth,
        height: rowHeight,
        color: isHeader ? rgb(0.9, 0.94, 0.98) : rIdx % 2 === 0 ? rgb(0.98, 0.98, 0.99) : rgb(1, 1, 1),
      });

      // Cell texts
      for (let cIdx = 0; cIdx < maxCols; cIdx++) {
        const cellValue = row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]).trim() : "";
        const truncated = cellValue.length > 25 ? cellValue.slice(0, 22) + "..." : cellValue;

        page.drawText(truncated, {
          x: margin + cIdx * colWidth + 5,
          y: y - 10,
          size: isHeader ? 9 : 8,
          font: isHeader ? fontBold : fontRegular,
          color: isHeader ? rgb(0.1, 0.15, 0.25) : rgb(0.25, 0.28, 0.35),
        });
      }

      // Border line
      page.drawLine({
        start: { x: margin, y: y - rowHeight + 4 },
        end: { x: margin + contentWidth, y: y - rowHeight + 4 },
        thickness: 0.5,
        color: rgb(0.85, 0.88, 0.92),
      });

      y -= rowHeight;
    }

    y -= 25; // Space between sheets
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const fileName = `${baseTitle}.pdf`;

  return { blob, fileName };
}

/**
 * 5. PDF TO POWERPOINT (.pptx)
 * Slide-Image Conversion: Renders each PDF page as a high-fidelity 16:9 slide background
 * and places extracted text into presentation notes.
 */
export async function convertPdfToPowerPoint(file: File): Promise<{ blob: Blob; fileName: string }> {
  const structure = await extractPdfStructure(file);
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false,
    useWorkerFetch: false,
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  const baseTitle = file.name.replace(/\.[^/.]+$/, "");
  pptx.title = baseTitle;

  for (let i = 1; i <= numPages; i++) {
    const slide = pptx.addSlide();
    const { canvas } = await renderPdfPageToCanvas(pdfDoc, i, 2.0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    slide.addImage({
      data: dataUrl,
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
    });

    const pageText = structure.pages[i - 1]?.rawText || "";
    if (pageText) {
      slide.addNotes(pageText);
    }
  }

  const pptxBlob = (await pptx.write({ outputType: "blob" })) as Blob;
  const fileName = `${baseTitle}.pptx`;

  return { blob: pptxBlob, fileName };
}

/**
 * 6. POWERPOINT TO PDF (.pdf)
 * Extracts slide XML content from PPTX (titles, text shapes, bullets, notes)
 * and generates a clean landscape presentation PDF.
 */
export async function convertPowerPointToPdf(file: File): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml")
  );

  slideFiles.sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, "") || "0", 10);
    const numB = parseInt(b.replace(/[^0-9]/g, "") || "0", 10);
    return numA - numB;
  });

  const slidesData: Array<{ title: string; bullets: string[] }> = [];

  for (const slidePath of slideFiles) {
    const xmlContent = await zip.files[slidePath].async("string");
    const textMatches = xmlContent.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
    const strings = textMatches.map((m) => m.replace(/<[^>]+>/g, "").trim()).filter(Boolean);

    const title = strings[0] || `Slide ${slidesData.length + 1}`;
    const bullets = strings.slice(1);
    slidesData.push({ title, bullets });
  }

  if (slidesData.length === 0) {
    slidesData.push({
      title: file.name.replace(/\.[^/.]+$/, ""),
      bullets: ["Imported Presentation Slides", "Converted to Landscape PDF via My PDF Engine."],
    });
  }

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Landscape 16:9 presentation dimensions: 842 x 474 points
  const pageWidth = 842;
  const pageHeight = 474;
  const margin = 50;

  slidesData.forEach((slide, idx) => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Top banner
    page.drawRectangle({
      x: 0,
      y: pageHeight - 75,
      width: pageWidth,
      height: 75,
      color: rgb(0.12, 0.18, 0.28),
    });

    // Slide Title
    page.drawText(slide.title.slice(0, 60), {
      x: margin,
      y: pageHeight - 48,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Bullets
    let y = pageHeight - 120;
    slide.bullets.slice(0, 8).forEach((b) => {
      page.drawText("• ", {
        x: margin,
        y,
        size: 13,
        font: fontBold,
        color: rgb(0.2, 0.45, 0.85),
      });
      page.drawText(b.slice(0, 90), {
        x: margin + 20,
        y,
        size: 12,
        font: fontRegular,
        color: rgb(0.2, 0.25, 0.35),
      });
      y -= 26;
    });

    // Slide counter footer
    page.drawText(`Slide ${idx + 1} of ${slidesData.length}`, {
      x: pageWidth - margin - 80,
      y: 20,
      size: 10,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.6),
    });
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const baseTitle = file.name.replace(/\.[^/.]+$/, "");
  const fileName = `${baseTitle}.pdf`;

  return { blob, fileName };
}

/**
 * 7. PDF TO JPG (.jpg / .zip)
 * Renders each PDF page to a JPG image. Single page -> .jpg; Multiple pages -> .zip.
 */
export async function convertPdfToJpg(file: File): Promise<{ blob: Blob; fileName: string; isZip: boolean }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false,
    useWorkerFetch: false,
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const baseTitle = file.name.replace(/\.[^/.]+$/, "");

  if (numPages === 1) {
    const { canvas } = await renderPdfPageToCanvas(pdfDoc, 1, 2.0);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), "image/jpeg", 0.95);
    });
    return { blob, fileName: `${baseTitle}_page_1.jpg`, isZip: false };
  }

  const zip = new JSZip();
  for (let i = 1; i <= numPages; i++) {
    const { canvas } = await renderPdfPageToCanvas(pdfDoc, i, 2.0);
    const pageBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), "image/jpeg", 0.95);
    });
    zip.file(`${baseTitle}_page_${i}.jpg`, pageBlob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  return { blob: zipBlob, fileName: `${baseTitle}_jpg_images.zip`, isZip: true };
}

/**
 * 8. PDF TO PNG (.png / .zip)
 * Renders each PDF page to a PNG image. Single page -> .png; Multiple pages -> .zip.
 */
export async function convertPdfToPng(file: File): Promise<{ blob: Blob; fileName: string; isZip: boolean }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false,
    useWorkerFetch: false,
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const baseTitle = file.name.replace(/\.[^/.]+$/, "");

  if (numPages === 1) {
    const { canvas } = await renderPdfPageToCanvas(pdfDoc, 1, 2.0);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), "image/png");
    });
    return { blob, fileName: `${baseTitle}_page_1.png`, isZip: false };
  }

  const zip = new JSZip();
  for (let i = 1; i <= numPages; i++) {
    const { canvas } = await renderPdfPageToCanvas(pdfDoc, i, 2.0);
    const pageBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), "image/png");
    });
    zip.file(`${baseTitle}_page_${i}.png`, pageBlob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  return { blob: zipBlob, fileName: `${baseTitle}_png_images.zip`, isZip: true };
}

/**
 * 9. PDF TO MARKDOWN (.md)
 */
export async function convertPdfToMarkdown(file: File): Promise<{ blob: Blob; fileName: string }> {
  const structure = await extractPdfStructure(file);
  const baseTitle = file.name.replace(/\.[^/.]+$/, "");

  let md = `# ${baseTitle}\n\n`;

  structure.pages.forEach((page) => {
    if (structure.numPages > 1) {
      md += `\n---\n*Page ${page.pageNumber}*\n\n`;
    }

    page.lines.forEach((line) => {
      if (!line.text) return;
      if (line.fontSize >= 16) {
        md += `## ${line.text}\n\n`;
      } else if (line.fontSize >= 13 && line.isBold) {
        md += `### ${line.text}\n\n`;
      } else if (/^[•\-\*]\s+/.test(line.text)) {
        md += `* ${line.text.replace(/^[•\-\*]\s+/, "")}\n`;
      } else {
        md += `${line.text}\n\n`;
      }
    });
  });

  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const fileName = `${baseTitle}.md`;

  return { blob, fileName };
}

/**
 * 10. PDF TO PDF/A (ARCHIVAL METADATA & STREAM PREPARATION)
 * Standardizes PDF metadata and disables compressed object streams for archival workflows.
 * Note: This workflow prepares document metadata and does NOT certify formal ISO 19005-1 (PDF/A) compliance.
 */
export async function convertPdfToPdfA(file: File): Promise<{
  blob: Blob;
  fileName: string;
  notes: string;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const baseTitle = file.name.replace(/\.[^/.]+$/, "");
  const now = new Date();
  pdfDoc.setTitle(baseTitle);
  pdfDoc.setCreationDate(now);
  pdfDoc.setModificationDate(now);
  pdfDoc.setSubject("Archival Metadata Preparation (Non-certified)");
  pdfDoc.setProducer("My PDF Archival Metadata Engine");
  pdfDoc.setCreator("My PDF Platform");

  // Save with disabled object streams for broad legacy archival viewer compatibility
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const fileName = `${baseTitle}_Archival_Prepared.pdf`;

  const notes =
    "Archival Metadata Prepared: Standardized creation/modification dates, title properties, and disabled compressed object streams for legacy archival viewer compatibility. Notice: This does not certify formal ISO 19005-1 (PDF/A) compliance.";

  return { blob, fileName, notes };
}

/**
 * 11. PROTECT PDF (REAL ENCRYPTION)
 * Performs real AES-256 standard encryption on the PDF bytes.
 */
export async function protectPdfReal(
  file: File,
  password: string
): Promise<{ blob: Blob; fileName: string }> {
  if (!password || password.trim() === "") {
    throw new Error("A valid password is required to encrypt this PDF document.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBytes = new Uint8Array(arrayBuffer);

  const encryptedBytes = await encryptPDF(inputBytes, password.trim(), {
    algorithm: "AES-256",
  });

  const encInfo = await isEncrypted(encryptedBytes);
  if (!encInfo.encrypted) {
    throw new Error("Encryption verification failed: output document is not encrypted.");
  }

  const blob = new Blob([encryptedBytes], { type: "application/pdf" });
  const baseTitle = file.name.replace(/\.[^/.]+$/, "");
  const fileName = `${baseTitle}_Protected.pdf`;

  return { blob, fileName };
}

/**
 * 12. UNLOCK PDF (REAL DECRYPTION)
 * Decrypts a password-encrypted PDF using standard decryption.
 */
export async function unlockPdfReal(
  file: File,
  password: string
): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const inputBytes = new Uint8Array(arrayBuffer);

  const encInfo = await isEncrypted(inputBytes);
  if (!encInfo.encrypted) {
    throw new Error("The uploaded document is not password-protected. No unlocking is required.");
  }

  if (!password || password.trim() === "") {
    throw new Error("Please provide the password to unlock this document.");
  }

  try {
    const decryptedBytes = await decryptPDF(inputBytes, password.trim());
    const blob = new Blob([decryptedBytes], { type: "application/pdf" });
    const baseTitle = file.name.replace(/\.[^/.]+$/, "");
    const fileName = `${baseTitle}_Unlocked.pdf`;

    return { blob, fileName };
  } catch (err: any) {
    throw new Error("Incorrect password. Could not decrypt the document. Please check the password and try again.");
  }
}

/**
 * 13. COMPRESS PDF (REAL MULTI-TIER OPTIMIZATION ENGINE)
 * Applies distinct optimization algorithms per tier:
 * - LOW: Prioritizes lossless quality and structure packing with full metadata preservation.
 * - RECOMMENDED: Balanced compression using object stream consolidation (FlateDecode) and table optimization.
 * - HIGH: Aggressive image downsampling & JPEG recompression (quality 0.70) for scanned/image PDFs,
 *         or maximal stream compaction with metadata stripping for vector PDFs.
 * Computes exact real byte sizes and ratio.
 */
export async function compressPdfReal(
  file: File,
  tier: "low" | "recommended" | "high" = "recommended"
): Promise<{
  blob: Blob;
  ratio: number;
  outputSize: number;
  originalSize: number;
  fileName: string;
  strategyApplied: string;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const originalSize = file.size;
  let pdfBytes: Uint8Array;
  let strategyApplied = "";

  if (tier === "low") {
    // Low: Preserve all metadata and streams, light structural deduplication
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    pdfBytes = await pdfDoc.save({
      useObjectStreams: false,
    });
    strategyApplied = "Light structural compaction (lossless, all metadata & streams preserved)";
  } else if (tier === "recommended") {
    // Recommended: Balanced FlateDecode object stream consolidation
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    pdfBytes = await pdfDoc.save({
      useObjectStreams: true,
    });
    strategyApplied = "Balanced object stream consolidation (FlateDecode compression enabled)";
  } else {
    // High: Stronger optimization with image recompression test
    try {
      // Load with pdfjs to inspect pages and attempt image downsampling recompression
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        isEvalSupported: false,
        useWorkerFetch: false,
      });
      const pdfJsDoc = await loadingTask.promise;
      const numPages = pdfJsDoc.numPages;

      // Create a fresh doc with recompressed JPEG raster streams
      const rasterDoc = await PDFDocument.create();
      let totalRasterBytes = 0;

      for (let p = 1; p <= numPages; p++) {
        const page = await pdfJsDoc.getPage(p);
        const viewport = page.getViewport({ scale: 1.35 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) break;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = canvas.toDataURL("image/jpeg", 0.70);
        const base64Data = dataUrl.split(",")[1];
        const binaryStr = atob(base64Data);
        const imgBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          imgBytes[i] = binaryStr.charCodeAt(i);
        }
        totalRasterBytes += imgBytes.byteLength;

        const embeddedImage = await rasterDoc.embedJpg(imgBytes);
        const newPage = rasterDoc.addPage([viewport.width / 1.35, viewport.height / 1.35]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: viewport.width / 1.35,
          height: viewport.height / 1.35,
        });
      }

      const recompressedBytes = await rasterDoc.save({ useObjectStreams: true });

      // If image recompression produced a smaller file than original, use it!
      if (recompressedBytes.byteLength < originalSize * 0.95 && totalRasterBytes > 0) {
        pdfBytes = recompressedBytes;
        strategyApplied = "Aggressive visual downsampling & JPEG recompression (70% quality, resampled raster)";
      } else {
        // Otherwise, the original was vector-dense; apply aggressive metadata stripping + object streams
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("");
        pdfDoc.setCreator("");
        pdfBytes = await pdfDoc.save({ useObjectStreams: true });
        strategyApplied = "High object stream consolidation & metadata stripping (vector optimized)";
      }
    } catch {
      // Fallback to high object stream consolidation
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      strategyApplied = "High object stream consolidation (FlateDecode)";
    }
  }

  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const outputSize = blob.size;
  const bytesSaved = Math.max(0, originalSize - outputSize);
  const ratio = originalSize > 0 ? Math.round((bytesSaved / originalSize) * 100) : 0;

  const baseTitle = file.name.replace(/\.[^/.]+$/, "");
  const fileName = `${baseTitle}_Compressed_${tier}.pdf`;

  return {
    blob,
    ratio,
    outputSize,
    originalSize,
    fileName,
    strategyApplied,
  };
}

/**
 * 14. REDACT PDF (GENUINE UNRECOVERABLE BITMAP REDACTION)
 * Permanently blacks out matching text patterns or user-selected areas
 * by drawing opaque black rectangles into rasterized page pixels,
 * completely destroying the underlying vector text stream.
 */
export interface RedactionOptions {
  terms?: string[];
  patterns?: {
    email?: boolean;
    ssn?: boolean;
    phone?: boolean;
    creditCard?: boolean;
  };
  manualAreas?: Array<{
    pageNumber: number;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
  }>;
}

export async function redactPdfReal(
  file: File,
  options?: RedactionOptions | string[]
): Promise<{ blob: Blob; fileName: string; redactedMatchesCount: number }> {
  const opts: RedactionOptions = Array.isArray(options)
    ? { terms: options }
    : options || {};

  const terms = (opts.terms || []).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const patterns = opts.patterns || {};
  const manualAreas = opts.manualAreas || [];

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;
  const ssnRegex = /\b(?:\d{3}-\d{2}-\d{4}|\d{9})\b/;
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  const ccRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false,
    useWorkerFetch: false,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let totalMatches = 0;
  const pageBoxesToRedact: Map<number, Array<{ x: number; y: number; width: number; height: number }>> = new Map();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];

    // Manual areas
    const pageManuals = manualAreas.filter((m) => m.pageNumber === i);
    for (const m of pageManuals) {
      const viewport = page.getViewport({ scale: 1.0 });
      boxes.push({
        x: (m.xPercent / 100) * viewport.width,
        y: (m.yPercent / 100) * viewport.height,
        width: (m.widthPercent / 100) * viewport.width,
        height: (m.heightPercent / 100) * viewport.height,
      });
      totalMatches++;
    }

    // Text items matching terms or regex
    for (const item of textContent.items as any[]) {
      if (!item.str || item.str.trim() === "") continue;
      const strLower = item.str.toLowerCase();
      let matched = false;

      for (const t of terms) {
        if (strLower.includes(t)) {
          matched = true;
          break;
        }
      }

      if (!matched && patterns.email && emailRegex.test(item.str)) matched = true;
      if (!matched && patterns.ssn && ssnRegex.test(item.str)) matched = true;
      if (!matched && patterns.phone && phoneRegex.test(item.str)) matched = true;
      if (!matched && patterns.creditCard && ccRegex.test(item.str)) matched = true;

      if (matched) {
        const x = item.transform ? item.transform[4] : 0;
        const y = item.transform ? item.transform[5] : 0;
        const fontSize = item.transform ? Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12 : 12;
        const textWidth = item.width || item.str.length * fontSize * 0.6;
        const viewport = page.getViewport({ scale: 1.0 });

        const topY = viewport.height - y - fontSize;
        boxes.push({
          x: Math.max(0, x - 2),
          y: Math.max(0, topY),
          width: textWidth + 4,
          height: fontSize + 4,
        });
        totalMatches++;
      }
    }

    pageBoxesToRedact.set(i, boxes);
  }

  // If user provided terms or patterns but nothing was found
  if (totalMatches === 0 && (terms.length > 0 || Object.values(patterns).some(Boolean))) {
    throw new Error(
      `No matches found for the specified redaction terms or patterns (${[
        ...terms,
        ...Object.entries(patterns)
          .filter(([, v]) => v)
          .map(([k]) => k),
      ].join(", ")}). Please verify spelling or adjust your selection.`
    );
  }

  // Create unrecoverable sanitized PDF
  const outPdf = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const scale = 2.0;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Canvas context unavailable.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Permanently overwrite canvas pixels with black rectangles
    const boxes = pageBoxesToRedact.get(i) || [];
    ctx.fillStyle = "#000000";
    for (const b of boxes) {
      ctx.fillRect(b.x * scale, b.y * scale, b.width * scale, b.height * scale);
    }

    const imgDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const imgBytes = Uint8Array.from(atob(imgDataUrl.split(",")[1]), (c) => c.charCodeAt(0));
    const embeddedImg = await outPdf.embedJpg(imgBytes);

    const pdfPage = outPdf.addPage([page.getViewport({ scale: 1.0 }).width, page.getViewport({ scale: 1.0 }).height]);
    pdfPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: pdfPage.getWidth(),
      height: pdfPage.getHeight(),
    });
  }

  const pdfBytes = await outPdf.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const baseTitle = file.name.replace(/\.[^/.]+$/, "");
  const fileName = `${baseTitle}_Redacted.pdf`;

  return { blob, fileName, redactedMatchesCount: totalMatches };
}

/**
 * 15. CROP PDF (USER RECTANGLE & DIRECTIONAL PERCENTAGES)
 */
export interface CropOptions {
  scope?: "all" | "selected";
  selectedPages?: number[];
  topPercent?: number;
  bottomPercent?: number;
  leftPercent?: number;
  rightPercent?: number;
}

export async function cropPdfReal(
  file: File,
  options?: CropOptions | number
): Promise<{ blob: Blob; fileName: string; appliedCrop: CropOptions }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  let cropOpts: CropOptions;
  if (typeof options === "number") {
    cropOpts = {
      scope: "all",
      topPercent: 5,
      bottomPercent: 5,
      leftPercent: 5,
      rightPercent: 5,
    };
  } else {
    cropOpts = {
      scope: options?.scope || "all",
      selectedPages: options?.selectedPages || [],
      topPercent: Math.max(0, Math.min(45, options?.topPercent ?? 5)),
      bottomPercent: Math.max(0, Math.min(45, options?.bottomPercent ?? 5)),
      leftPercent: Math.max(0, Math.min(45, options?.leftPercent ?? 5)),
      rightPercent: Math.max(0, Math.min(45, options?.rightPercent ?? 5)),
    };
  }

  pages.forEach((page, index) => {
    const pageNum = index + 1;
    if (
      cropOpts.scope === "selected" &&
      cropOpts.selectedPages &&
      cropOpts.selectedPages.length > 0 &&
      !cropOpts.selectedPages.includes(pageNum)
    ) {
      return; // Skip pages not in target list
    }

    const { width, height } = page.getSize();
    const leftInset = ((cropOpts.leftPercent || 0) / 100) * width;
    const rightInset = ((cropOpts.rightPercent || 0) / 100) * width;
    const topInset = ((cropOpts.topPercent || 0) / 100) * height;
    const bottomInset = ((cropOpts.bottomPercent || 0) / 100) * height;

    const newX = leftInset;
    const newY = bottomInset;
    const newWidth = Math.max(10, width - leftInset - rightInset);
    const newHeight = Math.max(10, height - topInset - bottomInset);

    page.setCropBox(newX, newY, newWidth, newHeight);
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const baseTitle = file.name.replace(/\.[^/.]+$/, "");
  const fileName = `${baseTitle}_Cropped.pdf`;

  return { blob, fileName, appliedCrop: cropOpts };
}

/**
 * 16. EDIT PDF (REAL ANNOTATION & OVERLAY ENGINE)
 * Allows adding text callouts, freehand drawings, highlight boxes, and image stamps directly onto the PDF.
 */
export interface PdfAnnotation {
  id: string;
  pageNumber: number;
  type: "text" | "draw" | "highlight" | "image" | "stamp";
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width?: number;
  height?: number;
  text?: string;
  color?: string;
  fontSize?: number;
  opacity?: number;
  points?: Array<{ x: number; y: number }>;
  imageBase64?: string;
}

export async function applyPdfEdits(
  file: File,
  annotations: PdfAnnotation[]
): Promise<{ blob: Blob; fileName: string }> {
  if (!annotations || annotations.length === 0) {
    throw new Error("No annotations or edits to apply.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  const parseHexColor = (hex: string) => {
    const clean = hex.replace("#", "");
    if (clean.length === 6) {
      return rgb(
        parseInt(clean.slice(0, 2), 16) / 255,
        parseInt(clean.slice(2, 4), 16) / 255,
        parseInt(clean.slice(4, 6), 16) / 255
      );
    }
    return rgb(0.1, 0.1, 0.1);
  };

  for (const ann of annotations) {
    const pageIdx = Math.max(0, Math.min(pages.length - 1, (ann.pageNumber || 1) - 1));
    const page = pages[pageIdx];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    const posX = ann.x <= 100 ? (ann.x / 100) * pageWidth : ann.x;
    const posY = ann.y <= 100 ? pageHeight - (ann.y / 100) * pageHeight : ann.y;

    if (ann.type === "text" && ann.text) {
      page.drawText(ann.text, {
        x: posX,
        y: Math.max(15, posY),
        size: ann.fontSize || 14,
        font: fontBold,
        color: parseHexColor(ann.color || "#1e293b"),
      });
    } else if (ann.type === "highlight") {
      const hWidth = ann.width && ann.width <= 100 ? (ann.width / 100) * pageWidth : ann.width || 180;
      const hHeight = ann.height || 22;
      page.drawRectangle({
        x: posX,
        y: Math.max(10, posY - hHeight),
        width: hWidth,
        height: hHeight,
        color: parseHexColor(ann.color || "#fde047"),
        opacity: ann.opacity || 0.45,
      });
    } else if (ann.type === "draw" && ann.points && ann.points.length > 1) {
      for (let i = 0; i < ann.points.length - 1; i++) {
        const p1 = ann.points[i];
        const p2 = ann.points[i + 1];
        const x1 = (p1.x / 100) * pageWidth;
        const y1 = pageHeight - (p1.y / 100) * pageHeight;
        const x2 = (p2.x / 100) * pageWidth;
        const y2 = pageHeight - (p2.y / 100) * pageHeight;

        page.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness: Math.max(1.5, (ann.fontSize || 14) / 5),
          color: parseHexColor(ann.color || "#ef4444"),
          opacity: ann.opacity || 0.9,
        });
      }
    } else if ((ann.type === "image" || ann.type === "stamp") && ann.imageBase64) {
      const cleanBase64 = ann.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const binary = atob(cleanBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const isPng = ann.imageBase64.includes("png");
      const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
      const imgW = ann.width || 120;
      const imgH = ann.height || 50;

      page.drawImage(img, {
        x: posX,
        y: Math.max(10, posY - imgH),
        width: imgW,
        height: imgH,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const baseTitle = file.name.replace(/\.[^/.]+$/, "");
  const fileName = `${baseTitle}_Edited.pdf`;

  return { blob, fileName };
}

/**
 * 17. PDF FORMS (ACROFORM INSPECTION & FILLING)
 */
export interface AcroFormFieldInfo {
  name: string;
  type: "text" | "checkbox" | "dropdown" | "radio";
  value: string | boolean;
  options?: string[];
}

export async function inspectPdfForm(file: File): Promise<AcroFormFieldInfo[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  return fields.map((field) => {
    const name = field.getName();
    const constructorName = field.constructor.name;

    if (constructorName === "PDFTextField" || (field as any).getText !== undefined) {
      return {
        name,
        type: "text" as const,
        value: (field as any).getText ? (field as any).getText() || "" : "",
      };
    } else if (constructorName === "PDFCheckBox" || (field as any).isChecked !== undefined) {
      return {
        name,
        type: "checkbox" as const,
        value: Boolean((field as any).isChecked ? (field as any).isChecked() : false),
      };
    } else if (constructorName === "PDFDropdown" || (field as any).getOptions !== undefined) {
      const selected = (field as any).getSelected ? (field as any).getSelected() : [];
      return {
        name,
        type: "dropdown" as const,
        value: selected[0] || "",
        options: (field as any).getOptions ? (field as any).getOptions() : [],
      };
    } else if (constructorName === "PDFRadioGroup") {
      const selected = (field as any).getSelected ? (field as any).getSelected() : "";
      return {
        name,
        type: "radio" as const,
        value: selected || "",
        options: (field as any).getOptions ? (field as any).getOptions() : [],
      };
    }

    return {
      name,
      type: "text" as const,
      value: "",
    };
  });
}

export async function fillPdfFormReal(
  file: File,
  fieldValues: Record<string, string | boolean>,
  flatten = false
): Promise<{ blob: Blob; fileName: string; filledCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  let filledCount = 0;

  for (const [name, val] of Object.entries(fieldValues)) {
    try {
      const field = form.getField(name);
      if ((field as any).setText) {
        (field as any).setText(String(val ?? ""));
        filledCount++;
      } else if ((field as any).check && (field as any).uncheck) {
        if (val === true || val === "true") (field as any).check();
        else (field as any).uncheck();
        filledCount++;
      } else if ((field as any).select) {
        (field as any).select(String(val));
        filledCount++;
      }
    } catch (e) {
      console.warn(`Could not set field "${name}":`, e);
    }
  }

  if (flatten) {
    form.flatten();
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const baseTitle = file.name.replace(/\.[^/.]+$/, "");
  const fileName = `${baseTitle}_Filled.pdf`;

  return { blob, fileName, filledCount };
}

/**
 * 18. COMPARE PDFS (REAL PAGE-BY-PAGE TEXT DIFFERENCE ENGINE)
 */
export async function comparePdfsReal(
  file1: File,
  file2: File
): Promise<{
  pageCount1: number;
  pageCount2: number;
  sizeDiff: number;
  similarityScore: number;
  differences: Array<{ title: string; desc: string; type: "added" | "removed" | "changed" }>;
}> {
  const [s1, s2] = await Promise.all([extractPdfStructure(file1), extractPdfStructure(file2)]);
  const p1 = s1.numPages;
  const p2 = s2.numPages;
  const sizeDiff = file2.size - file1.size;

  const diffs: Array<{ title: string; desc: string; type: "added" | "removed" | "changed" }> = [];

  // 1. Page count comparison
  if (p1 !== p2) {
    diffs.push({
      title: "Page Count Difference",
      desc: `Document 1 has ${p1} page(s), while Document 2 has ${p2} page(s). (${p2 > p1 ? `+${p2 - p1} page(s) added` : `${p1 - p2} page(s) removed`})`,
      type: p2 > p1 ? "added" : "removed",
    });
  } else {
    diffs.push({
      title: "Page Alignment",
      desc: `Both documents have identical lengths of ${p1} page(s).`,
      type: "changed",
    });
  }

  // 2. File size difference
  if (Math.abs(sizeDiff) > 50) {
    diffs.push({
      title: "File Payload Variation",
      desc: `Document 2 is ${(Math.abs(sizeDiff) / 1024).toFixed(1)} KB ${sizeDiff > 0 ? "larger" : "smaller"} than Document 1 (${file1.size.toLocaleString()} bytes vs ${file2.size.toLocaleString()} bytes).`,
      type: sizeDiff > 0 ? "added" : "removed",
    });
  }

  // 3. Page-by-page text differences
  const maxPages = Math.max(p1, p2);
  let matchingLinesCount = 0;
  let totalLinesCompared = 0;

  for (let i = 1; i <= maxPages; i++) {
    const page1 = s1.pages.find((p) => p.pageNumber === i);
    const page2 = s2.pages.find((p) => p.pageNumber === i);

    if (!page1 && page2) {
      diffs.push({
        title: `Page ${i}: Newly Added Page`,
        desc: `Document 2 contains an entire additional page with ${page2.lines.length} lines of text.`,
        type: "added",
      });
      totalLinesCompared += page2.lines.length;
      continue;
    }

    if (page1 && !page2) {
      diffs.push({
        title: `Page ${i}: Removed Page`,
        desc: `Document 1 has page ${i} with ${page1.lines.length} lines that was removed in Document 2.`,
        type: "removed",
      });
      totalLinesCompared += page1.lines.length;
      continue;
    }

    if (page1 && page2) {
      const lines1 = page1.lines.map((l) => l.text.trim()).filter(Boolean);
      const lines2 = page2.lines.map((l) => l.text.trim()).filter(Boolean);
      totalLinesCompared += Math.max(lines1.length, lines2.length);

      const addedLines = lines2.filter((l) => !lines1.includes(l));
      const removedLines = lines1.filter((l) => !lines2.includes(l));
      matchingLinesCount += lines1.filter((l) => lines2.includes(l)).length;

      if (addedLines.length > 0 || removedLines.length > 0) {
        const descParts: string[] = [];
        if (removedLines.length > 0) {
          descParts.push(`Removed: "${removedLines.slice(0, 2).join(" / ")}${removedLines.length > 2 ? "..." : ""}"`);
        }
        if (addedLines.length > 0) {
          descParts.push(`Added: "${addedLines.slice(0, 2).join(" / ")}${addedLines.length > 2 ? "..." : ""}"`);
        }

        diffs.push({
          title: `Page ${i} Text Differences`,
          desc: descParts.join("\n"),
          type:
            addedLines.length > 0 && removedLines.length > 0
              ? "changed"
              : addedLines.length > 0
              ? "added"
              : "removed",
        });
      }
    }
  }

  const similarityScore =
    totalLinesCompared > 0 ? Math.round((matchingLinesCount / totalLinesCompared) * 100) : 100;

  if (diffs.length <= 2) {
    diffs.push({
      title: "Content Equivalence",
      desc: "All extracted text strings match identically across compared pages.",
      type: "changed",
    });
  }

  return {
    pageCount1: p1,
    pageCount2: p2,
    sizeDiff,
    similarityScore,
    differences: diffs,
  };
}

export {
  redactPdfReal as redactPdf,
  cropPdfReal as cropPdf,
  compressPdfReal as compressPdf,
  protectPdfReal as protectPdf,
  unlockPdfReal as unlockPdf,
};
