#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const prompts = require('prompts');

// Try to load chalk, fallback to no-color functions if it fails
let chalk;
try {
  chalk = require('chalk');
  // Test if chalk functions work
  if (typeof chalk.red !== 'function') {
    throw new Error('Chalk functions not available');
  }
} catch (error) {
  // Fallback to no-color functions
  chalk = {
    bold: {
      cyan: (text) => text,
      yellow: (text) => text
    },
    green: (text) => text,
    yellow: (text) => text,
    red: (text) => text,
    blue: (text) => text,
    magenta: (text) => text,
    gray: (text) => text,
    underline: { blue: (text) => text }
  };

  // Add missing bold function
  chalk.bold = (text) => text;
}

/* eslint-disable no-console */
// Enhanced console logging with colors
const log = {
  title: (text) => console.log(chalk.bold.cyan(`\n🚀 ${text}`)),
  success: (text) => console.log(chalk.green(`✅ ${text}`)),
  warning: (text) => console.log(chalk.yellow(`⚠️  ${text}`)),
  error: (text) => console.log(chalk.red(`❌ ${text}`)),
  info: (text) => console.log(chalk.blue(`ℹ️  ${text}`)),
  step: (text) => console.log(chalk.magenta(`📋 ${text}`)),
  data: (text) => console.log(chalk.gray(`   ${text}`)),
  highlight: (text) => chalk.bold.yellow(text),
  url: (text) => chalk.underline.blue(text)
};

// Business-friendly commit type mappings
const COMMIT_TYPE_MAPPINGS = {
  feat: 'New Features & Enhancements',
  fix: 'Bug Fixes & Improvements',
  perf: 'Performance Optimizations',
  refactor: 'Code Quality & Architecture',
  style: 'UI/UX & Design Updates',
  docs: 'Documentation & Guides',
  test: 'Quality Assurance & Testing',
  chore: 'Maintenance & Infrastructure',
  ci: 'DevOps & Automation',
  build: 'Build System & Dependencies'
};

// Business impact descriptions
const BUSINESS_IMPACT_DESCRIPTIONS = {
  feat: 'Delivers new value to users and expands product capabilities',
  fix: 'Enhances user experience and system reliability',
  perf: 'Improves application speed and resource efficiency',
  refactor: 'Strengthens codebase foundation for future development',
  style: 'Modernizes user interface and improves visual consistency',
  docs: 'Improves developer productivity and user understanding',
  test: 'Ensures product quality and reduces potential issues',
  chore: 'Maintains system health and development workflow',
  ci: 'Streamlines development process and deployment reliability',
  build: 'Optimizes development tools and dependency management'
};

class FeatureDebriefGenerator {
  constructor() {
    this.outputDir = './reports';
    this.tempDir = './temp';
  }

  async run() {
    try {
      log.title('Feature Debrief Generator');
      log.info(
        'Generating comprehensive development activity reports using real git data'
      );

      // Interactive prompts
      const options = await this.getOptions();

      // Generate changelog data
      log.step('Analyzing git commit history...');
      const changelogData = await this.generateChangelog(options);

      // Analyze commit data
      log.step('Processing commit data for business insights...');
      const analysis = await this.analyzeCommits(options);

      // Generate business-friendly report
      log.step('Creating business-friendly feature debrief...');
      const report = await this.generateReport(
        changelogData,
        analysis,
        options
      );

      // Save report
      await this.saveReport(report, options);

      log.success('Feature debrief generated successfully!');
      log.info(`Report saved to: ${chalk.bold(options.outputFile)}`);
    } catch (error) {
      log.error(`Failed to generate feature debrief: ${error.message}`);
      process.exit(1);
    }
  }

