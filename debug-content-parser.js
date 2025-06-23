#!/usr/bin/env node

const chalk = require('chalk');

// Test cases for debugging
const testCases = [
  'test #database @[lunaarmstrong|16|author] huzzah!',
  'Simple text with #hashtag',
  '@[user|123|mentions] at start',
  'Multiple #tags #here @[user1|1|author] and @[user2|2|mentions]',
  'Line 1\nLine 2 with #hashtag\nLine 3 @[user|456|author]',
  'URL test ![embed](https://youtube.com/watch?v=abc) after',
  'Mixed content #test @[user|789|author] ![link](https://example.com) more text!'
];

console.log(chalk.blue.bold('=== CONTENT PARSER DEBUG TOOL ===\n'));

// Mock the content parser classes since we can't import the TS files directly
class MockHashtagParser {
  static findMatches(text) {
    const regex = /#[a-zA-Z0-9_-]+/g;
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        content: match[0],
        start: match.index,
        end: match.index + match[0].length,
        type: 'hashtag'
      });
    }

    return matches;
  }
}

class MockMentionParser {
  static findMatches(text) {
    const regex = /@\[[^\]]+\]/g;
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        content: match[0],
        start: match.index,
        end: match.index + match[0].length,
        type: 'mention'
      });
    }

    return matches;
  }
}

class MockURLParser {
  static findMatches(text) {
    const regex = /!\[[^\]]*\]\([^)]+\)/g;
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        content: match[0],
        start: match.index,
        end: match.index + match[0].length,
        type: 'url'
      });
    }

    return matches;
  }
}

function analyzeText(text, testIndex) {
  console.log(chalk.yellow.bold(`\n📝 Test Case ${testIndex + 1}:`));
  console.log(chalk.gray(`"${text}"`));
  console.log(chalk.gray(`Length: ${text.length} characters\n`));

  // Find all matches
  const hashtagMatches = MockHashtagParser.findMatches(text);
  const mentionMatches = MockMentionParser.findMatches(text);
  const urlMatches = MockURLParser.findMatches(text);

  // Log matches by type
  if (hashtagMatches.length > 0) {
    console.log(chalk.green.bold('🏷️  Hashtag matches:'));
    hashtagMatches.forEach((match, i) => {
      console.log(
        chalk.green(
          `  ${i + 1}: "${match.content}" at positions ${match.start}-${match.end}`
        )
      );
    });
  }

  if (mentionMatches.length > 0) {
    console.log(chalk.blue.bold('👤 Mention matches:'));
    mentionMatches.forEach((match, i) => {
      console.log(
        chalk.blue(
          `  ${i + 1}: "${match.content}" at positions ${match.start}-${match.end}`
        )
      );
    });
  }

  if (urlMatches.length > 0) {
    console.log(chalk.magenta.bold('🔗 URL matches:'));
    urlMatches.forEach((match, i) => {
      console.log(
        chalk.magenta(
          `  ${i + 1}: "${match.content}" at positions ${match.start}-${match.end}`
        )
      );
    });
  }

  // Combine and sort all matches
  const allMatches = [...hashtagMatches, ...mentionMatches, ...urlMatches].sort(
    (a, b) => a.start - b.start
  );

  if (allMatches.length > 0) {
    console.log(chalk.cyan.bold('\n🔄 All matches (sorted by position):'));
    allMatches.forEach((match, i) => {
      const color =
        match.type === 'hashtag'
          ? chalk.green
          : match.type === 'mention'
            ? chalk.blue
            : chalk.magenta;
      console.log(
        color(
          `  ${i + 1}: ${match.type.toUpperCase()} "${match.content}" at positions ${match.start}-${match.end}`
        )
      );
    });
  }

  // Analyze text segments
  console.log(chalk.white.bold('\n📋 Text segments analysis:'));
  let processedRanges = allMatches.map((match) => ({
    start: match.start,
    end: match.end
  }));
  let currentIndex = 0;

  for (const range of processedRanges) {
    if (currentIndex < range.start) {
      const textSegment = text.slice(currentIndex, range.start);
      console.log(
        chalk.white(
          `  TEXT: "${textSegment}" at positions ${currentIndex}-${range.start}`
        )
      );
    }
    const matchData = allMatches.find((m) => m.start === range.start);
    const color =
      matchData.type === 'hashtag'
        ? chalk.green.bold
        : matchData.type === 'mention'
          ? chalk.blue.bold
          : chalk.magenta.bold;
    console.log(
      color(
        `  ${matchData.type.toUpperCase()}: "${text.slice(range.start, range.end)}" at positions ${range.start}-${range.end}`
      )
    );
    currentIndex = range.end;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    console.log(
      chalk.white(
        `  TEXT: "${remainingText}" at positions ${currentIndex}-${text.length}`
      )
    );
  }

  // Character-by-character breakdown for complex cases
  if (text.includes('\n') || allMatches.length > 2) {
    console.log(chalk.gray.bold('\n🔍 Character-by-character breakdown:'));
    for (let i = 0; i < Math.min(text.length, 100); i++) {
      // Limit to first 100 chars for readability
      const char = text[i];
      const displayChar = char === '\n' ? '\\n' : char === ' ' ? '·' : char;
      const inWhichSegment = allMatches.find(
        (match) => i >= match.start && i < match.end
      );
      const segmentType = inWhichSegment ? inWhichSegment.type : 'text';

      const color =
        segmentType === 'hashtag'
          ? chalk.green
          : segmentType === 'mention'
            ? chalk.blue
            : segmentType === 'url'
              ? chalk.magenta
              : chalk.gray;

      console.log(
        color(
          `  ${i.toString().padStart(2)}: "${displayChar}" (${segmentType})`
        )
      );
    }
    if (text.length > 100) {
      console.log(
        chalk.gray('  ... (truncated, showing first 100 characters)')
      );
    }
  }

  // Line analysis for multiline content
  if (text.includes('\n')) {
    console.log(chalk.yellow.bold('\n📏 Line analysis:'));
    const lines = text.split('\n');
    let charIndex = 0;
    lines.forEach((line, lineIndex) => {
      console.log(
        chalk.yellow(
          `  Line ${lineIndex + 1}: "${line}" (chars ${charIndex}-${charIndex + line.length})`
        )
      );
      charIndex += line.length + 1; // +1 for the newline character
    });
  }

  console.log(chalk.gray('─'.repeat(80)));
}

// Analyze all test cases
testCases.forEach((testCase, index) => {
  analyzeText(testCase, index);
});

console.log(chalk.blue.bold('\n✅ Debug analysis complete!\n'));

// Interactive mode
if (process.argv.includes('--interactive')) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(chalk.green.bold('🔄 Interactive mode enabled!'));
  console.log(chalk.gray('Enter text to analyze (or "exit" to quit):\n'));

  function promptForInput() {
    rl.question(chalk.cyan('> '), (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log(chalk.blue('👋 Goodbye!'));
        rl.close();
        return;
      }

      if (input.trim()) {
        analyzeText(input, testCases.length);
      }

      promptForInput();
    });
  }

  promptForInput();
}
