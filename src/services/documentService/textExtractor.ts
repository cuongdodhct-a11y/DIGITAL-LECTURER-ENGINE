/**
 * Digital Lecturer Engine - Document Text Extraction & Normalization
 * Supports DOCX, PPTX, PDF, TXT, and Markdown files.
 */

import JSZip from 'jszip';
import { DocumentType } from '../../types/source';

export interface ExtractedSlideInfo {
  slideNumber: number;
  title: string;
  body: string[];
  speakerNotes?: string[];
  hasImages?: boolean;
  imageCount?: number;
}

export interface ExtractionResult {
  text: string;
  documentType: DocumentType;
  pageCount?: number;
  slideCount?: number;
  slides?: ExtractedSlideInfo[];
  detectedSections?: string[];
}

/**
 * Strips XML tags and decodes common XML entities.
 */
function cleanXmlText(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts speaker notes text from a notesSlide XML document.
 * Excludes system metadata placeholders (slide numbers, dates, footers, headers, thumbnails).
 */
function extractNotesText(notesXml: string): string[] {
  const notesLines: string[] = [];
  const spMatches = notesXml.match(/<p:sp[\s>][\s\S]*?<\/p:sp>/gi) || [];

  for (const sp of spMatches) {
    // Filter out system metadata placeholders (sldNum, sldImg, dt, ftr, hdr)
    const isMetaPlaceholder = /<p:ph[^>]*type=["'](sldNum|sldImg|dt|ftr|hdr)["']/i.test(sp);
    if (isMetaPlaceholder) {
      continue;
    }

    const pMatches = sp.match(/<a:p[\s>][\s\S]*?<\/a:p>/gi) || [];
    for (const p of pMatches) {
      const textMatches = p.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
      const line = textMatches.map(m => cleanXmlText(m)).filter(s => s.length > 0).join('');
      if (line.trim().length > 0) {
        notesLines.push(line.trim());
      }
    }
  }

  // Fallback if no <p:sp> matched but <a:t> tags exist
  if (notesLines.length === 0 && spMatches.length === 0) {
    const textMatches = notesXml.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
    const strings = textMatches.map(m => cleanXmlText(m)).filter(s => s.length > 0);
    if (strings.length > 0) {
      notesLines.push(strings.join(' '));
    }
  }

  return notesLines;
}

/**
 * Extracts slide text, speaker notes, and image metadata from PPTX files using JSZip.
 */
async function extractPptx(buffer: ArrayBuffer | Uint8Array): Promise<ExtractionResult> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles: { num: number; file: JSZip.JSZipObject }[] = [];

  zip.forEach((relativePath, file) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (match) {
      slideFiles.push({ num: parseInt(match[1], 10), file });
    }
  });

  slideFiles.sort((a, b) => a.num - b.num);

  const slides: ExtractedSlideInfo[] = [];
  const textParts: string[] = [];

  for (const { num, file } of slideFiles) {
    const xmlContent = await file.async('string');

    // 1. Extract text blocks inside <a:t> tags
    const matches = xmlContent.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
    const strings = matches.map(m => cleanXmlText(m)).filter(s => s.length > 0);

    const title = strings.length > 0 ? strings[0] : `Slide ${num}`;
    const body = strings.slice(1);

    // 2. Image metadata detection (<p:pic> elements and <a:blip> embeds)
    const picMatches = xmlContent.match(/<p:pic[\s>]/gi) || [];
    const blipMatches = xmlContent.match(/<a:blip[\s>]/gi) || [];
    const imageCount = Math.max(picMatches.length, blipMatches.length);
    const hasImages = imageCount > 0;

    // 3. Speaker notes detection and extraction
    let speakerNotes: string[] = [];
    const slideRelsPath = `ppt/slides/_rels/slide${num}.xml.rels`;
    const relsFile = zip.file(slideRelsPath);
    let notesFile: JSZip.JSZipObject | null = null;

    if (relsFile) {
      const relsXml = await relsFile.async('string');
      const relTargetMatch = relsXml.match(/Type=["'][^"']*\/relationships\/notesSlide["'][^>]*Target=["']([^"']+)["']/i) ||
                             relsXml.match(/Target=["']([^"']+)["'][^>]*Type=["'][^"']*\/relationships\/notesSlide["']/i);
      if (relTargetMatch) {
        const rawTarget = relTargetMatch[1];
        const normalized = rawTarget.replace(/^\.\.\//, 'ppt/').replace(/^\//, '');
        notesFile = zip.file(normalized) || zip.file(`ppt/notesSlides/${rawTarget.split('/').pop()}`);
      }
    }

    if (!notesFile) {
      // Direct naming fallback
      notesFile = zip.file(`ppt/notesSlides/notesSlide${num}.xml`);
    }

    if (notesFile) {
      const notesXml = await notesFile.async('string');
      speakerNotes = extractNotesText(notesXml);
    }

    slides.push({
      slideNumber: num,
      title,
      body,
      speakerNotes: speakerNotes.length > 0 ? speakerNotes : undefined,
      hasImages,
      imageCount
    });

    let slideTextRepresentation = `[Slide ${num}: ${title}]\n${body.join('\n')}\n`;
    if (speakerNotes.length > 0) {
      slideTextRepresentation += `[Speaker Notes]\n${speakerNotes.join('\n')}\n`;
    }
    textParts.push(slideTextRepresentation);
  }

  return {
    text: textParts.join('\n---\n\n'),
    documentType: 'PPTX',
    slideCount: slides.length,
    slides
  };
}

/**
 * Extracts text from DOCX files using JSZip.
 */
async function extractDocx(buffer: ArrayBuffer | Uint8Array): Promise<ExtractionResult> {
  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file('word/document.xml');

  if (!docXmlFile) {
    throw new Error('Invalid DOCX file: word/document.xml not found.');
  }

  const xmlContent = await docXmlFile.async('string');
  // Match paragraphs <w:p>
  const paragraphs: string[] = [];
  const pMatches = xmlContent.match(/<w:p[\s>].*?<\/w:p>/gi) || [];

  for (const p of pMatches) {
    const textMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/gi) || [];
    const pText = textMatches.map(m => cleanXmlText(m)).join('');
    if (pText.trim().length > 0) {
      paragraphs.push(pText.trim());
    }
  }

  const fullText = paragraphs.join('\n\n');
  return {
    text: fullText,
    documentType: 'DOCX',
    pageCount: Math.max(1, Math.ceil(paragraphs.length / 8))
  };
}

