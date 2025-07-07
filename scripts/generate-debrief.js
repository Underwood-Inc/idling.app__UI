const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Import chalk with robust fallback (supports both CommonJS and ESM)
let chalk;

async function initChalk() {
  try {
    // Try dynamic import for ESM chalk (works with Node 22+)
    chalk = (await import('chalk')).default;
    if (!chalk || typeof chalk.red !== 'function') {
      throw new Error('Chalk functions not available');
    }
  } catch (error) {
    try {
      // Fallback to CommonJS require for older chalk versions
      chalk = require('chalk');
      if (!chalk || typeof chalk.red !== 'function') {
        throw new Error('Chalk functions not available');
      }
    } catch (requireError) {
      // Ultimate fallback when chalk is not available or not working
      const identity = (text) => text;
      const createChalkProxy = () =>
        new Proxy(identity, {
          get: () => createChalkProxy(),
          apply: (target, thisArg, args) => args[0] || ''
        });

      chalk = {
        green: createChalkProxy(),
        red: createChalkProxy(),
        yellow: createChalkProxy(),
        blue: createChalkProxy(),
        cyan: createChalkProxy(),
        magenta: createChalkProxy(),
        bold: createChalkProxy(),
        dim: createChalkProxy(),
        white: createChalkProxy()
      };
    }
  }
}

class DebriefGenerator {
  constructor(options = {}) {
    this.options = {
      days: options.days || 30,
      outputDir: options.outputDir || 'reports',
      filename: options.filename || this.generateDefaultFilename(options),
      style: options.style || 'comprehensive',
      commitRange: options.commitRange || null,
      prNumber: options.prNumber || null,
      prTitle: options.prTitle || null,
      prAuthor: options.prAuthor || null,
      prUrl: options.prUrl || null,
      baseSha: options.baseSha || null,
      headSha: options.headSha || null,
      ...options
    };
  }

