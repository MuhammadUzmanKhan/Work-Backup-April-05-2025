/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read the index.html file
fs.readFile('coverage/apps/auth/index.html', 'utf-8', (err, html) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Parse the HTML using JSDOM
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Function to extract code coverage info from the HTML document
  function getCoverageInfo() {
    const coverageInfo = {};

    // Select elements containing coverage details
    const statements = document.querySelector(
      '.fl.pad1y.space-right2:nth-child(1) .strong',
    );
    const branches = document.querySelector(
      '.fl.pad1y.space-right2:nth-child(2) .strong',
    );
    const functions = document.querySelector(
      '.fl.pad1y.space-right2:nth-child(3) .strong',
    );
    const lines = document.querySelector(
      '.fl.pad1y.space-right2:nth-child(4) .strong',
    );

    // Extract and store the text content for each coverage metric
    if (statements)
      coverageInfo.Statements = parseFloat(statements.textContent.trim());
    if (branches)
      coverageInfo.Branches = parseFloat(branches.textContent.trim());
    if (functions)
      coverageInfo.Functions = parseFloat(functions.textContent.trim());
    if (lines) coverageInfo.Lines = parseFloat(lines.textContent.trim());

    return coverageInfo;
  }

  function generateColoredProgressBar(percentage) {
    const totalBars = 20; // Total number of bars in the progress bar
    const filledBars = Math.round((percentage / 100) * totalBars); // Number of filled bars
    const emptyBars = totalBars - filledBars; // Number of empty bars

    // Determine the color of the bar based on the percentage
    let barColor;
    if (percentage >= 80) {
      barColor = '🟩'; // Green
    } else if (percentage >= 70) {
      barColor = '🟨'; // Yellow
    } else if (percentage >= 50) {
      barColor = '🟧'; // Orange
    } else {
      barColor = '🟥'; // Red
    }

    // Return the progress bar string with colored emojis
    return `${percentage.toFixed(2)}%\n${barColor.repeat(filledBars)}${'░'.repeat(emptyBars)}`;
  }

  // Function to format the report with right-aligned bars
  function formatReportLine(label, percentage) {
    const bar = generateColoredProgressBar(percentage);
    return `**${label}:**\n${bar}`;
  }

  // Get the coverage information
  const coverageData = getCoverageInfo();

  // Parse the coverage percentages
  const statementsPercentage = parseFloat(coverageData.Statements);
  const branchesPercentage = parseFloat(coverageData.Branches);
  const functionsPercentage = parseFloat(coverageData.Functions);
  const linesPercentage = parseFloat(coverageData.Lines);

  // Create a custom formatted report in Markdown with progress bars
  const markdownReport = `
  ### Code Coverage Report
  
  ${formatReportLine('Statements', statementsPercentage)}
  ${formatReportLine('Branches', branchesPercentage)}
  ${formatReportLine('Functions', functionsPercentage)}
  ${formatReportLine('Lines', linesPercentage)}
  `;

  // Write the custom report to a file
  fs.writeFileSync('coverage-report.md', markdownReport);
  console.log(JSON.stringify(coverageData));
});
