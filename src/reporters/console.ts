import { RetryReport } from '../core/types';

const R = '\x1b[0m',
  B = '\x1b[1m',
  D = '\x1b[2m';
const RED = '\x1b[31m',
  GRN = '\x1b[32m',
  YEL = '\x1b[33m',
  CYN = '\x1b[36m',
  MAG = '\x1b[35m';

const CLASS_COLORS: Record<string, string> = { bug: RED, flaky: YEL, infra: MAG, unknown: D };

export function printReport(report: RetryReport): void {
  console.log();
  console.log(`${B}${CYN}Test Retry Analysis${R}`);
  console.log();
  console.log(`  Total tests:      ${report.totalTests}`);
  console.log(`  Tests with retries: ${report.testsWithRetries} ${D}(${report.retryRate}%)${R}`);
  console.log(`  Avg retries/test: ${report.avgRetriesPerTest}`);
  console.log(`  Time saved:       ${report.timeSavedByRetries}ms`);
  console.log();
  console.log(`  ${B}Classifications:${R}`);
  console.log(
    `    ${RED}Bug: ${report.classifications.bug}${R}  ${YEL}Flaky: ${report.classifications.flaky}${R}  ${MAG}Infra: ${report.classifications.infra}${R}  ${D}Unknown: ${report.classifications.unknown}${R}`,
  );
  console.log();

  for (const rec of report.records.slice(0, 15)) {
    const color = CLASS_COLORS[rec.classification];
    const icon = rec.finalStatus === 'passed' ? `${GRN}✓` : `${RED}✗`;
    console.log(
      `  ${icon}${R} ${B}${rec.name}${R} ${color}[${rec.classification}]${R} ${D}stability: ${rec.stabilityScore}% · ${rec.totalRetries} retries${R}`,
    );
  }
  console.log();
}