  generateDefaultFilename(options) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    if (options.prNumber) {
      return `pr-${options.prNumber}-debrief.md`;
    } else if (options.commitRange) {
      const rangeStr = options.commitRange.replace(/[^\w.-]/g, '_');
      return `feature-debrief-${rangeStr}-${dateStr}.md`;
    } else {
      const days = options.days || 30;
      return `feature-debrief-${days}days-${dateStr}.md`;
    }
  }

  async generate() {
    if (!chalk) await initChalk();
    console.log(chalk.cyan('🔍 Generating Feature Debrief Report...'));

    try {
      // Ensure output directory exists and is writable
      try {
        if (!fs.existsSync(this.options.outputDir)) {
          fs.mkdirSync(this.options.outputDir, { recursive: true });
        }
        // Test write permissions by creating a temp file
        const testFile = path.join(this.options.outputDir, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (error) {
        // If we can't write to reports/, use current directory
        console.log(
          `⚠️ Cannot write to ${this.options.outputDir}, using current directory`
        );
        this.options.outputDir = '.';
      }

      let commits;
      if (this.options.commitRange) {
        commits = this.getCommitsFromRange(this.options.commitRange);
      } else if (this.options.baseSha && this.options.headSha) {
        commits = this.getCommitsFromPR(
          this.options.baseSha,
          this.options.headSha
        );
      } else {
        commits = this.getCommitsFromDays(this.options.days);
      }

      const analysis = this.analyzeCommits(commits);

      // Handle multiple formats and report types
      const format = this.options.format || this.getFileFormat();
      const reportType = this.options.reportType || 'detailed';

      if (format === 'all' || reportType === 'all') {
        return await this.generateMultipleReports(
          analysis,
          commits,
          format,
          reportType
        );
      } else {
        return await this.generateSingleReport(
          analysis,
          commits,
          format,
          reportType
        );
      }
    } catch (error) {
      console.error(chalk.red('❌ Error generating debrief:'), error.message);
      throw error;
    }
  }

  getCommitsFromRange(range) {
    const gitCmd = `git log --oneline --pretty=format:"%h|%ad|%s|%an" --date=short ${range}`;
    return this.executeGitCommand(gitCmd);
  }

  getCommitsFromPR(baseSha, headSha) {
    const gitCmd = `git log --oneline --pretty=format:"%h|%ad|%s|%an" --date=short ${baseSha}..${headSha}`;
    return this.executeGitCommand(gitCmd);
  }

  getCommitsFromDays(days) {
    const gitCmd = `git log --oneline --pretty=format:"%h|%ad|%s|%an" --date=short --since="${days} days ago"`;
    return this.executeGitCommand(gitCmd);
  }

  executeGitCommand(gitCmd) {
    try {
      const output = execSync(gitCmd, { encoding: 'utf8' });
      return output
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const cleanLine = line.replace(/^"/, '').replace(/"$/, '');
          const parts = cleanLine.split('|');
          if (parts.length >= 4) {
            const [hash, date, subject, author] = parts;
            return {
              hash: hash || '',
              date: date || '',
              subject: subject || '',
              author: author || '',
              body: '' // Add empty body field for enhanced analysis
            };
          }
          return null;
        })
        .filter((commit) => commit !== null);
    } catch (error) {
      console.error(chalk.red('❌ Git command failed:'), gitCmd);
      throw error;
    }
  }

  analyzeCommits(commits) {
    const commitsByType = {};
    const commitsByAuthor = {};
    const commitsByDate = {};
    const commitsByScope = {};
    const commitsByHour = {};
    const commitsByDayOfWeek = {};
    const detailedCommits = [];
    const versionBumps = [];
    const breakingChanges = [];
    const securityFixes = [];
    const performanceImprovements = [];
    const fileChanges = {};
    const commitSizes = { small: 0, medium: 0, large: 0, massive: 0 };

    const typeMapping = {
      feat: 'New Features & Enhancements',
      fix: 'Bug Fixes & Improvements',
      chore: 'Maintenance & Infrastructure',
      refactor: 'Code Quality & Architecture',
      docs: 'Documentation & Guides',
      style: 'UI/UX & Design Updates',
      test: 'Quality Assurance & Testing',
      perf: 'Performance Optimization',
      ci: 'Continuous Integration',
      build: 'Build System',
      revert: 'Reverts',
      security: 'Security Fixes',
      release: 'Version Releases'
    };

    commits.forEach((commit) => {
      // Enhanced commit parsing
      const match = commit.subject.match(/^(\w+)(\(([^)]+)\))?(!)?:\s*(.+)/);
      const type = match ? match[1].toLowerCase() : 'other';
      const scope = match && match[3] ? match[3] : null;
      const isBreaking = !!(match && match[4]);
      const description = match ? match[5] : commit.subject;
      const businessType = typeMapping[type] || 'Other';

      // Get detailed commit info including files changed
      const commitDetails = this.getDetailedCommitInfo(commit.hash);

      // Categorize commit sizes
      const linesChanged = commitDetails.insertions + commitDetails.deletions;
      if (linesChanged <= 10) commitSizes.small++;
      else if (linesChanged <= 50) commitSizes.medium++;
      else if (linesChanged <= 200) commitSizes.large++;
      else commitSizes.massive++;

      // Track file changes
      commitDetails.files.forEach((file) => {
        if (!fileChanges[file.name]) {
          fileChanges[file.name] = { commits: 0, insertions: 0, deletions: 0 };
        }
        fileChanges[file.name].commits++;
        fileChanges[file.name].insertions += file.insertions || 0;
        fileChanges[file.name].deletions += file.deletions || 0;
      });

      // Detect version bumps
      if (this.isVersionBump(commit.subject, commitDetails.files)) {
        versionBumps.push({
          hash: commit.hash,
          subject: commit.subject,
          author: commit.author,
          date: commit.date,
          version: this.extractVersion(commit.subject, commitDetails.files),
          type: this.getVersionBumpType(commit.subject, commitDetails.files)
        });
      }

      // Track breaking changes
      if (isBreaking || this.hasBreakingChanges(commit.body || '')) {
        breakingChanges.push({
          hash: commit.hash,
          subject: commit.subject,
          author: commit.author,
          date: commit.date,
          description: this.extractBreakingChangeDescription(commit.body || '')
        });
      }

      // Track security fixes
      if (this.isSecurityFix(commit.subject, commit.body || '')) {
        securityFixes.push({
          hash: commit.hash,
          subject: commit.subject,
          author: commit.author,
          date: commit.date,
          severity: this.getSecuritySeverity(commit.subject, commit.body || '')
        });
      }

      // Track performance improvements
      if (
        type === 'perf' ||
        this.isPerformanceImprovement(commit.subject, commit.body || '')
      ) {
        performanceImprovements.push({
          hash: commit.hash,
          subject: commit.subject,
          author: commit.author,
          date: commit.date,
          impact: this.getPerformanceImpact(commit.subject, commit.body || '')
        });
      }

      // Time-based analysis
      const commitDate = new Date(commit.date);
      const hour = commitDate.getHours();
      const dayOfWeek = commitDate.toLocaleDateString('en-US', {
        weekday: 'long'
      });

      commitsByHour[hour] = (commitsByHour[hour] || 0) + 1;
      commitsByDayOfWeek[dayOfWeek] = (commitsByDayOfWeek[dayOfWeek] || 0) + 1;

      // Enhanced detailed commit info
      const detailedCommit = {
        hash: commit.hash,
        shortHash: commit.hash.substring(0, 8),
        subject: commit.subject,
        body: commit.body || '',
        author: commit.author,
        date: commit.date,
        type,
        businessType,
        scope,
        isBreaking,
        description,
        linesChanged,
        filesChanged: commitDetails.files.length,
        insertions: commitDetails.insertions,
        deletions: commitDetails.deletions,
        files: commitDetails.files,
        coAuthors: this.extractCoAuthors(commit.body || ''),
        tags: this.extractTags(commit.subject, commit.body || ''),
        references: this.extractReferences(commit.body || ''),
        complexity: this.calculateCommitComplexity(commitDetails)
      };

      detailedCommits.push(detailedCommit);

      // Existing aggregations
      commitsByType[businessType] = (commitsByType[businessType] || 0) + 1;
      commitsByAuthor[commit.author] =
        (commitsByAuthor[commit.author] || 0) + 1;
      commitsByDate[commit.date] = (commitsByDate[commit.date] || 0) + 1;

      if (scope) {
        commitsByScope[scope] = (commitsByScope[scope] || 0) + 1;
      }
    });

    return {
      commitsByType,
      commitsByAuthor,
      commitsByDate,
      commitsByScope,
      commitsByHour,
      commitsByDayOfWeek,
      commitSizes,
      fileChanges,
      detailedCommits,
      versionBumps,
      breakingChanges,
      securityFixes,
      performanceImprovements,
      totalCommits: commits.length,
      totalLinesChanged: detailedCommits.reduce(
        (sum, c) => sum + c.linesChanged,
        0
      ),
      totalFilesChanged: Object.keys(fileChanges).length,
      averageCommitSize:
        commits.length > 0
          ? detailedCommits.reduce((sum, c) => sum + c.linesChanged, 0) /
            commits.length
          : 0
    };
  }

  async generateSingleReport(analysis, commits, format, reportType) {
    const report = this.generateReport(analysis, commits, reportType);
    const filename = this.options.filename || this.generateDefaultFilename();

    return await this.writeReport(report, filename, format);
  }

  async generateMultipleReports(analysis, commits, format, reportType) {
    const baseFilename = this.options.filename
      ? this.options.filename.replace(/\.[^.]+$/, '')
      : this.generateDefaultFilename().replace(/\.[^.]+$/, '');

    const timestamp = new Date().toISOString().split('T')[0];
    const outputDir = this.options.outputDir || 'reports';
    const multiOutputDir = path.join(outputDir, `debrief-${timestamp}`);

    // Create dedicated directory for multiple outputs
    try {
      if (!fs.existsSync(multiOutputDir)) {
        fs.mkdirSync(multiOutputDir, { recursive: true });
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ Using current directory for output'));
    }

    console.log(
      chalk.cyan(
        `📁 Creating comprehensive report suite in: ${multiOutputDir}/`
      )
    );

    const formats = format === 'all' ? ['md', 'html', 'txt'] : [format];
    const reportTypes =
      reportType === 'all' ? ['standard', 'detailed', 'ultra'] : [reportType];
    const generatedFiles = [];

    for (const rType of reportTypes) {
      const report = this.generateReport(analysis, commits, rType);

      for (const fmt of formats) {
        const filename = `${baseFilename}-${rType}.${fmt}`;
        const fullPath = path.join(multiOutputDir, filename);

        try {
          const convertedReport = this.convertToFormat(report, fmt);
          fs.writeFileSync(fullPath, convertedReport);
          console.log(chalk.green(`✅ Generated: ${filename}`));
          generatedFiles.push(fullPath);
        } catch (error) {
          console.log(
            chalk.red(`❌ Failed to generate ${filename}: ${error.message}`)
          );
        }
      }
    }

    console.log(
      chalk.green.bold(
        `🎉 Complete report suite generated in: ${multiOutputDir}/`
      )
    );
    return generatedFiles;
  }

  async writeReport(report, filename, format) {
    const outputDir = this.options.outputDir || 'reports';
    const convertedReport = this.convertToFormat(report, format);

    // Ensure filename has correct extension
    const ext = format === 'md' ? 'md' : format === 'html' ? 'html' : 'txt';
    const finalFilename = filename.includes('.')
      ? filename
      : `${filename}.${ext}`;

    const outputPath = path.join(outputDir, finalFilename);
    const dir = path.dirname(outputPath);

    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, convertedReport);
      console.log(chalk.green(`✅ Report generated: ${outputPath}`));
      return outputPath;
    } catch (error) {
      // Fallback to current directory if reports directory is not writable
      const fallbackPath = finalFilename;
      fs.writeFileSync(fallbackPath, convertedReport);
      console.log(chalk.green(`✅ Report generated: ${fallbackPath}`));
      return fallbackPath;
    }
  }

  generateReport(analysis, commits, reportType = 'detailed') {
    const now = new Date();

    let content;
    if (this.options.prNumber) {
      content = this.generatePRReport(analysis, commits, now, reportType);
    } else {
      content = this.generateComprehensiveReport(
        analysis,
        commits,
        now,
        reportType
      );
    }

    return content;
  }

  getFileFormat() {
    // Check explicit format option first
    if (
      this.options.format &&
      ['html', 'txt', 'md'].includes(this.options.format)
    ) {
      return this.options.format;
    }

    // Fall back to filename extension
    if (this.options.filename) {
      const ext = this.options.filename.split('.').pop().toLowerCase();
      if (['html', 'txt', 'md'].includes(ext)) {
        return ext;
      }
    }
    return 'md'; // default
  }

  convertToFormat(markdownContent, format) {
    switch (format) {
      case 'html':
        return this.markdownToHtml(markdownContent);
      case 'txt':
        return this.markdownToText(markdownContent);
      case 'md':
      default:
        return markdownContent;
    }
  }

  markdownToHtml(markdown) {
    // Process markdown to HTML with proper handling
    let html = markdown
      // Handle headers first
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')

      // Handle bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')

      // Handle code blocks and inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')

      // Handle horizontal rules
      .replace(/^---$/gm, '<hr>')

      // Handle lists - preserve structure
      .replace(/^- (.*$)/gm, '<li>$1</li>')

      // Handle hashtags
      .replace(/#(\w+)/g, '<span class="tag">#$1</span>')

      // Split into paragraphs and process
      .split('\n\n')
      .map((paragraph) => {
        paragraph = paragraph.trim();
        if (!paragraph) return '';

        // Skip if already HTML element
        if (paragraph.match(/^<(h[1-6]|hr)/)) {
          return paragraph;
        }

        // Handle list items
        if (paragraph.includes('<li>')) {
          const items = paragraph.split('\n').filter((line) => line.trim());
          return '<ul>\n' + items.join('\n') + '\n</ul>';
        }

        // Regular paragraph
        return '<p>' + paragraph.replace(/\n/g, '<br>') + '</p>';
      })
      .join('\n\n')

      // Post-process to fix consecutive list items
      .replace(/<\/ul>\n\n<ul>/g, ''); // Merge consecutive lists

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Feature Debrief Report</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 40px; 
            line-height: 1.6; 
            color: #333;
        }
        h1, h2, h3, h4 { color: #2c3e50; margin-top: 30px; margin-bottom: 15px; }
        h1 { 
            border-bottom: 3px solid #3498db; 
            padding-bottom: 15px; 
            font-size: 2.5em;
        }
        h2 { 
            border-bottom: 2px solid #bdc3c7; 
            padding-bottom: 10px; 
            font-size: 2em;
        }
        h3 { font-size: 1.5em; }
        h4 { font-size: 1.2em; }
        
        p { margin: 15px 0; }
        
        ul { 
            list-style: none; 
            padding-left: 0; 
            margin: 20px 0;
        }
        li { 
            position: relative;
            padding-left: 25px;
            margin: 8px 0;
        }
        li:before { 
            content: "▶"; 
            color: #3498db; 
            font-weight: bold; 
            position: absolute;
            left: 0;
        }
        
        code { 
            background-color: #f8f9fa; 
            padding: 3px 6px; 
            border-radius: 4px; 
            font-family: 'Fira Code', 'Monaco', monospace;
            font-size: 0.9em;
        }
        
        strong { color: #2c3e50; }
        
        hr { 
            border: none; 
            border-top: 2px solid #ecf0f1; 
            margin: 40px 0; 
        }
        
        .tag { 
            background-color: #e8f4fd; 
            color: #2980b9; 
            padding: 2px 6px; 
            border-radius: 3px; 
            font-size: 0.9em;
            margin-right: 5px;
        }
        
        .metrics-section {
            background-color: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 5px solid #3498db;
        }
    </style>
</head>
<body>
${html}
</body>
</html>`;
  }

  markdownToText(markdown) {
    return (
      markdown
        // Remove markdown headers but keep the text
        .replace(/^#{1,6}\s+/gm, '')

        // Remove bold/italic formatting but keep content
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')

        // Remove code formatting but keep content
        .replace(/`([^`]+)`/g, '$1')

        // Remove table formatting
        .replace(/^\|\s*(.+?)\s*\|$/gm, '$1')
        .replace(/^\|[-:\s|]+\|$/gm, '')

        // Remove blockquotes
        .replace(/^>\s+/gm, '')

        // Keep horizontal rules simple
        .replace(/^-{3,}$/gm, '---')

        // Convert list markers to bullets
        .replace(/^[*+-]\s+/gm, '• ')

        // Clean up excessive whitespace but preserve structure
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
  }

  generatePRReport(analysis, commits, now) {
    const { prNumber, prTitle, prAuthor, prUrl } = this.options;

    return `# 📊 PR Feature Debrief Report
## Pull Request #${prNumber} Analysis

**PR:** [#${prNumber}](${prUrl})  
**Title:** ${prTitle}  
**Author:** ${prAuthor}  
**Total Commits:** ${commits.length}

## Executive Summary

This pull request contains **${commits.length} commits**:

### Commit Types
${Object.entries(analysis.commitsByType)
  .map(([type, count]) => {
    const percentage = ((count / commits.length) * 100).toFixed(1);
    return `- **${type}**: ${count} commits (${percentage}%)`;
  })
  .join('\n')}

### Contributors
${Object.entries(analysis.commitsByAuthor)
  .map(([author, count]) => {
    const percentage = ((count / commits.length) * 100).toFixed(1);
    return `- **${author}**: ${count} commits (${percentage}%)`;
  })
  .join('\n')}

## All Commits

${commits
  .map((commit) => {
    const match = commit.subject.match(/^(\w+)(\(.+\))?:/);
    const type = match ? match[1] : 'other';
    return `- \`${commit.hash}\` **[${type}]** ${commit.subject} *(${commit.author}, ${commit.date})*`;
  })
  .join('\n')}

---

**Report Generated:** ${now.toLocaleString()}  
**Report Generated by:** Feature Debrief Generator  
**Data Source:** Git Repository Analysis  
**Tool:** auto-changelog wrapper with business intelligence
`;
  }

  generateComprehensiveReport(analysis, commits, now, reportType = 'detailed') {
    const avgCommitsPerDay = (
      analysis.totalCommits / (this.options.days || 30)
    ).toFixed(1);
    const mostActiveDay = Object.entries(analysis.commitsByDate).sort(
      ([, a], [, b]) => b - a
    )[0];

    // Generate different levels of detail based on report type
    switch (reportType) {
      case 'standard':
        return this.generateStandardReport(
          analysis,
          commits,
          now,
          avgCommitsPerDay,
          mostActiveDay
        );
      case 'ultra':
        return this.generateUltraDetailedReport(
          analysis,
          commits,
          now,
          avgCommitsPerDay,
          mostActiveDay
        );
      case 'detailed':
      default:
        return this.generateDetailedReport(
          analysis,
          commits,
          now,
          avgCommitsPerDay,
          mostActiveDay
        );
    }
  }

  generateStandardReport(
    analysis,
    commits,
    now,
    avgCommitsPerDay,
    mostActiveDay
  ) {
    return `# 📊 Feature Debrief Report
## *Development Activity Analysis*

---

### 📅 **Analysis Period**
**Generated:** ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}  
**Time Range:** Last ${this.options.days} days  
**Report Style:** ${this.options.style}

