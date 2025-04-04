export interface EmailInterface {
  body: {
    name: string;
    email?: string;
    message?: string;
    company: string;
    get_updates?: boolean;
  };
}

export interface IncidentAlertInterface {
  body: {
    emails: string[];
    data: IncidentAlertDataInterface;
  };
}

export interface IncidentAlertDataInterface {
  id: number;
  date: string;
  time: string;
  companyName: any;
  eventName: any;
  city: any;
  incidentType: string;
  priority: string;
  status: number;
  divisionNames: string;
  zoneLocation: string;
  locatorCode: string;
  latitude: any;
  longitude: any;
  description: string;
}

export interface TwilioWebhookDataInterface {
  To: string;
  From: string;
  Body: string;
}

export interface AttachmentJSON {
  content: string;
  filename: string;
  type?: string;
  disposition?: string;
  content_id?: string;
}
