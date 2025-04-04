import { TableColumnsType, Tooltip } from "antd";
import { convertDateFormat } from "../../helpers";

export interface Workspace {
    name: string;
    teamCount: number;
    ownerName: string;
    ownerEmail: string;
    lastActivityDate: string;
    subscription: {
        nextBillingDate: string;
        isActive: boolean;
        billingCycle: string;
        plan: {
            name: string;
        };
    };
}

export const getWorkspaceColumns: TableColumnsType<Workspace> = [
    {
        title: "Workspace Name",
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
        render: (name) => (
            <Tooltip title={name}>
                <span>{name || "--"}</span>
            </Tooltip>
        ),
    },
    {
        title: "Owner Name",
        dataIndex: "ownerName",
        key: "ownerName",
        sorter: (a, b) => (a.ownerName || "").localeCompare(b.ownerName || ""),
        render: (ownerName) => (
            <Tooltip title={ownerName}>
                <span>{ownerName || "--"}</span>
            </Tooltip>
        ),
    },
    {
        title: "Owner Email",
        dataIndex: "ownerEmail",
        key: "ownerEmail",
        sorter: (a, b) => (a.ownerEmail || "").localeCompare(b.ownerEmail || ""),
        render: (ownerEmail) => (
            <Tooltip title={ownerEmail}>
                <span>{ownerEmail || "--"}</span>
            </Tooltip>
        ),
    },
    {
        title: "Team Members",
        dataIndex: "teamCount",
        key: "teamCount",
        align: "center",
        sorter: (a, b) => Number(a.teamCount) - Number(b.teamCount),
        render: (teamCount) => <span>{teamCount || "--"}</span>,
    },
    {
        title: "Current Plan",
        dataIndex: ["subscription", "plan", "name"],
        key: "currentPlan",
        align: "center",
        sorter: (a, b) =>
            (a.subscription?.plan?.name || "").localeCompare(
                b.subscription?.plan?.name || ""
            ),
        render: (_, record) => {
            const currentPlan = record.subscription?.plan?.name;
            return (
                <Tooltip title={currentPlan || "--"}>
                    <span>{currentPlan || "--"}</span>
                </Tooltip>
            );
        },
    },
    {
        title: "Billing Date",
        dataIndex: "subscription",
        key: "nextBillingDate",
        sorter: (a, b) => {
            const dateA = a.subscription?.nextBillingDate ? new Date(a.subscription.nextBillingDate).getTime() : Number.NEGATIVE_INFINITY;
            const dateB = b.subscription?.nextBillingDate ? new Date(b.subscription.nextBillingDate).getTime() : Number.NEGATIVE_INFINITY;
            return dateA - dateB;
        },
        render: (_, record) => {
            const nextBillingDate = record.subscription?.nextBillingDate;
            return (
                <Tooltip title={nextBillingDate || "--"}>
                    <span>
                        {nextBillingDate ? convertDateFormat(nextBillingDate) : "--"}
                    </span>
                </Tooltip>
            );
        },
    },
    {
        title: "Last Activity Date",
        dataIndex: "lastActivityDate",
        key: "lastActivityDate",
        sorter: (a, b) => {
            const dateA = a.lastActivityDate ? new Date(a.lastActivityDate).getTime() : Number.NEGATIVE_INFINITY;
            const dateB = b.lastActivityDate ? new Date(b.lastActivityDate).getTime() : Number.NEGATIVE_INFINITY;
            return dateA - dateB;
        },
        render: (lastActivityDate) => (
            <Tooltip title={lastActivityDate || "--"}>
                <span>
                    {lastActivityDate ? convertDateFormat(lastActivityDate) : "--"}
                </span>
            </Tooltip>
        ),
    },

];
