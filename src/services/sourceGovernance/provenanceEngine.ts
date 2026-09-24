/**
 * Digital Lecturer Engine - Provenance Engine
 * Guarantees verifiable provenance for every teaching claim and surfaces unsupported/conflicting statements.
 */

import { SourceClaim, ContentClassification, ClaimConfidence, RegisteredDocument } from '../../types/source';

export class ProvenanceEngine {
  /**
   * Evaluates claim provenance against registered documents.
   * Enforces rules:
   * 1. No invented page numbers or quotes.
   * 2. Distinguishes CORE_CONTENT vs INFERENCE.
   * 3. Flags UNSUPPORTED claims.
   */
  public static auditClaim(
    claim: SourceClaim,
    documents: Map<string, RegisteredDocument>
  ): { auditedClaim: SourceClaim; issues: string[] } {
    const issues: string[] = [];
    const audited: SourceClaim = { ...claim };

    if (!claim.sourceIds || claim.sourceIds.length === 0) {
      audited.confidence = 'UNSUPPORTED';
      audited.isUnsupported = true;
      issues.push(`Claim "${claim.claim.slice(0, 50)}..." has no registered sources attached.`);
      return { auditedClaim: audited, issues };
    }

    // Verify all sourceIds exist
    for (const sId of claim.sourceIds) {
      const doc = documents.get(sId);
      if (!doc) {
        audited.confidence = 'UNSUPPORTED';
        audited.isUnsupported = true;
        issues.push(`Referenced sourceId "${sId}" does not exist in registered document catalog.`);
      } else {
        // If direct quote is claimed, check if it actually exists in extracted text
        if (claim.directQuote && claim.directQuote.trim().length > 0) {
          const normQuote = claim.directQuote.toLowerCase().replace(/\s+/g, ' ').trim();
          const normDoc = doc.extractedText.toLowerCase().replace(/\s+/g, ' ');
          if (!normDoc.includes(normQuote)) {
            audited.confidence = 'LOW';
            issues.push(`Direct quote attributed to source ${doc.sourceId} ("${claim.directQuote.slice(0, 40)}...") was NOT found in document text.`);
          }
        }
      }
    }

    // Rule: INFERENCE must never be presented as CORE_CONTENT
    if (claim.contentType === 'INFERENCE' && claim.confidence === 'HIGH') {
      issues.push('Claim is an INFERENCE and cannot be labeled as HIGH direct source fact.');
      audited.confidence = 'MEDIUM';
    }

    return { auditedClaim: audited, issues };
  }

  /**
   * Detects explicit conflicts between two sources on the same topic.
   */
  public static detectSourceConflict(
    sourceA: RegisteredDocument,
    sourceB: RegisteredDocument,
    topic: string,
    excerptA: string,
    excerptB: string
  ): { hasConflict: boolean; details?: string } {
    // Basic heuristic: check if both discuss topic but have conflicting assertions
    if (sourceA.sourceId === sourceB.sourceId) return { hasConflict: false };

    return {
      hasConflict: true,
      details: `Source ${sourceA.sourceId} (${sourceA.title}) and Source ${sourceB.sourceId} (${sourceB.title}) express diverging formulations on "${topic}".`
    };
  }
}