---

## 🎯 **Executive Summary**

Our development team has maintained a **high-velocity development pace** with **${analysis.totalCommits} commits** during this period, averaging **${avgCommitsPerDay} commits per day**.

### 🚀 **Key Highlights**
${Object.entries(analysis.commitsByType)
  .slice(0, 3)
  .map(([type, count]) => {
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
    return `- **${percentage}%** ${type} (${count} commits)`;
  })
  .join('\n')}

### 💼 **Business Impact**
${Object.entries(analysis.commitsByType)
  .map(([type, count]) => {
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
    const impact = this.getBusinessImpact(type);
    return `- **${type}** (${percentage}%): ${impact}`;
  })
  .join('\n')}

### 👥 **Team Contribution**
${Object.entries(analysis.commitsByAuthor)
  .map(([author, count]) => {
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
    return `- **${author}**: ${count} commits (${percentage}%)`;
  })
  .join('\n')}

---

## 🔧 **Technical Development Activity**

### 🔧 **Development Breakdown by Category**

${Object.entries(analysis.commitsByType)
  .map(([type, count]) => {
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
    const impact = this.getBusinessImpact(type);
    return `#### ${type}
- **${count} commits** (${percentage}% of total)
- ${impact}`;
  })
  .join('\n\n')}

---

## 📈 **Development Metrics**

### 📊 **Key Performance Indicators**
- **Total Commits:** ${analysis.totalCommits}
- **Average Daily Velocity:** ${avgCommitsPerDay} commits/day
- **Active Contributors:** ${Object.keys(analysis.commitsByAuthor).length}
- **Most Active Day:** ${mostActiveDay ? mostActiveDay[0] : 'N/A'} (${mostActiveDay ? mostActiveDay[1] : 0} commits)
- **Development Consistency:** ${this.calculateConsistency(analysis.commitsByDate)}%

### 🎯 **Commit Distribution**
${Object.entries(analysis.commitsByType)
  .map(([type, count]) => {
    return `- **${type}:** ${count} commits`;
  })
  .join('\n')}

---

## 📊 **Trends & Insights**

### 📈 **Development Patterns**
- **Team Velocity:** ${this.getVelocityInsight(avgCommitsPerDay)}
- **Focus Areas:** ${Object.keys(analysis.commitsByType).slice(0, 2).join(' and ')}
- **Quality Indicators:** ${this.getQualityInsight(analysis.commitsByType)}

### 🔮 **Insights & Recommendations**
- ${this.generateRecommendations(analysis)}

---

## 🏷️ **Tags & Categories**

#FeatureDebrief #DevelopmentAnalysis #GitAnalysis #TeamVelocity #CodeQuality #TechnicalDebt #FeatureDevelopment #BugFixes #PerformanceOptimization #UserExperience #DeveloperProductivity #ContinuousImprovement #SoftwareDevelopment #ProjectManagement

---

**Report Generated by:** Feature Debrief Generator  
**Data Source:** Git Repository Analysis  
**Tool:** auto-changelog wrapper with business intelligence
`;
  }

  getBusinessImpact(type) {
    const impacts = {
      'New Features & Enhancements':
        'Delivers new value to users and expands product capabilities',
      'Bug Fixes & Improvements':
        'Enhances user experience and system reliability',
      'Maintenance & Infrastructure':
        'Maintains system health and development workflow',
      'Code Quality & Architecture':
        'Strengthens codebase foundation for future development',
      'Documentation & Guides':
        'Improves developer productivity and user understanding',
      'UI/UX & Design Updates':
        'Modernizes user interface and improves visual consistency',
      'Quality Assurance & Testing':
        'Ensures product quality and reduces potential issues',
      'Performance Optimization':
        'Improves system speed and resource efficiency',
      'Continuous Integration':
        'Streamlines development and deployment processes',
      'Build System': 'Optimizes build pipeline and development tools',
      Other: 'Supports various development activities'
    };
    return impacts[type] || 'Supports development activities';
  }

  getVelocityInsight(avgCommitsPerDay) {
    if (avgCommitsPerDay > 20)
      return 'High-velocity development with frequent iterations';
    if (avgCommitsPerDay > 10)
      return 'Moderate-velocity development with regular updates';
    if (avgCommitsPerDay > 5)
      return 'Steady development pace with consistent progress';
    return 'Low-velocity development with focused changes';
  }

  getQualityInsight(commitsByType) {
    const bugFixes = commitsByType['Bug Fixes & Improvements'] || 0;
    const features = commitsByType['New Features & Enhancements'] || 0;
    const ratio = features > 0 ? bugFixes / features : 0;

    if (ratio < 0.2)
      return 'Proactive development with minimal bug fixes needed';
    if (ratio < 0.5) return 'Balanced development with regular maintenance';
    return 'Reactive development with focus on issue resolution';
  }

  generateDetailedReport(
    analysis,
    commits,
    now,
    avgCommitsPerDay,
    mostActiveDay
  ) {
    return `# 📊 Feature Debrief Report - Detailed Analysis
## *Comprehensive Development Activity Analysis*

---

### 📅 **Analysis Period**
**Generated:** ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}  
**Time Range:** Last ${this.options.days} days  
**Report Style:** ${this.options.style} (Detailed)

---

## 🎯 **Executive Summary**

Our development team has maintained a **high-velocity development pace** with **${analysis.totalCommits} commits** during this period, averaging **${avgCommitsPerDay} commits per day**.

### 🚀 **Key Highlights**
${Object.entries(analysis.commitsByType)
  .slice(0, 5)
  .map(([type, count]) => {
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
    return `- **${percentage}%** ${type} (${count} commits)`;
  })
  .join('\n')}

### 💼 **Business Impact Analysis**
${Object.entries(analysis.commitsByType)
  .map(([type, count]) => {
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
    const impact = this.getBusinessImpact(type);
    return `- **${type}** (${percentage}%): ${impact}`;
  })
  .join('\n')}

### 👥 **Team Contribution Analysis**
${Object.entries(analysis.commitsByAuthor)
  .map(([author, count]) => {
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
    return `- **${author}**: ${count} commits (${percentage}%)`;
  })
  .join('\n')}

---

## 🔧 **Technical Development Activity**

### 🔧 **Development Breakdown by Category**

${Object.entries(analysis.commitsByType)
  .map(([type, count]) => {
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
    const impact = this.getBusinessImpact(type);
    return `#### ${type}
- **${count} commits** (${percentage}% of total)
- ${impact}
- **Key Areas:** ${(analysis.commitsByScope && Object.keys(analysis.commitsByScope).slice(0, 3).join(', ')) || 'General development'}`;
  })
  .join('\n\n')}

---

## 📈 **Advanced Development Metrics**

### 📊 **Key Performance Indicators**
- **Total Commits:** ${analysis.totalCommits}
- **Average Daily Velocity:** ${avgCommitsPerDay} commits/day
- **Active Contributors:** ${Object.keys(analysis.commitsByAuthor).length}
- **Most Active Day:** ${mostActiveDay ? mostActiveDay[0] : 'N/A'} (${mostActiveDay ? mostActiveDay[1] : 0} commits)
- **Development Consistency:** ${this.calculateConsistency(analysis.commitsByDate)}%
- **Version Bumps:** ${analysis.versionBumps.length}
- **Breaking Changes:** ${analysis.breakingChanges.length}
- **Security Fixes:** ${analysis.securityFixes.length}
- **Performance Improvements:** ${analysis.performanceImprovements.length}

### 🎯 **Commit Size Distribution**
- **Small commits:** ${analysis.commitSizes.small} (quick fixes, minor updates)
- **Medium commits:** ${analysis.commitSizes.medium} (feature additions, refactoring)
- **Large commits:** ${analysis.commitSizes.large} (major features, significant changes)
- **Massive commits:** ${analysis.commitSizes.massive} (major refactoring, migrations)