  async getOptions() {
    const questions = [
      {
        type: 'select',
        name: 'timeRange',
        message: 'Select time range for analysis:',
        choices: [
          { title: '📅 Last 7 days', value: '7days' },
          { title: '📅 Last 30 days', value: '30days' },
          { title: '📅 Last 3 months', value: '3months' },
          { title: '📅 Since last release', value: 'lastrelease' },
          { title: '📅 Custom date range', value: 'custom' },
          { title: '📅 All time', value: 'all' }
        ],
        initial: 1
      },
      {
        type: (prev) => (prev === 'custom' ? 'date' : null),
        name: 'startDate',
        message: 'Start date:',
        initial: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        type: (prev, values) => (values.timeRange === 'custom' ? 'date' : null),
        name: 'endDate',
        message: 'End date:',
        initial: new Date()
      },
      {
        type: 'select',
        name: 'reportStyle',
        message: 'Choose report style:',
        choices: [
          {
            title: '💼 Executive Summary (High-level business impact)',
            value: 'executive'
          },
          {
            title: '🔧 Technical Deep-dive (Detailed technical changes)',
            value: 'technical'
          },
          {
            title: '📊 Comprehensive (Both business and technical)',
            value: 'comprehensive'
          },
          {
            title: '📈 Metrics-focused (Numbers and statistics)',
            value: 'metrics'
          }
        ],
        initial: 2
      },
      {
        type: 'multiselect',
        name: 'includeTypes',
        message: 'Include commit types:',
        choices: Object.entries(COMMIT_TYPE_MAPPINGS).map(([key, value]) => ({
          title: `${value} (${key})`,
          value: key,
          selected: ['feat', 'fix', 'perf', 'refactor'].includes(key)
        }))
      },
      {
        type: 'text',
        name: 'outputFile',
        message: 'Output filename:',
        initial: () =>
          `feature-debrief-${new Date().toISOString().split('T')[0]}.md`
      },
      {
        type: 'confirm',
        name: 'includeMetrics',
        message: 'Include development velocity metrics?',
        initial: true
      },
      {
        type: 'confirm',
        name: 'includeTrends',
        message: 'Include trend analysis?',
        initial: true
      }
    ];

    return await prompts(questions);
  }

  async generateChangelog(options) {
    log.data('Running auto-changelog to extract commit data...');

    // Prepare auto-changelog options
    let autoChangelogArgs = ['--template', 'json', '--stdout'];

    // Add date range options
    if (options.timeRange !== 'all') {
      const dateRange = this.getDateRange(options);
      if (dateRange.startDate) {
        autoChangelogArgs.push('--starting-date', dateRange.startDate);
      }
      if (dateRange.endDate) {
        autoChangelogArgs.push('--ending-date', dateRange.endDate);
      }
    }

    try {
      const command = `npx auto-changelog ${autoChangelogArgs.join(' ')}`;
      log.data(`Executing: ${command}`);

      const output = execSync(command, {
        encoding: 'utf8',
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      return JSON.parse(output);
    } catch (error) {
      log.warning('auto-changelog failed, falling back to git analysis');
      return await this.fallbackGitAnalysis(options);
    }
  }

  getDateRange(options) {
    const now = new Date();
    let startDate, endDate;

    switch (options.timeRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = options.startDate;
        endDate = options.endDate;
        break;
      case 'lastrelease':
        // Get last tag date
        try {
          const lastTag = execSync('git describe --tags --abbrev=0', {
            encoding: 'utf8'
          }).trim();
          const tagDate = execSync(`git log -1 --format=%ai ${lastTag}`, {
            encoding: 'utf8'
          }).trim();
          startDate = new Date(tagDate);
        } catch (e) {
          log.warning('No tags found, using 30 days');
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        break;
    }

    return {
      startDate: startDate ? startDate.toISOString().split('T')[0] : null,
      endDate: endDate ? endDate.toISOString().split('T')[0] : null
    };
  }

  async fallbackGitAnalysis(options) {
    log.data('Performing direct git analysis...');

    const dateRange = this.getDateRange(options);
    let gitArgs = [
      'log',
      '--oneline',
      '--pretty=format:"%h|%ad|%s|%an"',
      '--date=short'
    ];

    if (dateRange.startDate) {
      gitArgs.push(`--since=${dateRange.startDate}`);
    }
    if (dateRange.endDate) {
      gitArgs.push(`--until=${dateRange.endDate}`);
    }

    try {
      const output = execSync(`git ${gitArgs.join(' ')}`, { encoding: 'utf8' });
      const commits = output
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          // Remove quotes from git output
          const cleanLine = line.replace(/^"/, '').replace(/"$/, '');
          const [hash, date, subject, author] = cleanLine.split('|');
          return { hash, date, subject, author };
        });

      return {
        releases: [
          {
            tag: { name: 'Current Period', date: new Date() },
            commits: commits
          }
        ]
      };
    } catch (error) {
      throw new Error(`Git analysis failed: ${error.message}`);
    }
  }

  async analyzeCommits(options) {
    log.data('Analyzing commit patterns and trends...');

    const dateRange = this.getDateRange(options);
    let gitArgs = [
      'log',
      '--oneline',
      '--pretty=format:"%h|%ad|%s|%an"',
      '--date=short'
    ];

    if (dateRange.startDate) {
      gitArgs.push(`--since=${dateRange.startDate}`);
    }

    const output = execSync(`git ${gitArgs.join(' ')}`, { encoding: 'utf8' });
    const commits = output.split('\n').filter((line) => line.trim());

    const analysis = {
      totalCommits: commits.length,
      commitsByType: {},
      commitsByAuthor: {},
      commitsByDate: {},
      averageCommitsPerDay: 0,
      topContributors: [],
      commitTrends: []
    };

    commits.forEach((line) => {
      // Remove quotes from git output
      const cleanLine = line.replace(/^"/, '').replace(/"$/, '');
      const [hash, date, subject, author] = cleanLine.split('|');

      // Analyze commit type
      const type = this.extractCommitType(subject);
      analysis.commitsByType[type] = (analysis.commitsByType[type] || 0) + 1;

      // Analyze by author
      analysis.commitsByAuthor[author] =
        (analysis.commitsByAuthor[author] || 0) + 1;

      // Analyze by date
      analysis.commitsByDate[date] = (analysis.commitsByDate[date] || 0) + 1;
    });

    // Calculate metrics
    const dates = Object.keys(analysis.commitsByDate);
    if (dates.length > 0) {
      const maxDate = new Date(Math.max(...dates.map((d) => new Date(d))));
      const minDate = new Date(Math.min(...dates.map((d) => new Date(d))));
      const daysDiff = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));
      analysis.averageCommitsPerDay = (
        analysis.totalCommits / daysDiff
      ).toFixed(1);
    }

