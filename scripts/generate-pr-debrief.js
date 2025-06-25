#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Try to load chalk, fallback to no-color functions if it fails
let chalk;
try {
  chalk = require('chalk');
  if (typeof chalk.red !== 'function') {
    throw new Error('Chalk functions not available');
  }
} catch (error) {
  chalk = {
    bold: { cyan: (text) => text, yellow: (text) => text },
    green: (text) => text,
    yellow: (text) => text,
    red: (text) => text,
    blue: (text) => text,
    magenta: (text) => text,
    gray: (text) => text,
    underline: { blue: (text) => text }
  };
  chalk.bold = (text) => text;
}

/* eslint-disable no-console */
const log = {
  title: (text) => console.log(chalk.bold.cyan(`\n🚀 ${text}`)),
  success: (text) => console.log(chalk.green(`✅ ${text}`)),
  warning: (text) => console.log(chalk.yellow(`⚠️  ${text}`)),
  error: (text) => console.log(chalk.red(`❌ ${text}`)),
  info: (text) => console.log(chalk.blue(`ℹ️  ${text}`)),
  step: (text) => console.log(chalk.magenta(`📋 ${text}`)),
  data: (text) => console.log(chalk.gray(`   ${text}`))
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

class PRDebriefGenerator {
  constructor() {
    this.outputDir = './reports';
    this.prNumber = process.env.PR_NUMBER;
    this.prTitle = process.env.PR_TITLE;
    this.prBaseSha = process.env.PR_BASE_SHA;
    this.prHeadSha = process.env.PR_HEAD_SHA;
    this.prAuthor = process.env.PR_AUTHOR;
    this.prUrl = process.env.PR_URL;
  }

  async run() {
    try {
      log.title(`PR Debrief Generator - PR #${this.prNumber}`);
      log.info(`Analyzing commits in PR: ${this.prTitle}`);
      log.data(
        `Range: ${this.prBaseSha?.substring(0, 7)}...${this.prHeadSha?.substring(0, 7)}`
      );
      log.data(`Author: ${this.prAuthor}`);

      // Analyze PR commits
      log.step('Analyzing PR commit history...');
      const analysis = await this.analyzePRCommits();

      // Generate PR-specific report
      log.step('Creating PR-specific feature debrief...');
      const report = await this.generatePRReport(analysis);

      // Save report
      await this.saveReport(report);

      log.success('PR debrief generated successfully!');
    } catch (error) {
      log.error(`Failed to generate PR debrief: ${error.message}`);
      process.exit(1);
    }
  }

  async analyzePRCommits() {
    log.data('Extracting commits from PR range...');

    // Get commits in the PR
    let gitArgs;
    if (this.prBaseSha && this.prHeadSha) {
      gitArgs = [
        'log',
        '--oneline',
        '--pretty=format:"%h|%ad|%s|%an"',
        '--date=short',
        `${this.prBaseSha}..${this.prHeadSha}`
      ];
    } else {
      // Fallback: get recent commits
      gitArgs = [
        'log',
        '--oneline',
        '--pretty=format:"%h|%ad|%s|%an"',
        '--date=short',
        '-10'
      ];
    }

    try {
      const output = execSync(`git ${gitArgs.join(' ')}`, { encoding: 'utf8' });
      const commits = output
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const cleanLine = line.replace(/^"/, '').replace(/"$/, '');
          const [hash, date, subject, author] = cleanLine.split('|');
          return { hash, date, subject, author };
        });

      log.data(`Found ${commits.length} commits in PR`);

      const analysis = {
        totalCommits: commits.length,
        commitsByType: {},
        commitsByAuthor: {},
        commitsByDate: {},
        commits: commits,
        prInfo: {
          number: this.prNumber,
          title: this.prTitle,
          author: this.prAuthor,
          url: this.prUrl
        }
      };

      commits.forEach((commit) => {
        // Analyze commit type
        const type = this.extractCommitType(commit.subject);
        analysis.commitsByType[type] = (analysis.commitsByType[type] || 0) + 1;

        // Analyze by author
        analysis.commitsByAuthor[commit.author] =
          (analysis.commitsByAuthor[commit.author] || 0) + 1;

        // Analyze by date
        analysis.commitsByDate[commit.date] =
          (analysis.commitsByDate[commit.date] || 0) + 1;
      });

      return analysis;
    } catch (error) {
      throw new Error(`Git analysis failed: ${error.message}`);
    }
  }

  extractCommitType(subject) {
    const match = subject.match(/^(\w+)(\(.+\))?:/);
    if (match) {
      return match[1].toLowerCase();
    }
    return 'other';
  }

  async generatePRReport(analysis) {
    const now = new Date();
    const dateRange = this.getDateRange(analysis);

    let report = `# 📊 PR Feature Debrief Report
## *Pull Request #${analysis.prInfo.number} Analysis*

---

### 📅 **PR Information**
**PR Number:** [#${analysis.prInfo.number}](${analysis.prInfo.url})  
**Title:** ${analysis.prInfo.title}  
**Author:** ${analysis.prInfo.author}  
**Generated:** ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}  
**Commit Range:** ${dateRange}

---

## 🎯 **Executive Summary**

This pull request contains **${analysis.totalCommits} commits** that ${this.getImpactDescription(analysis)}.

### 🚀 **Key Changes**
${this.generateKeyChanges(analysis)}

### 💼 **Business Impact**
${this.generateBusinessImpact(analysis)}

### 👥 **Development Contribution**
${this.generateContributionSummary(analysis)}

---

## 🔧 **Technical Changes**

### 📝 **Commit Breakdown**
${this.generateCommitBreakdown(analysis)}

### 📊 **Change Distribution**
${this.generateChangeDistribution(analysis)}

---

## 📋 **Detailed Commit History**

${this.generateCommitHistory(analysis)}

---

## 🏷️ **Tags & Categories**

${this.generateHashtags(analysis)}

---

**Report Generated by:** PR Debrief Bot 🤖  
**Data Source:** Git Commit Analysis  
**PR Link:** ${analysis.prInfo.url}
`;

    return report;
  }

  getDateRange(analysis) {
    const dates = Object.keys(analysis.commitsByDate);
    if (dates.length === 0) return 'No commits';
    if (dates.length === 1) return dates[0];

    const sortedDates = dates.sort();
    return `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`;
  }

  getImpactDescription(analysis) {
    const topType = Object.entries(analysis.commitsByType).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (!topType) return 'introduce various changes';

    const [type, count] = topType;
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(0);
    const typeLabel = COMMIT_TYPE_MAPPINGS[type] || type;

    if (percentage > 50) {
      return `primarily focus on ${typeLabel.toLowerCase()} (${percentage}% of changes)`;
    } else {
      return `include a mix of changes, with emphasis on ${typeLabel.toLowerCase()}`;
    }
  }

  generateKeyChanges(analysis) {
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

  generateBusinessImpact(analysis) {
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

  generateContributionSummary(analysis) {
    const contributions = Object.entries(analysis.commitsByAuthor).map(
      ([author, count]) => {
        const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
        return `- **${author}**: ${count} commits (${percentage}%)`;
      }
    );

    return contributions.join('\n');
  }

  generateCommitBreakdown(analysis) {
    let section = '';

    Object.entries(analysis.commitsByType).forEach(([type, count]) => {
      const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
      const typeLabel = COMMIT_TYPE_MAPPINGS[type] || type;
      section += `#### ${typeLabel}
- **${count} commits** (${percentage}% of total)
- ${BUSINESS_IMPACT_DESCRIPTIONS[type] || 'Development activity in this area'}

`;
    });

    return section;
  }

  generateChangeDistribution(analysis) {
    return Object.entries(analysis.commitsByType)
      .sort(([, a], [, b]) => b - a)
      .map(
        ([type, count]) =>
          `- **${COMMIT_TYPE_MAPPINGS[type] || type}:** ${count} commits`
      )
      .join('\n');
  }

  generateCommitHistory(analysis) {
    return analysis.commits
      .map((commit) => {
        const type = this.extractCommitType(commit.subject);
        const typeLabel = COMMIT_TYPE_MAPPINGS[type] || type;
        return `- \`${commit.hash}\` **[${typeLabel}]** ${commit.subject} *(${commit.author}, ${commit.date})*`;
      })
      .join('\n');
  }

  generateHashtags(analysis) {
    const tags = [
      '#PullRequest',
      '#FeatureDebrief',
      '#CodeReview',
      '#Development',
      '#GitAnalysis',
      '#TeamCollaboration',
      '#SoftwareDevelopment'
    ];

    // Add dynamic tags based on analysis
    const topType = Object.entries(analysis.commitsByType).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (topType) {
      const [type] = topType;
      switch (type) {
        case 'feat':
          tags.push('#NewFeatures', '#Innovation');
          break;
        case 'fix':
          tags.push('#BugFixes', '#QualityImprovement');
          break;
        case 'perf':
          tags.push('#Performance', '#Optimization');
          break;
        case 'refactor':
          tags.push('#Refactoring', '#CodeQuality');
          break;
      }
    }

    return tags.join(' ');
  }

  async saveReport(report) {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const filename = `pr-${this.prNumber}-debrief-${new Date().toISOString().split('T')[0]}.md`;
    const outputPath = path.join(this.outputDir, filename);
    fs.writeFileSync(outputPath, report, 'utf8');

    log.success(`Report saved to: ${outputPath}`);
    log.info(
      `File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`
    );
  }
}

// Run the generator
if (require.main === module) {
  const generator = new PRDebriefGenerator();
  generator.run().catch((error) => {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  });
}

module.exports = PRDebriefGenerator;