### 📅 **Temporal Analysis**
#### **Most Active Hours:**
${
  Object.entries(analysis.commitsByHour || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour, count]) => `- **${hour}:00**: ${count} commits`)
    .join('\n') || '- No hourly data available'
}

#### **Most Active Days of Week:**
${
  Object.entries(analysis.commitsByDayOfWeek || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([day, count]) => `- **${day}**: ${count} commits`)
    .join('\n') || '- No daily data available'
}

---

## 🔍 **Detailed Commit Analysis**

${
  analysis.versionBumps.length > 0
    ? `### 🔢 **Version Bumps** (${analysis.versionBumps.length})
${analysis.versionBumps
  .slice(0, 5)
  .map(
    (commit) => `- **${commit.hash}**: ${commit.subject} by ${commit.author}`
  )
  .join('\n')}
${analysis.versionBumps.length > 5 ? `\n... and ${analysis.versionBumps.length - 5} more` : ''}

`
    : ''
}${
      analysis.breakingChanges.length > 0
        ? `### ⚠️ **Breaking Changes** (${analysis.breakingChanges.length})
${analysis.breakingChanges
  .slice(0, 3)
  .map(
    (commit) => `- **${commit.hash}**: ${commit.subject} by ${commit.author}`
  )
  .join('\n')}
${analysis.breakingChanges.length > 3 ? `\n... and ${analysis.breakingChanges.length - 3} more` : ''}

`
        : ''
    }${
      analysis.securityFixes.length > 0
        ? `### 🔒 **Security Fixes** (${analysis.securityFixes.length})
${analysis.securityFixes
  .slice(0, 3)
  .map(
    (commit) => `- **${commit.hash}**: ${commit.subject} by ${commit.author}`
  )
  .join('\n')}
${analysis.securityFixes.length > 3 ? `\n... and ${analysis.securityFixes.length - 3} more` : ''}

`
        : ''
    }${
      analysis.performanceImprovements.length > 0
        ? `###  **Performance Improvements** (${analysis.performanceImprovements.length})
${analysis.performanceImprovements
  .slice(0, 3)
  .map(
    (commit) => `- **${commit.hash}**: ${commit.subject} by ${commit.author}`
  )
  .join('\n')}
${analysis.performanceImprovements.length > 3 ? `\n... and ${analysis.performanceImprovements.length - 3} more` : ''}

`
        : ''
    }---

## 📊 **Trends & Insights**

### 📈 **Development Patterns**
- **Team Velocity:** ${this.getVelocityInsight(avgCommitsPerDay)}
- **Focus Areas:** ${Object.keys(analysis.commitsByType).slice(0, 3).join(', ')}
- **Quality Indicators:** ${this.getQualityInsight(analysis.commitsByType)}
- **Consistency Score:** ${this.calculateConsistency(analysis.commitsByDate)}% (${this.calculateConsistency(analysis.commitsByDate) > 70 ? 'Excellent' : this.calculateConsistency(analysis.commitsByDate) > 50 ? 'Good' : 'Needs Improvement'})

### 🔮 **Strategic Insights & Recommendations**
${this.generateRecommendations(analysis)}

---

## 🏷️ **Tags & Categories**

#FeatureDebrief #DevelopmentAnalysis #GitAnalysis #TeamVelocity #CodeQuality #TechnicalDebt #FeatureDevelopment #BugFixes #PerformanceOptimization #UserExperience #DeveloperProductivity #ContinuousImprovement #SoftwareDevelopment #ProjectManagement #BusinessIntelligence #DetailedAnalysis

---

**Report Generated by:** Feature Debrief Generator (Detailed Mode)  
**Data Source:** Git Repository Analysis  
**Tool:** auto-changelog wrapper with business intelligence  
**Analysis Depth:** Detailed with enhanced metrics and insights
`;
  }

  generateUltraDetailedReport(
    analysis,
    commits,
    now,
    avgCommitsPerDay,
    mostActiveDay
  ) {
    return `# 📊 Feature Debrief Report - Ultra-Detailed Analysis
## *Maximum Depth Development Activity Analysis*

---

### 📅 **Analysis Period**
**Generated:** ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}  
**Time Range:** Last ${this.options.days} days  
**Report Style:** ${this.options.style} (Ultra-Detailed)
**Analysis Depth:** Maximum with comprehensive insights

---

## 🎯 **Executive Summary**

Our development team has maintained a **high-velocity development pace** with **${analysis.totalCommits} commits** during this period, averaging **${avgCommitsPerDay} commits per day**.

### 🚀 **Key Highlights & Achievements**
${Object.entries(analysis.commitsByType)
  .map(([type, count]) => {
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
    return `- **${percentage}%** ${type} (${count} commits)`;
  })
  .join('\n')}

### 💼 **Comprehensive Business Impact Analysis**
${Object.entries(analysis.commitsByType)
  .map(([type, count]) => {
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
    const impact = this.getBusinessImpact(type);
    return `#### ${type} (${percentage}%)
- **Volume:** ${count} commits
- **Business Impact:** ${impact}
- **Strategic Value:** ${this.getStrategicValue(type)}`;
  })
  .join('\n\n')}

### 👥 **Detailed Team Contribution Analysis**
${Object.entries(analysis.commitsByAuthor)
  .map(([author, count]) => {
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
    const authorCommits = commits.filter((c) => c.author === author);
    const authorTypes = {};
    authorCommits.forEach((commit) => {
      const type = this.categorizeCommit(commit.subject);
      authorTypes[type] = (authorTypes[type] || 0) + 1;
    });
    const topType = Object.entries(authorTypes).sort(
      ([, a], [, b]) => b - a
    )[0];
    return `#### ${author}
- **Total Commits:** ${count} (${percentage}%)
- **Primary Focus:** ${topType ? topType[0] : 'General development'}
- **Contribution Pattern:** ${this.getContributionPattern(count, analysis.totalCommits)}`;
  })
  .join('\n\n')}

---

## 🔧 **Ultra-Detailed Technical Development Activity**

### 🔧 **Comprehensive Development Breakdown**

${Object.entries(analysis.commitsByType)
  .map(([type, count]) => {
    const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
    const impact = this.getBusinessImpact(type);
    const typeCommits = commits.filter(
      (c) => this.categorizeCommit(c.subject) === type
    );
    const authors = [...new Set(typeCommits.map((c) => c.author))];
    return `#### ${type}
- **Volume:** ${count} commits (${percentage}% of total)
- **Business Impact:** ${impact}
- **Strategic Value:** ${this.getStrategicValue(type)}
- **Contributors:** ${authors.join(', ')}
- **Key Areas:** ${(analysis.commitsByScope && Object.keys(analysis.commitsByScope).slice(0, 5).join(', ')) || 'General development'}
- **Recent Activity:** ${typeCommits
      .slice(0, 3)
      .map((c) => c.subject.substring(0, 60) + '...')
      .join('; ')}`;
  })
  .join('\n\n')}

---

## 📈 **Maximum Depth Development Metrics**

### 📊 **Comprehensive Key Performance Indicators**
- **Total Commits:** ${analysis.totalCommits}
- **Average Daily Velocity:** ${avgCommitsPerDay} commits/day
- **Peak Daily Activity:** ${mostActiveDay ? mostActiveDay[1] : 0} commits
- **Active Contributors:** ${Object.keys(analysis.commitsByAuthor).length}
- **Most Active Day:** ${mostActiveDay ? mostActiveDay[0] : 'N/A'}
- **Development Consistency:** ${this.calculateConsistency(analysis.commitsByDate)}%
- **Version Bumps:** ${analysis.versionBumps.length}
- **Breaking Changes:** ${analysis.breakingChanges.length}
- **Security Fixes:** ${analysis.securityFixes.length}
- **Performance Improvements:** ${analysis.performanceImprovements.length}
- **Documentation Updates:** ${analysis.commitsByType['Documentation & Guides'] || 0}
- **Test Coverage Changes:** ${analysis.commitsByType['Quality Assurance & Testing'] || 0}

### 🎯 **Advanced Commit Size Distribution & Complexity**
- **Small commits (1-10 files):** ${analysis.commitSizes.small} (${((analysis.commitSizes.small / analysis.totalCommits) * 100).toFixed(1)}%)
- **Medium commits (11-25 files):** ${analysis.commitSizes.medium} (${((analysis.commitSizes.medium / analysis.totalCommits) * 100).toFixed(1)}%)
- **Large commits (26-50 files):** ${analysis.commitSizes.large} (${((analysis.commitSizes.large / analysis.totalCommits) * 100).toFixed(1)}%)
- **Massive commits (50+ files):** ${analysis.commitSizes.massive} (${((analysis.commitSizes.massive / analysis.totalCommits) * 100).toFixed(1)}%)

### 📅 **Comprehensive Temporal Analysis**
#### **Hourly Development Patterns:**
${
  Object.entries(analysis.commitsByHour || {})
    .sort(([, a], [, b]) => b - a)
    .map(([hour, count]) => {
      const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
      return `- **${hour}:00**: ${count} commits (${percentage}%) - ${this.getHourInsight(parseInt(hour))}`;
    })
    .join('\n') || '- No hourly data available'
}

#### **Weekly Development Patterns:**
${
  Object.entries(analysis.commitsByDayOfWeek || {})
    .sort(([, a], [, b]) => b - a)
    .map(([day, count]) => {
      const percentage = ((count / analysis.totalCommits) * 100).toFixed(1);
      return `- **${day}**: ${count} commits (${percentage}%) - ${this.getDayInsight(day)}`;
    })
    .join('\n') || '- No daily data available'
}

