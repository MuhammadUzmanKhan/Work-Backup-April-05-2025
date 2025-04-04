export class ClientDto { 
  company?: string;
  name?: string;
  timeZone?: string;
  upworkPlus?: boolean;
  paymentMethod?: string;
  rating?: string;
  location?: Location;
  history?: History;
  numberOfEmployees?: string;  
  designation?: string;         
  industry?: string;           
  companyAge?: string;          
  funding?: string;             
  currentInterview?: string;    
  decisionMaker?: boolean;     
  socialMediaHandles?: SocialMediaHandles = {};  
  specialInterest?: string;     
  clientsExperience?: ClientExperience = {};
  email?: string; 
}
interface Location {
  country?: string;
  state?: string;
}
interface SocialMediaHandles {
  Facebook?: string;
  Twitter?: string;
  Linkedin?: string;
}

interface ClientExperience {
  totalYears?: string;       
  jobTitles?: string[];      
  organizationName?: string[];  
}


interface History {
  proposals?: string;
  interviews?: string;
  jobsPosted?: string;
  totalSpent?: string;
  hoursBilled?: string;
  openJobs?: string;
  hires?: string;
  hired?: string;
  memberJoined?: string;
}

