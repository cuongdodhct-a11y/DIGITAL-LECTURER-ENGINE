/**
 * Digital Lecturer Engine - Teaching Unit & State Machine Types
 */

import { ContentClassification, ClaimConfidence } from './source';

export type TeachingState =
  | 'IDLE'
  | 'INTRODUCTION'
  | 'EXPLAINING'
  | 'CURRENT_TEACHING_POINT'
  | 'WAITING_FOR_POINT_RESPONSE'
  | 'TRANSITION_TO_NEXT_POINT'
  | 'QUESTIONING'
  | 'WAITING_FOR_RESPONSE'
  | 'RESPONDING'
  | 'TRANSITIONING'
  | 'SUMMARIZING'
  | 'CONCLUDING'
  | 'PAUSED'
  | 'ERROR';

export type TeachingEventType =
  | 'TEACHING_POINT_STARTED'
  | 'TEACHING_POINT_COMPLETED'
  | 'TEACHING_POINT_SKIPPED'
  | 'TEACHING_POINT_REPEATED'
  | 'TEACHING_POINT_INTERRUPTED'
  | 'SLIDE_CHANGED'
  | 'BLOCK_CHANGED';

export interface TeachingEvent {
  type: TeachingEventType;
  packageId: string;
  blockId: string;
  slideNumber: number;
  teachingPointId: string;
  timestamp: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface TeachingPointDelivery {
  pointId: string;
  pointType: string;
  title: string;
  statement: string;
  explanation: string;
  emphasis: string;
  example?: string;
  application?: string;
  transition: string;
  hasExample: boolean;
  hasApplication: boolean;
  fullLectureScript: string;
}

export type TeachingMode =
  | 'FULL_LECTURE'
  | 'SUPERVISED_LECTURE'
  | 'TEACHING_ASSISTANT'
  | 'REHEARSAL';

export interface TeachingBlockSourceRef {
  sourceId: string;
  citation: string;
  sourceType: string;
  pageOrSlide?: string;
  confidence: ClaimConfidence;
  contentType: ContentClassification;
  isUnsupported?: boolean;
}

export interface TeachingBlock {
  id: string;
  slideStart: number;
  slideEnd: number;
  topic: string;
  purpose: string;
  objectiveIds: string[];
  keyPoints: string[];
  lectureText: string;
  pedagogicalMethod: string;
  question: string;
  waitSeconds: number;
  expectedResponse: string;
  example: string;
  application: string;
  transition: string;
  durationSeconds: number;
  sources: TeachingBlockSourceRef[];
  contentType: ContentClassification;
  status: 'DRAFT' | 'READY' | 'ACTIVE' | 'FLAGGED' | 'COMPLETED';
  timingMismatch?: boolean;
  notes?: string;
}

export type QuestionCategory =
  | 'ON_TOPIC'
  | 'RELATED'
  | 'CLARIFICATION'
  | 'APPLICATION'
  | 'EXTENSION'
  | 'OFF_TOPIC'
  | 'UNSUPPORTED';

export interface StudentInteractionRecord {
  id: string;
  timestamp: string;
  blockId: string;
  slideNumber: number;
  studentQuestion: string;
  category: QuestionCategory;
  lecturerResponse: string;
  sourceReferences: string[];
  returnTransition: string;
  timeSpentSeconds: number;
}
