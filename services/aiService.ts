export interface AISummaryResult {
  shortSummary: string;
  detailedSummary: string;
  keyPoints: string[];
  importantTopics: string[];
  actionItems: string[];
  isDemoFallback?: boolean;
}

export interface AIAskResult {
  answer: string;
  suggestedFollowUps?: string[];
  isDemoFallback?: boolean;
}

export interface AITranslateResult {
  translatedText: string;
  targetLanguage: string;
  sourceLanguage?: string;
  isDemoFallback?: boolean;
}

export interface AIOCRResult {
  extractedText: string;
  confidence: number;
  language: string;
  isDemoFallback?: boolean;
}

export async function requestAISummary(text: string, fileName?: string): Promise<AISummaryResult> {
  const res = await fetch("/api/ai/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, fileName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to summarize document (Server status: ${res.status})`);
  }

  return await res.json();
}

export async function requestAIAsk(
  documentText: string,
  question: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<AIAskResult> {
  const res = await fetch("/api/ai/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentText, question, conversationHistory: history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to process question (Server status: ${res.status})`);
  }

  return await res.json();
}

export async function requestAITranslate(
  text: string,
  targetLanguage: string,
  sourceLanguage = "English"
): Promise<AITranslateResult> {
  const res = await fetch("/api/ai/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLanguage, sourceLanguage }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to translate document (Server status: ${res.status})`);
  }

  return await res.json();
}

export async function requestAIOCR(
  imageBase64: string,
  language = "English"
): Promise<AIOCRResult> {
  const res = await fetch("/api/ai/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, language }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to perform OCR on image (Server status: ${res.status})`);
  }

  return await res.json();
}
