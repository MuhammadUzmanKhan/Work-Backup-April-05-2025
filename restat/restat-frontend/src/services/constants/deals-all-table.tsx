import { images } from "../../assets";
import { TableColumnsType, Tag, Tooltip } from "antd";
import {
  ClockCircleOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { BidDetails } from "../types/bids";
import { renderStatusWithDot, renderTableSpan, renderTableStyledSpan, renderTableTitle } from "./helpers";
import { convertDateFormat } from "../utils/convertDate";
import { routes } from "..";

export const getDealsAllTabTableHeadings = ({
  handleProposalsViewIcon,
  handleViewLeadLogsIcon,
  handleViewCommentsLogsIcon,
  navigation,
}: {
  handleProposalsViewIcon: (data: BidDetails) => void;
  handleViewLeadLogsIcon?: (data: BidDetails) => void;
  handleViewCommentsLogsIcon?: (data: BidDetails) => void;
  navigation: (path: string) => void;
}) => {
  const DealsAllTabTableColumn: TableColumnsType<BidDetails> = [
    {
      title: renderTableTitle("Job Title"),
      dataIndex: ["job", "title"],
      key: "name",
      width: "20rem",
      fixed: "left",
      sorter: {
        compare: (a, b) =>
          (a.job?.title || "").localeCompare(b.job?.title || ""),
        multiple: 1,
      },
      render: (value, data) => (
        <Tooltip title={value} placement="topLeft">
          <div className="cursor-pointer" onClick={
            () => {
              handleProposalsViewIcon(data);
              const queryParams = window.location.search;
              if (window.location.href.includes(routes.deals)) {
                navigation(`${routes.deals}/${data.slug}${queryParams}`);
              }
            }
          }
          >{renderTableStyledSpan(value)}
          </div>
        </Tooltip>
      ),
    },
    {
      title: renderTableTitle("Status"),
      dataIndex: ["status"],
      key: "status",
      width: "9rem",
      sorter: {
        compare: (a, b) =>
          (a.status || "").localeCompare(b.status || ""),
        multiple: 2,
      },
      render: renderStatusWithDot
    },
    {
      title: renderTableTitle("Proposal Date"),
      dataIndex: "createdAt",
      key: "proposalDate",
      ellipsis: {
        showTitle: false,
      },
      sorter: {
        compare: (a, b) => moment(a.createdAt).diff(moment(b.createdAt)),
        multiple: 2,
      },
      render: (value) => (
        <Tooltip title={value ? convertDateFormat(value) : null}>
          <div style={{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
            {renderTableSpan(value ? convertDateFormat(value) : null)}
          </div>
        </Tooltip>
      ),
      width: "12rem",
    },
    {
      title: "Lead Date",
      dataIndex: "responseDate",
      key: "responseDate",
      ellipsis: {
        showTitle: false,
      },
      sorter: {
        compare: (a, b) => moment(a?.responseDate).diff(moment(b?.responseDate)),
        multiple: 2,
      },
      render: (value) => (
        <Tooltip title={value ? convertDateFormat(value) : null}>
          {renderTableSpan(value ? convertDateFormat(value) : null)}
        </Tooltip>
      ),
      width: 140,
    },
    {
      title: "Contract Date",
      key: "date",
      dataIndex: "contractDate",
      ellipsis: {
        showTitle: false,
      },
      sorter: {
        compare: (a, b) => moment(a?.contractDate).diff(moment(b?.contractDate)),
        multiple: 2,
      },
      render: (value) => (
        <Tooltip title={value ? convertDateFormat(value) : null}>
          {renderTableSpan(value ? convertDateFormat(value) : null)}
        </Tooltip>
      ),
      width: 120,
    },
    {
      title: renderTableTitle("Client Budget"),
      dataIndex: ["job", "hourlyRange"],
      key: "clientBudget",
      sorter: {
        compare: (a, b) => {
          const getMinValue = (range: string) => {
            const match = range.match(/[\$]?([\d.,]+)/);
            return match ? parseFloat(match[1].replace(",", "")) : 0;
          };

          const aValue = a.job?.hourlyRange
            ? getMinValue(a.job.hourlyRange)
            : 0;
          const bValue = b.job?.hourlyRange
            ? getMinValue(b.job.hourlyRange)
            : 0;

          return aValue - bValue;
        },
        multiple: 3,
      },
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          {renderTableSpan(value)}
        </Tooltip>
      ),
      width: 140,
    },
    {
      title: "Proposed Rate",
      dataIndex: "proposedRate",
      key: "proposedRate",
      sorter: {
        compare: (a, b) => {
          const getRate = (rate: string) => {
            if (!rate) return 0;
            const match = rate.match(/[\$]?([\d.,]+)/);
            return match ? parseFloat(match[1].replace(",", "")) : 0;
          };

          return getRate(a.proposedRate) - getRate(b.proposedRate);
        },
        multiple: 3,
      },
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          {renderTableSpan(value)}
        </Tooltip>
      ),
    },
    {
      title: "Received Rate",
      dataIndex: "receivedAmount",
      key: "receivedAmount",
      sorter: {
        compare: (a, b) => {
          const getRate = (rate: string) => {
            if (!rate) return 0;
            const match = rate.match(/[\$]?([\d.,]+)/);
            return match ? parseFloat(match[1].replace(",", "")) : 0;
          };

          return (
            getRate(a?.receivedAmount ?? "") - getRate(b?.receivedAmount ?? "")
          );
        },
        multiple: 3,
      },
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          {renderTableSpan(value)}
        </Tooltip>
      ),
    },
    {
      title: "Invite",
      dataIndex: "invite",
      key: "invite",
      width: 100,
      sorter: {
        compare: (a, b) => Number(b.invite) - Number(a.invite),
        multiple: 4,
      },
      render: (value) => (
        <Tooltip title={value ? "Yes" : "No"}>
          {value ? (
            <img width={22} src={images.tickox} alt="" />
          ) : (
            renderTableSpan("")
          )}
        </Tooltip>
      ),
    },
    {
      title: "Business Developer",
      dataIndex: "user",
      key: "bidder",
      sorter: {
        compare: (a, b) => (a.user || "").localeCompare(b.user || ""),
        multiple: 5,
      },
      render: (value, record) => (
        <Tooltip
          title={
            <>
              {value}
              {record.deletedAt && <Tag color="red">Deleted</Tag>}
            </>
          }
          placement="topLeft"
        >
          <span>
            {renderTableSpan(value)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Profile",
      dataIndex: ["bidProfile", "name"],
      key: "profile",
      sorter: {
        compare: (a, b) =>
          (a.bidProfile?.name || "").localeCompare(b.bidProfile?.name || ""),
        multiple: 6,
      },
      width: 110,
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          {renderTableSpan(value)}
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      align: "center",
      width: 85,
      render: (data) => (
        <div className="flex items-left">
          <Tooltip placement="top" title="View Logs">
            <button
              onClick={() =>
                handleViewLeadLogsIcon && handleViewLeadLogsIcon(data)
              }
              style={{
                display: "flex",
                justifyContent: "center",
                width: "70%",
              }}
            >
              <ClockCircleOutlined className="text-black text-[20px]" />
            </button>
          </Tooltip>
          <Tooltip placement="top" title="Comments">
            <button
              onClick={() =>
                handleViewCommentsLogsIcon && handleViewCommentsLogsIcon(data)
              }
              style={{
                display: "flex",
                justifyContent: "center",
                width: "70%",
              }}
            >
              <CommentOutlined className="text-black text-[20px]" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];
  return DealsAllTabTableColumn;
};
