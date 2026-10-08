import express from 'express';
import { courseEngineRouter } from '../src/services/courseEngine/courseEngineRouter';

const app = express();
app.use(express.json());
app.use('/api/course-engine', courseEngineRouter);

const server = app.listen(3101, '127.0.0.1', async () => {
  try {
    const getJson = async (path: string) => {
      const response = await fetch('http://127.0.0.1:3101' + path);
      const text = await response.text();
      let body: any;
      try { body = JSON.parse(text); } catch { body = text; }
      return { response, body };
    };
    const assert = (condition: unknown, message: string) => {
      if (!condition) throw new Error(message);
    };

    const health = await getJson('/api/course-engine/health');
    assert(health.response.ok, 'Course Engine health endpoint failed');
    assert(health.body.ok === true, 'Course Engine health is not ok');
    assert(health.body.packageCount === 10, 'Expected 10 lesson packages');

    const coursePackages = await getJson('/api/course-engine/courses/COURSE-1MD/packages');
    assert(coursePackages.response.ok, 'Course package listing failed');
    assert(coursePackages.body.packages.length === 10, 'Course must expose exactly 10 packages');

    const packageIds = new Set(coursePackages.body.packages.map((p: any) => p.packageId));
    assert(packageIds.size === 10, 'Package IDs must be unique');

    for (let n = 1; n <= 10; n++) {
      const pkg = coursePackages.body.packages[n - 1];
      assert(pkg.lessonNumber === n, `Package order mismatch at lesson ${n}`);
      assert(pkg.packageId === `LPKG-1MD${n}-001`, `Wrong package ID at lesson ${n}`);
      assert(pkg.courseId === 'COURSE-1MD', `Wrong course at lesson ${n}`);
      assert(pkg.commonSourceSetId === 'COMMON-1MD', `Wrong common source set at lesson ${n}`);
      assert(pkg.isolated === true, `Package ${n} is not marked isolated`);
    }

    const p1 = await getJson('/api/course-engine/courses/COURSE-1MD/packages/1');
    assert(p1.response.ok && p1.body.package.packageId === 'LPKG-1MD1-001', '1MD1 package lookup failed');

    const p10 = await getJson('/api/course-engine/courses/COURSE-1MD/packages/10');
    assert(p10.response.ok && p10.body.package.packageId === 'LPKG-1MD10-001', '1MD10 package lookup failed');

    const p7 = await getJson('/api/course-engine/resolve/COURSE-1MD/LPKG-1MD7-001');
    assert(p7.response.ok && p7.body.package.packageId === 'LPKG-1MD7-001', '1MD7 package resolution failed');

    const cross = await getJson('/api/course-engine/resolve/COURSE-1MD/LPKG-CS401-007');
    assert(cross.response.status === 404, 'Cross-package isolation guard did not reject unknown package');

    console.log('PHASE 1 API/ISOLATION SMOKE TEST: PASS');
  } finally {
    server.close();
  }
});

server.on('error', (error) => {
  console.error('API smoke server failed:', error);
  process.exit(1);
});
