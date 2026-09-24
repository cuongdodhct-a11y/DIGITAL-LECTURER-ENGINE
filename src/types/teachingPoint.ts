/**
 * Digital Lecturer Engine - Slide-Level Teaching Scripting Types
 * Phase 1.5.4: Canonical Slide-Level TeachingPoint representation
 */

export type TeachingPointType =
  | 'TITLE_ORIENTATION'
  | 'PRIOR_KNOWLEDGE'
  | 'CONCEPT_DEFINITION'
  | 'THEORETICAL_ARGUMENT'
  | 'STRUCTURAL_ANALYSIS'
  | 'CATEGORICAL_DISTINCTION'
  | 'FUNCTION_ANALYSIS'
  | 'HISTORICAL_DEVELOPMENT'
  | 'METHODOLOGICAL_GUIDELINE'
  | 'PRACTICAL_APPLICATION'
  | 'TRANSITION'
  | 'SYNTHESIS_CONCLUSION';

export interface TeachingPointProvenance {
  sourceId: string;
  locator: {
    slideNumber?: number;
    section?: string;
    pageOrParagraph?: string;
  };
}

export interface TeachingPoint {
  id: string;
  packageId: string;
  teachingBlockId: string;
  slideNumber: number;
  sequence: number;
  title: string;
  pointType: TeachingPointType | string;
  sourceText: string;
  explanation: string;
  emphasis: string;
  example?: string;
  application?: string;
  transition: string;
  durationSeconds: number;
  provenance: TeachingPointProvenance;
}

export interface SlideTeachingScript {
  slideNumber: number;
  slideTitle: string;
  semanticRole: string;
  teachingBlockId: string;
  totalDurationSeconds: number;
  points: TeachingPoint[];
}

export interface PackageTeachingScript {
  packageId: string;
  totalPoints: number;
  totalDurationSeconds: number;
  totalDurationMinutes: number;
  teachingBlocksCount: number;
  slidesCount: number;
  pointsByBlock: Record<string, TeachingPoint[]>;
  pointsBySlide: Record<number, TeachingPoint[]>;
}
