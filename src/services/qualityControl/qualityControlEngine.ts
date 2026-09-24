/**
 * Digital Lecturer Engine - Dedicated Quality Control Engine
 * Strictly audits 16 pedagogical, structural, provenance, and timing dimensions.
 * Enforces rule: Never silently repair issues; surface them with CRITICAL, WARNING, INFO severity.
 * Enforces stable, deterministic issue identities that persist across audit runs and re-evaluations.
 */

import { LecturePackage, SlideMapItem } from '../../types/lecture';
import { TeachingBlock } from '../../types/teaching';
import { QCIssue, QCReport, QCCategory, QCSeverity } from '../../types/quality';

interface RawCandidateFinding {
  category: QCCategory;
  severity: QCSeverity;
  title: string;
  description: string;
  targetId?: string;
  targetType?: QCIssue['targetType'];
  subTargetId?: string;
  suggestedAction?: string;
  evidence?: QCIssue['evidence'];
}

export class QualityControlEngine {
  /**
   * Generates a canonical, deterministic semantic key for an issue.
   * Format: CATEGORY|TARGET_TYPE|TARGET_ID(|SUB_TARGET_ID)
   */
  public static generateIssueKey(
    category: QCCategory,
    targetType?: string,
    targetId?: string,
    subTargetId?: string
  ): string {
    const tType = targetType || 'PACKAGE';
    const tId = targetId || 'PACKAGE';
    const sub = subTargetId ? `|${subTargetId}` : '';
    return `${category}|${tType}|${tId}${sub}`;
  }

  /**
   * Generates a deterministic, human-readable stable identifier for an issue.
   * Format: QC-CATEGORY-TARGET_ID(-SUB_TARGET_ID)
   */
  public static generateIssueId(
    category: QCCategory,
    targetType?: string,
    targetId?: string,
    subTargetId?: string
  ): string {
    const rawTarget = targetId || targetType || 'PACKAGE';
    const cleanTarget = rawTarget.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanSub = subTargetId ? `-${subTargetId.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
    return `QC-${category}-${cleanTarget}${cleanSub}`;
  }

  /**
   * Generates a unique execution identifier for a QC audit run.
   */
  public static generateAuditRunId(): string {
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RUN-${ts}-${rand}`;
  }

