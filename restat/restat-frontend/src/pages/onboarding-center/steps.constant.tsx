import { images } from "../../assets";
import { routes } from "../../services";
import { IOnboardingStepType } from "../../services/types/onboarding-steps";

const stepsDescription = [
  {
    key: IOnboardingStepType.addYourTeam,
    title: "Add Your Team",
    description: <>
      <span className="text-lg font-bold">Invite and manage team members to collaborate on projects.</span> <br />
      Click on the go to step button that will redirect you to the team members page. <br />
      At the team members page, you can add new team members by clicking on the <span className="bg-green-400 p-1">"Add"</span> button.
    </>,
    link: routes.teamMembers
  },
  {
    key: IOnboardingStepType.buildYourPortfolio,
    title: "Build Your Portfolio",
    description: <>
      <span className="text-lg font-bold">Showcase your past work to impress potential clients</span> <br />
      Click on the go to step button that will redirect you to the portfolios page. <br />
      At the portfolios page, you can add new portfolio by clicking on the <span className="bg-green-400 p-1">"Add Portfolio"</span> button.
    </>
    ,
    link: routes.portfolios
  },
  {
    key: IOnboardingStepType.createCustomTemplates,
    title: "Create Custom Templates",
    description: <>
      <span className="text-lg font-bold">Design professional proposal templates to streamline your workflow.</span> <br />
      Click on the go to step button that will redirect you to the portfolios page. <br />
      At the portfolios page, you can add new portfolio by clicking on the <span className="bg-green-400 p-1">"Add Template"</span> button.
    </>
    ,
    link: routes.portfolios
  },
  {
    key: IOnboardingStepType.connectYourProfiles,
    title: "Connect Your Profiles",
    description: <>
      <span className="text-lg font-bold">Integrate with Upwork and LinkedIn to sync client information.</span> <br />
      Click on the go to step button that will redirect you to the profile page. <br />
      At the profile page, you can add new profile by clicking on the <span className="bg-green-400 p-1">"Add"</span> button for both upwork and lindkin.
    </>,
    link: routes.upworkProfiles
  },
  {
    key: IOnboardingStepType.expandYourReach,
    title: "Expand Your Reach",
    description: <>
      <span className="text-lg font-bold">Add integrations with other tools to boost productivity.</span> <br />
      Click on the go to step button that will redirect you to the settings page. <br />
      At the settings page, you can add new integrations by clicking on the Integration Tab and then <span className="bg-green-400 p-1">"Clickup/HubSpot"</span> button.
    </>,
    link: routes.settings
  },
  {
    key: IOnboardingStepType.speedUpYourWorkflow,
    title: "Speed Up Your Workflow",
    description: <>
      <span className="text-lg font-bold">Download the browser <span className="bg-green-400 p-1">extension</span> for quick access to your tools.</span> <br />
      go to the settings page and click on the <span className="bg-green-400 p-1">"Download Extension"</span> button.
    </>,
    link: process.env.REACT_APP_EXTENSION_URL
  },
  {
    key: IOnboardingStepType.syncYourBids,
    title: "Sync Your Bids",
    description: (
      <>
        <span className="flex gap-2 text-lg font-bold">
          Sync your proposals from <span className="text-green-600">Upwork</span>
          <img src={images.upwork} width={20} alt="Upwork logo" />
        </span>
        <br />
        Click on the go to step button that will redirect you to the Upwork website. <br />
        At the Upwork website, you can add new proposals by clicking on the Sync<span className="bg-green-400 p-1">"Proposal/Lead/Contract"</span>.
      </>
    ),
    link: "https://www.upwork.com/"
  },
  {
    key: IOnboardingStepType.efficientDealsManagement,
    title: "Efficient Deals Management",
    description: <span className="text-lg font-bold">Track proposals, sync client communication, and manage leads</span>,
    link: routes.deals
  },
  {
    key: IOnboardingStepType.automateYourWorkflow,
    title: "Automate Your Workflow",
    description: <>
      <span className="text-lg font-bold">Automatically add LinkedIn connections to your contact list.</span><br />
      Click on the go to step button that will redirect you to the linkedin Website.<br />
      At the linkedin Website, you can add new linkedin connection by clicking on the Sync<span className="bg-green-400 p-1">Connection</span> button.
    </>,
    link: "https://www.linkedin.com/"
  },
  {
    key: IOnboardingStepType.centralizeContactInformation,
    title: "Centralize Contact Information",
    description: <span className="text-lg font-bold">Access and manage all Contacts in one place.</span>,
    link: routes.contacts
  },
  {
    key: IOnboardingStepType.streamlineYourProspecting,
    title: "Streamline Your Prospecting",
    description: <>
      <span className="text-lg font-bold">Sync potential Contacts from LinkedIn.</span><br />
      Click on the go to step button that will redirect you to the linkedin Website.<br />
      At the linkedin Website, you can add new linkedin connection by clicking on the Sync<span className="bg-green-400 p-1">Prospect</span> button.
    </>,
    link: "https://www.linkedin.com/"
  },
  {
    key: IOnboardingStepType.manageBusinessProfileSettings,
    title: "Manage Your Business & Profile Settings",
    description: <span className="text-lg font-bold">Oversee your company information and settings.</span>,
    link: routes.settings
  },
  {
    key: IOnboardingStepType.analyzeYourPerformance,
    title: "Analyze Your Performance",
    description: <span className="text-lg font-bold">Track key metrics and gain valuable insights.</span>,
    link: routes.dashboard
  },
];

export default stepsDescription;