import { describe, it, expect } from 'vitest';
import { classicalMDS, sammonMapping, nonMetricMDS, sammonMappingDM, landmarkMDS } from './mds.js';
import { expectKeys } from './__fixtures__/helpers.js';
import ref from './__fixtures__/reference.json' with { type: 'json' };

const data = []; for (let i = 0; i < 12; i++) data.push({ x1: i, x2: i * 0.5, x3: Math.sin(i), x4: i % 3 });

describe('classicalMDS', () => {
  it('null <5', () => expect(classicalMDS(data.slice(0, 3), ['x1', 'x2'])).toBeNull());
  it('contract keys', () => expectKeys(classicalMDS(data, ['x1', 'x2', 'x3', 'x4']), ['test', 'points', 'nDimensions', 'stress', 'n', 'apa']));
  it('points correct count', () => { const r = classicalMDS(data, ['x1', 'x2']); expect(r.points).toHaveLength(data.length); });
  it('stress >= 0', () => { const r = classicalMDS(data, ['x1', 'x2']); expect(r.stress).toBeGreaterThanOrEqual(0); });
  it('points have correct dimensions', () => { const r = classicalMDS(data, ['x1', 'x2']); if (r && r.points && r.points[0]) expect(r.points[0]).toHaveLength(2); });
});

describe('classicalMDS matches an independent numpy double-centering + eigendecomposition exactly', () => {
  it('stress matches on a 7-point 3-variable example', () => {
    const e = ref.mds.classical_basic;
    const rows = e.data.map(([a, b, c]) => ({ a, b, c }));
    const r = classicalMDS(rows, ['a', 'b', 'c'], { nDimensions: 2 });
    expect(r.stress).toBeCloseTo(e.stress, 4);
  });
});

describe('sammonMapping', () => {
  it('null <5', () => expect(sammonMapping(data.slice(0, 3), ['x1', 'x2'])).toBeNull());
  it('contract keys', () => expectKeys(sammonMapping(data, ['x1', 'x2']), ['test', 'points', 'nDimensions', 'n', 'apa']));
  it('points correct count', () => { const r = sammonMapping(data, ['x1', 'x2']); expect(r.points).toHaveLength(data.length); });
  it('stress >= 0', () => { const r = sammonMapping(data, ['x1', 'x2']); if (r && r.stress !== undefined) expect(r.stress).toBeGreaterThanOrEqual(0); });
});

describe('nonMetricMDS', () => {
  it('null <6', () => expect(nonMetricMDS(data.slice(0, 4), ['x1', 'x2'])).toBeNull());
  it('contract keys', () => expectKeys(nonMetricMDS(data, ['x1', 'x2']), ['test', 'points', 'nDimensions', 'stress', 'n', 'apa']));
  it('stress >= 0', () => { const r = nonMetricMDS(data, ['x1', 'x2']); expect(r.stress).toBeGreaterThanOrEqual(0); });
  it('points array present', () => { const r = nonMetricMDS(data, ['x1', 'x2']); if (r) expect(Array.isArray(r.points)).toBe(true); });
});

describe('sammonMapping', () => {
  const D = [[0,3,4],[3,0,5],[4,5,0]];
  it('contract keys', () => expectKeys(sammonMappingDM(D, { maxIter: 10 }), ['test','points','stress','n','apa']));
  it('null <3', () => expect(sammonMappingDM([[0,1],[1,0]])).toBeNull());
  it('stress >= 0', () => { const r = sammonMappingDM(D, { maxIter: 10 }); if (r) expect(r.stress).toBeGreaterThanOrEqual(0); });
});
describe('landmarkMDS', () => {
  const D = [[0,3,4,2,5],[3,0,5,4,1],[4,5,0,3,2],[2,4,3,0,4],[5,1,2,4,0]];
  it('contract keys', () => expectKeys(landmarkMDS(D, { nLandmarks: 3 }), ['test','points','nLandmarks','n','apa']));
  it('null too small', () => expect(landmarkMDS([[0,1],[1,0]])).toBeNull());
  it('n points equals input', () => { const D2 = [[0,3,4,2,5],[3,0,5,4,1],[4,5,0,3,2],[2,4,3,0,4],[5,1,2,4,0]]; const r = landmarkMDS(D2, { nLandmarks: 3 }); if (r && r.points && r.n) expect(r.points.length).toBe(r.n); });
});

