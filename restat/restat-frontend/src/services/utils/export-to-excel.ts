import * as XLSX from 'xlsx';
import { CONTACT_SOURCE, DateProps, LINKEDIN_SUBTYPE, SOURCE } from '../types/common';
import { convertDateFormat } from './convertDate';
import { IBid, ICompany, IContact, IInstitution, ISkill } from '../types/contacts';
import { apis } from '../apis';
import { routes } from '../constants';

export const generateExcel = async (
  { search, upworkProfile, linkedinProfile, bidder, source, linkedInType, industries, date }: {
    search: string,
    linkedInType: LINKEDIN_SUBTYPE[],
    source: SOURCE[],
    upworkProfile: string[],
    linkedinProfile: string[],
    bidder: string[],
    industries: string[],
    date: DateProps,
  }
): Promise<Blob> => {

  const { data } = await apis.getExcelContacts(
    {
      search,
      source: source?.join(),
      linkedInType: linkedInType?.join(),
      upworkProfile: upworkProfile?.join(),
      linkedinProfile: linkedinProfile?.join(),
      bidder: bidder?.join(),
      dates: date.selected ? date : undefined,
      industries: industries?.join(),
    }
  )

  const contacts = data?.contacts

  const dataForExcel = contacts.map((contact: IContact) => {
    const contactDates: string[] = [];
    if (contact.source === CONTACT_SOURCE.UPWORK && contact.createdAt) {
      contactDates.push(convertDateFormat(contact.createdAt));
    } else if (contact.source === CONTACT_SOURCE.LINKEDIN && contact.linkedInReference?.length) {
      contact.linkedInReference.forEach((ref: any) => {
        if (ref.createdAt) {
          contactDates.push(convertDateFormat(ref.createdAt));
        }
      });
    }
    const linkedinDates: string[] = [];
    if (contact.source === CONTACT_SOURCE.LINKEDIN && contact.linkedInReference?.length) {
      contact.linkedInReference.forEach((ref: any) => {
        if (ref.linkedinConnectedDate) {
          linkedinDates.push(ref.linkedinConnectedDate);
        }
      });
    }

    const businessDevelopers = contact.source === CONTACT_SOURCE.UPWORK
      ? contact.bid?.map((b: any) => b?.user?.name).join(', ')
      : contact.linkedInReference?.map((ref: any) => ref?.user?.name).join(', ');

    const profiles = contact.source === CONTACT_SOURCE.UPWORK
      ? contact.bid?.map((b: any) => b?.bidProfile?.name).join(', ')
      : contact.linkedInReference?.map((ref: any) => ref?.profile?.name).join(', ');

    const companies = contact.companies?.map((c: ICompany) => c.name).join(', ');

    const institutions = contact.institutions?.map((i: IInstitution) => i.name).join(', ');

    const skills = contact.skills?.map((s: ISkill) => s.name).join(', ');

    const bids = contact.bid?.map((b: IBid) => b.upworkProposalURL).join(', ');

    const bidUrls = contact.bid?.map((b: IBid) => `${window.location.origin}${routes.deals}/${b?.slug}`).join(', ')

    const job = contact.job?.url;

    return {
      Name: contact.name || 'N/A',
      Email: contact.email || 'N/A',
      "Phone Number": contact.phoneNumber || 'N/A',
      Address: contact.address || 'N/A',
      "Location Country": contact.locationCountry || 'N/A',
      "Location State": contact.locationState || 'N/A',
      "Contact Date": contactDates.length ? contactDates.join(', ') : 'N/A',
      "LinkedIn Connection Date": linkedinDates.length ? linkedinDates.join(', ') : 'N/A',
      "Business Developer": businessDevelopers || 'N/A',
      Profile: profiles || 'N/A',
      Source: contact.source || 'N/A',
      Companies: companies || 'N/A',
      Institutions: institutions || 'N/A',
      Skills: skills || 'N/A',
      "Bids Upwork Urls": bids || 'N/A',
      "Bid Urls": bidUrls || 'N/A',
      Job: job || 'N/A',
      "Payment Method": contact.paymentMethod || 'N/A',
      Rating: contact.rating || 'N/A',
      "UpWork Rating": contact.upWorkRating || 'N/A',
      "Total Spent": contact.historyTotalSpent || 'N/A',
      "Open Jobs": contact.historyOpenJobs || 'N/A',
      "Jobs Posted": contact.historyJobsPosted || 'N/A',
      Interviews: contact.historyInterviews || 'N/A',
      "Hours Billed": contact.historyHoursBilled || 'N/A',
      "Member Joined": contact.historyMemberJoined || 'N/A',
      Proposals: contact.historyProposals || 'N/A',
      Hires: contact.historyHires || 'N/A',
      Hired: contact.historyHired || 'N/A',
      "Hire Rate": contact.historyHireRate || 'N/A',
      "Avg Hourly Rate": contact.historyAvgHourlyRate || 'N/A',
      "LinkedIn Profile": contact.linkedinProfileLink || 'N/A',
      "LinkedIn Connections": contact.linkedinConnections || 'N/A',
      "LinkedIn Followers": contact.linkedinFollowers || 'N/A',
      "Profile Headline": contact.profileHeadline || 'N/A',
      "Website Links": contact.websites?.join(', ') || 'N/A',
    };
  });
  return new Promise((resolve) => {
    setTimeout(() => {
      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Restat Contacts");

      const excelFile = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelFile], { type: "application/octet-stream" });
      resolve(blob);
    }, 2000);
  });
};
