import { htmlToText } from "html-to-text";
import { IMessage } from "src/types/bids";
import { IClient } from "../constants/client";
import { Jobs } from "../models/jobs.model";
import { BidDto } from "src/modules/bids/dto/bid.dto";
import { Profiles } from "../models/profiles.model";
import { Users } from "../models/users.model";
import { CreateFieldProps } from "src/types/integrations";
import * as moment from "moment";
import { Bids } from "../models/bids.model";
import { Contacts } from "../models/contacts.model";


export const getTextFromHTML = (description: string): string => {
  return htmlToText(description, {
    wordwrap: 130,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'br', format: 'block' },
      { selector: 'p', format: 'block' },
      { selector: 'li', format: 'block' },
      { selector: 'h1', format: 'block' },
      { selector: 'h2', format: 'block' },
      { selector: 'h3', format: 'block' },
      { selector: 'h4', format: 'block' },
      { selector: 'h5', format: 'block' },
      { selector: 'h6', format: 'block' },
      { selector: 'div', format: 'block' },
      { selector: 'span', format: 'inline' },
      { selector: 'button', format: 'block' }
    ],
    whitespaceCharacters: '\n',
    preserveNewlines: true
  });
}

export const getRateAmountFromRateString = (rate: string): number => {
  let rateAmount = 0;
  const sanitizedRate = rate.replace(/,/g, '');
  const rateAmountMatch = sanitizedRate?.match(/\d+(\.\d+)?/);
  if (rateAmountMatch) {
    rateAmount = +rateAmountMatch[0];
  }
  return rateAmount;
};

export const getRatingFromRatingString = (inputString: string): number => {
  const match = inputString?.match(/\((\d+(\.\d+)?)\)/);
  return match && match[1] ? parseFloat(match[1]) : null;
};

export const isValidEmail = (email: string) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex?.test(email);
}

export const formatMessages = (messages: IMessage[]) => {
  return messages.map(msg => {
    const symbol = msg.success ? '✓' : '✗';
    return `${symbol} ${msg.message}`;
  }).join('\n');
}

export const getUpworkRestatFields = (
  {
    client, job, bidDto, profile, bidder,
  }: {
    client: IClient, job: Jobs, bidDto: BidDto, profile: Profiles, bidder: Users,
  }): CreateFieldProps => {

  const rateAmount = getRateAmountFromRateString(bidDto.rate)
  const accountRating = getRatingFromRatingString(client.rating)
  const textDescription = getTextFromHTML(job.description)
  const titleWithClientName = `${job.title} ${client.name ? `For ${client.name}` : ''}`

  return {
    // Account Fields
    accountRating,
    clientName: client.name,
    clientCountry: client?.location?.country,
    clientState: client?.location?.state,
    clientTimezone: client.timeZone,

    // Job Fields
    name: job.title,
    titleWithClientName,
    description: textDescription,
    category: job.category,
    postedDate: moment(job.postedDate).valueOf(),
    experienceLevel: job.experienceLevel,
    hourlyRange: job.hourlyRange,
    hourly: job.hourly,
    projectLength: job.projectLength,
    url: job.url,
    featured: job.featured,
    
    // Bid Fields
    bidCoverLetter: bidDto.bidCoverLetter,
    bidURL: bidDto.bidURL,
    boosted: bidDto.boosted,
    connects: +bidDto.connects,
    profile: {
      add: [profile?.clickupId && +profile.clickupId]
    },
    bidderProfile: {
      add: [bidder?.clickupId && +bidder.clickupId]
    },
    bidderName: bidder?.name,
    profileName: profile?.name,
    rate: rateAmount,
    responseDate: bidDto.response?.date ? moment(bidDto.response.date).valueOf() : null,
    bidQuestions:
      bidDto.bidQuestions && bidDto.bidQuestions.length
        ? bidDto.bidQuestions
          .map(
            (value) => `Question: ${value?.q} \nAnswer: ${value?.a}`
          )
          .join("\n")
        : "",
    invite: bidDto.invite
  }
}

export const getUpworkRestatFieldsForManualBid = (
  {
    client, job, bidDto, profile, bidder,
  }: {
    client: Contacts, job: Jobs, bidDto: Bids, profile: Profiles, bidder: Users,
  }): CreateFieldProps => {

  const rateAmount = getRateAmountFromRateString(bidDto.proposedRate)
  const accountRating = getRatingFromRatingString(client.rating)
  const textDescription = getTextFromHTML(job.description)
  const titleWithClientName = `${job.title} ${client.name ? `For ${client.name}` : ''}`

  return {
    // Account Fields
    accountRating,
    clientName: client.name,
    clientCountry: client?.locationCountry,
    clientState: client?.locationState,
    clientTimezone: client.timeZone,

    // Job Fields
    name: job.title,
    titleWithClientName,
    description: textDescription,
    category: job.category,
    postedDate: moment(job.postedDate).valueOf(),
    experienceLevel: job.experienceLevel,
    hourlyRange: job.hourlyRange,
    hourly: job.hourly,
    projectLength: job.projectLength,
    url: job.url,
    featured: job.featured,
    
    // Bid Fields
    bidCoverLetter: bidDto.coverLetter,
    bidURL: bidDto.upworkProposalURL,
    boosted: bidDto.boosted,
    connects: +bidDto.connects,
    profile: {
      add: [profile?.clickupId && +profile?.clickupId]
    },
    bidderProfile: {
      add: [bidder?.clickupId && +bidder?.clickupId]
    },
    bidderName: bidder?.name,
    profileName: profile?.name,
    rate: rateAmount,
    responseDate: bidDto.responseDate ? moment(bidDto.responseDate).valueOf() : null,
    invite: bidDto.invite
  }
}