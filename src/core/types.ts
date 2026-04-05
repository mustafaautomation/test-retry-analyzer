export type FailureClass = 'bug' | 'flaky' | 'infra' | 'unknown';

export interface RetryAttempt {
  attempt: number;
  status: 'passed' | 'failed';
  duration: number;
  error?: string;
}

export interface TestRetryRecord {
  name: string;
  suite: string;
  attempts: RetryAttempt[];
  finalStatus: 'passed' | 'failed';
  totalRetries: number;
  classification: FailureClass;
  stabilityScore: number;
}

export interface RetryReport {
  timestamp: string;
  totalTests: number;
  testsWithRetries: number;
  retryRate: number;
  classifications: Record<FailureClass, number>;
  avgRetriesPerTest: number;
  timeSavedByRetries: number;
  records: TestRetryRecord[];
}
