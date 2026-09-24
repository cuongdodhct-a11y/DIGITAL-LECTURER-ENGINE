/**
 * Phase 1.5.7B — Production Default Package Provider (LPKG-1MD1-001)
 * Provides canonical production package and documents for client/server fallback.
 */

import { LecturePackage } from '../../types/lecture';
import { RegisteredDocument } from '../../types/source';
import registeredDocsJson from '../../../data/registeredDocuments.json';
import { buildLecturePackageFromSources } from '../lectureBuilder/lecturePackageBuilder';

export const PRODUCTION_PACKAGE_ID = 'LPKG-1MD1-001';

export function getProductionDocuments(): RegisteredDocument[] {
  const docs = registeredDocsJson as unknown as RegisteredDocument[];
  return docs.filter(d => ['SRC-006', 'SRC-007'].includes(d.sourceId));
}

export function createProduction1MD1Package(): LecturePackage {
  const docs = registeredDocsJson as unknown as RegisteredDocument[];
  const pptxDoc = docs.find(d => d.sourceId === 'SRC-006');
  const docxDoc = docs.find(d => d.sourceId === 'SRC-007');

  if (!pptxDoc || !docxDoc) {
    throw new Error('Production documents SRC-006 and SRC-007 are missing.');
  }

  return buildLecturePackageFromSources({
    packageId: PRODUCTION_PACKAGE_ID,
    pptxSource: pptxDoc,
    docxSource: docxDoc,
    lecturerDecisions: {
      pedagogicalFocusDecision: 'PARTS_I_AND_III',
      slide6OutlineDecision: 'STANDARDIZE_TO_II',
      slide10LabelDecision: 'TRANSITION_SLIDE_LESSON_1',
      approvedAt: new Date().toISOString(),
      approvedBy: 'Thượng tá, ThS Đỗ Đình Cường'
    }
  });
}