/**
 * Normalizes plain text / markdown files.
 */
function extractPlainText(content: string, type: 'TXT' | 'MARKDOWN'): ExtractionResult {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const lines = normalized.split('\n');
  const sections: string[] = [];

  for (const line of lines) {
    const match = line.match(/^#{1,3}\s+(.+)$/);
    if (match) {
      sections.push(match[1]);
    }
  }

  return {
    text: normalized,
    documentType: type,
    pageCount: Math.max(1, Math.ceil(lines.length / 45)),
    detectedSections: sections
  };
}

/**
 * General document extractor orchestrator.
 */
export async function extractDocumentContent(
  filename: string,
  data: ArrayBuffer | string
): Promise<ExtractionResult> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (typeof data === 'string') {
    if (ext === 'md' || ext === 'markdown') {
      return extractPlainText(data, 'MARKDOWN');
    }
    return extractPlainText(data, 'TXT');
  }

  // Binary data
  if (ext === 'pptx') {
    return await extractPptx(data);
  }
  if (ext === 'docx') {
    return await extractDocx(data);
  }
  if (ext === 'pdf') {
    // For PDF binary in browser/node environment, attempt text decode
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(data);
    // Extract readable text stream sequences
    const textBlocks = raw.match(/\(([^()]+)\)\s*Tj/g) || [];
    if (textBlocks.length > 0) {
      const extracted = textBlocks.map(t => t.replace(/^[()Tj\s]+|[()Tj\s]+$/g, '')).join(' ');
      return {
        text: extracted,
        documentType: 'PDF',
        pageCount: 1
      };
    }
    return {
      text: `[PDF Document: ${filename}]\n` + cleanXmlText(raw.slice(0, 10000)),
      documentType: 'PDF',
      pageCount: 1
    };
  }

  // Fallback to text decode
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return extractPlainText(decoder.decode(data), ext === 'md' ? 'MARKDOWN' : 'TXT');
}
