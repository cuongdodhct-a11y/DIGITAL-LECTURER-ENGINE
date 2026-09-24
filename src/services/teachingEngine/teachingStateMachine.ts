/**
 * Digital Lecturer Engine - Teaching State Machine
 */

import { TeachingState } from '../../types/teaching';

export interface StateTransitionEvent {
  from: TeachingState;
  to: TeachingState;
  action: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export class TeachingStateMachine {
  private currentState: TeachingState = 'IDLE';
  private previousState: TeachingState = 'IDLE';
  private transitionHistory: StateTransitionEvent[] = [];

  public getState(): TeachingState {
    return this.currentState;
  }

  public getPreviousState(): TeachingState {
    return this.previousState;
  }

  public getHistory(): StateTransitionEvent[] {
    return [...this.transitionHistory];
  }

  public transition(targetState: TeachingState, action: string, metadata?: Record<string, unknown>): boolean {
    const valid = this.isValidTransition(this.currentState, targetState);
    if (!valid) {
      console.warn(`[TeachingStateMachine] Invalid transition from ${this.currentState} to ${targetState}`);
      return false;
    }

    this.previousState = this.currentState;
    this.currentState = targetState;

    this.transitionHistory.push({
      from: this.previousState,
      to: targetState,
      action,
      timestamp: new Date().toISOString(),
      metadata
    });

    return true;
  }

  public pause(): boolean {
    if (this.currentState === 'PAUSED' || this.currentState === 'IDLE' || this.currentState === 'CONCLUDING') {
      return false;
    }
    return this.transition('PAUSED', 'LECTURER_PAUSE');
  }

  public resume(): boolean {
    if (this.currentState !== 'PAUSED') {
      return false;
    }
    return this.transition(this.previousState, 'LECTURER_RESUME');
  }

  public reset(): void {
    this.currentState = 'IDLE';
    this.previousState = 'IDLE';
    this.transitionHistory = [];
  }

  private isValidTransition(from: TeachingState, to: TeachingState): boolean {
    if (to === 'ERROR' || to === 'PAUSED') return true;
    if (from === 'PAUSED') return true; // Can resume back

    switch (from) {
      case 'IDLE':
        return to === 'INTRODUCTION' || to === 'EXPLAINING' || to === 'CURRENT_TEACHING_POINT';
      case 'INTRODUCTION':
        return to === 'EXPLAINING' || to === 'CURRENT_TEACHING_POINT' || to === 'QUESTIONING';
      case 'CURRENT_TEACHING_POINT':
        return (
          to === 'CURRENT_TEACHING_POINT' ||
          to === 'WAITING_FOR_POINT_RESPONSE' ||
          to === 'TRANSITION_TO_NEXT_POINT' ||
          to === 'QUESTIONING' ||
          to === 'RESPONDING' ||
          to === 'EXPLAINING' ||
          to === 'TRANSITIONING' ||
          to === 'SUMMARIZING' ||
          to === 'CONCLUDING'
        );
      case 'WAITING_FOR_POINT_RESPONSE':
        return (
          to === 'RESPONDING' ||
          to === 'CURRENT_TEACHING_POINT' ||
          to === 'TRANSITION_TO_NEXT_POINT' ||
          to === 'EXPLAINING'
        );
      case 'TRANSITION_TO_NEXT_POINT':
        return (
          to === 'CURRENT_TEACHING_POINT' ||
          to === 'EXPLAINING' ||
          to === 'SUMMARIZING' ||
          to === 'CONCLUDING'
        );
      case 'EXPLAINING':
        return (
          to === 'CURRENT_TEACHING_POINT' ||
          to === 'TRANSITION_TO_NEXT_POINT' ||
          to === 'QUESTIONING' ||
          to === 'TRANSITIONING' ||
          to === 'SUMMARIZING' ||
          to === 'CONCLUDING' ||
          to === 'EXPLAINING'
        );
      case 'QUESTIONING':
        return (
          to === 'WAITING_FOR_RESPONSE' ||
          to === 'WAITING_FOR_POINT_RESPONSE' ||
          to === 'RESPONDING' ||
          to === 'CURRENT_TEACHING_POINT' ||
          to === 'EXPLAINING'
        );
      case 'WAITING_FOR_RESPONSE':
        return (
          to === 'RESPONDING' ||
          to === 'CURRENT_TEACHING_POINT' ||
          to === 'EXPLAINING' ||
          to === 'TRANSITIONING'
        );
      case 'RESPONDING':
        return (
          to === 'CURRENT_TEACHING_POINT' ||
          to === 'TRANSITION_TO_NEXT_POINT' ||
          to === 'EXPLAINING' ||
          to === 'TRANSITIONING' ||
          to === 'SUMMARIZING'
        );
      case 'TRANSITIONING':
        return (
          to === 'CURRENT_TEACHING_POINT' ||
          to === 'EXPLAINING' ||
          to === 'QUESTIONING' ||
          to === 'SUMMARIZING' ||
          to === 'CONCLUDING'
        );
      case 'SUMMARIZING':
        return (
          to === 'CONCLUDING' ||
          to === 'CURRENT_TEACHING_POINT' ||
          to === 'QUESTIONING' ||
          to === 'EXPLAINING'
        );
      case 'CONCLUDING':
        return to === 'IDLE';
      case 'ERROR':
        return to === 'IDLE';
      default:
        return false;
    }
  }
}
