import useIsMobile from "@/app/hooks/MobileOnly";
import { FaBirthdayCake } from "react-icons/fa";

export default function IntroductionOfAgeCalculator() {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col sm:flex-row px-5 justify-center items-center">
      <div className="mb-4 sm:mb-0">
        <FaBirthdayCake className="text-4xl text-blue-500" />
      </div>
      <div
        className={`ml-0 sm:ml-5 flex px-5 ${isMobile ? "justify-start items-start" : "justify-center"} pb-10 `}
      >
        <div className="shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">
            Age Calculator
          </h2>
          <p className="text-lg mb-4">
            The Age Calculator is a useful tool designed to calculate your age
            based on the date of birth <br /> and the date you want to calculate{" "}
            <br /> the age for. It&apos;s perfect for anyone who wants to know
            their exact age in years, months, and days.
          </p>
          <h3 className="text-xl md:text-2xl font-semibold mb-2">
            Key Features:
          </h3>
          <ul className="list-disc ml-5 text-lg mb-4">
            <li>Simple and easy to use interface.</li>
            <li>Calculates age in years, months, and days.</li>
            <li>
              Provides additional details such as total months, weeks, days,
              hours, minutes, and seconds.
            </li>
            <li>Shows the day of the week you were born.</li>
            <li>Responsive design for both desktop and mobile devices.</li>
          </ul>
          <h3 className="text-xl md:text-2xl font-semibold mb-2">
            How It Works:
          </h3>
          <ol className="list-decimal ml-5 text-lg">
            <li>Enter your date of birth in the provided date field.</li>
            <li>
              Enter the date you want to calculate your age for, or leave it as
              the current date.
            </li>
            <li>
              Click the &quot;Calculate&quot; button to see your age and other
              details.
            </li>
            <li>
              View your age in various formats and see the day of the week you
              were born.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
