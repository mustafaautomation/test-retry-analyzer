# Test Retry Analyzer

[![CI](https://github.com/mustafaautomation/test-retry-analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/mustafaautomation/test-retry-analyzer/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

Analyze test retry patterns to distinguish real bugs from infrastructure flakiness. Classifies failures, computes stability scores, and reports time saved by retries.

---

## Failure Classification

| Class | Pattern | Action |
|-------|---------|--------|
| **Bug** | All retries failed with same error | Fix the code |
| **Flaky** | Some pass, some fail (random) | Investigate test isolation |
| **Infra** | Timeout/network errors then pass | Fix infrastructure |
| **Unknown** | Single attempt, no retries | N/A |

---

## Quick Start

```bash
npx retry-analyze analyze retry-data.json
npx retry-analyze analyze retry-data.json --json
```

## Library API

```typescript
import { analyzeRetries } from 'test-retry-analyzer';

const report = analyzeRetries([
  {
    name: 'login test',
    suite: 'auth',
    attempts: [
      { status: 'failed', duration: 200, error: 'Element not found' },
      { status: 'passed', duration: 150 },
    ],
  },
]);

console.log(`Retry rate: ${report.retryRate}%`);
console.log(`Bugs: ${report.classifications.bug}, Flaky: ${report.classifications.flaky}`);
```

---

## Project Structure

```
test-retry-analyzer/
├── src/
│   ├── core/
│   │   ├── types.ts       # RetryAttempt, TestRetryRecord, RetryReport
│   │   └── analyzer.ts    # Retry classification + stability scoring
│   ├── reporters/
│   │   └── console.ts     # Colored terminal output
│   ├── cli.ts
│   └── index.ts
├── tests/unit/
│   └── analyzer.test.ts   # 8 tests — all classifications + edge cases
└── .github/workflows/ci.yml
```

---

## License

MIT

---

Built by [Quvantic](https://quvantic.com)
