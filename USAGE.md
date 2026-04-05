## Real-World Use Cases

### 1. Post-CI Retry Analysis
```bash
npx retry-analyze analyze retry-data.json
# Classifies each retry: bug (fix code), flaky (fix test), infra (fix env)
```

### 2. Flakiness Budget
Track retry rate over time. If >10% of tests need retries, investigate infrastructure.
