import { StorageEntry, RiskAlert, SecurityReport } from '../types';
import { riskAnalyzer } from './riskAnalyzer';

export class ReportGenerator {
  /**
   * Generate a security report from storage entries
   */
  generate(entries: StorageEntry[]): SecurityReport {
    const alerts = riskAnalyzer.analyze(entries);

    const storageStats = this.getStorageBreakdown(entries);
    const riskStats = riskAnalyzer.getStatistics(alerts);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalItems: entries.length,
        riskLevels: {
          low: riskStats.low,
          medium: riskStats.medium,
          high: riskStats.high,
        },
        storageBreakdown: storageStats,
      },
      findings: alerts,
      recommendations: this.generateRecommendations(alerts),
    };
  }

  /**
   * Get storage breakdown by type
   */
  private getStorageBreakdown(entries: StorageEntry[]) {
    return {
      cookies: entries.filter((e) => e.type === 'cookie').length,
      localStorage: entries.filter((e) => e.type === 'localStorage').length,
      sessionStorage: entries.filter((e) => e.type === 'sessionStorage').length,
    };
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(alerts: RiskAlert[]): string[] {
    const recommendations: Set<string> = new Set();

    const highRiskCount = alerts.filter((a) => a.riskLevel === 'high').length;
    const mediumRiskCount = alerts.filter(
      (a) => a.riskLevel === 'medium'
    ).length;

    if (highRiskCount > 0) {
      recommendations.add(
        `🚨 URGENT: Found ${highRiskCount} high-risk item(s). Clear them immediately.`
      );
      recommendations.add(
        '✅ Review how sensitive data is getting stored in the browser.'
      );
      recommendations.add(
        '✅ Implement server-side session management instead of browser storage.'
      );
      recommendations.add(
        '✅ Use HTTP-only cookies for authentication tokens.'
      );
    }

    if (mediumRiskCount > 0) {
      recommendations.add(
        `⚠️ Found ${mediumRiskCount} medium-risk item(s). Review and consider removing.`
      );
      recommendations.add(
        '✅ Encrypt sensitive data before storing in localStorage.'
      );
      recommendations.add('✅ Use appropriate expiration times for session data.');
    }

    if (alerts.length === 0) {
      recommendations.add(
        '✅ No immediate security issues detected in browser storage.'
      );
    }

    recommendations.add('📚 Educate team about secure data storage practices.');
    recommendations.add(
      '🔐 Regularly audit browser storage for security vulnerabilities.'
    );

    return Array.from(recommendations);
  }

  /**
   * Export report as JSON
   */
  exportJSON(report: SecurityReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as CSV
   */
  exportCSV(report: SecurityReport): string {
    let csv =
      'Key,Value,Type,Risk Level,Detected Patterns,Reasons\n';

    report.findings.forEach((finding) => {
      const entry = finding.entry;
      const row = [
        `"${entry.key.replace(/"/g, '""')}"`,
        `"${entry.value.substring(0, 50).replace(/"/g, '""')}"`,
        entry.type,
        finding.riskLevel,
        `"${finding.detectedPatterns.join(', ')}"`,
        `"${finding.reasons.join('; ').replace(/"/g, '""')}"`,
      ].join(',');
      csv += row + '\n';
    });

    return csv;
  }

  /**
   * Download report as file
   */
  downloadReport(report: SecurityReport, format: 'json' | 'csv' = 'json') {
    const content =
      format === 'json' ? this.exportJSON(report) : this.exportCSV(report);
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    const fileExtension = format === 'json' ? 'json' : 'csv';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-report-${Date.now()}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const reportGenerator = new ReportGenerator();