### 📁 **File Impact Analysis**
${
  Object.entries(analysis.fileChanges || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([file, count]) => `- **${file}**: ${count} changes`)
    .join('\n') || '- No file change data available'
}

---

## 🔍 **Ultra-Detailed Commit Analysis**

### 📋 **Complete Special Commit Categories**

${
  analysis.versionBumps.length > 0
    ? `#### 🔢 **Version Bumps** (${analysis.versionBumps.length})
${analysis.versionBumps
  .map((commit) => {
    const details = this.getDetailedCommitInfo(commit.hash);
    return `- **${commit.hash}**: ${commit.subject}
  - **Author:** ${commit.author}
  - **Date:** ${commit.date}
  - **Files Changed:** ${details.filesChanged || 'N/A'}
  - **Impact:** ${details.insertions || 0} insertions, ${details.deletions || 0} deletions`;
  })
  .join('\n')}

`
    : ''
}${
      analysis.breakingChanges.length > 0
        ? `#### ⚠️ **Breaking Changes** (${analysis.breakingChanges.length})
${analysis.breakingChanges
  .map((commit) => {
    const details = this.getDetailedCommitInfo(commit.hash);
    return `- **${commit.hash}**: ${commit.subject}
  - **Author:** ${commit.author}
  - **Date:** ${commit.date}
  - **Files Changed:** ${details.filesChanged || 'N/A'}
  - **Impact:** ${details.insertions || 0} insertions, ${details.deletions || 0} deletions
  - **Risk Level:** ${this.assessBreakingChangeRisk(commit)}`;
  })
  .join('\n')}

`
        : ''
    }${
      analysis.securityFixes.length > 0
        ? `#### 🔒 **Security Fixes** (${analysis.securityFixes.length})
${analysis.securityFixes
  .map((commit) => {
    const details = this.getDetailedCommitInfo(commit.hash);
    const severity = this.getSecuritySeverity(
      commit.subject,
      commit.body || ''
    );
    return `- **${commit.hash}**: ${commit.subject}
  - **Author:** ${commit.author}
  - **Date:** ${commit.date}
  - **Severity:** ${severity}
  - **Files Changed:** ${details.filesChanged || 'N/A'}
  - **Impact:** ${details.insertions || 0} insertions, ${details.deletions || 0} deletions`;
  })
  .join('\n')}

`
        : ''
    }${
      analysis.performanceImprovements.length > 0
        ? `####  **Performance Improvements** (${analysis.performanceImprovements.length})
${analysis.performanceImprovements
  .map((commit) => {
    const details = this.getDetailedCommitInfo(commit.hash);
    const impact = this.getPerformanceImpact(commit.subject, commit.body || '');
    return `- **${commit.hash}**: ${commit.subject}
  - **Author:** ${commit.author}
  - **Date:** ${commit.date}
  - **Expected Impact:** ${impact}
  - **Files Changed:** ${details.filesChanged || 'N/A'}
  - **Code Changes:** ${details.insertions || 0} insertions, ${details.deletions || 0} deletions`;
  })
  .join('\n')}

`
        : ''
    }### 📊 **Detailed Commit History (Recent 20)**
${analysis.detailedCommits
  .slice(0, 20)
  .map((commit) => {
    const complexity = this.calculateCommitComplexity(commit);
    return `#### ${commit.hash} - ${commit.subject.substring(0, 80)}
- **Author:** ${commit.author}
- **Date:** ${commit.date}
- **Type:** ${this.categorizeCommit(commit.subject)}
- **Complexity Score:** ${complexity}/10
- **Files Changed:** ${commit.filesChanged || 'N/A'}
- **Lines:** +${commit.insertions || 0}/-${commit.deletions || 0}
- **Tags:** ${commit.tags && commit.tags.length > 0 ? commit.tags.join(', ') : 'None'}`;
  })
  .join('\n\n')}

---

## 📊 **Advanced Trends & Strategic Insights**

### 📈 **Comprehensive Development Patterns**
- **Team Velocity:** ${this.getVelocityInsight(avgCommitsPerDay)}
- **Primary Focus Areas:** ${Object.keys(analysis.commitsByType).slice(0, 3).join(', ')}
- **Secondary Focus Areas:** ${Object.keys(analysis.commitsByType).slice(3, 6).join(', ') || 'None'}
- **Quality Indicators:** ${this.getQualityInsight(analysis.commitsByType)}
- **Consistency Score:** ${this.calculateConsistency(analysis.commitsByDate)}% (${this.getConsistencyRating(this.calculateConsistency(analysis.commitsByDate))})
- **Development Maturity:** ${this.assessDevelopmentMaturity(analysis)}
- **Risk Assessment:** ${this.assessProjectRisk(analysis)}

### 🔮 **Strategic Insights & Comprehensive Recommendations**
${this.generateRecommendations(analysis)}

### 📊 **Predictive Analysis**
- **Projected Velocity:** ${this.predictVelocity(analysis)} commits/day (next 30 days)
- **Quality Trend:** ${this.predictQualityTrend(analysis)}
- **Risk Factors:** ${this.identifyRiskFactors(analysis)}
- **Optimization Opportunities:** ${this.identifyOptimizations(analysis)}

---

## 🏷️ **Comprehensive Tags & Categories**

#FeatureDebrief #DevelopmentAnalysis #GitAnalysis #TeamVelocity #CodeQuality #TechnicalDebt #FeatureDevelopment #BugFixes #PerformanceOptimization #UserExperience #DeveloperProductivity #ContinuousImprovement #SoftwareDevelopment #ProjectManagement #BusinessIntelligence #UltraDetailedAnalysis #StrategicInsights #PredictiveAnalysis #RiskAssessment #QualityMetrics #TeamAnalytics #DevelopmentMaturity #CodeMetrics #CommitAnalysis #VelocityTracking

---

