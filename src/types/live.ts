/**
 * Digital Lecturer Engine - Live & Real-Time Reasoning Interface Types
 */

export type LiveModelType = 'gemini-3.8-live' | 'gemini-3.8-live-extended-thinking';

export type LiveInteractionStatus =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'CONSULTING_SOURCES'
  | 'RESPONDING'
  | 'ERROR';

export interface LiveToolCall {
  name: string;
  args: Record<string, unknown>;
  callId: string;
}

export interface LiveToolResponse {
  callId: string;
  name: string;
  result: unknown;
}

export interface LiveSessionContext {
  courseCode: string;
  courseTitle: string;
  lectureTitle: string;
  currentBlockId: string;
  currentSlideNumber: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  pedagogicalFocus: string;
  sourceContext: string;
}

export interface LiveEventLog {
  id: string;
  timestamp: string;
  type: 'STUDENT_AUDIO' | 'LECTURER_AUDIO' | 'TOOL_INVOCATION' | 'THINKING_EVENT' | 'STATUS_CHANGE';
  payload: Record<string, unknown>;
}
