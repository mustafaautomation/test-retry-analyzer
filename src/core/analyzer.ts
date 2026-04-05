import { RetryAttempt, TestRetryRecord, RetryReport, FailureClass } from './types';

export interface RetryInput {
  name: string;
  suite: string;
  attempts: Array<{ status: 'passed' | 'failed'; duration: number; error?: string }>;
}

export function analyzeRetries(inputs: RetryInput[]): RetryReport {
  const records: TestRetryRecord[] = inputs.map((input) => {
    const attempts: RetryAttempt[] = input.attempts.map((a, i) => ({
      attempt: i + 1,
      ...a,
    }));

    const totalRetries = Math.max(0, attempts.length - 1);
    const finalStatus = attempts[attempts.length - 1]?.status || 'failed';
    const classification = classifyFailure(attempts);
    const stabilityScore = computeStability(attempts);

    return {
      name: input.name,
      suite: input.suite,
      attempts,
      finalStatus,
      totalRetries,
      classification,
      stabilityScore,
    };
  });

  const testsWithRetries = records.filter((r) => r.totalRetries > 0);
  const totalRetries = testsWithRetries.reduce((s, r) => s + r.totalRetries, 0);

  const classifications: Record<FailureClass, number> = { bug: 0, flaky: 0, infra: 0, unknown: 0 };
  for (const r of records) {
    if (r.totalRetries > 0) classifications[r.classification]++;
  }

  // Time saved = tests that eventually passed after retries
  const savedTests = testsWithRetries.filter((r) => r.finalStatus === 'passed');
  const timeSaved = savedTests.reduce(
    (s, r) =>
      s + r.attempts.filter((a) => a.status === 'passed').reduce((d, a) => d + a.duration, 0),
    0,
  );

  return {
    timestamp: new Date().toISOString(),
    totalTests: records.length,
    testsWithRetries: testsWithRetries.length,
    retryRate:
      records.length > 0 ? Math.round((testsWithRetries.length / records.length) * 1000) / 10 : 0,
    classifications,
    avgRetriesPerTest:
      testsWithRetries.length > 0
        ? Math.round((totalRetries / testsWithRetries.length) * 10) / 10
        : 0,
    timeSavedByRetries: timeSaved,
    records: records
      .filter((r) => r.totalRetries > 0)
      .sort((a, b) => a.stabilityScore - b.stabilityScore),
  };
}

function classifyFailure(attempts: RetryAttempt[]): FailureClass {
  if (attempts.length <= 1) return 'unknown';

  const failedAttempts = attempts.filter((a) => a.status === 'failed');
  const passedAttempts = attempts.filter((a) => a.status === 'passed');

  // All failed = likely a real bug
  if (passedAttempts.length === 0) return 'bug';

  // Failed then passed = flaky
  if (failedAttempts.length > 0 && passedAttempts.length > 0) {
    // Check error patterns for infra issues
    const errors = failedAttempts
      .map((a) => a.error || '')
      .join(' ')
      .toLowerCase();
    if (
      errors.includes('timeout') ||
      errors.includes('econnrefused') ||
      errors.includes('network') ||
      errors.includes('socket')
    ) {
      return 'infra';
    }
    return 'flaky';
  }

  return 'unknown';
}

function computeStability(attempts: RetryAttempt[]): number {
  if (attempts.length <= 1) return attempts[0]?.status === 'passed' ? 100 : 0;
  const passed = attempts.filter((a) => a.status === 'passed').length;
  return Math.round((passed / attempts.length) * 100);
}
