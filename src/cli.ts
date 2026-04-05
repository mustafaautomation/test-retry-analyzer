#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import { analyzeRetries, RetryInput } from './core/analyzer';
import { printReport } from './reporters/console';

const program = new Command();
program.name('retry-analyze').description('Analyze test retry patterns').version('1.0.0');

program
  .command('analyze')
  .description('Analyze retry data from JSON file')
  .argument('<file>', 'JSON file with retry data')
  .option('--json', 'Output as JSON')
  .action((file: string, options) => {
    if (!fs.existsSync(file)) {
      console.error(`Not found: ${file}`);
      process.exit(1);
    }
    const data: RetryInput[] = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const report = analyzeRetries(data);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReport(report);
    }
    if (report.classifications.bug > 0) process.exit(1);
  });

program.parse();
