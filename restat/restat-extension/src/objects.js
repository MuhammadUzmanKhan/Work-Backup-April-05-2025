const _jobAttributes = {
  experienceLevel: "",
  hourlyRange: "",
  hourly: "",
  proposeYourTerms: "",
  projectLengthDuration: "",
  featuredJob: false,
};

const _clientLocation = {
  country: "",
  state: "",
};

const _clientHistory = {
  proposals: "",
  interviews: "",
  jobsPosted: "",
  totalSpent: "",
  hoursBilled: "",
  openJobs: "",
  hires: "",
  hired: "",
  hireRate: "",
  avgHourlyRate: "",
  memberJoined: null,
};

const _response = {
  date: null,
};

const _proposedTerms = {
  profile: "",
  rate: "",
  receivedAmount: ""
};

let upworkBidObj = {
  jobDetails: {
    jobTitle: "",
    jobCategories: "",
    jobDescription: "",
    jobAttributes: _jobAttributes,
    jobSkills: [],
    jobPosted: undefined,
    inviteOnly: false,
    jobURL: "",
    jobConnects: "",
  },
  client: {
    company: "",
    name: "",
    timeZone: "",
    upworkPlus: false,
    paymentMethod: "",
    rating: "",
    location: _clientLocation,
    history: _clientHistory,
  },
  bidProfileInfo: {
    freelancer: "",
    agency: "",
    businessManager: ""
  },
  bidCoverLetter: "",
  bidProfile: "",
  bidQuestions: [],
  bidURL: "",
  bidTime: "",
  bidder: "",
  connects: "",
  boosted: false,
  bidResponse: false,
  invite: false,
  response: _response,
  proposedTerms: _proposedTerms,
  rawHtml: ""
};
// object to save information from a linkedin profile
let _contactInfo = {
  linkedinProfileLink: "",
  website: "",
  address: "",
  websites: [],
  phone: "",
  email: "",
  twitter: "",
  birthday: "",
  connected: "",
};
let _education = [
  {
    name: "",
    degree: "",
    duration: "",
  },
];
let _skills = [
  {
    name: "",
  },
];
let _experience = [
  {
    company: "",
    title: "",
    duration: "",
    location: "",
  },
  {
    company: "",
    duration: "",
    location: "",
    title: [
      {
        name: "",
        duration: "",
        location: "",
      },
    ],
  },
];
let linkedinProfileObj = {
  bidProfile: "",
  businessDeveloper: "",
  industry: "",
  name: "",
  isConnected: false,
  profileHeadline: "",
  location: "",
  locationState: "",
  locationCountry: "",
  contactInfo: _contactInfo,
  education: _education,
  skills: _skills,
  experience: _experience,
  followers: "",
  connections: "",
  rawHtml: "",
  contactInfoPopupRawHtml: ""
};

module.exports = {
  upworkBidObj,
  linkedinProfileObj,
};
