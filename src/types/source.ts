/**
 * Digital Lecturer Engine - Source Types & Hierarchy
 */

export type SourceLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface SourceLevelDefinition {
  level: SourceLevel;
  name: string;
  description: string;
  purpose: string[];
}

export const SOURCE_HIERARCHY_DEFINITIONS: Record<SourceLevel, SourceLevelDefinition> = {
  1: {
    level: 1,
    name: 'Original lecture plan / teaching intention document',
    description: 'Defines lesson structure, teaching goals, objectives, requirements, and timing allocation.',
    purpose: ['teaching objectives', 'teaching requirements', 'lesson structure', 'teaching focus', 'time allocation', 'teaching methods', 'expected learner activities']
  },
  2: {
    level: 2,
    name: 'Main subject textbook / course material',
    description: 'Primary source of academic definitions, theoretical concepts, and systematic arguments.',
    purpose: ['academic definitions', 'theoretical concepts', 'arguments', 'systematic content']
  },
  3: {
    level: 3,
    name: 'PowerPoint presentation',
    description: 'Visual classroom teaching framework, slide progression, keywords, diagrams, and figures.',
    purpose: ['visual teaching structure', 'slide sequence', 'keywords', 'diagrams', 'classroom presentation']
  },
  4: {
    level: 4,
    name: 'Classical / foundational authoritative sources',
    description: 'Original foundational works, canonical quotations, and seminal theoretical texts.',
    purpose: ['original theoretical foundations', 'documented quotations', 'conceptual foundations']
  },
  5: {
    level: 5,
    name: 'Official political / institutional documents',
    description: 'State, ministry, or governing institutional resolutions, guidelines, and contemporary policies.',
    purpose: ['contextualization', 'contemporary policy framework', 'application']
  },
  6: {
    level: 6,
    name: 'Military / institutional reference documents',
    description: 'Specialized organizational directives, field manuals, doctrine, or institutional regulations.',
    purpose: ['professional application', 'military context', 'organizational context']
  },
  7: {
    level: 7,
    name: 'Other reference materials',
    description: 'Supplemental academic articles, case studies, comparative literature, and extensions.',
    purpose: ['supplementary explanation', 'comparison', 'extension']
  }
};

export type DocumentType = 'DOCX' | 'PPTX' | 'PDF' | 'TXT' | 'MARKDOWN';

export type DocumentStatus = 'UPLOADED' | 'EXTRACTED' | 'REGISTERED' | 'ERROR';

export interface RegisteredDocument {
  sourceId: string;
  filename: string;
  documentType: DocumentType;
  sourceLevel: SourceLevel;
  title: string;
  author?: string;
  year?: string | number;
  publisher?: string;
  pageCount?: number;
  slideCount?: number;
  status: DocumentStatus;
  extractedText: string;
  metadata: {
    fileSize: number;
    mimeType?: string;
    extractedAt: string;
    checksum?: string;
    chapterSections?: string[];
  };
}

export type ContentClassification = 
  | 'CORE_CONTENT'
  | 'EXPLANATION'
  | 'EXAMPLE'
  | 'APPLICATION'
  | 'EXTENSION'
  | 'INFERENCE';

export type ClaimConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNSUPPORTED';

export interface SourceClaim {
  id: string;
  claim: string;
  sourceIds: string[];
  sourceType: string;
  sourceLevel: SourceLevel;
  pageOrSlide?: string;
  directQuote?: string;
  confidence: ClaimConfidence;
  contentType: ContentClassification;
  isUnsupported: boolean;
  notes?: string;
}