**Report Generated by:** Feature Debrief Generator (Ultra-Detailed Mode)  
**Data Source:** Git Repository Analysis with Maximum Depth  
**Tool:** auto-changelog wrapper with comprehensive business intelligence  
**Analysis Depth:** Ultra-Detailed with predictive insights and strategic recommendations  
**Report Complexity:** Maximum (includes all available metrics and analyses)
`;
  }

  calculateConsistency(commitsByDate) {
    const dates = Object.keys(commitsByDate);
    if (dates.length < 2) return 0;

    const commits = Object.values(commitsByDate);
    const avg = commits.reduce((a, b) => a + b, 0) / commits.length;
    const variance =
      commits.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) /
      commits.length;
    const stdDev = Math.sqrt(variance);

    return Math.max(0, 100 - stdDev * 10);
  }

  generateRecommendations(analysis) {
    const testCommits =
      analysis.commitsByType['Quality Assurance & Testing'] || 0;
    const totalCommits = analysis.totalCommits;

    if (testCommits / totalCommits < 0.1) {
      return 'Consider adding more automated testing for better quality assurance';
    }

    return 'Continue current development practices with focus on consistency';
  }

  // Enhanced analysis helper methods
  getDetailedCommitInfo(hash) {
    try {
      const statsCmd = `git show --stat --format="" ${hash}`;
      const statsOutput = this.executeGitCommand(statsCmd);

      const diffCmd = `git show --numstat --format="" ${hash}`;
      const diffOutput = this.executeGitCommand(diffCmd);

      const files = [];
      let totalInsertions = 0;
      let totalDeletions = 0;

      diffOutput.split('\n').forEach((line) => {
        if (line.trim()) {
          const parts = line.split('\t');
          if (parts.length >= 3) {
            const insertions = parseInt(parts[0]) || 0;
            const deletions = parseInt(parts[1]) || 0;
            const filename = parts[2];

            files.push({
              name: filename,
              insertions,
              deletions,
              changes: insertions + deletions
            });

            totalInsertions += insertions;
            totalDeletions += deletions;
          }
        }
      });

      return {
        files,
        insertions: totalInsertions,
        deletions: totalDeletions,
        stats: statsOutput
      };
    } catch (error) {
      return {
        files: [],
        insertions: 0,
        deletions: 0,
        stats: ''
      };
    }
  }

  isVersionBump(subject, files) {
    const versionPatterns = [
      /bump.*version/i,
      /version.*bump/i,
      /release.*v?\d+\.\d+/i,
      /v?\d+\.\d+\.\d+/,
      /prepare.*release/i,
      /release.*\d+/i
    ];

    const versionFiles = [
      'package.json',
      'package-lock.json',
      'VERSION',
      'version.txt'
    ];
    const hasVersionFile = files.some((f) => versionFiles.includes(f.name));
    const hasVersionPattern = versionPatterns.some((pattern) =>
      pattern.test(subject)
    );

    return hasVersionFile || hasVersionPattern;
  }

  extractVersion(subject, files) {
    const versionMatch = subject.match(/v?(\d+\.\d+\.\d+(?:-[\w.]+)?)/);
    if (versionMatch) return versionMatch[1];

    // Try to extract from package.json changes
    const packageFile = files.find((f) => f.name === 'package.json');
    if (packageFile) {
      // This would require parsing the actual diff, simplified for now
      return 'detected';
    }

    return 'unknown';
  }

  getVersionBumpType(subject, files) {
    if (/major/i.test(subject)) return 'major';
    if (/minor/i.test(subject)) return 'minor';
    if (/patch/i.test(subject)) return 'patch';
    if (/alpha|beta|rc/i.test(subject)) return 'prerelease';
    return 'unknown';
  }

  hasBreakingChanges(body) {
    const breakingPatterns = [
      /BREAKING CHANGE/i,
      /BREAKING:/i,
      /!:/,
      /breaking/i
    ];
    return breakingPatterns.some((pattern) => pattern.test(body));
  }

  extractBreakingChangeDescription(body) {
    const match = body.match(/BREAKING CHANGE:\s*(.+)/i);
    return match ? match[1].trim() : 'Breaking change detected';
  }

  isSecurityFix(subject, body) {
    const securityPatterns = [
      /security/i,
      /vulnerability/i,
      /CVE-/i,
      /exploit/i,
      /XSS/i,
      /CSRF/i,
      /injection/i,
      /sanitize/i,
      /escape/i
    ];
    return securityPatterns.some((pattern) =>
      pattern.test(subject + ' ' + body)
    );
  }

  getSecuritySeverity(subject, body) {
    const text = subject + ' ' + body;
    if (/critical/i.test(text)) return 'critical';
    if (/high/i.test(text)) return 'high';
    if (/medium/i.test(text)) return 'medium';
    if (/low/i.test(text)) return 'low';
    return 'unspecified';
  }

  isPerformanceImprovement(subject, body) {
    const perfPatterns = [
      /performance/i,
      /optimize/i,
      /speed/i,
      /faster/i,
      /efficiency/i,
      /cache/i,
      /memory/i,
      /cpu/i,
      /benchmark/i
    ];
    return perfPatterns.some((pattern) => pattern.test(subject + ' ' + body));
  }

  getPerformanceImpact(subject, body) {
    const text = subject + ' ' + body;
    if (/significant/i.test(text) || /major/i.test(text)) return 'high';
    if (/moderate/i.test(text)) return 'medium';
    if (/minor/i.test(text) || /small/i.test(text)) return 'low';
    return 'unspecified';
  }

  extractCoAuthors(body) {
    const coAuthorPattern = /Co-authored-by:\s*(.+)/gi;
    const matches = [];
    let match;
    while ((match = coAuthorPattern.exec(body)) !== null) {
      matches.push(match[1].trim());
    }
    return matches;
  }

  extractTags(subject, body) {
    const tags = [];
    const text = subject + ' ' + body;

    // Extract hashtags
    const hashtagMatches = text.match(/#\w+/g);
    if (hashtagMatches) {
      tags.push(...hashtagMatches);
    }

    // Extract conventional commit scopes as tags
    const scopeMatch = subject.match(/\(([^)]+)\)/);
    if (scopeMatch) {
      tags.push(`scope:${scopeMatch[1]}`);
    }

    return tags;
  }

  extractReferences(body) {
    const references = [];

    // GitHub issues/PRs
    const githubRefs = body.match(/#\d+/g);
    if (githubRefs) {
      references.push(...githubRefs.map((ref) => ({ type: 'github', ref })));
    }

    // Closes/Fixes patterns
    const closesPattern = /(closes?|fixes?|resolves?)\s+#(\d+)/gi;
    let match;
    while ((match = closesPattern.exec(body)) !== null) {
      references.push({ type: 'closes', ref: `#${match[2]}` });
    }

    // URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = body.match(urlPattern);
    if (urls) {
      references.push(...urls.map((url) => ({ type: 'url', ref: url })));
    }

    return references;
  }

  calculateCommitComplexity(commitDetails) {
    const { files, insertions, deletions } = commitDetails;

    let complexity = 0;

    // File count factor
    complexity += files.length * 0.5;

    // Lines changed factor
    complexity += (insertions + deletions) * 0.1;

    // File type complexity
    files.forEach((file) => {
      const ext = file.name.split('.').pop();
      switch (ext) {
        case 'js':
        case 'ts':
        case 'jsx':
        case 'tsx':
          complexity += 2;
          break;
        case 'json':
        case 'yml':
        case 'yaml':
          complexity += 1;
          break;
        case 'md':
        case 'txt':
          complexity += 0.5;
          break;
        default:
          complexity += 1;
      }
    });

    if (complexity <= 5) return 'low';
    if (complexity <= 15) return 'medium';
    if (complexity <= 30) return 'high';
    return 'very high';
  }

  async runGuidedMode() {
    if (!chalk) await initChalk();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    try {
      console.log(
        chalk.cyan.bold('\n🎯 Feature Debrief Generator - Guided Mode\n')
      );
      console.log(
        chalk.dim("Let's create a customized debrief report together!\n")
      );

      // Preset selection
      console.log(chalk.yellow.bold('📋 Choose a preset:'));
      console.log(
        chalk.green('1. ') +
          chalk.white('Quick Summary') +
          chalk.dim(' (Last 7 days, essential metrics)')
      );
      console.log(
        chalk.green('2. ') +
          chalk.white('Weekly Review') +
          chalk.dim(' (Last 7 days, comprehensive)')
      );
      console.log(
        chalk.green('3. ') +
          chalk.white('Sprint Analysis') +
          chalk.dim(' (Last 14 days, comprehensive)')
      );
      console.log(
        chalk.green('4. ') +
          chalk.white('Monthly Report') +
          chalk.dim(' (Last 30 days, comprehensive)')
      );
      console.log(
        chalk.green('5. ') +
          chalk.white('Quarter Review') +
          chalk.dim(' (Last 90 days, comprehensive)')
      );
      console.log(
        chalk.green('6. ') +
          chalk.white('Custom Range') +
          chalk.dim(' (Specify your own parameters)')
      );
      console.log(
        chalk.green('7. ') +
          chalk.white('Recent Commits') +
          chalk.dim(' (Last 10 commits)')
      );
      console.log(
        chalk.green('8. ') +
          chalk.white('Git Range') +
          chalk.dim(' (Specify commit range)')
      );

      const presetChoice = await question(
        chalk.cyan('\nEnter your choice (1-8): ')
      );

      let options = {};

      switch (presetChoice.trim()) {
        case '1':
          console.log(chalk.green('\n✨ Quick Summary selected'));
          options = { days: 7, style: 'summary' };
          break;
        case '2':
          console.log(chalk.green('\n✨ Weekly Review selected'));
          options = { days: 7, style: 'comprehensive' };
          break;
        case '3':
          console.log(chalk.green('\n✨ Sprint Analysis selected'));
          options = { days: 14, style: 'comprehensive' };
          break;
        case '4':
          console.log(chalk.green('\n✨ Monthly Report selected'));
          options = { days: 30, style: 'comprehensive' };
          break;
        case '5':
          console.log(chalk.green('\n✨ Quarter Review selected'));
          options = { days: 90, style: 'comprehensive' };
          break;
        case '6':
          console.log(chalk.green('\n✨ Custom Range selected'));
          const customDays = await question(
            chalk.cyan('How many days to analyze? ')
          );
          options = {
            days: parseInt(customDays) || 30,
            style: 'comprehensive'
          };
          break;
        case '7':
          console.log(chalk.green('\n✨ Recent Commits selected'));
          options = { commitRange: 'HEAD~10..HEAD', style: 'comprehensive' };
          break;
        case '8':
          console.log(chalk.green('\n✨ Git Range selected'));
          const range = await question(
            chalk.cyan('Enter git range (e.g., HEAD~5..HEAD): ')
          );
          options = { commitRange: range, style: 'comprehensive' };
          break;
        default:
          console.log(
            chalk.yellow('\n⚠️ Invalid choice, using Weekly Review preset')
          );
          options = { days: 7, style: 'comprehensive' };
      }

      // Output format selection
      console.log(chalk.yellow.bold('\n📄 Choose output format:'));
      console.log(
        chalk.green('1. ') +
          chalk.white('Markdown') +
          chalk.dim(' (Standard .md format)')
      );
      console.log(
        chalk.green('2. ') +
          chalk.white('HTML') +
          chalk.dim(' (Web-friendly format)')
      );
      console.log(
        chalk.green('3. ') +
          chalk.white('Text') +
          chalk.dim(' (Plain text format)')
      );
      console.log(
        chalk.green('4. ') +
          chalk.white('All Formats') +
          chalk.dim(' (Generate MD, HTML, and TXT)')
      );

      const formatChoice = await question(
        chalk.cyan('\nEnter format choice (1-4, default: 1): ')
      );

      const formats = { 1: 'md', 2: 'html', 3: 'txt', 4: 'all' };
      const format = formats[formatChoice.trim()] || 'md';

      // Report type selection
      console.log(chalk.yellow.bold('\n📊 Choose report type:'));
      console.log(
        chalk.green('1. ') +
          chalk.white('Standard') +
          chalk.dim(' (Regular comprehensive report)')
      );
      console.log(
        chalk.green('2. ') +
          chalk.white('Detailed') +
          chalk.dim(' (Enhanced with commit details)')
      );
      console.log(
        chalk.green('3. ') +
          chalk.white('Ultra-Detailed') +
          chalk.dim(' (Maximum depth and analysis)')
      );
      console.log(
        chalk.green('4. ') +
          chalk.white('All Types') +
          chalk.dim(' (Generate all report types)')
      );

      const reportTypeChoice = await question(
        chalk.cyan('\nEnter report type choice (1-4, default: 2): ')
      );

      const reportTypes = {
        1: 'standard',
        2: 'detailed',
        3: 'ultra',
        4: 'all'
      };
      const reportType = reportTypes[reportTypeChoice.trim()] || 'detailed';

      // Update options with report type
      options.reportType = reportType;

      // Custom filename option
      const customFilename = await question(
        chalk.cyan('\nCustom filename (press Enter for auto-generated): ')
      );

      if (customFilename.trim()) {
        options.filename = customFilename.includes('.')
          ? customFilename
          : `${customFilename}.${format}`;
      }

      // Output directory selection
      console.log(chalk.yellow.bold('\n📁 Choose output location:'));
      console.log(
        chalk.green('1. ') +
          chalk.white('reports/') +
          chalk.dim(' (Default reports directory)')
      );
      console.log(
        chalk.green('2. ') +
          chalk.white('./') +
          chalk.dim(' (Current directory)')
      );
      console.log(
        chalk.green('3. ') +
          chalk.white('custom') +
          chalk.dim(' (Specify custom path)')
      );

      const dirChoice = await question(
        chalk.cyan('\nEnter location choice (1-3, default: 1): ')
      );

      switch (dirChoice.trim()) {
        case '2':
          options.outputDir = '.';
          break;
        case '3':
          const customDir = await question(
            chalk.cyan('Enter custom directory path: ')
          );
          options.outputDir = customDir.trim() || 'reports';
          break;
        default:
          options.outputDir = 'reports';
      }

      console.log(chalk.blue.bold('\n🔧 Configuration Summary:'));
      if (options.days) {
        console.log(
          chalk.white('📅 Analysis Period: ') +
            chalk.cyan(`${options.days} days`)
        );
      }
      if (options.commitRange) {
        console.log(
          chalk.white('📅 Commit Range: ') + chalk.cyan(options.commitRange)
        );
      }
      console.log(chalk.white('🎨 Style: ') + chalk.cyan(options.style));
      console.log(
        chalk.white('📄 Format: ') + chalk.cyan(format.toUpperCase())
      );
      console.log(
        chalk.white('📁 Output: ') + chalk.cyan(options.outputDir + '/')
      );
      if (options.filename) {
        console.log(
          chalk.white('📝 Filename: ') + chalk.cyan(options.filename)
        );
      }

      const confirm = await question(
        chalk.green.bold('\n✅ Generate report with these settings? (Y/n): ')
      );

      if (confirm.toLowerCase() === 'n') {
        console.log(chalk.yellow('\n👋 Operation cancelled'));
        rl.close();
        return null;
      }

      console.log(
        chalk.cyan.bold('\n🚀 Generating your custom debrief report...\n')
      );

      rl.close();

      // Set the format in options and ensure filename has correct extension
      options.format = format;
      if (!options.filename) {
        // Generate default filename with correct extension
        const baseFilename = options.days
          ? `feature-debrief-${options.days}days-${new Date().toISOString().split('T')[0]}`
          : options.commitRange
            ? `feature-debrief-${options.commitRange.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}`
            : `feature-debrief-${new Date().toISOString().split('T')[0]}`;
        options.filename = `${baseFilename}.${format}`;
      }

      return options;
    } catch (error) {
      rl.close();
      throw error;
    }
  }

  // Helper methods for ultra-detailed report
  getStrategicValue(type) {
    const values = {
      'New Features & Enhancements':
        'High - Drives product growth and user acquisition',
      'Bug Fixes & Improvements':
        'Medium - Maintains user satisfaction and product stability',
      'Maintenance & Infrastructure':
        'Medium - Ensures long-term system health',
      'Code Quality & Architecture':
        'High - Enables future development velocity',
      'Documentation & Guides':
        'Low - Supports team productivity and onboarding',
      'UI/UX & Design Updates':
        'Medium - Improves user experience and engagement',
      'Quality Assurance & Testing':
        'High - Prevents future issues and maintains quality',
      'Performance Optimization':
        'High - Improves user experience and system efficiency',
      'Continuous Integration': 'Medium - Streamlines development processes',
      'Build System': 'Low - Supports development workflow',
      Other: 'Variable - Depends on specific implementation'
    };
    return values[type] || 'Medium - Standard development value';
  }

  getContributionPattern(commitCount, totalCommits) {
    const percentage = (commitCount / totalCommits) * 100;
    if (percentage > 50) return 'Primary contributor with dominant impact';
    if (percentage > 25) return 'Major contributor with significant impact';
    if (percentage > 10) return 'Regular contributor with steady impact';
    return 'Occasional contributor with focused impact';
  }

  categorizeCommit(subject) {
    const typeMapping = {
      feat: 'New Features & Enhancements',
      fix: 'Bug Fixes & Improvements',
      docs: 'Documentation & Guides',
      style: 'UI/UX & Design Updates',
      refactor: 'Code Quality & Architecture',
      perf: 'Performance Optimization',
      test: 'Quality Assurance & Testing',
      build: 'Build System',
      ci: 'Continuous Integration',
      chore: 'Maintenance & Infrastructure'
    };

    const lowerSubject = subject.toLowerCase();

    // Check for conventional commit patterns
    for (const [prefix, type] of Object.entries(typeMapping)) {
      if (
        lowerSubject.startsWith(prefix + ':') ||
        lowerSubject.startsWith(prefix + '(')
      ) {
        return type;
      }
    }

    // Fallback keyword matching
    if (
      lowerSubject.includes('feat') ||
      lowerSubject.includes('add') ||
      lowerSubject.includes('implement')
    ) {
      return 'New Features & Enhancements';
    }
    if (
      lowerSubject.includes('fix') ||
      lowerSubject.includes('bug') ||
      lowerSubject.includes('resolve')
    ) {
      return 'Bug Fixes & Improvements';
    }
    if (lowerSubject.includes('doc') || lowerSubject.includes('readme')) {
      return 'Documentation & Guides';
    }
    if (
      lowerSubject.includes('style') ||
      lowerSubject.includes('ui') ||
      lowerSubject.includes('design')
    ) {
      return 'UI/UX & Design Updates';
    }
    if (
      lowerSubject.includes('refactor') ||
      lowerSubject.includes('clean') ||
      lowerSubject.includes('restructure')
    ) {
      return 'Code Quality & Architecture';
    }
    if (
      lowerSubject.includes('perf') ||
      lowerSubject.includes('optimize') ||
      lowerSubject.includes('speed')
    ) {
      return 'Performance Optimization';
    }
    if (lowerSubject.includes('test') || lowerSubject.includes('spec')) {
      return 'Quality Assurance & Testing';
    }
    if (
      lowerSubject.includes('build') ||
      lowerSubject.includes('webpack') ||
      lowerSubject.includes('rollup')
    ) {
      return 'Build System';
    }
    if (
      lowerSubject.includes('ci') ||
      lowerSubject.includes('github') ||
      lowerSubject.includes('workflow')
    ) {
      return 'Continuous Integration';
    }
    if (
      lowerSubject.includes('chore') ||
      lowerSubject.includes('update') ||
      lowerSubject.includes('bump')
    ) {
      return 'Maintenance & Infrastructure';
    }

    return 'Other';
  }

  getHourInsight(hour) {
    if (hour >= 9 && hour <= 17) return 'Business hours development';
    if (hour >= 18 && hour <= 22) return 'Evening development session';
    if (hour >= 23 || hour <= 5) return 'Late night/early morning development';
    return 'Early morning development';
  }

  getDayInsight(day) {
    const insights = {
      Monday: 'Week startup activity',
      Tuesday: 'Peak productivity day',
      Wednesday: 'Mid-week momentum',
      Thursday: 'Pre-weekend push',
      Friday: 'Week completion focus',
      Saturday: 'Weekend development',
      Sunday: 'Weekend development'
    };
    return insights[day] || 'Development activity';
  }

  assessBreakingChangeRisk(commit) {
    const subject = commit.subject.toLowerCase();
    if (subject.includes('major') || subject.includes('breaking'))
      return 'High';
    if (subject.includes('api') || subject.includes('interface'))
      return 'Medium';
    return 'Low';
  }

  getConsistencyRating(score) {
    if (score > 80) return 'Excellent';
    if (score > 60) return 'Good';
    if (score > 40) return 'Fair';
    return 'Needs Improvement';
  }

  assessDevelopmentMaturity(analysis) {
    const hasTests =
      (analysis.commitsByType['Quality Assurance & Testing'] || 0) > 0;
    const hasCI = (analysis.commitsByType['Continuous Integration'] || 0) > 0;
    const hasDocumentation =
      (analysis.commitsByType['Documentation & Guides'] || 0) > 0;
    const hasPerformanceWork =
      (analysis.performanceImprovements || []).length > 0;

    let score = 0;
    if (hasTests) score += 25;
    if (hasCI) score += 25;
    if (hasDocumentation) score += 25;
    if (hasPerformanceWork) score += 25;

    if (score >= 75) return 'Mature (comprehensive practices)';
    if (score >= 50) return 'Developing (good practices)';
    if (score >= 25) return 'Basic (some practices)';
    return 'Early stage (limited practices)';
  }

  assessProjectRisk(analysis) {
    const breakingChanges = (analysis.breakingChanges || []).length;
    const securityFixes = (analysis.securityFixes || []).length;
    const bugFixes = analysis.commitsByType['Bug Fixes & Improvements'] || 0;
    const totalCommits = analysis.totalCommits;

    let riskScore = 0;
    if (breakingChanges > 0) riskScore += 30;
    if (securityFixes > 2) riskScore += 20;
    if (bugFixes / totalCommits > 0.3) riskScore += 25;
    if (Object.keys(analysis.commitsByAuthor).length < 2) riskScore += 25;

    if (riskScore >= 50) return 'High risk (multiple concerns)';
    if (riskScore >= 25) return 'Medium risk (some concerns)';
    return 'Low risk (stable development)';
  }

  predictVelocity(analysis) {
    const currentVelocity = analysis.totalCommits / (this.options.days || 30);
    const trend = this.calculateVelocityTrend(analysis);
    return (currentVelocity * (1 + trend)).toFixed(1);
  }

  calculateVelocityTrend(analysis) {
    // Simple trend calculation based on recent vs older commits
    const dates = Object.keys(analysis.commitsByDate).sort();
    if (dates.length < 7) return 0;

    const recentDays = dates.slice(-7);
    const olderDays = dates.slice(0, 7);

    const recentAvg =
      recentDays.reduce(
        (sum, date) => sum + (analysis.commitsByDate[date] || 0),
        0
      ) / recentDays.length;
    const olderAvg =
      olderDays.reduce(
        (sum, date) => sum + (analysis.commitsByDate[date] || 0),
        0
      ) / olderDays.length;

    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  predictQualityTrend(analysis) {
    const bugFixRatio =
      (analysis.commitsByType['Bug Fixes & Improvements'] || 0) /
      analysis.totalCommits;
    const testRatio =
      (analysis.commitsByType['Quality Assurance & Testing'] || 0) /
      analysis.totalCommits;

    if (testRatio > 0.2) return 'Improving (strong testing focus)';
    if (bugFixRatio < 0.2) return 'Stable (low bug fix ratio)';
    if (bugFixRatio > 0.4) return 'Declining (high bug fix ratio)';
    return 'Stable (balanced development)';
  }

  identifyRiskFactors(analysis) {
    const risks = [];

    if ((analysis.breakingChanges || []).length > 0) {
      risks.push('Breaking changes present');
    }
    if ((analysis.securityFixes || []).length > 2) {
      risks.push('Multiple security issues');
    }
    if (Object.keys(analysis.commitsByAuthor).length < 2) {
      risks.push('Single contributor dependency');
    }
    if ((analysis.commitsByType['Quality Assurance & Testing'] || 0) === 0) {
      risks.push('No testing activity');
    }

    return risks.length > 0
      ? risks.join(', ')
      : 'No significant risk factors identified';
  }

  identifyOptimizations(analysis) {
    const optimizations = [];

    if (
      (analysis.commitsByType['Quality Assurance & Testing'] || 0) <
      analysis.totalCommits * 0.1
    ) {
      optimizations.push('Increase testing coverage');
    }
    if (
      (analysis.commitsByType['Documentation & Guides'] || 0) <
      analysis.totalCommits * 0.05
    ) {
      optimizations.push('Improve documentation practices');
    }
    if ((analysis.performanceImprovements || []).length === 0) {
      optimizations.push('Consider performance optimization');
    }
    if (Object.keys(analysis.commitsByAuthor).length < 3) {
      optimizations.push('Expand contributor base');
    }

    return optimizations.length > 0
      ? optimizations.join(', ')
      : 'Development practices are well-optimized';
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  let options = {};
  let isGuided = false;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--days' && args[i + 1]) {
      options.days = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--output' && args[i + 1]) {
      options.filename = args[i + 1];
      i++;
    } else if (arg === '--style' && args[i + 1]) {
      options.style = args[i + 1];
      i++;
    } else if (arg === '--commit-range' && args[i + 1]) {
      options.commitRange = args[i + 1];
      i++;
    } else if (arg === '--format' && args[i + 1]) {
      options.format = args[i + 1];
      i++;
    } else if (arg === '--report-type' && args[i + 1]) {
      options.reportType = args[i + 1];
      i++;
    } else if (arg === '--pr') {
      options.prNumber = process.env.PR_NUMBER;
      options.prTitle = process.env.PR_TITLE;
      options.prAuthor = process.env.PR_AUTHOR;
      options.prUrl = process.env.PR_URL;
      options.baseSha = process.env.PR_BASE_SHA;
      options.headSha = process.env.PR_HEAD_SHA;
      if (options.prNumber) {
        options.filename = `pr-${options.prNumber}-debrief.md`;
      }
    } else if (arg === '--guided') {
      isGuided = true;
    } else if (arg === '--help') {
      options.showHelp = true;
    }
  }

  async function main() {
    try {
      // Initialize chalk first
      if (!chalk) await initChalk();

      // Handle help after chalk is initialized
      if (options.showHelp) {
        console.log(`
${chalk.cyan.bold('🚀 Feature Debrief Generator')}
${chalk.dim('Advanced Git repository analysis and reporting tool')}

${chalk.yellow.bold('USAGE:')}
  ${chalk.white('node generate-debrief.js')} ${chalk.green('[options]')}

${chalk.yellow.bold('CORE OPTIONS:')}
  ${chalk.green('--days')} ${chalk.cyan('<number>')}        Number of days to analyze ${chalk.dim('(default: 30)')}
  ${chalk.green('--output')} ${chalk.cyan('<filename>')}    Output filename ${chalk.dim('(default: auto-generated)')}
  ${chalk.green('--style')} ${chalk.cyan('<style>')}        Report style ${chalk.dim('(summary|comprehensive)')}
  ${chalk.green('--commit-range')} ${chalk.cyan('<range>')} Git commit range ${chalk.dim('(e.g., HEAD~10..HEAD)')}
  ${chalk.green('--pr')}                   Generate PR-specific report ${chalk.dim('(uses env vars)')}

${chalk.yellow.bold('OUTPUT FORMATS:')}
  ${chalk.green('--format')} ${chalk.cyan('<format>')}      Output format ${chalk.dim('(md|html|txt|all)')}
    ${chalk.white('md')}     - Markdown format ${chalk.dim('(default)')}
    ${chalk.white('html')}   - Web-friendly HTML with CSS styling
    ${chalk.white('txt')}    - Plain text format
    ${chalk.white('all')}    - Generate all formats

${chalk.yellow.bold('REPORT TYPES:')}
  ${chalk.green('--report-type')} ${chalk.cyan('<type>')}   Report depth level ${chalk.dim('(standard|detailed|ultra|all)')}
    ${chalk.white('standard')}  - Basic commit analysis
    ${chalk.white('detailed')}  - Enhanced with commit details ${chalk.dim('(default)')}
    ${chalk.white('ultra')}     - Maximum depth and analysis
    ${chalk.white('all')}       - Generate all report types

${chalk.yellow.bold('INTERACTIVE MODE:')}
  ${chalk.green('--guided')}               Launch interactive mode with presets

${chalk.yellow.bold('PRESET CONFIGURATIONS:')}
  ${chalk.white('1. Quick Summary')}       - Last 7 days, essential metrics
  ${chalk.white('2. Weekly Review')}       - Last 7 days, comprehensive analysis
  ${chalk.white('3. Sprint Analysis')}     - Last 14 days, comprehensive
  ${chalk.white('4. Monthly Report')}      - Last 30 days, comprehensive
  ${chalk.white('5. Quarter Review')}      - Last 90 days, comprehensive
  ${chalk.white('6. Custom Range')}        - User-specified parameters
  ${chalk.white('7. Recent Commits')}      - Last 10 commits
  ${chalk.white('8. Git Range')}           - Specific commit range

${chalk.yellow.bold('EXAMPLES:')}
  ${chalk.dim('# Interactive mode with all options')}
  ${chalk.white('node generate-debrief.js')} ${chalk.green('--guided')}

  ${chalk.dim('# Generate comprehensive weekly report in all formats')}
  ${chalk.white('node generate-debrief.js')} ${chalk.green('--days 7 --format all --report-type detailed')}

  ${chalk.dim('# Ultra-detailed analysis for specific commit range')}
  ${chalk.white('node generate-debrief.js')} ${chalk.green('--commit-range HEAD~5..HEAD --report-type ultra')}

  ${chalk.dim('# Generate all report types for last 30 days')}
  ${chalk.white('node generate-debrief.js')} ${chalk.green('--days 30 --report-type all --format html')}

  ${chalk.dim('# PR analysis (requires environment variables)')}
  ${chalk.white('node generate-debrief.js')} ${chalk.green('--pr')}

${chalk.yellow.bold('ENHANCED FEATURES:')}
  ${chalk.white('🔍 Deep Commit Analysis')}    - File changes, complexity metrics, co-authors
  ${chalk.white('📊 Version Tracking')}        - Automatic version bump detection and notes
  ${chalk.white('🔒 Security Analysis')}       - Security fix identification and severity
  ${chalk.white(' Performance Tracking')}    - Performance improvement detection
  ${chalk.white('💥 Breaking Changes')}        - Breaking change detection and documentation
  ${chalk.white('📈 Temporal Analysis')}       - Commit patterns by time and day
  ${chalk.white('📁 File Impact Analysis')}    - Most changed files and hotspots
  ${chalk.white('🏷️  Smart Categorization')}   - Conventional commits + business impact

${chalk.yellow.bold('OUTPUT ORGANIZATION:')}
  ${chalk.dim('When using')} ${chalk.green('--format all')} ${chalk.dim('or')} ${chalk.green('--report-type all')}${chalk.dim(', files are organized in:')}
  ${chalk.white('reports/debrief-YYYY-MM-DD/')}
    ${chalk.dim('├── filename-standard.md')}
    ${chalk.dim('├── filename-detailed.html')}
    ${chalk.dim('├── filename-ultra.txt')}
    ${chalk.dim('└── ...')}

${chalk.yellow.bold('ENVIRONMENT VARIABLES (for --pr):')}
  ${chalk.green('PR_NUMBER')}              - Pull request number
  ${chalk.green('PR_TITLE')}               - Pull request title
  ${chalk.green('PR_AUTHOR')}              - Pull request author
  ${chalk.green('PR_URL')}                 - Pull request URL
  ${chalk.green('PR_BASE_SHA')}            - Base commit SHA
  ${chalk.green('PR_HEAD_SHA')}            - Head commit SHA

${chalk.green.bold('For more information, visit:')} ${chalk.cyan('https://github.com/Underwood-Inc/idling.app__UI/blob/master/DOCS/development/caching.md')}
        `);
        process.exit(0);
      }

      if (isGuided) {
        const generator = new DebriefGenerator();
        const guidedOptions = await generator.runGuidedMode();
        if (guidedOptions) {
          options = { ...options, ...guidedOptions };
        } else {
          process.exit(0);
        }
      }

      const generator = new DebriefGenerator(options);
      await generator.generate();
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate debrief:'), error.message);
      process.exit(1);
    }
  }

  main();
}

module.exports = { DebriefGenerator };
