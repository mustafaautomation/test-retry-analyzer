import { describe, it, expect } from 'vitest';
import { analyzeRetries, RetryInput } from '../../src/core/analyzer';

describe('Classification — bug detection', () => {
  it('should classify as bug when all attempts fail', () => {
    const inputs: RetryInput[] = [
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

    const report = analyzeRetries(inputs);
    expect(report.classifications.bug).toBe(1);
    expect(report.records[0].classification).toBe('bug');
    expect(report.records[0].finalStatus).toBe('failed');
  });

  it('should classify as bug with 2 failed attempts', () => {
    const inputs: RetryInput[] = [
      {
        name: 'broken test',
        suite: 's',
        attempts: [
          { status: 'failed', duration: 50 },
          { status: 'failed', duration: 50 },
        ],
      },
    ];

    const report = analyzeRetries(inputs);
    expect(report.classifications.bug).toBe(1);
  });
});

describe('Classification — flaky detection', () => {
  it('should classify as flaky when fails then passes', () => {
    const inputs: RetryInput[] = [
      {
        name: 'flaky dropdown',
        suite: 'ui',
        attempts: [
          { status: 'failed', duration: 200, error: 'Element not visible' },
          { status: 'passed', duration: 150 },
        ],
      },
    ];

    const report = analyzeRetries(inputs);
    expect(report.classifications.flaky).toBe(1);
    expect(report.records[0].finalStatus).toBe('passed');
  });

  it('should classify as flaky with multiple fail-pass pattern', () => {
    const inputs: RetryInput[] = [
      {
        name: 'animation test',
        suite: 'ui',
        attempts: [
          { status: 'failed', duration: 100, error: 'Assertion failed' },
          { status: 'failed', duration: 100, error: 'Assertion failed' },
          { status: 'passed', duration: 120 },
        ],
      },
    ];

    const report = analyzeRetries(inputs);
    expect(report.classifications.flaky).toBe(1);
  });
});

describe('Classification — infra detection', () => {
  it('should classify as infra for timeout errors', () => {
    const inputs: RetryInput[] = [
      {
        name: 'slow API',
        suite: 'api',
        attempts: [
          { status: 'failed', duration: 30000, error: 'Timeout waiting for response' },
          { status: 'passed', duration: 500 },
        ],
      },
    ];

    const report = analyzeRetries(inputs);
    expect(report.classifications.infra).toBe(1);
  });

  it('should classify as infra for ECONNREFUSED', () => {
    const inputs: RetryInput[] = [
      {
        name: 'db test',
        suite: 'integration',
        attempts: [
          { status: 'failed', duration: 100, error: 'ECONNREFUSED 127.0.0.1:5432' },
          { status: 'passed', duration: 200 },
        ],
      },
    ];

    const report = analyzeRetries(inputs);
    expect(report.classifications.infra).toBe(1);
  });

  it('should classify as infra for network errors', () => {
    const inputs: RetryInput[] = [
      {
        name: 'fetch test',
        suite: 'api',
        attempts: [
          { status: 'failed', duration: 50, error: 'Network request failed' },
          { status: 'passed', duration: 150 },
        ],
      },
    ];

    const report = analyzeRetries(inputs);
    expect(report.classifications.infra).toBe(1);
  });

  it('should classify as infra for socket errors', () => {
    const inputs: RetryInput[] = [
      {
        name: 'ws test',
        suite: 'realtime',
        attempts: [
          { status: 'failed', duration: 100, error: 'Socket hang up' },
          { status: 'passed', duration: 200 },
        ],
      },
    ];

    const report = analyzeRetries(inputs);
    expect(report.classifications.infra).toBe(1);
  });
});

describe('Classification — unknown', () => {
  it('should classify as unknown for single attempt', () => {
    const inputs: RetryInput[] = [
      { name: 'one shot', suite: 's', attempts: [{ status: 'passed', duration: 50 }] },
    ];

    const report = analyzeRetries(inputs);
    // Single attempt with no retries — not in records
    expect(report.testsWithRetries).toBe(0);
  });
});
