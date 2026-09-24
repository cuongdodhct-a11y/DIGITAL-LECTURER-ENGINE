/**
 * Phase 1.5.6B — Spoken Lecture Script Normalization & TTS Sanitization Gate
 * 
 * Strict separation of concerns:
 * - Internal Structure: opening, explanation, core_emphasis, clarification, example_or_application, transition, provenance
 * - Spoken Delivery: natural teacher delivery voice completely free from metadata leakage
 */

export interface TTSSanitizationResult {
  isSafe: boolean;
  leaksDetected: Array<{ pattern: string; matched: string; index: number }>;
  sanitizedText?: string;
  error?: string;
}

export const FORBIDDEN_METADATA_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'Slide', regex: /\bSlide\b/i },
  { name: 'Trang chiếu', regex: /Trang chiếu/i },
  { name: 'TeachingPoint', regex: /TeachingPoint/i },
  { name: 'TP-id', regex: /\bTP-[A-Z0-9-]+\b/i },
  { name: 'Statement', regex: /\bStatement\b/i },
  { name: 'Nêu luận điểm', regex: /Nêu luận điểm/i },
  { name: 'Luận điểm', regex: /\bLuận điểm\b/i },
  { name: 'Clarification', regex: /\bClarification\b/i },
  { name: 'Core emphasis', regex: /\bCore emphasis\b/i },
  { name: 'Example', regex: /\bExample\b/i },
  { name: 'Application', regex: /\bApplication\b/i },
  { name: 'Transition', regex: /\bTransition\b/i },
  { name: 'Opening', regex: /\bOpening\b/i },
  { name: 'Conclusion', regex: /\bConclusion\b/i },
  { name: 'Explanation', regex: /\bExplanation\b/i },
  { name: 'Source', regex: /\bSource\b/i },
  { name: 'PPTX', regex: /\bPPTX\b/i },
  { name: 'DOCX', regex: /\bDOCX\b/i },
  { name: 'SRC-id', regex: /\bSRC-\d+\b/i },
  { name: 'REC-id', regex: /\bREC-\d+\b/i }
];

/**
 * Gatekeeper function: Inspects text intended for TTS or Live Voice output.
 * If any metadata leak is detected, rejects delivery with SANITIZATION_FAILED.
 */
export function sanitizeSpokenLectureScript(text: string): TTSSanitizationResult {
  if (!text || typeof text !== 'string') {
    return {
      isSafe: false,
      leaksDetected: [],
      error: 'SANITIZATION_FAILED: Empty or invalid spoken delivery text'
    };
  }

  const leaks: Array<{ pattern: string; matched: string; index: number }> = [];

  for (const pattern of FORBIDDEN_METADATA_PATTERNS) {
    const matches = Array.from(text.matchAll(new RegExp(pattern.regex, 'gi')));
    for (const m of matches) {
      leaks.push({
        pattern: pattern.name,
        matched: m[0],
        index: m.index ?? -1
      });
    }
  }

  if (leaks.length > 0) {
    return {
      isSafe: false,
      leaksDetected: leaks,
      error: `SANITIZATION_FAILED: Detected ${leaks.length} metadata leakage token(s)`
    };
  }

  return {
    isSafe: true,
    leaksDetected: [],
    sanitizedText: text.trim()
  };
}

/**
 * Defensive Normalizer: Converts pedagogical text with accidental metadata mentions
 * into clean, natural teacher delivery voice before reaching the TTS gate.
 */
export function normalizeSpokenLectureText(text: string): string {
  if (!text) return '';

  return text
    // Replace "tại Slide tiếp theo" / "sang Slide tiếp theo"
    .replace(/(?:tại|sang|ở|đến)\s+[Ss]lide\s+tiếp\s+theo/gi, 'trong nội dung tiếp theo')
    // Replace "tại Slide <num>" / "sang Slide <num>" / "ở Slide <num>"
    .replace(/(?:tại|sang|ở|đến với)\s+[Ss]lide\s+\d+/gi, 'trong nội dung tiếp theo')
    // Replace "Sơ đồ Slide <num>"
    .replace(/Sơ đồ\s+[Ss]lide\s+\d+/gi, 'Sơ đồ trực quan')
    // Replace "Hình ảnh trên Slide <num>"
    .replace(/Hình ảnh trên\s+[Ss]lide\s+\d+/gi, 'Hình ảnh trực quan')
    // Replace generic "[Ss]lide <num>"
    .replace(/[Ss]lide\s+\d+/gi, 'nội dung tiếp theo')
    // Replace standalone "Slide" or "Trang chiếu"
    .replace(/\b[Ss]lide\b/g, 'nội dung')
    .replace(/\bTrang chiếu\b/gi, 'nội dung')
    // Remove structural labels like "Luận điểm:", "Statement:", "Explanation:"
    .replace(/\b(?:Statement|Nêu luận điểm|Luận điểm|Explanation|TeachingPoint)\s*:\s*/gi, '')
    // Remove ID and recommendation patterns
    .replace(/\bTP-[A-Z0-9-]+\b/gi, '')
    .replace(/\bSRC-\d+\b/gi, '')
    .replace(/\(?\bREC-\d+\b\)?/gi, '')
    // Clean up spaces
    .replace(/\s+/g, ' ')
    .trim();
}
