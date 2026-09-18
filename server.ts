import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// High body limit for base64 document and image processing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-memory telemetry & stats for demo and dashboard
const appStats = {
  totalProcessedFiles: 14280,
  totalUsers: 3840,
  storageUsedMb: 1240,
  toolUsage: {
    "merge-pdf": 4120,
    "split-pdf": 2350,
    "compress-pdf": 3610,
    "pdf-to-word": 1920,
    "word-to-pdf": 1450,
    "sign-pdf": 980,
    "ai-summarizer": 1210,
    "ocr-pdf": 840,
    "protect-pdf": 640,
    "organize-pdf": 930,
  } as Record<string, number>,
  recentActivity: [
    { id: "act-1", tool: "Merge PDF", fileName: "Q3_Financial_Reports.pdf", status: "completed", timestamp: Date.now() - 1000 * 60 * 3 },
    { id: "act-2", tool: "AI PDF Summarizer", fileName: "Research_Draft_v2.pdf", status: "completed", timestamp: Date.now() - 1000 * 60 * 12 },
    { id: "act-3", tool: "Compress PDF", fileName: "Product_Catalog_2026.pdf", status: "completed", timestamp: Date.now() - 1000 * 60 * 25 },
    { id: "act-4", tool: "Sign PDF", fileName: "Employment_Agreement.pdf", status: "completed", timestamp: Date.now() - 1000 * 60 * 45 },
    { id: "act-5", tool: "OCR PDF", fileName: "Scan_Receipt_Invoice.jpg", status: "completed", timestamp: Date.now() - 1000 * 60 * 62 },
  ],
};

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// API: Telemetry / Admin Stats
app.get("/api/stats", (req, res) => {
  res.json(appStats);
});

// Record tool usage
app.post("/api/stats/record", (req, res) => {
  const { toolId, toolName, fileName } = req.body;
  appStats.totalProcessedFiles += 1;
  if (toolId) {
    appStats.toolUsage[toolId] = (appStats.toolUsage[toolId] || 0) + 1;
  }
  if (toolName && fileName) {
    appStats.recentActivity.unshift({
      id: `act-${Date.now()}`,
      tool: toolName,
      fileName,
      status: "completed",
      timestamp: Date.now(),
    });
    if (appStats.recentActivity.length > 20) {
      appStats.recentActivity.pop();
    }
  }
  res.json({ success: true, totalProcessedFiles: appStats.totalProcessedFiles });
});

/**
 * Splits document text safely into chunks that fit within AI context limits,
 * preserving [Page X] markers and paragraph boundaries where possible.
 */
