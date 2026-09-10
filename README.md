# @statlab/core

A large, **dependency-free** statistics & modeling library for JavaScript/TypeScript.
84 method modules + 6 numerical primitives — regression, ANOVA, survival,
econometrics, multivariate, Bayesian, nonparametric, time series, and much more.
Pure ESM, runtime-agnostic (runs unchanged in Node and the browser), ships ESM + CJS.

## Install

```sh
npm install @statlab/core
```

Zero runtime dependencies.

## Usage

The public API is **namespaced by module** (this resolves function-name
collisions across modules — e.g. `bootstrapCI`, `hausmanTest`, `egarch` each
appear in more than one module).

```js
// Namespaced barrel
import { survival, anova, core } from '@statlab/core';

survival.coxPH(/* … */);
anova.oneWayANOVA(/* … */);
core.avg([1, 2, 3]);

// Or import a single module directly (tree-shakeable subpath)
import { coxPH } from '@statlab/core/methods/survival';
import { avg } from '@statlab/core/math/core';
```

CommonJS works too:

```js
const { survival } = require('@statlab/core');
```

### Module layout

- `@statlab/core/math/*` — numerical primitives: `core`, `distributions`, `inference`,
  `matrix`, `power`, `rng`.
- `@statlab/core/methods/*` — the 84 statistical method modules (`anova`, `regression`,
  `survival`, `ecology`, `econometric`, `sem`, `bayesian`, …).

> Note: two modules share the basename `power`. In the barrel, the low-level
> primitives are `power` (`@statlab/core/math/power`) and the power-analysis methods are
> `powerAnalysis` (`@statlab/core/methods/power`).

## Accuracy & rigor

Every headline method is covered by tests, many against independent numeric
oracles (R / scipy / statsmodels). Some methods in the long tail use documented
approximations (normal-approx criticals, one-term asymptotic p-values, etc.) —
see the repository's `BASELINE.md` for the per-method rigor classification.

## Types

Ships `.d.ts` declarations generated from precise JSDoc annotations across
every module (parameter and return-shape types, not `any`) — `tsc` passes
with zero errors against the full public surface.

## License

[MIT](./LICENSE)