describe('sammonMappingDM', () => {
  const D = [[0,3,4],[3,0,5],[4,5,0]];
  it('contract keys', () => { const r = sammonMappingDM(D, { maxIter: 5 }); if (r) expectKeys(r, ['test','points','stress','n','apa']); });
  it('stress non-negative', () => { const r = sammonMappingDM(D, { maxIter: 5 }); if (r) expect(r.stress).toBeGreaterThanOrEqual(0); });
  it('points has n rows', () => { const r = sammonMappingDM(D, { maxIter: 5 }); if (r) expect(r.points.length).toBe(D.length); });
  it('null for small D', () => expect(sammonMappingDM([[0,1],[1,0]], { maxIter: 5 })).toBeNull());
});

describe('landmarkMDS produces a real distance-preserving embedding', () => {
  it('reconstructs pairwise distances of a 2D configuration', () => {
    const P = Array.from({ length: 14 }, (_, i) => [Math.cos(i), Math.sin(i * 1.3) + (i % 3)]);
    const D = P.map(a => P.map(b => Math.hypot(a[0] - b[0], a[1] - b[1])));
    const r = landmarkMDS(D, { nLandmarks: 7, nDim: 2, seed: 2 });
    const dist = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1]);
    // distances are rotation/reflection invariant, so embedded ≈ original
    expect(dist(r.points[0], r.points[5])).toBeCloseTo(D[0][5], 1);
    expect(dist(r.points[3], r.points[10])).toBeCloseTo(D[3][10], 1);
  });
});

describe('nonMetricMDS does real isotonic (rank-based) scaling', () => {
  it('recovers latent structure from monotonically-distorted dissimilarities', () => {
    // true 2D config -> true distances -> monotone (nonlinear) distortion as dissimilarities
    const P = Array.from({ length: 14 }, (_, i) => [Math.cos(i * 0.9), Math.sin(i * 0.7) + (i % 4) * 0.5]);
    const trueD = P.map(a => P.map(b => Math.hypot(a[0] - b[0], a[1] - b[1])));
    const diss = trueD.map(r => r.map(v => Math.pow(v, 1.6))); // monotone distortion
    // data/vars are random noise: a metric MDS that ignores `dissimilarities` cannot recover trueD
    const data = Array.from({ length: 14 }, () => ({ a: Math.random(), b: Math.random() }));
    const r = nonMetricMDS(data, ['a', 'b'], { dissimilarities: diss, nDimensions: 2, maxIter: 200, seed: 1 });
    const rd = (i, j) => Math.hypot(r.points[i][0] - r.points[j][0], r.points[i][1] - r.points[j][1]);
    const xs = [], ys = [];
    for (let i = 0; i < 14; i++) for (let j = i + 1; j < 14; j++) { xs.push(rd(i, j)); ys.push(trueD[i][j]); }
    const mx = xs.reduce((s, v) => s + v, 0) / xs.length, my = ys.reduce((s, v) => s + v, 0) / ys.length;
    let cov = 0, vx = 0, vy = 0;
    for (let k = 0; k < xs.length; k++) { cov += (xs[k] - mx) * (ys[k] - my); vx += (xs[k] - mx) ** 2; vy += (ys[k] - my) ** 2; }
    const corr = cov / Math.sqrt(vx * vy);
    expect(corr).toBeGreaterThan(0.9); // embedded distances track the true latent distances
  });
});

