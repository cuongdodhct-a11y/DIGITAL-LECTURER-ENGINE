/**
 * Test Helper: Loads canonical 1MĐ1 LecturePackage for tests
 */

import fs from 'fs';
import path from 'path';
import { LecturePackage } from '../../types/lecture';
import { RegisteredDocument } from '../../types/source';
import { buildLecturePackageFromSources } from '../lectureBuilder/lecturePackageBuilder';

export function getCanonical1MD1Package(): LecturePackage {
  const filePath = path.join(process.cwd(), 'data', 'registeredDocuments.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found at ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const docs: RegisteredDocument[] = JSON.parse(raw);
  const pptxDoc = docs.find(d => d.sourceId === 'SRC-006' || (d.documentType === 'PPTX' && d.filename.includes('1.MĐ1')));
  const docxDoc = docs.find(d => d.sourceId === 'SRC-007' || (d.documentType === 'DOCX' && d.filename.includes('1.MĐ1')));

  if (!pptxDoc || !docxDoc) {
    throw new Error('Could not find SRC-006 and SRC-007 documents in registeredDocuments.json');
  }

  return buildLecturePackageFromSources({
    packageId: 'LPKG-1MD1-001',
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