  /**
   * Runs the full 16-point Quality Control audit against a candidate LecturePackage.
   * Reconciles current findings against existing issue registry to maintain persistent identity,
   * audit history, and lecturer sign-off integrity.
   */
  public static audit(pkg: LecturePackage): QCReport {
    const rawCandidates: RawCandidateFinding[] = [];

    const addRawCandidate = (
      category: QCCategory,
      severity: QCSeverity,
      title: string,
      description: string,
      targetId?: string,
      targetType?: QCIssue['targetType'],
      subTargetId?: string,
      suggestedAction?: string,
      evidence?: QCIssue['evidence']
    ) => {
      rawCandidates.push({
        category,
        severity,
        title,
        description,
        targetId,
        targetType,
        subTargetId,
        suggestedAction,
        evidence
      });
    };

    // 1. Objectives present
    if (!pkg.objectives || pkg.objectives.length === 0) {
      addRawCandidate(
        'OBJECTIVES_PRESENT',
        'CRITICAL',
        'Missing Lesson Objectives',
        'The lecture package has no pedagogical objectives defined from Level 1 source.',
        'PACKAGE',
        'PACKAGE',
        undefined,
        'Define minimum 2-3 specific learning objectives based on the lecture syllabus.'
      );
    }

    // 2. Objectives mapped to content
    if (pkg.objectives && pkg.objectives.length > 0) {
      for (const obj of pkg.objectives) {
        const mapped = (pkg.teachingBlocks || []).filter(b => b.objectiveIds?.includes(obj.id));
        if (mapped.length === 0) {
          addRawCandidate(
            'OBJECTIVES_MAPPED',
            'WARNING',
            `Unmapped Objective: ${obj.code}`,
            `Objective "${obj.statement}" is not addressed by any TeachingBlock in the current plan.`,
            obj.id,
            'OBJECTIVE',
            undefined,
            'Assign this objective to an existing or new TeachingBlock.'
          );
        }
      }
    }

    // 3. Teaching focus identified
    if (!pkg.metadata?.pedagogicalFocus || pkg.metadata.pedagogicalFocus.trim().length < 5) {
      addRawCandidate(
        'TEACHING_FOCUS_IDENTIFIED',
        'WARNING',
        'Teaching Focus Undefined',
        'No clear didactic focus specified in metadata. The lecturer must designate primary conceptual focal points.',
        'PACKAGE',
        'PACKAGE',
        undefined,
        'Specify the primary emphasis (e.g. theoretical derivation vs practical analysis).'
      );
    }

    // 4. Lecture sequence coherent
    const blocks = pkg.teachingBlocks || [];
    for (let i = 0; i < blocks.length - 1; i++) {
      const current = blocks[i];
      const next = blocks[i + 1];
      if (current.slideEnd > next.slideStart) {
        addRawCandidate(
          'LECTURE_SEQUENCE_COHERENT',
          'WARNING',
          `Slide Sequence Inversion between ${current.id} and ${next.id}`,
          `Block ${current.id} spans slides ${current.slideStart}-${current.slideEnd}, while next block ${next.id} starts at slide ${next.slideStart}.`,
          current.id,
          'BLOCK',
          next.id,
          'Realign slide boundaries or reorder teaching blocks.'
        );
      }
    }

    // 5. PowerPoint sequence mapped
    const slideMap = pkg.slideMap || [];
    const unmappedSlides = slideMap.filter(s => s.status === 'UNMAPPED' || s.mappedTeachingBlockIds.length === 0);
    for (const unmapped of unmappedSlides) {
      addRawCandidate(
        'POWERPOINT_SEQUENCE_MAPPED',
        'WARNING',
        `PowerPoint Slide ${unmapped.slideNumber} Unmapped`,
        `Slide ${unmapped.slideNumber} ("${unmapped.title}") has no associated TeachingBlock.`,
        `Slide-${unmapped.slideNumber}`,
        'SLIDE',
        undefined,
        'Map this slide to a relevant TeachingBlock or mark as non-instructional.'
      );
    }

    // 6. Timing plan valid
    if (pkg.timingPlan?.isMismatch) {
      addRawCandidate(
        'TIMING_PLAN_VALID',
        'WARNING',
        'Timing Mismatch Detected',
        pkg.timingPlan.mismatchDescription || 'Teaching block durations do not match target lecture duration.',
        'PACKAGE',
        'PACKAGE',
        undefined,
        'Adjust individual TeachingBlock durations or modify target lecture time.'
      );
    }

    // 7. TeachingBlocks complete
    for (const b of blocks) {
      if (!b.lectureText || b.lectureText.length < 50) {
        addRawCandidate(
          'TEACHING_BLOCKS_COMPLETE',
          'CRITICAL',
          `TeachingBlock ${b.id} has insufficient lecture text`,
          `Block "${b.topic}" has only ${b.lectureText?.length || 0} characters of script. Must have substantive pedagogical exposition.`,
          b.id,
          'BLOCK',
          'TEXT_LENGTH',
          'Expand lecturer script with source-grounded explanation.'
        );
      }
      if (!b.purpose) {
        addRawCandidate(
          'TEACHING_BLOCKS_COMPLETE',
          'WARNING',
          `TeachingBlock ${b.id} missing pedagogical purpose`,
          `No explicit pedagogical intention given for block "${b.topic}".`,
          b.id,
          'BLOCK',
          'PURPOSE',
          'Add learning purpose for this block.'
        );
      }
    }

    // 8. Sources attached
    for (const b of blocks) {
      if (!b.sources || b.sources.length === 0) {
        addRawCandidate(
          'SOURCES_ATTACHED',
          'CRITICAL',
          `TeachingBlock ${b.id} Has No Sources Attached`,
          `Block "${b.topic}" does not reference any registered Level 1-7 document. Violates Source Governance Rule.`,
          b.id,
          'BLOCK',
          undefined,
          'Attach verifiable source references from the registered documents catalog.'
        );
      }
    }

    // 9. Unsupported claims detected (MISSING_SOURCE_SUPPORT)
    for (const b of blocks) {
      const unsupported = (b.sources || []).filter(s => s.isUnsupported || s.confidence === 'UNSUPPORTED');
      if (unsupported.length > 0) {
        addRawCandidate(
          'UNSUPPORTED_CLAIMS_DETECTED',
          'CRITICAL',
          `MISSING_SOURCE_SUPPORT in Block ${b.id}`,
          `Block "${b.topic}" contains claims with status UNSUPPORTED. The system must not teach unsubstantiated material.`,
          b.id,
          'BLOCK',
          undefined,
          'Verify with an authoritative textbook/source or remove unsupported assertion.'
        );
      }
    }

    // 10. Duplicate content detected
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        if (blocks[i].topic.trim().toLowerCase() === blocks[j].topic.trim().toLowerCase()) {
          addRawCandidate(
            'DUPLICATE_CONTENT_DETECTED',
            'WARNING',
            `Duplicate Topic Detected (${blocks[i].id} and ${blocks[j].id})`,
            `Both blocks share the exact topic: "${blocks[i].topic}". Ensure this is intentional progression rather than redundant duplication.`,
            blocks[j].id,
            'BLOCK',
            blocks[i].id,
            'Differentiate subtopics or combine blocks.'
          );
        }
      }
    }

    // 11. Out-of-topic content detected
    for (const b of blocks) {
      if (b.contentType === 'EXTENSION' && b.durationSeconds > 600) {
        addRawCandidate(
          'OUT_OF_TOPIC_DETECTED',
          'INFO',
          `Extended Peripheral Content in ${b.id}`,
          `Block "${b.topic}" is marked as EXTENSION but allocated ${Math.round(b.durationSeconds / 60)} minutes. Check if it risks drifting off syllabus focus.`,
          b.id,
          'BLOCK',
          undefined,
          'Review whether extension time should be compressed to preserve core content.'
        );
      }
    }

    // 12. Missing transitions detected
    for (let i = 0; i < blocks.length - 1; i++) {
      if (!blocks[i].transition || blocks[i].transition.trim().length < 10) {
        addRawCandidate(
          'MISSING_TRANSITIONS_DETECTED',
          'WARNING',
          `Missing Transition Script in ${blocks[i].id}`,
          `Block ${blocks[i].id} lacks an articulated pedagogical transition to lead into ${blocks[i + 1].id}.`,
          blocks[i].id,
          'BLOCK',
          undefined,
          'Provide a connecting bridge explaining how this topic leads into the next.'
        );
      }
    }

    // 13. Questions appropriate
    for (const b of blocks) {
      if (!b.question || b.question.trim().length === 0) {
        addRawCandidate(
          'QUESTIONS_APPROPRIATE',
          'INFO',
          `No Checkpoint Question in ${b.id}`,
          `Block "${b.topic}" does not include a Socratic or verification question for students.`,
          b.id,
          'BLOCK',
          'MISSING_QUESTION',
          'Consider inserting a targeted check-for-understanding question.'
        );
      } else if (b.waitSeconds <= 0) {
        addRawCandidate(
          'QUESTIONS_APPROPRIATE',
          'INFO',
          `Zero Wait Time for Question in ${b.id}`,
          `Block ${b.id} has question "${b.question.slice(0, 30)}..." but waitSeconds is 0.`,
          b.id,
          'BLOCK',
          'ZERO_WAIT',
          'Set a pedagogical wait time (e.g. 5-15 seconds) to allow students to reflect.'
        );
      }
    }

    // 14. Conclusion present
    const lastBlock = blocks[blocks.length - 1];
    const hasConclusion = blocks.some(b => 
      b.topic.toLowerCase().includes('kết luận') || 
      b.topic.toLowerCase().includes('tổng kết') ||
      b.topic.toLowerCase().includes('conclusion') ||
      b.topic.toLowerCase().includes('summary')
    );
    if (!hasConclusion && blocks.length > 0) {
      addRawCandidate(
        'CONCLUSION_PRESENT',
        'WARNING',
        'Missing Formal Lesson Summary / Conclusion',
        'The lecture does not conclude with a synthesis or summary teaching block.',
        lastBlock?.id || 'PACKAGE',
        'BLOCK',
        undefined,
        'Add a dedicated synthesis block summarizing key learning takeaways.'
      );
    }

    // 15. Source conflicts identified (SOURCE_CONFLICT)
    if (pkg.unresolvedIssues) {
      const explicitConflicts = pkg.unresolvedIssues.filter(i => i.category === 'SOURCE_CONFLICTS_IDENTIFIED');
      for (const c of explicitConflicts) {
        addRawCandidate(
          'SOURCE_CONFLICTS_IDENTIFIED',
          c.severity || 'CRITICAL',
          c.title,
          c.description,
          c.targetId,
          c.targetType || 'SOURCE',
          c.subTargetId,
          c.suggestedAction,
          c.evidence
        );
      }
    }

    // 16. Slide/Content mismatch detected (SLIDE_CONTENT_MISMATCH)
    for (const s of slideMap) {
      if (s.status === 'MISMATCHED') {
        addRawCandidate(
          'SLIDE_CONTENT_MISMATCH',
          'CRITICAL',
          `SLIDE_TOPIC_MISMATCH on Slide ${s.slideNumber}: "${s.title}"`,
          `Slide ${s.slideNumber} content does not match the assigned TeachingBlock topic or syllabus context. Do not silently delete.`,
          `Slide-${s.slideNumber}`,
          'SLIDE',
          undefined,
          s.suggestedAction || 'Lecturer must verify if slide belongs to another lecture or needs realignment.'
        );
      }
    }

    // -------------------------------------------------------------
    // RECONCILIATION AGAINST HISTORICAL ISSUE REGISTRY
    // -------------------------------------------------------------
    const currentAuditRunId = QualityControlEngine.generateAuditRunId();
    const now = new Date().toISOString();

    // 1. Index previously recorded issues
    const existingMap = new Map<string, QCIssue>();
    const previousIssues: QCIssue[] = [
      ...(pkg.qualityControl?.issues || []),
      ...(pkg.unresolvedIssues || [])
    ];

    for (const prev of previousIssues) {
      const key = prev.issueKey || QualityControlEngine.generateIssueKey(
        prev.category,
        prev.targetType,
        prev.targetId,
        prev.subTargetId
      );
      if (!existingMap.has(key)) {
        // Upgrade legacy ID if present
        if (!prev.id || prev.id.startsWith('QC-00')) {
          prev.legacyId = prev.id;
          prev.id = QualityControlEngine.generateIssueId(
            prev.category,
            prev.targetType,
            prev.targetId,
            prev.subTargetId
          );
        }
        prev.issueKey = key;
        existingMap.set(key, prev);
      }
    }

    const currentDetectedKeys = new Set<string>();
    const reconciledIssues: QCIssue[] = [];

    // 2. Process current findings
    for (const candidate of rawCandidates) {
      const key = QualityControlEngine.generateIssueKey(
        candidate.category,
        candidate.targetType,
        candidate.targetId,
        candidate.subTargetId
      );
      const stableId = QualityControlEngine.generateIssueId(
        candidate.category,
        candidate.targetType,
        candidate.targetId,
        candidate.subTargetId
      );
      currentDetectedKeys.add(key);

      const existing = existingMap.get(key);
      if (existing) {
        // Re-detected existing issue: preserve identity and resolution history
        existing.lastDetectedAt = now;
        existing.lastDetectedRunId = currentAuditRunId;
        existing.detectionCount = (existing.detectionCount || 1) + 1;
        existing.title = candidate.title;
        existing.description = candidate.description;
        existing.suggestedAction = candidate.suggestedAction;
        existing.evidence = candidate.evidence;

        if (existing.status === 'DISAPPEARED' || existing.status === 'RESOLVED_BY_SOURCE_CHANGE') {
          // Reopened: defect was previously gone or resolved by change, but has returned
          existing.status = 'REOPENED';
          existing.resolved = false;
        } else if (existing.status === 'RESOLVED' || existing.status === 'WAIVED') {
          // Explicitly signed off by lecturer: preserve resolution state
          existing.resolved = true;
        } else {
          existing.status = existing.status || 'ACTIVE';
          existing.resolved = false;
        }

        reconciledIssues.push(existing);
      } else {
        // Brand new issue
        const newIssue: QCIssue = {
          id: stableId,
          issueKey: key,
          category: candidate.category,
          severity: candidate.severity,
          title: candidate.title,
          description: candidate.description,
          targetId: candidate.targetId,
          targetType: candidate.targetType,
          subTargetId: candidate.subTargetId,
          suggestedAction: candidate.suggestedAction,
          status: 'ACTIVE',
          resolved: false,
          firstDetectedAt: now,
          firstDetectedRunId: currentAuditRunId,
          lastDetectedAt: now,
          lastDetectedRunId: currentAuditRunId,
          detectionCount: 1,
          resolutionHistory: [],
          evidence: candidate.evidence
        };
        reconciledIssues.push(newIssue);
      }
    }

    // 3. Mark issues that disappeared in this audit run
    for (const [key, existing] of existingMap.entries()) {
      if (!currentDetectedKeys.has(key)) {
        if (existing.status === 'ACTIVE' || existing.status === 'REOPENED') {
          existing.status = 'DISAPPEARED';
          existing.resolved = true;
        }
        reconciledIssues.push(existing);
      }
    }

    // 4. Stable deterministic sort:
    // Status priority: ACTIVE/REOPENED (0) -> WAIVED/RESOLVED (1) -> DISAPPEARED (2)
    // Severity priority: CRITICAL (0) -> WARNING (1) -> INFO (2)
    // Tie-break: issueKey alphabetical
    const statusWeight: Record<string, number> = {
      ACTIVE: 0,
      REOPENED: 0,
      WAIVED: 1,
      RESOLVED: 1,
      RESOLVED_BY_SOURCE_CHANGE: 2,
      DISAPPEARED: 2
    };
    const severityWeight: Record<QCSeverity, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 };

    reconciledIssues.sort((a, b) => {
      const swA = statusWeight[a.status] ?? 0;
      const swB = statusWeight[b.status] ?? 0;
      if (swA !== swB) return swA - swB;

      const svA = severityWeight[a.severity] ?? 1;
      const svB = severityWeight[b.severity] ?? 1;
      if (svA !== svB) return svA - svB;

      return a.issueKey.localeCompare(b.issueKey);
    });

    const activeCritical = reconciledIssues.filter(
      i => i.severity === 'CRITICAL' && (i.status === 'ACTIVE' || i.status === 'REOPENED')
    );
    const activeWarning = reconciledIssues.filter(
      i => i.severity === 'WARNING' && (i.status === 'ACTIVE' || i.status === 'REOPENED')
    );
    const activeInfo = reconciledIssues.filter(
      i => i.severity === 'INFO' && (i.status === 'ACTIVE' || i.status === 'REOPENED')
    );
    const resolvedCount = reconciledIssues.filter(
      i => i.status === 'RESOLVED' || i.status === 'WAIVED'
    ).length;
    const disappearedCount = reconciledIssues.filter(
      i => i.status === 'DISAPPEARED' || i.status === 'RESOLVED_BY_SOURCE_CHANGE'
    ).length;

    const criticalCount = activeCritical.length;
    const warningCount = activeWarning.length;
    const infoCount = activeInfo.length;
    const canApprove = criticalCount === 0;

    let summaryNarrative = '';
    if (criticalCount > 0) {
      summaryNarrative = `Quality Control gate failed: ${criticalCount} active CRITICAL issue(s) detected. The lecture package cannot be approved or locked until resolved.`;
    } else if (warningCount > 0) {
      summaryNarrative = `Quality Control passed with ${warningCount} WARNING(s). Lecturer review recommended before locking.`;
    } else {
      summaryNarrative = 'All Quality Control checks passed successfully. The lecture package is verified and ready for approval.';
    }

    return {
      auditRunId: currentAuditRunId,
      timestamp: now,
      totalChecks: 16,
      passedCount: Math.max(0, 16 - (criticalCount > 0 ? 1 : 0) - (warningCount > 0 ? 1 : 0)),
      criticalCount,
      warningCount,
      infoCount,
      resolvedCount,
      disappearedCount,
      canApprove,
      issues: reconciledIssues,
      summaryNarrative
    };
  }
}
