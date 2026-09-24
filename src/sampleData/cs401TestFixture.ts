/**
 * Phase 1.5.7B — Test Fixture Isolation for CS-401 Demo
 * 
 * Strict boundary:
 * - This fixture is strictly reserved for automated regression tests.
 * - It is NEVER registered in the production PackageRepository.
 * - It is NEVER presented in the production UI package selector.
 * - It CANNOT become the active package in production runtime.
 * - It is NEVER read by ClassroomView or TeachingEngine in production.
 */

import { SAMPLE_DOCUMENTS, createSampleLecturePackage } from './universityLecturePackage';
import { LecturePackage } from '../types/lecture';
import { RegisteredDocument } from '../types/source';

export const TEST_FIXTURE_CS401_PACKAGE_ID = 'LPKG-CS401-007';

export const TEST_FIXTURE_CS401_DOCUMENTS: RegisteredDocument[] = SAMPLE_DOCUMENTS;

export function getCS401TestFixturePackage(): LecturePackage {
  return createSampleLecturePackage();
}