describe('hardening — invalid inputs', () => {
  it('classicalMDS rejects null/short/few vars', () => {
    expect(classicalMDS(null, ['x1', 'x2'])).toBeNull();
    expect(classicalMDS(data.slice(0, 3), ['x1', 'x2'])).toBeNull();
    expect(classicalMDS(data, null)).toBeNull();
    expect(classicalMDS(data, ['x1'])).toBeNull();
  });
  it('sammonMapping rejects null/short', () => {
    expect(sammonMapping(null, ['x1', 'x2'])).toBeNull();
    expect(sammonMapping(data.slice(0, 3), ['x1', 'x2'])).toBeNull();
  });
  it('nonMetricMDS rejects null/short', () => {
    expect(nonMetricMDS(null, ['x1', 'x2'])).toBeNull();
    expect(nonMetricMDS(data.slice(0, 4), ['x1', 'x2'])).toBeNull();
  });
  it('sammonMappingDM rejects null/short', () => {
    expect(sammonMappingDM(null)).toBeNull();
    expect(sammonMappingDM([[0, 1], [1, 0]])).toBeNull();
  });
  it('landmarkMDS rejects null/too small', () => {
    expect(landmarkMDS(null)).toBeNull();
    expect(landmarkMDS([[0, 1], [1, 0]])).toBeNull();
  });
});

describe('sammonMapping numerical stability on real-world-shaped data', () => {
  it('stays finite on a large dataset with many near-duplicate rows (regression: used to diverge to all-NaN)', () => {
    // Mirrors the shape that broke this in production: n in the hundreds, and
    // several variables with low cardinality (e.g. "years since X") so many
    // rows share identical or near-identical values — some pairwise distances
    // land essentially at zero while others are much larger.
    const nTemplates = 40, perTemplate = 10;
    const bigData = [];
    for (let t = 0; t < nTemplates; t++) {
      const yrsPhd = t % 20;
      const yrsService = Math.floor(t / 2);
      for (let k = 0; k < perTemplate; k++) {
        const salary = 50000 + t * 1500 + (k % 3 === 0 ? 0 : k * 7); // exact duplicates when k % 3 === 0
        bigData.push({ yrsPhd, yrsService, salary });
      }
    }
    const r = sammonMapping(bigData, ['yrsPhd', 'yrsService', 'salary'], { nDimensions: 2 });
    expect(r).not.toBeNull();
    expect(r.points).toHaveLength(bigData.length);
    for (const p of r.points) for (const v of p) expect(Number.isFinite(v)).toBe(true);
  });

  it('reduces Sammon stress rather than increasing it (regression: gradient direction was inverted)', () => {
    const stress = (points, D, n, nDimensions) => {
      let num = 0, c = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        let dh = 0; for (let d = 0; d < nDimensions; d++) dh += (points[i][d] - points[j][d]) ** 2;
        dh = Math.sqrt(dh);
        num += (D[i][j] - dh) ** 2 / D[i][j]; c += D[i][j];
      }
      return num / c;
    };
    const vars = ['x1', 'x2', 'x3', 'x4'];
    const n = data.length, m = vars.length;
    const X = data.map(r => vars.map(v => +r[v]));
    const D = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
      if (i === j) return 0;
      let s = 0; for (let k = 0; k < m; k++) s += (X[i][k] - X[j][k]) ** 2;
      return Math.sqrt(Math.max(s, 1e-10));
    }));
    const before = stress(classicalMDS(data, vars, { nDimensions: 2 }).points, D, n, 2);
    const after = stress(sammonMapping(data, vars, { nDimensions: 2, maxIter: 50 }).points, D, n, 2);
    expect(after).toBeLessThan(before);
  });
});

describe('hardening — reproducibility', () => {
  it('sammonMapping reproducible with seed', () => {
    const r1 = sammonMapping(data, ['x1', 'x2'], { seed: 42, maxIter: 10 });
    const r2 = sammonMapping(data, ['x1', 'x2'], { seed: 42, maxIter: 10 });
    expect(r1.points).toEqual(r2.points);
  });
  it('nonMetricMDS reproducible with seed', () => {
    const r1 = nonMetricMDS(data, ['x1', 'x2'], { seed: 42, maxIter: 10 });
    const r2 = nonMetricMDS(data, ['x1', 'x2'], { seed: 42, maxIter: 10 });
    expect(r1.points).toEqual(r2.points);
  });
  it('sammonMappingDM reproducible with seed', () => {
    const D = [[0, 3, 4], [3, 0, 5], [4, 5, 0]];
    const r1 = sammonMappingDM(D, { seed: 42, maxIter: 10 });
    const r2 = sammonMappingDM(D, { seed: 42, maxIter: 10 });
    expect(r1.points).toEqual(r2.points);
  });
});
