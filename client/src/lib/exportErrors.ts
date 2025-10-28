/**
 * Export errors, partial recoveries, and logs as user-downloadable JSON/txt.
 */

export interface ErrorLog {
  timestamp: Date;
  file: string;
  error: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recovered?: boolean;
  recoveryNotes?: string[];
  stackTrace?: string;
}

export interface RecoveryLog {
  timestamp: Date;
  file: string;
  originalSize: number;
  recoveredSize: number;
  method: string;
  confidence: number;
  changes: string[];
}

/**
 * Export errors and recovery logs as JSON file.
 *
 * @param errors - Array of error logs
 * @param archiveName - Name of the archive for filename
 */
export function exportErrors(errors: ErrorLog[], archiveName: string): void {
  const data = {
    exportDate: new Date().toISOString(),
    archive: archiveName,
    totalErrors: errors.length,
    errors: errors.map(err => ({
      ...err,
      timestamp: err.timestamp.toISOString(),
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  downloadBlob(blob, `${sanitizeFilename(archiveName)}-errors.json`);
}

/**
 * Export recovery logs as JSON file.
 *
 * @param recoveries - Array of recovery logs
 * @param archiveName - Name of the archive for filename
 */
export function exportRecoveryLogs(recoveries: RecoveryLog[], archiveName: string): void {
  const data = {
    exportDate: new Date().toISOString(),
    archive: archiveName,
    totalRecoveries: recoveries.length,
    successRate: calculateSuccessRate(recoveries),
    recoveries: recoveries.map(rec => ({
      ...rec,
      timestamp: rec.timestamp.toISOString(),
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  downloadBlob(blob, `${sanitizeFilename(archiveName)}-recovery.json`);
}

/**
 * Export combined report (errors + recoveries) as text file.
 *
 * @param errors - Array of error logs
 * @param recoveries - Array of recovery logs
 * @param archiveName - Name of the archive for filename
 */
export function exportFullReport(
  errors: ErrorLog[],
  recoveries: RecoveryLog[],
  archiveName: string
): void {
  const lines: string[] = [];

  // Header
  lines.push('='.repeat(80));
  lines.push(`ARCHIVE PROCESSING REPORT`);
  lines.push(`Archive: ${archiveName}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('='.repeat(80));
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push('-'.repeat(80));
  lines.push(`Total Errors: ${errors.length}`);
  lines.push(`Total Recoveries: ${recoveries.length}`);
  lines.push(`Success Rate: ${calculateSuccessRate(recoveries).toFixed(2)}%`);
  lines.push('');

  // Error section
  if (errors.length > 0) {
    lines.push('ERRORS');
    lines.push('-'.repeat(80));

    // Group by severity
    const bySeverity = groupBy(errors, 'severity');

    for (const [severity, errs] of Object.entries(bySeverity)) {
      lines.push(`\n${severity.toUpperCase()} (${errs.length})`);
      lines.push('');

      for (const err of errs) {
        lines.push(`  File: ${err.file}`);
        lines.push(`  Time: ${err.timestamp.toISOString()}`);
        lines.push(`  Error: ${err.error}`);
        if (err.recovered) {
          lines.push(`  Status: RECOVERED`);
          if (err.recoveryNotes) {
            lines.push(`  Recovery Notes: ${err.recoveryNotes.join(', ')}`);
          }
        }
        lines.push('');
      }
    }
  }

  // Recovery section
  if (recoveries.length > 0) {
    lines.push('RECOVERIES');
    lines.push('-'.repeat(80));

    for (const rec of recoveries) {
      lines.push(`\nFile: ${rec.file}`);
      lines.push(`Time: ${rec.timestamp.toISOString()}`);
      lines.push(`Method: ${rec.method}`);
      lines.push(`Confidence: ${(rec.confidence * 100).toFixed(1)}%`);
      lines.push(`Original Size: ${formatBytes(rec.originalSize)}`);
      lines.push(`Recovered Size: ${formatBytes(rec.recoveredSize)}`);
      lines.push(`Recovery Rate: ${((rec.recoveredSize / rec.originalSize) * 100).toFixed(1)}%`);

      if (rec.changes.length > 0) {
        lines.push(`Changes Applied:`);
        rec.changes.forEach(change => {
          lines.push(`  - ${change}`);
        });
      }
      lines.push('');
    }
  }

  // Footer
  lines.push('='.repeat(80));
  lines.push('END OF REPORT');
  lines.push('='.repeat(80));

  const text = lines.join('\n');
  const blob = new Blob([text], { type: 'text/plain' });

  downloadBlob(blob, `${sanitizeFilename(archiveName)}-report.txt`);
}

/**
 * Export as CSV for spreadsheet analysis.
 *
 * @param errors - Array of error logs
 * @param archiveName - Name of the archive for filename
 */
export function exportErrorsAsCSV(errors: ErrorLog[], archiveName: string): void {
  const headers = ['Timestamp', 'File', 'Error', 'Severity', 'Recovered', 'Recovery Notes'];
  const rows = errors.map(err => [
    err.timestamp.toISOString(),
    err.file,
    `"${err.error.replace(/"/g, '""')}"`, // Escape quotes
    err.severity,
    err.recovered ? 'Yes' : 'No',
    err.recoveryNotes ? `"${err.recoveryNotes.join('; ').replace(/"/g, '""')}"` : '',
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `${sanitizeFilename(archiveName)}-errors.csv`);
}

/**
 * Helper: Download blob as file.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper: Sanitize filename for safe download.
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_\-\.]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Helper: Calculate success rate for recoveries.
 */
function calculateSuccessRate(recoveries: RecoveryLog[]): number {
  if (recoveries.length === 0) return 0;

  const totalConfidence = recoveries.reduce((sum, rec) => sum + rec.confidence, 0);
  return (totalConfidence / recoveries.length) * 100;
}

/**
 * Helper: Group array by property.
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const group = String(item[key]);
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Helper: Format bytes.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
