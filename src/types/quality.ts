/**
 * Digital Lecturer Engine - Quality Control & Verification Types
 */

export type QCSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type QCIssueStatus =
  | 'ACTIVE'
  | 'RESOLVED'
  | 'WAIVED'
  | 'REOPENED'
  | 'DISAPPEARED'
  | 'RESOLVED_BY_SOURCE_CHANGE';

export type QCCategory =
  | 'OBJECTIVES_PRESENT'
  | 'OBJECTIVES_MAPPED'
  | 'TEACHING_FOCUS_IDENTIFIED'
  | 'LECTURE_SEQUENCE_COHERENT'
  | 'POWERPOINT_SEQUENCE_MAPPED'
  | 'TIMING_PLAN_VALID'
  | 'TEACHING_BLOCKS_COMPLETE'
  | 'SOURCES_ATTACHED'
  | 'UNSUPPORTED_CLAIMS_DETECTED'
  | 'DUPLICATE_CONTENT_DETECTED'
  | 'OUT_OF_TOPIC_DETECTED'
  | 'MISSING_TRANSITIONS_DETECTED'
  | 'QUESTIONS_APPROPRIATE'
  | 'CONCLUSION_PRESENT'
  | 'SOURCE_CONFLICTS_IDENTIFIED'
  | 'SLIDE_CONTENT_MISMATCH';

export interface ResolutionRecord {
  id: string; // e.g. RES-XXXX
  issueId: string; // Stable human-readable issue ID (e.g. QC-SLIDE_CONTENT_MISMATCH-Slide-6)
  issueKey: string; // Stable canonical semantic key (e.g. SLIDE_CONTENT_MISMATCH|SLIDE|Slide-6)
  auditRunId: string;
  issueType: QCCategory;
  severity: QCSeverity;
  lecturerDecision: 'RESOLVED' | 'WAIVED' | 'ACKNOWLEDGED' | 'EXCLUDED';
  lecturerNote: string;
  resolvedAt: string;
  resolvedBy: string;
  affectedSource?: string;
  affectedSlide?: number | string;
  affectedTeachingBlock?: string;
}

export interface QCIssue {
  id: string; // Stable human-readable identifier (e.g. QC-SLIDE_CONTENT_MISMATCH-Slide-6)
  issueKey: string; // Canonical semantic key: `${category}|${targetType}|${targetId}`
  category: QCCategory;
  severity: QCSeverity;
  title: string;
  description: string;
  targetId?: string; // e.g. 'Slide-6', 'TB-001', 'PACKAGE'
  targetType?: 'BLOCK' | 'SLIDE' | 'SOURCE' | 'PACKAGE' | 'OBJECTIVE';
  subTargetId?: string;
  suggestedAction?: string;
  status: QCIssueStatus;
  resolved: boolean;
  resolvedByLecturer?: boolean;
  lecturerComment?: string;
  firstDetectedAt: string;
  firstDetectedRunId: string;
  lastDetectedAt: string;
  lastDetectedRunId: string;
  detectionCount: number;
  resolutionHistory: ResolutionRecord[];
  legacyId?: string; // Legacy sequential identifier (e.g. 'QC-001') for backward compatibility
  evidence?: {
    sourceA?: { id: string; name: string; excerpt: string };
    sourceB?: { id: string; name: string; excerpt: string };
    discrepancy?: string;
  };
}

export interface QCReport {
  auditRunId: string; // Unique execution run ID (e.g. RUN-20260923-XXXX)
  timestamp: string;
  totalChecks: number;
  passedCount: number;
  criticalCount: number; // Count of ACTIVE or REOPENED CRITICAL issues
  warningCount: number;  // Count of ACTIVE or REOPENED WARNING issues
  infoCount: number;     // Count of ACTIVE or REOPENED INFO issues
  resolvedCount: number; // Count of RESOLVED or WAIVED issues
  disappearedCount: number; // Count of DISAPPEARED issues
  canApprove: boolean; // Must be false if any active or reopened CRITICAL issues exist
  issues: QCIssue[];
  summaryNarrative: string;
}

export type ApprovalState =
  | 'DRAFT'
  | 'ANALYZING'
  | 'QC_PENDING'
  | 'NEEDS_REVIEW'
  | 'APPROVED'
  | 'LOCKED'
  | 'TEACHING'
  | 'COMPLETED';
