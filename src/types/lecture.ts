/**
 * Digital Lecturer Engine - Canonical LecturePackage Types
 */

import { SourceLevel, RegisteredDocument, SourceClaim } from './source';
import { TeachingBlock } from './teaching';
import { TeachingPoint } from './teachingPoint';
import { QCReport, QCIssue, ApprovalState } from './quality';

export interface LectureObjective {
  id: string;
  code: string;
  statement: string;
  cognitiveLevel: 'KNOWLEDGE' | 'COMPREHENSION' | 'APPLICATION' | 'ANALYSIS' | 'EVALUATION';
  targetAudience: string;
  mappedBlockIds: string[];
}

export interface LectureRequirement {
  id: string;
  type: 'PREREQUISITE' | 'STUDENT_EQUIPMENT' | 'PEDAGOGICAL_ORIENTATION';
  description: string;
}

export interface SlideMapItem {
  slideNumber: number;
  title: string;
  sourceText: string;
  mappedTeachingBlockIds: string[];
  status: 'MAPPED' | 'UNMAPPED' | 'MISMATCHED' | 'DUPLICATE';
  issues: string[];
  previewBullets?: string[];
  suggestedAction?: string;
  sourceDocumentId?: string;
  originalText?: string;
  semanticRole?: string;
  lecturerStandardizedOutline?: string;
  speakerNotes?: string;
  imageMetadata?: {
    hasImage?: boolean;
    isVisualOnly?: boolean;
    description?: string;
  };
  provenance?: {
    sourceId: string;
    locator: {
      slideNumber: number;
    };
  };
}

export interface LecturerDecisionsRecord {
  pedagogicalFocusDecision: 'PARTS_I_AND_III' | 'PARTS_I_AND_II';
  slide6OutlineDecision: 'STANDARDIZE_TO_II' | 'KEEP_AS_PPTX';
  slide10LabelDecision: 'TRANSITION_SLIDE_LESSON_1' | 'STANDALONE_LESSON_2';
  approvedAt?: string;
  approvedBy?: string;
}

export interface PackageSummary {
  id: string;
  title: string;
  courseCode: string;
  status: ApprovalState;
  slideCount: number;
  teachingBlockCount: number;
  durationMinutes: number;
  isActive: boolean;
  sourceIds: string[];
}

export interface PackageRepository {
  packages: Map<string, LecturePackage>;
  activePackageId: string;
}

export interface TimingPlan {
  totalPlannedSeconds: number;
  totalActualSeconds: number;
  remainingSeconds: number;
  varianceSeconds: number;
  blockTimings: Record<string, number>; // blockId -> seconds
  bufferSeconds: number;
  isMismatch: boolean;
  mismatchDescription?: string;
}

export interface LecturePackageMetadata {
  courseCode: string;
  courseTitle: string;
  lectureNumber: number;
  lectureTitle: string;
  academicUnit: string;
  targetDegree: string;
  plannedDurationMinutes: number;
  authorLecturer: string;
  pedagogicalFocus: string;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
  lockedBy?: string;
}

export interface LecturePackage {
  id: string;
  version: number;
  status: ApprovalState;
  metadata: LecturePackageMetadata;
  objectives: LectureObjective[];
  requirements: LectureRequirement[];
  sourceHierarchy: {
    sourceId: string;
    level: SourceLevel;
    title: string;
    role: string;
    filename: string;
  }[];
  lectureStructure: {
    sectionId: string;
    sectionTitle: string;
    allocatedMinutes: number;
    teachingBlockIds: string[];
  }[];
  timingPlan: TimingPlan;
  slideMap: SlideMapItem[];
  teachingBlocks: TeachingBlock[];
  /** Optional runtime-resolved teaching points. Gate B/C artifacts remain authoritative. */
  teachingPoints?: TeachingPoint[];
  interactionPlan: {
    blockId: string;
    checkpointPrompt: string;
    waitSeconds: number;
    fallbackPrompt: string;
  }[];
  transitionPlan: {
    fromBlockId: string;
    toBlockId: string;
    transitionScript: string;
  }[];
  citationMap: Record<string, SourceClaim[]>; // blockId -> claims
  qualityControl: QCReport;
  unresolvedIssues: QCIssue[];
}
