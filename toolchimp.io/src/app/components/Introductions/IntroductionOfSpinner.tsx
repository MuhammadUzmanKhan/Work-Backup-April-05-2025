import { FiRotateCw } from "react-icons/fi";

export default function IntroductionOfSpinner() {
  return (
    <div className="flex flex-row px-5 justify-center items-center">
      <div ml-5>
        <FiRotateCw className="text-4xl text-blue-500" />
      </div>
      <div className="ml-5 flex px-5 justify-start items-start pb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Interactive Spinner
          </h2>
          <p className="text-lg mb-4">
            The Spinner is an exciting tool designed to randomly select a name
            from a given list of entries.Perfect for games,
            <br /> giveaways, or decision-making, this spinner adds an element
            of fun and fairness to any event.
          </p>
          <h3 className="text-xl md:text-2xl font-semibold mb-2">
            Key Features:
          </h3>
          <ul className="list-disc ml-5 text-lg mb-4">
            <li>Easy to use with a simple interface.</li>
            <li>Supports up to 10 entries at a time.</li>
            <li>
              Provides a visual and audible experience with spinning sound
              effects.
            </li>
            <li>Displays the winner in a modal after the spin is complete.</li>
            <li>Responsive design for both desktop and mobile devices.</li>
          </ul>
          <h3 className="text-xl md:text-2xl font-semibold mb-2">
            How It Works:
          </h3>
          <ol className="list-decimal ml-5 text-lg">
            <li>Enter up to 10 names in the text area provided.</li>
            <li>Click the &quot;Start&quot; button to spin the wheel.</li>
            <li>
              Watch as the spinner randomly selects a name, accompanied by sound
              effects.
            </li>
            <li>
              The winner is highlighted with a needle, and a modal displays the
              winning name.
            </li>
            <li>
              The spinner is ready for another round of exciting selection!
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
