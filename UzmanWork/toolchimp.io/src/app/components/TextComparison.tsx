import React, { useState } from "react";
import DiffMatchPatch from "diff-match-patch";

const dmp = new DiffMatchPatch();

interface Difference {
  0: number;
  1: string;
}

const highlightDifferences = (left: string, right: string) => {
  const diffs = dmp.diff_main(left, right);
  dmp.diff_cleanupSemantic(diffs);

  let leftHtml = "";
  let rightHtml = "";
  let hasDifference = false;

  diffs.forEach((diff: Difference) => {
    const operation = diff[0];
    const text = diff[1];

    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (operation === DiffMatchPatch.DIFF_INSERT) {
      rightHtml += `<span class="bg-green-500">${escapedText}</span>`;
      hasDifference = true;
    } else if (operation === DiffMatchPatch.DIFF_DELETE) {
      leftHtml += `<span class="bg-red-500">${escapedText}</span>`;
      hasDifference = true;
    } else {
      leftHtml += escapedText;
      rightHtml += escapedText;
    }
  });

  return { leftHtml, rightHtml, hasDifference };
};

const addLineNumbers = (text: string, highlightedLines: number[]) => {
  return text
    .split("\n")
    .map((line, index) => {
      const lineNumber = index + 1;
      const lineNumberContent = highlightedLines.includes(lineNumber)
        ? `<span class="bg-yellow-500">${lineNumber}</span>`
        : `${lineNumber}`;
      return `${lineNumberContent} ${line}`;
    })
    .join("\n");
};

const findDifferenceLines = (leftHtml: string, rightHtml: string): number[] => {
  const leftLines = leftHtml.split("\n");
  const rightLines = rightHtml.split("\n");
  const highlightedLines = new Set<number>();

  leftLines.forEach((line, index) => {
    if (
      line.includes("bg-red-500") ||
      rightLines[index]?.includes("bg-green-500")
    ) {
      highlightedLines.add(index + 1);
    }
  });

  return Array.from(highlightedLines);
};

export default function TextComparison() {
  const [leftText, setLeftText] = useState<string>("");
  const [rightText, setRightText] = useState<string>("");
  const [comparedTexts, setComparedTexts] = useState<{
    leftHtml: string;
    rightHtml: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const clearAll = () => {
    setLeftText("");
    setRightText("");
    setComparedTexts(null);
    setErrorMessage("");
  };

  const switchTexts = () => {
    const temp = leftText;
    setLeftText(rightText);
    setRightText(temp);
    setErrorMessage("");
  };

  const compareTexts = () => {
    if (!leftText || !rightText) {
      setErrorMessage("Nothing to compare. Please enter text in both fields.");
      setComparedTexts(null);
      return;
    }
    const { leftHtml, rightHtml, hasDifference } = highlightDifferences(
      leftText,
      rightText
    );

    if (!hasDifference) {
      setComparedTexts(null);
      setErrorMessage("Texts are identical. No differences found.");
    } else {
      const highlightedLines = findDifferenceLines(leftHtml, rightHtml);
      const leftWithLineNumbers = addLineNumbers(leftHtml, highlightedLines);
      const rightWithLineNumbers = addLineNumbers(rightHtml, highlightedLines);
      setComparedTexts({
        leftHtml: leftWithLineNumbers,
        rightHtml: rightWithLineNumbers,
      });
      setErrorMessage("");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      {comparedTexts && (
        <div className="flex w-full">
          <div className="w-1/2 p-2 border border-gray-300 bg-gray-900 text-white rounded-tl-lg overflow-auto relative flex justify-start">
            <div className="relative pl-2">
              <pre>
                <code
                  style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                  dangerouslySetInnerHTML={{ __html: comparedTexts.leftHtml }}
                />
              </pre>
            </div>
          </div>
          <div className="w-1/2 p-2 border border-gray-300 bg-gray-900 text-white rounded-tr-lg overflow-auto relative flex justify-start">
            <div className="relative pl-2">
              <pre>
                <code
                  style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                  dangerouslySetInnerHTML={{ __html: comparedTexts.rightHtml }}
                />
              </pre>
            </div>
          </div>
        </div>
      )}
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      <div className="flex space-x-2">
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded"
          onClick={switchTexts}
        >
          Switch texts
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded"
          onClick={compareTexts}
        >
          Compare!
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded"
          onClick={clearAll}
        >
          Clear all
        </button>
      </div>
      <div className="flex w-full">
        <textarea
          className="w-1/2 h-64 p-2 border border-gray-300 bg-gray-900 text-white rounded-bl-lg"
          value={leftText}
          onChange={(e) => setLeftText(e.target.value)}
        />
        <textarea
          className="w-1/2 h-64 p-2 border border-gray-300 bg-gray-900 text-white rounded-br-lg"
          value={rightText}
          onChange={(e) => setRightText(e.target.value)}
        />
      </div>
    </div>
  );
}
