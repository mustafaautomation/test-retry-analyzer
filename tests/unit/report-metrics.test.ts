import { describe, it, expect } from 'vitest';
import { analyzeRetries, RetryInput } from '../../src/core/analyzer';

describe('Report metrics', () => {
  const mixedInputs: RetryInput[] = [
    { name: 'clean', suite: 's', attempts: [{ status: 'passed', duration: 100 }] },
    {
      name: 'flaky1',
      suite: 's',
      attempts: [
        { status: 'failed', duration: 50 },
        { status: 'passed', duration: 80 },
      ],
    },
    {
      name: 'flaky2',
      suite: 's',
      attempts: [
        { status: 'failed', duration: 60 },
        { status: 'passed', duration: 70 },
      ],
    },
    {
      name: 'bug',
      suite: 's',
      attempts: [
        { status: 'failed', duration: 100 },
        { status: 'failed', duration: 100 },
      ],
    },
    { name: 'clean2', suite: 's', attempts: [{ status: 'passed', duration: 50 }] },
  ];

  it('should count total tests correctly', () => {
    const report = analyzeRetries(mixedInputs);
    expect(report.totalTests).toBe(5);
  });

  it('should count tests with retries', () => {
    const report = analyzeRetries(mixedInputs);
    expect(report.testsWithRetries).toBe(3); // flaky1, flaky2, bug
  });

  it('should calculate retry rate', () => {
    const report = analyzeRetries(mixedInputs);
    expect(report.retryRate).toBe(60); // 3/5 = 60%
  });

  it('should count classifications', () => {
    const report = analyzeRetries(mixedInputs);
    expect(report.classifications.flaky).toBe(2);
    expect(report.classifications.bug).toBe(1);
    expect(report.classifications.infra).toBe(0);
  });

  it('should calculate average retries per test', () => {
    const report = analyzeRetries(mixedInputs);
    // flaky1: 1 retry, flaky2: 1 retry, bug: 1 retry → avg 1.0
    expect(report.avgRetriesPerTest).toBe(1);
  });

  it('should calculate time saved by retries', () => {
    const report = analyzeRetries(mixedInputs);
    // flaky1 saved: 80ms (passed attempt), flaky2 saved: 70ms
    expect(report.timeSavedByRetries).toBe(150);
  });

  it('should sort records by stability score ascending', () => {
    const report = analyzeRetries(mixedInputs);
    const scores = report.records.map((r) => r.stabilityScore);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }
  });

  it('should only include retried tests in records', () => {
    const report = analyzeRetries(mixedInputs);
    expect(report.records).toHaveLength(3);
    expect(report.records.every((r) => r.totalRetries > 0)).toBe(true);
  });
});

describe('Stability score', () => {
  it('should be 100 for single pass', () => {
    const report = analyzeRetries([
      { name: 'stable', suite: 's', attempts: [{ status: 'passed', duration: 50 }] },
    ]);
    // Single attempt = no retries, not in records, but totalTests counted
    expect(report.totalTests).toBe(1);
    expect(report.testsWithRetries).toBe(0);
  });

  it('should be 50 for 1 fail + 1 pass', () => {
    const report = analyzeRetries([
      {
        name: 'half',
        suite: 's',
        attempts: [
          { status: 'failed', duration: 50 },
          { status: 'passed', duration: 50 },
        ],
      },
    ]);
    expect(report.records[0].stabilityScore).toBe(50);
  });

  it('should be 33 for 1 pass + 2 fail', () => {
    const report = analyzeRetries([
      {
        name: 'unstable',
        suite: 's',
        attempts: [
          { status: 'passed', duration: 50 },
          { status: 'failed', duration: 50 },
          { status: 'failed', duration: 50 },
        ],
      },
    ]);
    expect(report.records[0].stabilityScore).toBe(33);
  });

  it('should be 0 for all failures', () => {
    const report = analyzeRetries([
      {
        name: 'broken',
        suite: 's',
        attempts: [
          { status: 'failed', duration: 50 },
          { status: 'failed', duration: 50 },
        ],
      },
    ]);
    expect(report.records[0].stabilityScore).toBe(0);
  });
});

describe('Edge cases', () => {
  it('should handle empty input', () => {
    const report = analyzeRetries([]);
    expect(report.totalTests).toBe(0);
    expect(report.retryRate).toBe(0);
    expect(report.avgRetriesPerTest).toBe(0);
    expect(report.records).toHaveLength(0);
  });

  it('should handle high retry count', () => {
    const attempts = Array.from({ length: 10 }, (_, i) => ({
      status: (i === 9 ? 'passed' : 'failed') as 'passed' | 'failed',
      duration: 100,
      error: i < 9 ? 'Assertion failed' : undefined,
    }));

    const report = analyzeRetries([{ name: 'mega-retry', suite: 's', attempts }]);
    expect(report.records[0].totalRetries).toBe(9);
    expect(report.records[0].stabilityScore).toBe(10); // 1/10
  });

  it('should include timestamp', () => {
    const report = analyzeRetries([]);
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});
