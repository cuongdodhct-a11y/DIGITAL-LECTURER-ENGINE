/**
 * Digital Lecturer Engine - Timing Engine & Utilities
 */

import { TimingPlan } from '../types/lecture';
import { TeachingBlock } from '../types/teaching';

export function formatTime(seconds: number): string {
  const isNegative = seconds < 0;
  const abs = Math.abs(Math.round(seconds));
  const mins = Math.floor(abs / 60);
  const secs = abs % 60;
  const prefix = isNegative ? '-' : '';
  return `${prefix}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeDetailed(seconds: number): string {
  const isNegative = seconds < 0;
  const abs = Math.abs(Math.round(seconds));
  const hours = Math.floor(abs / 3600);
  const mins = Math.floor((abs % 3600) / 60);
  const secs = abs % 60;
  const prefix = isNegative ? '-' : '';

  if (hours > 0) {
    return `${prefix}${hours}h ${mins}m ${secs}s`;
  }
  return `${prefix}${mins}m ${secs}s`;
}

export function computeTimingPlan(
  blocks: TeachingBlock[],
  targetDurationMinutes: number
): TimingPlan {
  const targetPlannedSeconds = targetDurationMinutes * 60;
  const blockTimings: Record<string, number> = {};

  let sumBlockSeconds = 0;
  for (const block of blocks) {
    const dur = block.durationSeconds || 0;
    blockTimings[block.id] = dur;
    sumBlockSeconds += dur;
  }

  const discrepancy = Math.abs(sumBlockSeconds - targetPlannedSeconds);
  // Allow a 5% margin before flagging timing mismatch
  const mismatchThreshold = Math.max(120, targetPlannedSeconds * 0.05);
  const isMismatch = discrepancy > mismatchThreshold;

  let mismatchDescription: string | undefined = undefined;
  if (isMismatch) {
    if (sumBlockSeconds > targetPlannedSeconds) {
      mismatchDescription = `Sum of TeachingBlocks (${formatTime(sumBlockSeconds)}) exceeds target lecture duration (${formatTime(targetPlannedSeconds)}) by ${formatTime(discrepancy)}.`;
    } else {
      mismatchDescription = `Sum of TeachingBlocks (${formatTime(sumBlockSeconds)}) is under target lecture duration (${formatTime(targetPlannedSeconds)}) by ${formatTime(discrepancy)}.`;
    }
  }

  return {
    totalPlannedSeconds: sumBlockSeconds,
    totalActualSeconds: 0,
    remainingSeconds: sumBlockSeconds,
    varianceSeconds: sumBlockSeconds - targetPlannedSeconds,
    blockTimings,
    bufferSeconds: Math.max(0, targetPlannedSeconds - sumBlockSeconds),
    isMismatch,
    mismatchDescription,
  };
}
