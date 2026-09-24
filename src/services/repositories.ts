/**
 * Digital Lecturer Engine - Persistence-Ready Repositories
 * Decouples storage concerns from UI and service orchestrators.
 */

import { LecturePackage } from '../types/lecture';
import { RegisteredDocument } from '../types/source';
import { StudentInteractionRecord } from '../types/teaching';
import { AudioCacheEntry } from '../types/audio';

export interface ILecturePackageRepository {
  get(id: string): Promise<LecturePackage | null>;
  save(pkg: LecturePackage): Promise<void>;
  updateStatus(id: string, status: LecturePackage['status']): Promise<void>;
  list(): Promise<LecturePackage[]>;
}

export interface ISourceRepository {
  get(sourceId: string): Promise<RegisteredDocument | null>;
  save(doc: RegisteredDocument): Promise<void>;
  delete(sourceId: string): Promise<boolean>;
  list(): Promise<RegisteredDocument[]>;
}

export interface ISessionRepository {
  recordInteraction(sessionPackageId: string, record: StudentInteractionRecord): Promise<void>;
  getInteractions(sessionPackageId: string): Promise<StudentInteractionRecord[]>;
}

export interface IAudioCacheRepository {
  get(key: string): Promise<AudioCacheEntry | null>;
  set(entry: AudioCacheEntry): Promise<void>;
  has(key: string): Promise<boolean>;
}

// In-Memory Implementation for Phase 1
export class InMemoryLecturePackageRepository implements ILecturePackageRepository {
  private packages: Map<string, LecturePackage> = new Map();

  async get(id: string): Promise<LecturePackage | null> {
    return this.packages.get(id) || null;
  }

  async save(pkg: LecturePackage): Promise<void> {
    this.packages.set(pkg.id, JSON.parse(JSON.stringify(pkg)));
  }

  async updateStatus(id: string, status: LecturePackage['status']): Promise<void> {
    const pkg = this.packages.get(id);
    if (pkg) {
      pkg.status = status;
    }
  }

  async list(): Promise<LecturePackage[]> {
    return Array.from(this.packages.values());
  }
}

export class InMemorySourceRepository implements ISourceRepository {
  private sources: Map<string, RegisteredDocument> = new Map();

  async get(sourceId: string): Promise<RegisteredDocument | null> {
    return this.sources.get(sourceId) || null;
  }

  async save(doc: RegisteredDocument): Promise<void> {
    this.sources.set(doc.sourceId, { ...doc });
  }

  async delete(sourceId: string): Promise<boolean> {
    return this.sources.delete(sourceId);
  }

  async list(): Promise<RegisteredDocument[]> {
    return Array.from(this.sources.values()).sort((a, b) => a.sourceLevel - b.sourceLevel);
  }
}

export const globalLecturePackageRepo = new InMemoryLecturePackageRepository();
export const globalSourceRepo = new InMemorySourceRepository();
