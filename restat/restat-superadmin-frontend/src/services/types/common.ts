interface ProtectedRouteProps {
    children: JSX.Element;
}

interface Features {
    clickUp: boolean;
    hubSpot: boolean;
    upwork: boolean;
    linkedIn: boolean;
    dashboard: boolean;
    settings: boolean;
    upworkProfiles: boolean;
    team: boolean;
    accounts: boolean;
    deals: boolean;
    portfolios: boolean;
}

// Define the main interface for the payload returned by the server
interface GlobalConfigurationPayload {
    id: string;
    companyId: string | null;
    features: Features;
}

interface INotification {
    maintenanceMode?: boolean;
    id: string;
    title: string;
    notice: string;
    callToAction: string;
    startDate: Date | string;
    endDate: Date | string;
    visibleOnWeb: boolean;
    visibleOnExtension: boolean;
}


export type {
    INotification,
    ProtectedRouteProps,
    GlobalConfigurationPayload
}