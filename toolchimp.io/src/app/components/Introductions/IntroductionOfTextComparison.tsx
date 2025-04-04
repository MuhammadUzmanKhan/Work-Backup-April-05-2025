import TextComparisonIcon from "@/icons/text-comparison-icon";

export default function IntroductionOfTextComparison() {
  return (
    <div className="flex flex-row px-5 justify-start items-center">
      <div ml-5>
        <TextComparisonIcon />
      </div>
      <div className="ml-5 flex px-5 justify-start items-start pb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Text Comparison Tool
          </h2>
          <ol className="list-decimal ml-5 text-lg">
            <li>
              Enter or paste the text you want to compare in the left and right
              text areas.
            </li>
            <li>
              Click the &quot;Compare!&quot; button to highlight differences.
            </li>
            <li>The differences will be shown with:</li>
            <ul className="list-disc ml-10">
              <li className="text-red-500">
                Red background for deletions in the left text.
              </li>
              <li className="text-green-500">
                Green background for insertions in the right text.
              </li>
              <li className="text-yellow-500">
                Yellow background for line numbers with differences.
              </li>
            </ul>
            <li>
              Use the &quot;Switch texts&quot; button to swap the texts between
              the left and right areas.
            </li>
            <li>
              Use the &quot;Clear all&quot; button to clear both text areas and
              reset the tool.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
