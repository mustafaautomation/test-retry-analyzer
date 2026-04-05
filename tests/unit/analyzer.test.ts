import { describe, it, expect } from 'vitest';
import { analyzeRetries, RetryInput } from '../../src/core/analyzer';

describe('analyzeRetries', () => {
  it('should classify consistent failures as bug', () => {
    const input: RetryInput[] = [
      {
        name: 'login test',
        suite: 'auth',
        attempts: [
          { status: 'failed', duration: 100, error: 'Expected 200 got 500' },
          { status: 'failed', duration: 100, error: 'Expected 200 got 500' },
          { status: 'failed', duration: 100, error: 'Expected 200 got 500' },
        ],
      },
    ];
    const report = analyzeRetries(input);
    expect(report.records[0].classification).toBe('bug');
    expect(report.records[0].stabilityScore).toBe(0);
  });

  it('should classify fail-then-pass as flaky', () => {
    const input: RetryInput[] = [
      {
        name: 'cart test',
        suite: 'shopping',
        attempts: [
          { status: 'failed', duration: 200, error: 'Element not found' },
          { status: 'passed', duration: 150 },
        ],
      },
    ];
    const report = analyzeRetries(input);
    expect(report.records[0].classification).toBe('flaky');
    expect(report.records[0].finalStatus).toBe('passed');
  });

  it('should classify timeout errors as infra', () => {
    const input: RetryInput[] = [
      {
        name: 'api test',
        suite: 'api',
        attempts: [
          { status: 'failed', duration: 30000, error: 'Timeout waiting for response' },
          { status: 'passed', duration: 200 },
        ],
      },
    ];
    const report = analyzeRetries(input);
    expect(report.records[0].classification).toBe('infra');
  });

  it('should classify network errors as infra', () => {
    const input: RetryInput[] = [
      {
        name: 'health check',
        suite: 'infra',
        attempts: [
          { status: 'failed', duration: 100, error: 'ECONNREFUSED 127.0.0.1:3000' },
          { status: 'passed', duration: 50 },
        ],
      },
    ];
    const report = analyzeRetries(input);
    expect(report.records[0].classification).toBe('infra');
  });

  it('should compute retry rate', () => {
    const input: RetryInput[] = [
      { name: 'a', suite: 's', attempts: [{ status: 'passed', duration: 50 }] },
      {
        name: 'b',
        suite: 's',
        attempts: [
          { status: 'failed', duration: 50 },
          { status: 'passed', duration: 50 },
        ],
      },
    ];
    const report = analyzeRetries(input);
    expect(report.totalTests).toBe(2);
    expect(report.testsWithRetries).toBe(1);
    expect(report.retryRate).toBe(50);
  });

  it('should compute stability score', () => {
    const input: RetryInput[] = [
      {
        name: 'flaky',
        suite: 's',
        attempts: [
          { status: 'failed', duration: 50 },
          { status: 'passed', duration: 50 },
          { status: 'failed', duration: 50 },
          { status: 'passed', duration: 50 },
        ],
      },
    ];
    const report = analyzeRetries(input);
    expect(report.records[0].stabilityScore).toBe(50);
  });

  it('should handle empty input', () => {
    const report = analyzeRetries([]);
    expect(report.totalTests).toBe(0);
    expect(report.retryRate).toBe(0);
  });

  it('should sort by stability ascending (worst first)', () => {
    const input: RetryInput[] = [
      {
        name: 'stable',
        suite: 's',
        attempts: [
          { status: 'failed', duration: 50 },
          { status: 'passed', duration: 50 },
          { status: 'passed', duration: 50 },
        ],
      },
      {
        name: 'unstable',
        suite: 's',
        attempts: [
          { status: 'failed', duration: 50 },
          { status: 'failed', duration: 50 },
          { status: 'passed', duration: 50 },
        ],
      },
    ];
    const report = analyzeRetries(input);
    expect(report.records[0].name).toBe('unstable');
  });
});
