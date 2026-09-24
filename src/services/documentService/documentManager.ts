/**
 * Digital Lecturer Engine - Document Manager
 * Manages source registration, hierarchy assignment, and provenance metadata.
 */

import { RegisteredDocument, SourceLevel, DocumentType } from '../../types/source';
import { extractDocumentContent } from './textExtractor';
import { hashString } from '../../utils/hashing';

export class DocumentManager {
  private documents: Map<string, RegisteredDocument> = new Map();
  private nextIdCounter = 1;

  public getAll(): RegisteredDocument[] {
    return Array.from(this.documents.values()).sort((a, b) => a.sourceLevel - b.sourceLevel);
  }

  public getById(sourceId: string): RegisteredDocument | undefined {
    return this.documents.get(sourceId);
  }

  public getByLevel(level: SourceLevel): RegisteredDocument[] {
    return this.getAll().filter(d => d.sourceLevel === level);
  }

  public register(doc: Omit<RegisteredDocument, 'sourceId' | 'status'> & { status?: RegisteredDocument['status'] }): RegisteredDocument {
    const sourceId = `SRC-${this.nextIdCounter.toString().padStart(3, '0')}`;
    this.nextIdCounter++;

    const registered: RegisteredDocument = {
      ...doc,
      sourceId,
      status: doc.status || 'REGISTERED'
    };

    this.documents.set(sourceId, registered);
    return registered;
  }

  public update(sourceId: string, updates: Partial<RegisteredDocument>): RegisteredDocument {
    const existing = this.documents.get(sourceId);
    if (!existing) {
      throw new Error(`Document with ID ${sourceId} not found.`);
    }
    const updated: RegisteredDocument = {
      ...existing,
      ...updates
    };
    this.documents.set(sourceId, updated);
    return updated;
  }

  public delete(sourceId: string): boolean {
    return this.documents.delete(sourceId);
  }

  public clear(): void {
    this.documents.clear();
    this.nextIdCounter = 1;
  }

  /**
   * Helper to process an uploaded raw file into a registered document.
   */
  public async processUpload(params: {
    filename: string;
    data: ArrayBuffer | string;
    sourceLevel: SourceLevel;
    title: string;
    author?: string;
    year?: string | number;
    publisher?: string;
    customDocType?: DocumentType;
  }): Promise<RegisteredDocument> {
    const extracted = await extractDocumentContent(params.filename, params.data);
    const checksum = hashString(typeof params.data === 'string' ? params.data : new Uint8Array(params.data).toString());

    return this.register({
      filename: params.filename,
      documentType: params.customDocType || extracted.documentType,
      sourceLevel: params.sourceLevel,
      title: params.title || params.filename,
      author: params.author,
      year: params.year,
      publisher: params.publisher,
      pageCount: extracted.pageCount,
      slideCount: extracted.slideCount,
      extractedText: extracted.text,
      metadata: {
        fileSize: typeof params.data === 'string' ? params.data.length : params.data.byteLength,
        extractedAt: new Date().toISOString(),
        checksum,
        chapterSections: extracted.detectedSections
      }
    });
  }
}

export const defaultDocumentManager = new DocumentManager();
