import { RegisteredDocument, SourceLevel } from '../../types/source';
import { assertLessonBelongsToCourse } from './packageResolver';

export interface RegisteredPackageSources {
  packageId: string;
  courseId: string;
  sources: Map<SourceLevel, RegisteredDocument>;
  sourceChecksums: Map<string, string>;
}

const registry = new Map<string, RegisteredPackageSources>();

export function registerPackageSource(
  courseId: string,
  packageId: string,
  source: RegisteredDocument
): RegisteredPackageSources {
  const pkg = assertLessonBelongsToCourse(courseId, packageId);

  if (source.sourceLevel !== 1 && source.sourceLevel !== 3) {
    throw new Error('Package ' + packageId + ' only accepts Level 1 (Word) and Level 3 (PPTX) as authoritative package sources.');
  }

  const expectedType = source.sourceLevel === 1 ? 'DOCX' : 'PPTX';
  if (source.documentType !== expectedType) {
    throw new Error('Level ' + source.sourceLevel + ' requires ' + expectedType + '; received ' + source.documentType + '.');
  }

  // Critical isolation guard: authoritative lesson sources must explicitly
  // declare ownership by the package they are being attached to.
  if (source.metadata.packageId !== packageId) {
    throw new Error(
      'Source ' + source.sourceId + ' is not owned by package ' + packageId +
      '. Expected metadata.packageId=' + packageId +
      ', received ' + (source.metadata.packageId ?? 'MISSING') + '.'
    );
  }

  const existing = registry.get(packageId) ?? {
    packageId,
    courseId,
    sources: new Map<SourceLevel, RegisteredDocument>(),
    sourceChecksums: new Map<string, string>()
  };

  if (existing.courseId !== courseId) {
    throw new Error('Package ' + packageId + ' is registered to another course.');
  }

  const previousChecksum = existing.sourceChecksums.get(source.sourceId);
  if (previousChecksum && previousChecksum !== source.metadata.checksum) {
    throw new Error('Source ' + source.sourceId + ' changed checksum after registration; replacement requires an explicit rebuild.');
  }

  const previousAtLevel = existing.sources.get(source.sourceLevel);
  if (previousAtLevel && previousAtLevel.sourceId !== source.sourceId) {
    throw new Error(
      'Package ' + packageId + ' already has a different Level ' + source.sourceLevel +
      ' source (' + previousAtLevel.sourceId + '). Explicit rebuild/replacement is required.'
    );
  }

  existing.sources.set(source.sourceLevel, source);
  if (source.metadata.checksum) {
    existing.sourceChecksums.set(source.sourceId, source.metadata.checksum);
  }
  registry.set(pkg.packageId, existing);
  return existing;
}

export function getRegisteredPackageSources(packageId: string): RegisteredPackageSources | undefined {
  return registry.get(packageId);
}

export function assertPackageReadyForBuild(packageId: string): RegisteredPackageSources {
  const registered = registry.get(packageId);
  if (!registered) throw new Error('No registered sources for package ' + packageId + '.');
  if (!registered.sources.get(1)) throw new Error('Package ' + packageId + ' is missing required Level 1 DOCX source.');
  if (!registered.sources.get(3)) throw new Error('Package ' + packageId + ' is missing required Level 3 PPTX source.');
  return registered;
}

export function clearPackageSourceRegistryForTests(): void {
  registry.clear();
}
