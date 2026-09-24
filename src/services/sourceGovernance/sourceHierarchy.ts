/**
 * Digital Lecturer Engine - Source Hierarchy & Governance Rules
 */

import { SourceLevel, SOURCE_HIERARCHY_DEFINITIONS, SourceLevelDefinition } from '../../types/source';

export class SourceHierarchyManager {
  public static getDefinition(level: SourceLevel): SourceLevelDefinition {
    return SOURCE_HIERARCHY_DEFINITIONS[level];
  }

  public static getAllDefinitions(): SourceLevelDefinition[] {
    return Object.values(SOURCE_HIERARCHY_DEFINITIONS);
  }

  /**
   * Evaluates authority priority between two source levels.
   * Lower numerical level = higher authority.
   * e.g. Level 1 (Lecture Plan) beats Level 2 (Textbook) for teaching intention/timing,
   * while Level 2 (Textbook) beats Level 3 (PowerPoint) for academic definitions.
   */
  public static compareAuthority(levelA: SourceLevel, levelB: SourceLevel): number {
    return levelA - levelB;
  }

  /**
   * Validates whether a proposed claim is permissible given the source levels provided.
   * Level 1 cannot define theoretical terms if Level 2 is available.
   * Level 3 (Slides) cannot override Level 1 (Lesson Plan) structure silently.
   */
  public static validateSourceRole(
    level: SourceLevel,
    intendedRole: 'DEFINITION' | 'TIMING' | 'VISUAL_STRUCTURE' | 'CANONICAL_QUOTE' | 'POLICY'
  ): { isValid: boolean; warning?: string } {
    switch (intendedRole) {
      case 'DEFINITION':
        if (level > 2) {
          return {
            isValid: false,
            warning: `Academic definitions should be grounded in Level 2 (Main Subject Textbook), but source level is ${level}.`
          };
        }
        break;
      case 'TIMING':
        if (level !== 1) {
          return {
            isValid: false,
            warning: `Timing and lesson requirements must be governed by Level 1 (Original Lecture Plan).`
          };
        }
        break;
      case 'CANONICAL_QUOTE':
        if (level !== 4 && level !== 2) {
          return {
            isValid: true,
            warning: `Canonical quotation should ideally stem from Level 4 (Foundational Source) or Level 2 (Textbook).`
          };
        }
        break;
      default:
        break;
    }
    return { isValid: true };
  }
}