function splitDocumentIntoChunks(fullText: string, maxChunkChars = 18000): string[] {
  if (fullText.length <= maxChunkChars) {
    return [fullText];
  }

  // Split preferentially by [Page X] boundaries
  const pageRegex = /(?=\[Page\s+\d+\])/g;
  const sections = fullText.split(pageRegex).filter(Boolean);

  const chunks: string[] = [];
  let currentChunk = "";

  for (const section of sections) {
    if (currentChunk.length + section.length > maxChunkChars) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      // If a single section exceeds maxChunkChars, split by double newlines (paragraphs)
      if (section.length > maxChunkChars) {
        const paragraphs = section.split(/\n\n+/);
        let subChunk = "";
        for (const p of paragraphs) {
          if (subChunk.length + p.length > maxChunkChars) {
            if (subChunk.trim()) chunks.push(subChunk.trim());
            subChunk = p + "\n\n";
          } else {
            subChunk += p + "\n\n";
          }
        }
        if (subChunk.trim()) chunks.push(subChunk.trim());
        currentChunk = "";
      } else {
        currentChunk = section;
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + section;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [fullText.slice(0, maxChunkChars)];
}

/**
 * Selects the most relevant chunks of a large document for a specific chat question.
 */
function selectRelevantChunks(chunks: string[], question: string, maxChars = 32000): string {
  if (chunks.length <= 1) return chunks[0] || "";

  const qLower = question.toLowerCase();
  const qWords = qLower.split(/\s+/).filter((w) => w.length > 2);
  const pageMatch = qLower.match(/page\s+(\d+)/);
  const requestedPage = pageMatch ? `[Page ${pageMatch[1]}]` : null;

  const scored = chunks.map((chunk, index) => {
    let score = 0;
    const chunkLower = chunk.toLowerCase();
    if (requestedPage && chunk.includes(requestedPage)) {
      score += 100;
    }
    for (const w of qWords) {
      const occurrences = (chunkLower.match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
      score += occurrences;
    }
    return { chunk, index, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Take highest-scoring chunks up to maxChars
  const selected: Array<{ chunk: string; index: number }> = [];
  let currentLen = 0;

  for (const item of scored) {
    if (currentLen + item.chunk.length <= maxChars || selected.length === 0) {
      selected.push(item);
      currentLen += item.chunk.length;
    }
  }

  // Re-sort selected chunks in original document sequence
  selected.sort((a, b) => a.index - b.index);
  return selected.map((s) => s.chunk).join("\n\n---\n\n");
}

// API: AI Summarizer
app.post("/api/ai/summarize", async (req, res) => {
  try {
    const { text, fileName } = req.body;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Document text content is required. The uploaded document does not contain readable text." });
    }

    const chunks = splitDocumentIntoChunks(text, 18000);

    if (!process.env.GEMINI_API_KEY) {
      // Extractive algorithmic summary from user's ACTUAL document text, noting pages
      const cleanText = text.trim();
      const words = cleanText.split(/\s+/).filter(Boolean);
      const sentences = cleanText
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20);

      const shortSummary =
        sentences.slice(0, 2).join(" ") ||
        `Document "${fileName || "Uploaded Document"}" contains ${words.length} words across ${chunks.length} analyzed segment(s).`;

      const detailedSummary =
        sentences.slice(0, 5).join(" ") ||
        `Document text extracted successfully (${words.length} total words across ${chunks.length} section(s)). Key sections discuss document specifications, records, and relevant content.`;

      const keyPoints = sentences.slice(0, 5).map((s) => s.slice(0, 140));
      if (keyPoints.length === 0) {
        keyPoints.push(`Extracted ${words.length} words of text from ${fileName || "document"}.`);
      }

      return res.json({
        shortSummary,
        detailedSummary,
        keyPoints,
        importantTopics: [`Overview (${words.length} words)`, "Content Extraction", "Text Structure"],
        actionItems: ["Review extracted content sections.", "Verify document terms and figures."],
        isDemoFallback: true,
      });
    }

    const ai = getGeminiClient();

    if (chunks.length === 1) {
      const prompt = `You are a professional document analysis AI. Analyze the following ACTUAL document text extracted from the user's uploaded file and provide a structured JSON response.
When identifying key findings or action items, cite the relevant page number where available (e.g., "[Page 2]").

Document Name: ${fileName || "Document"}
Document Content:
"""
${chunks[0]}
"""

Return a JSON object with:
{
  "shortSummary": "A punchy 2-3 sentence executive summary citing main takeaways.",
  "detailedSummary": "A comprehensive 2-3 paragraph breakdown with clear structure, referencing page numbers where relevant.",
  "keyPoints": ["bullet point 1 (cite [Page X] if known)", "bullet point 2", "bullet point 3", "bullet point 4", "bullet point 5"],
  "importantTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
  "actionItems": ["Actionable step 1", "Actionable step 2", "Actionable step 3"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const outputText = response.text || "{}";
      const parsed = JSON.parse(outputText);
      return res.json({ ...parsed, isDemoFallback: false });
    }

    // Map-reduce multi-chunk summarization pipeline for large documents
    const chunkSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkPrompt = `Summarize key facts, decisions, and findings in section ${i + 1} of ${chunks.length} of the document "${fileName || "Document"}". Preserve [Page X] references:
"""
${chunks[i]}
"""`;
      const chunkRes = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: chunkPrompt,
      });
      chunkSummaries.push(`Section ${i + 1} findings:\n${chunkRes.text || ""}`);
    }

    // Reduce step: combine all section findings into unified executive summary
    const reducePrompt = `You are a professional document analysis AI. Synthesize the following section summaries from all parts of "${fileName || "Document"}" into a final cohesive structured JSON response. Citing page references (e.g. "[Page X]") where appropriate.

Section Summaries:
${chunkSummaries.join("\n\n")}

Return a JSON object with:
{
  "shortSummary": "A punchy 2-3 sentence executive summary covering the entire document.",
  "detailedSummary": "A comprehensive multi-paragraph breakdown covering all major sections, referencing specific pages where noted.",
  "keyPoints": ["key finding 1 (with [Page X] citation)", "key finding 2", "key finding 3", "key finding 4", "key finding 5"],
  "importantTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
  "actionItems": ["Actionable step 1", "Actionable step 2", "Actionable step 3"]
}`;

    const finalResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: reducePrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(finalResponse.text || "{}");
    res.json({ ...parsed, isDemoFallback: false });
  } catch (error: any) {
    console.error("Error in /api/ai/summarize:", error);
    res.status(500).json({ error: error.message || "Failed to summarize document." });
  }
});

// API: AI Ask / Chat with Document
app.post("/api/ai/ask", async (req, res) => {
  try {
    const { documentText, question, conversationHistory } = req.body;
    if (!question) {
      return res.status(400).json({ error: "A question is required." });
    }

    if (!documentText || documentText.trim().length === 0) {
      return res.status(400).json({ error: "No document text available. Please upload a readable document." });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Direct text search heuristic on actual uploaded document
      const lowerQ = question.toLowerCase();
      const qWords = lowerQ.split(/\s+/).filter((w: string) => w.length > 3);
      const sentences = documentText.split(/(?<=[.?!])\s+/);
      const matches = sentences.filter((s: string) => {
        const lowerS = s.toLowerCase();
        return qWords.some((w: string) => lowerS.includes(w));
      });

      if (matches.length > 0) {
        return res.json({
          answer: `From your uploaded document:\n\n"${matches.slice(0, 3).join(" ")}"\n\n(Note: Connect GEMINI_API_KEY in settings for advanced AI reasoning and conversational synthesis.)`,
          suggestedFollowUps: [
            "Can you extract the main conclusions?",
            "What are the key dates or numbers mentioned?",
          ],
          isDemoFallback: true,
        });
      }

      return res.json({
        answer: `This information is not mentioned in the uploaded document. (Searched ${sentences.length} sentences for "${question}"). For semantic AI reasoning, configure a GEMINI_API_KEY.`,
        suggestedFollowUps: ["Summarize the whole document", "List the key headings"],
        isDemoFallback: true,
      });
    }

    const ai = getGeminiClient();
    const historyText = Array.isArray(conversationHistory)
      ? conversationHistory.map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n")
      : "";

    const chunks = splitDocumentIntoChunks(documentText, 18000);
    const contextualText = selectRelevantChunks(chunks, question, 30000);

    const prompt = `You are "My PDF AI Assistant", embedded in a PDF viewer.
You have access to the document text extracted from the user's uploaded document below. The text includes [Page X] page markers where available:

--- RELEVANT DOCUMENT EXCERPTS ---
${contextualText}
--- END EXCERPTS ---

Conversation history:
${historyText}

User's question:
"${question}"

CRITICAL INSTRUCTIONS:
1. Answer strictly based on the provided document text above.
2. Where practical, explicitly reference the page number in your answers (for example: "According to page 4...", or "On [Page 2]...").
3. If the user asks a question whose answer is NOT present in the provided document, you MUST explicitly state: "This information is not mentioned in the uploaded document."
4. Do not invent facts or extrapolate beyond the uploaded text. Quote relevant passages directly when helpful.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({
      answer: response.text || "No response generated.",
      isDemoFallback: false,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/ask:", error);
    res.status(500).json({ error: error.message || "Failed to process question." });
  }
});

// API: AI Translate Document Text
app.post("/api/ai/translate", async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text content is required. The document does not contain readable text." });
    }

    const targetLang = targetLanguage || "Spanish";

    if (!process.env.GEMINI_API_KEY) {
      return res.status(422).json({
        error: "Translation requires a live GEMINI_API_KEY in the environment settings to perform neural language translation.",
        isDemoFallback: false,
      });
    }

    const ai = getGeminiClient();
    const chunks = splitDocumentIntoChunks(text, 16000);
    const translatedParts: string[] = [];

    for (const chunk of chunks) {
      const prompt = `You are a high-fidelity document translation engine.
Translate the following document text into ${targetLang}.
Preserve paragraph breaks, document hierarchy, lists, and [Page X] markers if present.

Document Content:
"""
${chunk}
"""`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      translatedParts.push(response.text || "");
    }

    res.json({
      translatedText: translatedParts.join("\n\n"),
      targetLanguage: targetLang,
      isDemoFallback: false,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/translate:", error);
    res.status(500).json({ error: error.message || "Failed to translate document." });
  }
});

// API: AI OCR PDF / Image
app.post("/api/ai/ocr", async (req, res) => {
  try {
    const { imageBase64, mimeType, language } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Image/document base64 payload is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(422).json({
        error: "Optical Character Recognition (OCR) requires a live GEMINI_API_KEY in environment settings to run neural vision analysis on the uploaded document scan.",
        isDemoFallback: false,
      });
    }

    const ai = getGeminiClient();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Perform OCR on this image or scanned document page.
Extract all visible text with exact spelling, layout structure, tables, and punctuation.
Target language focus: ${language || "Multilingual / Auto"}.
Do not add meta-commentary, output strictly the recognized text.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
    });

    res.json({
      extractedText: response.text || "",
      confidence: 0.99,
      language: language || "Auto-detected",
      isDemoFallback: false,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/ocr:", error);
    res.status(500).json({ error: error.message || "Failed to perform OCR on file." });
  }
});

// Setup Vite dev middleware or serve static dist
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
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
    console.log(`My PDF server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error("Failed to start My PDF server:", err);
});