    // Top contributors
    analysis.topContributors = Object.entries(analysis.commitsByAuthor)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([author, count]) => ({ author, count }));

    return analysis;
  }

  extractCommitType(subject) {
    const match = subject.match(/^(\w+)(\(.+\))?:/);
    if (match) {
      return match[1].toLowerCase();
    }
    return 'other';
  }

  async generateReport(changelogData, analysis, options) {
    const now = new Date();
    const dateRange = this.getDateRange(options);

    let report = `# 📊 Feature Debrief Report
## *Development Activity Analysis*

---

### 📅 **Analysis Period**
**Generated:** ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}  
**Time Range:** ${this.getTimeRangeDescription(options)}  
**Report Style:** ${options.reportStyle.charAt(0).toUpperCase() + options.reportStyle.slice(1)}

---

## 🎯 **Executive Summary**

`;

    // Add executive summary based on analysis
    report += this.generateExecutiveSummary(analysis, options);

    if (
      options.reportStyle === 'comprehensive' ||
      options.reportStyle === 'technical'
    ) {
      report += `
---

## 🔧 **Technical Development Activity**

`;
      report += this.generateTechnicalSection(changelogData, analysis, options);
    }

    if (options.includeMetrics) {
      report += `
---

## 📈 **Development Metrics**

`;
      report += this.generateMetricsSection(analysis, options);
    }

    if (options.includeTrends) {
      report += `
---

## 📊 **Trends & Insights**

`;
      report += this.generateTrendsSection(analysis, options);
    }

    report += `
---

## 🏷️ **Tags & Categories**

${this.generateHashtags(analysis)}

---

**Report Generated by:** Feature Debrief Generator  
**Data Source:** Git Repository Analysis  
**Tool:** auto-changelog wrapper with business intelligence
`;

    return report;
  }

  generateExecutiveSummary(analysis, options) {
    const velocity = parseFloat(analysis.averageCommitsPerDay);
    const velocityDescription =
      velocity > 5 ? 'high-velocity' : velocity > 2 ? 'steady' : 'measured';

    const summary =
      `Our development team has maintained a **${velocityDescription} development pace** ` +
      `with **${analysis.totalCommits} commits** during this period, ` +
      `averaging **${analysis.averageCommitsPerDay} commits per day**.`;

    return (
      summary +
      `

### 🚀 **Key Highlights**
${this.generateKeyHighlights(analysis)}

### 💼 **Business Impact**
${this.generateBusinessImpact(analysis, options)}

### 👥 **Team Contribution**
${this.generateTeamContribution(analysis)}
`
    );
  }

  generateKeyHighlights(analysis) {
    const highlights = [];
    const sortedTypes = Object.entries(analysis.commitsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    sortedTypes.forEach(([type, count]) => {
      const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
      const businessType = COMMIT_TYPE_MAPPINGS[type] || type;
      highlights.push(
        `- **${percentage}%** ${businessType} (${count} commits)`
      );
    });

    return highlights.join('\n');
  }

  generateBusinessImpact(analysis, options) {
    const impacts = [];

    Object.entries(analysis.commitsByType).forEach(([type, count]) => {
      if (count > 0 && BUSINESS_IMPACT_DESCRIPTIONS[type]) {
        const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
        const typeLabel = COMMIT_TYPE_MAPPINGS[type] || type;
        const description = BUSINESS_IMPACT_DESCRIPTIONS[type];
        impacts.push(`- **${typeLabel}** (${percentage}%): ${description}`);
      }
    });

    return impacts.slice(0, 5).join('\n');
  }

  generateTeamContribution(analysis) {
    const contributions = analysis.topContributors.map(({ author, count }) => {
      const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
      return `- **${author}**: ${count} commits (${percentage}%)`;
    });

    return contributions.join('\n');
  }

  generateTechnicalSection(changelogData, analysis, options) {
    let section = `### 🔧 **Development Breakdown by Category**

`;

    Object.entries(analysis.commitsByType).forEach(([type, count]) => {
      if (options.includeTypes.includes(type)) {
        const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
        section += `#### ${COMMIT_TYPE_MAPPINGS[type] || type}
- **${count} commits** (${percentage}% of total)
- ${BUSINESS_IMPACT_DESCRIPTIONS[type] || 'Development activity in this area'}

`;
      }
    });

    return section;
  }

  generateMetricsSection(analysis, options) {
    return `### 📊 **Key Performance Indicators**
- **Total Commits:** ${analysis.totalCommits}
- **Average Daily Velocity:** ${analysis.averageCommitsPerDay} commits/day
- **Active Contributors:** ${Object.keys(analysis.commitsByAuthor).length}
- **Most Active Day:** ${this.getMostActiveDay(analysis)}
- **Development Consistency:** ${this.getConsistencyScore(analysis)}%

### 🎯 **Commit Distribution**
${Object.entries(analysis.commitsByType)
  .sort(([, a], [, b]) => b - a)
  .map(
    ([type, count]) =>
      `- **${COMMIT_TYPE_MAPPINGS[type] || type}:** ${count} commits`
  )
  .join('\n')}
`;
  }

  getMostActiveDay(analysis) {
    const maxCommits = Math.max(...Object.values(analysis.commitsByDate));
    const mostActiveDate = Object.entries(analysis.commitsByDate).find(
      ([date, count]) => count === maxCommits
    );
    return mostActiveDate
      ? `${mostActiveDate[0]} (${mostActiveDate[1]} commits)`
      : 'N/A';
  }

  getConsistencyScore(analysis) {
    const values = Object.values(analysis.commitsByDate);
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Convert to consistency score (lower std dev = higher consistency)
    return Math.max(0, Math.min(100, 100 - (stdDev / mean) * 100)).toFixed(0);
  }

  generateTrendsSection(analysis, options) {
    return `### 📈 **Development Patterns**
- **Team Velocity:** ${this.getVelocityTrend(analysis)}
- **Focus Areas:** ${this.getFocusAreas(analysis)}
- **Quality Indicators:** ${this.getQualityIndicators(analysis)}

### 🔮 **Insights & Recommendations**
${this.generateRecommendations(analysis)}
`;
  }

  getVelocityTrend(analysis) {
    const velocity = parseFloat(analysis.averageCommitsPerDay);
    if (velocity > 5)
      return 'High-velocity development with frequent iterations';
    if (velocity > 2) return 'Steady development pace with consistent progress';
    return 'Measured development approach with focused changes';
  }

  getFocusAreas(analysis) {
    const topTypes = Object.entries(analysis.commitsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([type]) => COMMIT_TYPE_MAPPINGS[type] || type);
    return topTypes.join(' and ');
  }

  getQualityIndicators(analysis) {
    const fixRatio = (analysis.commitsByType.fix || 0) / analysis.totalCommits;
    const testRatio =
      (analysis.commitsByType.test || 0) / analysis.totalCommits;

    if (testRatio > 0.1)
      return 'Strong focus on quality with comprehensive testing';
    if (fixRatio < 0.2)
      return 'Proactive development with minimal bug fixes needed';
    return 'Balanced approach to feature development and maintenance';
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    const fixRatio = (analysis.commitsByType.fix || 0) / analysis.totalCommits;
    const featRatio =
      (analysis.commitsByType.feat || 0) / analysis.totalCommits;
    const testRatio =
      (analysis.commitsByType.test || 0) / analysis.totalCommits;

    if (fixRatio > 0.3) {
      recommendations.push(
        '- Consider increasing test coverage to reduce bug fixes'
      );
    }

    if (featRatio > 0.5) {
      recommendations.push(
        '- Strong feature development momentum - maintain current pace'
      );
    }

    if (testRatio < 0.05) {
      recommendations.push(
        '- Consider adding more automated testing for better quality assurance'
      );
    }

    if (Object.keys(analysis.commitsByAuthor).length === 1) {
      recommendations.push(
        '- Consider expanding the development team for better knowledge sharing'
      );
    }

    return recommendations.length > 0
      ? recommendations.join('\n')
      : '- Current development patterns show healthy project progress';
  }

  getTimeRangeDescription(options) {
    switch (options.timeRange) {
      case '7days':
        return 'Last 7 days';
      case '30days':
        return 'Last 30 days';
      case '3months':
        return 'Last 3 months';
      case 'lastrelease':
        return 'Since last release';
      case 'custom':
        return `${options.startDate} to ${options.endDate}`;
      case 'all':
        return 'All time';
      default:
        return 'Custom range';
    }
  }

  generateHashtags(analysis) {
    const tags = [
      '#FeatureDebrief',
      '#DevelopmentAnalysis',
      '#GitAnalysis',
      '#TeamVelocity',
      '#CodeQuality',
      '#TechnicalDebt',
      '#FeatureDevelopment',
      '#BugFixes',
      '#PerformanceOptimization',
      '#UserExperience',
      '#DeveloperProductivity',
      '#ContinuousImprovement',
      '#SoftwareDevelopment',
      '#ProjectManagement'
    ];

    // Add dynamic tags based on analysis
    const topType = Object.entries(analysis.commitsByType).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (topType) {
      const [type] = topType;
      switch (type) {
        case 'feat':
          tags.push('#FeatureRich', '#Innovation');
          break;
        case 'fix':
          tags.push('#QualityFocus', '#Reliability');
          break;
        case 'perf':
          tags.push('#PerformanceFirst', '#Optimization');
          break;
        case 'refactor':
          tags.push('#CleanCode', '#Architecture');
          break;
      }
    }

    return tags.join(' ');
  }

  async saveReport(report, options) {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const outputPath = path.join(this.outputDir, options.outputFile);
    fs.writeFileSync(outputPath, report, 'utf8');

    log.success(`Report saved to: ${outputPath}`);
    log.info(
      `File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`
    );
  }
}

// Run the generator
if (require.main === module) {
  const generator = new FeatureDebriefGenerator();
  generator.run().catch((error) => {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  });
}

module.exports = FeatureDebriefGenerator;
