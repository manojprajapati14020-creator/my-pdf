import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface SampleDocMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  pageCount: number;
  previewColor: string;
}

export const SAMPLE_DOCS: SampleDocMeta[] = [
  {
    id: "sample-agreement",
    name: "Standard_Service_Agreement_2026.pdf",
    description: "Multi-page business services contract with terms, signature blocks, and confidentiality clauses.",
    category: "Contract",
    pageCount: 3,
    previewColor: "from-blue-600 to-indigo-700",
  },
  {
    id: "sample-report",
    name: "Q3_Strategic_Performance_Report.pdf",
    description: "Financial performance summary with executive highlights, quarterly figures, and deliverables.",
    category: "Finance",
    pageCount: 2,
    previewColor: "from-emerald-600 to-teal-700",
  },
  {
    id: "sample-invoice",
    name: "Enterprise_Invoice_INV-8921.pdf",
    description: "Commercial itemized invoice with line items, tax breakdown, and banking payment details.",
    category: "Invoice",
    pageCount: 1,
    previewColor: "from-violet-600 to-purple-700",
  },
];

/**
 * Generates an authentic, fully compliant PDF File object in-memory for testing.
 */
export async function createSamplePdfFile(sampleId: string): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  if (sampleId === "sample-agreement") {
    // Page 1
    const p1 = pdfDoc.addPage([600, 800]);
    p1.drawText("MASTER PROFESSIONAL SERVICES AGREEMENT", {
      x: 50,
      y: 730,
      size: 18,
      font: timesRoman,
      color: rgb(0.12, 0.15, 0.25),
    });
    p1.drawText("Document Reference: PSA-2026-0916 | Effective Date: October 1, 2026", {
      x: 50,
      y: 705,
      size: 10,
      font: regular,
      color: rgb(0.4, 0.45, 0.55),
    });

    p1.drawText("1. ENGAGEMENT AND SCOPE", {
      x: 50,
      y: 660,
      size: 13,
      font: timesRoman,
      color: rgb(0.15, 0.2, 0.4),
    });
    const body1 =
      "This Agreement is entered into between Acme Solutions Corp ('Client') and Premier Technologies LLC ('Provider').\n" +
      "The Provider agrees to deliver enterprise document infrastructure, automated digital transformation services,\n" +
      "and data compliance monitoring in accordance with the specifications set forth in Exhibit A attached hereto.\n\n" +
      "Provider shall ensure 99.9% uptime for cloud workflow components, adhere strictly to ISO 27001 cybersecurity\n" +
      "benchmarks, and execute continuous backup and archival procedures.";
    p1.drawText(body1, {
      x: 50,
      y: 635,
      size: 10,
      lineHeight: 16,
      font: regular,
      color: rgb(0.2, 0.2, 0.25),
    });

    p1.drawText("2. COMPENSATION AND BILLING", {
      x: 50,
      y: 520,
      size: 13,
      font: timesRoman,
      color: rgb(0.15, 0.2, 0.4),
    });
    const body2 =
      "Client shall pay Provider a fixed monthly retainer of $8,500.00 USD, payable net-30 upon monthly invoice generation.\n" +
      "Any additional architectural or custom engineering work requested beyond the initial scope shall be billed at\n" +
      "the agreed rate of $175.00 per hour with prior written authorization.";
    p1.drawText(body2, {
      x: 50,
      y: 495,
      size: 10,
      lineHeight: 16,
      font: regular,
      color: rgb(0.2, 0.2, 0.25),
    });

    // Page 2
    const p2 = pdfDoc.addPage([600, 800]);
    p2.drawText("3. CONFIDENTIALITY AND DATA PROTECTION", {
      x: 50,
      y: 730,
      size: 13,
      font: timesRoman,
      color: rgb(0.15, 0.2, 0.4),
    });
    const body3 =
      "Both parties agree that all trade secrets, customer records, technical diagrams, and proprietary algorithms\n" +
      "disclosed during the tenure of this engagement shall remain strictly confidential for five (5) years.\n" +
      "Neither party shall disclose or disseminate such materials without express written consent.\n\n" +
      "Security Protocols: All uploaded customer documentation must be processed through isolated memory buffers\n" +
      "and automatically expunged from temporary operational buffers within one hour of successful job termination.";
    p2.drawText(body3, {
      x: 50,
      y: 700,
      size: 10,
      lineHeight: 16,
      font: regular,
      color: rgb(0.2, 0.2, 0.25),
    });

    p2.drawText("4. TERM AND TERMINATION", {
      x: 50,
      y: 570,
      size: 13,
      font: timesRoman,
      color: rgb(0.15, 0.2, 0.4),
    });
    p2.drawText(
      "This agreement shall remain effective for twelve (12) calendar months and automatically renew unless terminated\n" +
      "with thirty (30) days prior written notice by either party.",
      {
        x: 50,
        y: 545,
        size: 10,
        lineHeight: 16,
        font: regular,
        color: rgb(0.2, 0.2, 0.25),
      }
    );

    // Page 3 - Signatures
    const p3 = pdfDoc.addPage([600, 800]);
    p3.drawText("5. EXECUTION AND SIGNATURE BLOCKS", {
      x: 50,
      y: 730,
      size: 14,
      font: timesRoman,
      color: rgb(0.15, 0.2, 0.4),
    });
    p3.drawText("IN WITNESS WHEREOF, the parties hereto have executed this Agreement by their authorized officers:", {
      x: 50,
      y: 700,
      size: 10,
      font: regular,
      color: rgb(0.3, 0.35, 0.45),
    });

    p3.drawRectangle({
      x: 50,
      y: 520,
      width: 230,
      height: 140,
      borderColor: rgb(0.75, 0.8, 0.88),
      borderWidth: 1,
    });
    p3.drawText("CLIENT: Acme Solutions Corp", { x: 60, y: 635, size: 11, font: timesRoman, color: rgb(0.1, 0.1, 0.2) });
    p3.drawText("Signature: [PENDING E-SIGNATURE]", { x: 60, y: 590, size: 9, font: regular, color: rgb(0.6, 0.2, 0.2) });
    p3.drawText("Name: Jonathan Reynolds", { x: 60, y: 560, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });
    p3.drawText("Title: Chief Operating Officer", { x: 60, y: 540, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });

    p3.drawRectangle({
      x: 310,
      y: 520,
      width: 230,
      height: 140,
      borderColor: rgb(0.75, 0.8, 0.88),
      borderWidth: 1,
    });
    p3.drawText("PROVIDER: Premier Technologies", { x: 320, y: 635, size: 11, font: timesRoman, color: rgb(0.1, 0.1, 0.2) });
    p3.drawText("Signature: [PENDING E-SIGNATURE]", { x: 320, y: 590, size: 9, font: regular, color: rgb(0.6, 0.2, 0.2) });
    p3.drawText("Name: Elena Rostova", { x: 320, y: 560, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });
    p3.drawText("Title: Managing Director", { x: 320, y: 540, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });

    const pdfBytes = await pdfDoc.save();
    return new File([pdfBytes], "Standard_Service_Agreement_2026.pdf", { type: "application/pdf" });
  }

  if (sampleId === "sample-report") {
    const p1 = pdfDoc.addPage([600, 800]);
    p1.drawText("Q3 STRATEGIC EXECUTIVE REPORT", { x: 50, y: 730, size: 20, font: timesRoman, color: rgb(0.05, 0.35, 0.3) });
    p1.drawText("Prepared for: Executive Leadership Board | Period: Q3 FY2026", { x: 50, y: 705, size: 10, font: regular, color: rgb(0.4, 0.45, 0.5) });

    p1.drawText("1. KEY FINANCIAL PERFORMANCE METRICS", { x: 50, y: 660, size: 13, font: timesRoman, color: rgb(0.1, 0.25, 0.2) });
    const textReport =
      "- Total Revenue: $4,850,000 (up +24% YoY, exceeding analyst target of $4.4M)\n" +
      "- Gross Margin: 78.4% (expanded 320 bps due to infrastructure cost consolidation)\n" +
      "- Customer Acquisition Cost (CAC): Decreased by 18% following organic referral expansion\n" +
      "- Net Revenue Retention (NRR): 128% across high-tier enterprise customer base\n\n" +
      "Growth across North American and European operational hubs showed consistent adoption,\n" +
      "with digital document automation accounting for 42% of total recurring subscription growth.";
    p1.drawText(textReport, { x: 50, y: 630, size: 10, lineHeight: 18, font: regular, color: rgb(0.2, 0.2, 0.25) });

    const p2 = pdfDoc.addPage([600, 800]);
    p2.drawText("2. Q4 INITIATIVES AND STRATEGIC PRIORITIES", { x: 50, y: 730, size: 14, font: timesRoman, color: rgb(0.1, 0.25, 0.2) });
    p2.drawText(
      "Priority 1: Multi-region failover and distributed edge processing.\n" +
      "Priority 2: AI document reasoning pipeline with instant OCR vector indexing.\n" +
      "Priority 3: SOC2 Type II certification audit completion by November 30.\n" +
      "Priority 4: Launch of next-generation developer API and self-serve billing portal.",
      { x: 50, y: 690, size: 11, lineHeight: 22, font: regular, color: rgb(0.2, 0.2, 0.25) }
    );

    const pdfBytes = await pdfDoc.save();
    return new File([pdfBytes], "Q3_Strategic_Performance_Report.pdf", { type: "application/pdf" });
  }

  // Invoice
  const p1 = pdfDoc.addPage([600, 800]);
  p1.drawText("COMMERCIAL INVOICE", { x: 50, y: 735, size: 22, font: timesRoman, color: rgb(0.3, 0.15, 0.5) });
  p1.drawText("Invoice Number: INV-8921 | Date: September 16, 2026 | Due: Net 30", { x: 50, y: 710, size: 10, font: regular, color: rgb(0.4, 0.4, 0.5) });

  p1.drawText("Billed To: Global Systems Enterprise", { x: 50, y: 660, size: 11, font: timesRoman, color: rgb(0.1, 0.1, 0.2) });
  p1.drawText("100 Innovation Parkway, Suite 400, Austin TX 78701", { x: 50, y: 645, size: 9, font: regular, color: rgb(0.3, 0.3, 0.4) });

  p1.drawRectangle({ x: 50, y: 480, width: 500, height: 140, borderColor: rgb(0.85, 0.85, 0.9), borderWidth: 1 });
  p1.drawText("Description", { x: 65, y: 595, size: 10, font: timesRoman, color: rgb(0.2, 0.2, 0.3) });
  p1.drawText("Quantity", { x: 300, y: 595, size: 10, font: timesRoman, color: rgb(0.2, 0.2, 0.3) });
  p1.drawText("Rate", { x: 380, y: 595, size: 10, font: timesRoman, color: rgb(0.2, 0.2, 0.3) });
  p1.drawText("Amount", { x: 470, y: 595, size: 10, font: timesRoman, color: rgb(0.2, 0.2, 0.3) });

  p1.drawText("Enterprise Document Suite License", { x: 65, y: 565, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });
  p1.drawText("1", { x: 315, y: 565, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });
  p1.drawText("$2,400.00", { x: 375, y: 565, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });
  p1.drawText("$2,400.00", { x: 465, y: 565, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });

  p1.drawText("AI OCR & Multi-Language Extraction Module", { x: 65, y: 535, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });
  p1.drawText("1", { x: 315, y: 535, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });
  p1.drawText("$850.00", { x: 385, y: 535, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });
  p1.drawText("$850.00", { x: 475, y: 535, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });

  p1.drawText("Dedicated SLA & Security Audit Support", { x: 65, y: 505, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });
  p1.drawText("1", { x: 315, y: 505, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });
  p1.drawText("$500.00", { x: 385, y: 505, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });
  p1.drawText("$500.00", { x: 475, y: 505, size: 10, font: regular, color: rgb(0.2, 0.2, 0.3) });

  p1.drawText("TOTAL DUE: $3,750.00 USD", { x: 370, y: 440, size: 13, font: timesRoman, color: rgb(0.1, 0.4, 0.2) });

  const pdfBytes = await pdfDoc.save();
  return new File([pdfBytes], "Enterprise_Invoice_INV-8921.pdf", { type: "application/pdf" });
}
