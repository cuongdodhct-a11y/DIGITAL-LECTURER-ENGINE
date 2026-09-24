/**
 * Digital Lecturer Engine - Schema Validation Utilities
 */

import { LecturePackage } from '../types/lecture';
import { TeachingBlock } from '../types/teaching';
import { RegisteredDocument } from '../types/source';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateTeachingBlock(block: Partial<TeachingBlock>): ValidationResult {
  const errors: string[] = [];

  if (!block.id || !block.id.startsWith('TB-')) {
    errors.push(`Invalid or missing TeachingBlock id: "${block.id}". Must follow format TB-XXX.`);
  }
  if (!block.topic || block.topic.trim().length < 3) {
    errors.push(`TeachingBlock ${block.id || 'unknown'} has missing or short topic.`);
  }
  if (!block.purpose || block.purpose.trim().length < 5) {
    errors.push(`TeachingBlock ${block.id || 'unknown'} has missing or insufficient purpose.`);
  }
  if (!block.objectiveIds || block.objectiveIds.length === 0) {
    errors.push(`TeachingBlock ${block.id || 'unknown'} must be mapped to at least one objectiveId.`);
  }
  if (!block.lectureText || block.lectureText.trim().length < 20) {
    errors.push(`TeachingBlock ${block.id || 'unknown'} has insufficient lectureText (min 20 chars).`);
  }
  if (typeof block.durationSeconds !== 'number' || block.durationSeconds <= 0) {
    errors.push(`TeachingBlock ${block.id || 'unknown'} has invalid durationSeconds.`);
  }
  if (typeof block.slideStart !== 'number' || typeof block.slideEnd !== 'number' || block.slideStart > block.slideEnd) {
    errors.push(`TeachingBlock ${block.id || 'unknown'} has invalid slide bounds (${block.slideStart} -> ${block.slideEnd}).`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateRegisteredDocument(doc: Partial<RegisteredDocument>): ValidationResult {
  const errors: string[] = [];
  if (!doc.sourceId || !doc.sourceId.startsWith('SRC-')) {
    errors.push(`Invalid sourceId: "${doc.sourceId}". Must start with SRC-.`);
  }
  if (!doc.title || doc.title.trim().length === 0) {
    errors.push(`Source ${doc.sourceId || 'unknown'} missing title.`);
  }
  if (!doc.sourceLevel || doc.sourceLevel < 1 || doc.sourceLevel > 7) {
    errors.push(`Source ${doc.sourceId || 'unknown'} has invalid sourceLevel (must be 1-7).`);
  }
  if (!doc.extractedText || doc.extractedText.trim().length === 0) {
    errors.push(`Source ${doc.sourceId || 'unknown'} has empty extracted text.`);
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateLecturePackage(pkg: Partial<LecturePackage>): ValidationResult {
  const errors: string[] = [];

  if (!pkg.id) errors.push('Missing package id.');
  if (!pkg.metadata?.courseTitle) errors.push('Missing course title.');
  if (!pkg.metadata?.lectureTitle) errors.push('Missing lecture title.');
  if (!pkg.objectives || pkg.objectives.length === 0) errors.push('No objectives defined.');
  if (!pkg.teachingBlocks || pkg.teachingBlocks.length === 0) {
    errors.push('No teaching blocks defined in LecturePackage.');
  } else {
    for (const block of pkg.teachingBlocks) {
      const blockRes = validateTeachingBlock(block);
      if (!blockRes.isValid) {
        errors.push(...blockRes.errors);
      }
    }
  }
  if (!pkg.slideMap || pkg.slideMap.length === 0) errors.push('No slide map present.');
  if (!pkg.timingPlan) errors.push('Missing timing plan.');

  return {
    isValid: errors.length === 0,
    errors
  };
}
