import { StorageEntry, RiskAlert, RiskLevel } from '../types';
import { detectKeywords, detectPatterns, SENSITIVE_KEYWORDS } from './patterns';

export class RiskAnalyzer {
  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  /**
   * Analyze storage entries and return risk alerts
   */
  analyze(entries: StorageEntry[]): RiskAlert[] {
    const alerts: RiskAlert[] = [];

    entries.forEach((entry) => {
      const keywords = detectKeywords(entry.value, entry.key);
      const patterns = detectPatterns(entry.value);

      if (keywords.length > 0 || patterns.length > 0) {
        const riskLevel = this.calculateRiskScore(
          keywords,
          patterns,
          entry.key
        );

        if (riskLevel !== 'low') {
          alerts.push({
            id: this.generateId(),
            entry,
            riskLevel,
            reasons: this.generateReasons(keywords, patterns, entry.key),
            recommendation: this.getRecommendation(riskLevel),
            detectedPatterns: patterns,
          });
        }
      }
    });

    // Sort by risk level: high > medium > low
    return alerts.sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });
  }

  /**
   * Calculate risk score based on keywords, patterns, and key name
   */
  private calculateRiskScore(
    keywords: string[],
    patterns: string[],
    keyName: string
  ): RiskLevel {
    let score = 0;

    // Keyword in value: +30
    if (keywords.length > 0) {
      score += 30;
    }

    // Keyword in key name: +40 (more suspicious)
    if (
      SENSITIVE_KEYWORDS.some((k) => keyName.toLowerCase().includes(k))
    ) {
      score += 40;
    }

    // JWT detected: +50
    if (patterns.includes('JWT')) {
      score += 50;
    }

    // AWS/GitHub key detected: +70
    if (
      patterns.includes('AWS_KEY') ||
      patterns.includes('GITHUB_TOKEN')
    ) {
      score += 70;
    }

    // Bearer token: +60
    if (patterns.includes('BEARER')) {
      score += 60;
    }

    // Credit card or SSN: +80
    if (
      patterns.includes('CREDIT_CARD') ||
      patterns.includes('SSN')
    ) {
      score += 80;
    }

    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Generate detailed reasons for the risk
   */
  private generateReasons(
    keywords: string[],
    patterns: string[],
    keyName: string
  ): string[] {
    const reasons: string[] = [];

    if (
      SENSITIVE_KEYWORDS.some((k) => keyName.toLowerCase().includes(k))
    ) {
      reasons.push(`Key name contains sensitive keyword: "${keyName}"`);
    }

    if (keywords.length > 0) {
      reasons.push(`Value contains sensitive keywords: ${keywords.join(', ')}`);
    }

    if (patterns.length > 0) {
      patterns.forEach((pattern) => {
        reasons.push(`Detected ${pattern} pattern`);
      });
    }

    return reasons;
  }

  /**
   * Get recommendation based on risk level
   */
  private getRecommendation(riskLevel: RiskLevel): string {
    const recommendations = {
      high: '⚠️ CRITICAL: Exposed sensitive data detected. Clear this data immediately and review how it got stored in the browser. Implement server-side session storage instead.',
      medium: '⚠️ Potentially sensitive data detected. Verify if this data is necessary to store in the browser. Consider encrypting before storage.',
      low: 'ℹ️ Normal application data. No immediate action needed.',
    };

    return recommendations[riskLevel];
  }

  /**
   * Get statistics about the alerts
   */
  getStatistics(alerts: RiskAlert[]) {
    return {
      total: alerts.length,
      high: alerts.filter((a) => a.riskLevel === 'high').length,
      medium: alerts.filter((a) => a.riskLevel === 'medium').length,
      low: alerts.filter((a) => a.riskLevel === 'low').length,
    };
  }
}

export const riskAnalyzer = new RiskAnalyzer();
