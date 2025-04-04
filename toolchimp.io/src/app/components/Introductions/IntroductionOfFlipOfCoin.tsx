import FlipACoinIcon from "@/icons/flip-a-coin-icon";

export default function IntroductionOfFlipOfCoin() {
  return (
    <div className="flex flex-row px-5 justify-start items-center">
      <div ml-5>
        <FlipACoinIcon />
      </div>
      <div className="ml-5 flex px-5 justify-start items-start pb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Toss a virtual coin
          </h2>
          <ol className="list-decimal ml-5 text-lg">
            <li>Choose which option will be heads and which will be tails.</li>
            <li>
              Click the button to flip the random coin (or tap the screen or
              press the space-bar).
            </li>
            <li>
              The winning option (heads or tails) will appear on the screen.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
