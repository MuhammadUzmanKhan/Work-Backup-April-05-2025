import { StaticImageData } from "next/image";
import { PropsWithChildren } from "react";

export interface JwtHeader {
    alg: string;
    kid: string;
}

export interface JwtClaims {
    sub: string;
    name: string;
    locale: string;
    email: string;
    ver: number;
    iss: string;
    aud: string;
    iat: number;
    exp: number;
    jti: string;
    amr: string[];
    idp: string;
    preferred_username: string;
    given_name: string;
    family_name: string;
    zoneinfo: string;
    updated_at: number;
    email_verified: boolean;
    auth_time: number;
    groups: string[];
    roles: string;
}

export interface JwtData {
    header?: JwtHeader;
    claims?: JwtClaims;
}

export interface JwtVerificationResponse {
    success: boolean;
    data: JwtData;
}

export interface AdminLogin {
    email: string;
    password: string;
}

export interface Permissions {
    SUPER_ADMIN: boolean;
    MEDS: boolean;
    RESEARCH_TEAMS: boolean;
    RESEARCH_INITIATIVES: boolean;
    EVIDENCE_LITERATURE_LIBRARY: boolean;
    EVIDENCE_GENERATION_FRAMEWORK: boolean;
    EVIDENCE_GENERATION_PRIORITIES: boolean;
}

export interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    isOktaUser: boolean;
    permissions: Permissions;
}

export interface AdminLoginResponse {
    token: string;
    user: UserData;
}

export interface AdminSidebarTabProps {
    selected: number;
    setSelected: (index: number) => void;
    index: number;
    label: string;
}

export enum MedicineSideBarTabs {
    MEDS = 'Meds',
    EVIDENCE_GENERATION_FRAMEWORK = 'Evidence Generation Framework',
    EVIDENCE_GENERATION_PRIORITIES = 'Evidence Generation Priorities',
    RESEARCH_INITIATIVES = 'Research Initiatives',
    RESEARCH_TEAMS = 'Research Teams',
    EVIDENCE_LITERATURE_LIBRARY = 'Evidence Literature Library',
}

export enum AdminSideBarTabs {
    DASHBOARD = "Dashboard",
    USERS_AND_MEMBERS = "Users and Members",
    SETTINGS = "Settings",
}

export enum LayoutTabs {
    EVIDENCE_GENERATION_FRAMEWORK = MedicineSideBarTabs.EVIDENCE_GENERATION_FRAMEWORK,
    RESEARCH_INITIATIVES = MedicineSideBarTabs.RESEARCH_INITIATIVES,
    RESEARCH_TEAMS = MedicineSideBarTabs.RESEARCH_TEAMS,
    LITERATURE_LIBRARY = "Literature Library",
    SUBMISSION_PORTAL = "Submission Portal",
    RWD_PLATFORM = "RWD Platform",
    NEWS = "News"
}

export interface MedicineProps {
    id: string;
    disease: string;
    therapy: string;
    published: boolean;
    additionalConfiguration: {
        [key: string]: string;
    }
}

export interface AdminDashboardLayoutPops extends PropsWithChildren {
    tabs?: string[];
    selectedTab?: number;
}

export interface TabsComponentProps {
    tabs: string[];
    selectedTab: number;
}
export interface LayoutTabProps {
    label?: string;
    image?: string;
}

export const images:Record<string, { [key: string]: StaticImageData }> = {
    search: {
        light: require('@public/search-icon-white.svg'),
        dark: require('@public/search-icon-dark.svg')
    }
};

export interface MedicineCardProps extends Pick<MedicineProps, 'disease' | 'therapy' | 'id'> {
    handleClick: (id: string) => void;
}