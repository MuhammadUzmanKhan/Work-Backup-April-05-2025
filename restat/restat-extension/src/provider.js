import { restatHost, STORAGE, SOURCE } from "./constants";
import moment from "moment"

const fetchWithInterceptors = async (url, options = {}, showErrorNotification = true) => {
  const token = await chrome.storage.sync.get(STORAGE.USER_TOKEN);
  const modifiedOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token?.userToken && { Authorization: `Bearer ${token.userToken}` }),
    },
  };

  try {
    const response = await fetch(url, modifiedOptions);

    if (!response.ok) {
      if (response.status === 440) {
        if (showErrorNotification)
          return { error: { status: response.status, message: 'Restat session has expired. Please log in again to continue.' } };
        else return null
      }
      return { error: { status: response.status, message: response.statusText ?? 'An Error Occurred! Please try again later' } };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return { error: { status: error.message, message: error.toString() } };
  }
};

const addBid = async (bid) => {
  const requestOptions = {
    method: "POST",
    body: JSON.stringify({ bid }),
  };
  return await fetchWithInterceptors(`${restatHost}/accounts/create`, requestOptions);
};

const addConnect = async (connectData) => {
  const requestOptions = {
    method: "POST",
    body: JSON.stringify(connectData),
  };
  return await fetchWithInterceptors(`${restatHost}/linkedin-accounts/create`, requestOptions);
};

const updateBid = async (bid) => {
  const requestOptions = {
    method: "PUT",
    body: JSON.stringify({ bid }),
  };
  return await fetchWithInterceptors(`${restatHost}/accounts/update`, requestOptions);
};

const addLead = async (bid) => {
  const requestOptions = {
    method: "PUT",
    body: JSON.stringify({ bid }),
  };
  return await fetchWithInterceptors(`${restatHost}/accounts/add-deal`, requestOptions);
};

const addError = async (error) => {
  const requestOptions = {
    method: "POST",
    body: JSON.stringify({ error: error?.stack }),
  };
  await fetchWithInterceptors(`${restatHost}/errors/create`, requestOptions);
};

const authenticate = async ({ idToken }) => {
  const requestOptions = {
    method: "POST",
    body: JSON.stringify({ idToken }),
  };
  return await fetchWithInterceptors(`${restatHost}/auth/authenticate`, requestOptions);
};

const getTags = async (tags, page = 1, search = "") => {
  const tagsString = tags.join(',');
  const requestOptions = {
    method: "GET",
  };
  return await fetchWithInterceptors(
    `${restatHost}/tags?search=${search}&tags=${encodeURIComponent(tagsString)}&page=${page}`,
    requestOptions
  );
};

const getLocation = async (location) => {
  const apiKey = process.env.VUE_APP_OPEN_CAGE_API_KEY;
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${location}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.results.length > 0) {
    const components = data.results[0].components;
    const locationState = components.state;
    const locationCountry = components.country;
    return { locationState, locationCountry };
  } else {
    return null;
  }
};

const getPortfolios = async (type, page = 1, search = "") => {
  const requestOptions = {
    method: "GET",
  };
  return await fetchWithInterceptors(
    `${restatHost}/portfolios?search=${search}&type=${type}&page=${page}`,
    requestOptions
  );
};

const createTemplate = async (template) => {
  const requestOptions = {
    method: "POST",
    body: JSON.stringify(template),
  };
  return await fetchWithInterceptors(`${restatHost}/portfolios/create`, requestOptions);
};

const getMatchedPortfolios = async (type, tags, matchedPortfoliosPage = 1) => {
  const requestOptions = {
    method: "GET",
  };

  return await fetchWithInterceptors(
    `${restatHost}/portfolios/matched?type=${type}&matchedPortfoliosPage=${matchedPortfoliosPage}&tags=${encodeURIComponent(tags)}`,
    requestOptions
  );
};

const authenticateUser = async (idToken, social = {}) => {
  let user, token;
  if(!social?.token){
    const data = await authenticate({ idToken: idToken });
    user = data.user
    token = data.token
  } else {
    user = social.user
    token = social.token
  }

  let company = await chrome.storage.sync.get([STORAGE.COMPANY]);
  let bidder = await chrome.storage.sync.get([STORAGE.BIDDER]);
  let settings = await chrome.storage.sync.get([STORAGE.SETTINGS]);
  let userToken = await chrome.storage.sync.get([STORAGE.USER_TOKEN]);
  let linkedinTarget = await chrome.storage.sync.get([STORAGE.LINKEDIN_TARGET]);
  let upworkTarget = await chrome.storage.sync.get([STORAGE.UPWORK_TARGET]);
  userToken.userToken = token;
  await chrome.storage.sync.set(userToken);
  bidder.bidder = user?.name;
  await chrome.storage.sync.set(bidder);
  upworkTarget.upworkTarget = user?.upworkTarget;
  await chrome.storage.sync.set(upworkTarget)
  linkedinTarget.linkedinTarget = user?.linkedinTarget;
  await chrome.storage.sync.set(linkedinTarget);
  const userCompany = await getCompanyById(user.companyId);
  if (userCompany) {
    company.company = userCompany;
    await chrome.storage.sync.set(company);
  }
  if (user.settings) {
    settings.settings = user.settings
    await chrome.storage.sync.set(settings)
  }
  return user;
};

const getCompanyById = async (id) => {
  const requestOptions = {
    method: "GET",
  };
  return await fetchWithInterceptors(`${restatHost}/workspaces/${id}`, requestOptions);
};

const getIndustries = async () => {
  const requestOptions = {
    method: "GET",
  };
  return await fetchWithInterceptors(`${restatHost}/industries`, requestOptions);
};

const getProfiles = async (source) => {
  const requestOptions = {
    method: "GET",
  };
  return await fetchWithInterceptors(`${restatHost}/profiles?source=${source}`, requestOptions);
};

const countBids = async () => {
  const monthStart = moment().startOf('month').toDate().toISOString();
  const dayStart = moment().startOf('day').toDate().toISOString();
  const dayEnd = moment().endOf('day').toDate().toISOString();

  const params = new URLSearchParams({
    type: SOURCE.UPWORK,
    monthStart: monthStart,
    dayStart: dayStart,
    dayEnd: dayEnd,
  });

  const requestOptions = {
    method: "GET",
  };
  return await fetchWithInterceptors(`${restatHost}/user/goal/count?${params.toString()}`, requestOptions, false);
};

const countLinkedinConnects = async () => {
  const monthStart = moment().startOf('month').toDate().toISOString();
  const dayStart = moment().startOf('day').toDate().toISOString();
  const dayEnd = moment().endOf('day').toDate().toISOString();

  const params = new URLSearchParams({
    type: SOURCE.LINKEDIN,
    monthStart: monthStart,
    dayStart: dayStart,
    dayEnd: dayEnd,
  });

  const requestOptions = {
    method: "GET",
  };
  return await fetchWithInterceptors(`${restatHost}/user/goal/count?${params.toString()}`, requestOptions);
};

const setUserSettings = async (settings) => {
  const requestOptions = {
    method: "POST",
    body: JSON.stringify(settings),
  };
  return await fetchWithInterceptors(`${restatHost}/settings/user`, requestOptions);
};

export {
  addBid,
  updateBid,
  addLead,
  getTags,
  createTemplate,
  addConnect,
  getIndustries,
  authenticate,
  authenticateUser,
  getPortfolios,
  getMatchedPortfolios,
  getProfiles,
  addError,
  countBids,
  countLinkedinConnects,
  setUserSettings,
  getLocation
};
