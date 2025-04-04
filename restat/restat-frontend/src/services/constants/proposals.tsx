import moment from "moment";
import { BidDetails } from "../types/bids";
import { TableColumnsType, Tag, Tooltip } from "antd";
import { routes } from ".";
import {
  ClockCircleOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import {
  renderTableSpan,
  renderTableStyledSpan,
  renderTableTitle,
} from "./helpers";
import { convertDateFormat } from "../utils/convertDate";

export const getProposalAccountTableHeadings = ({
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
  const proposalTableColumns: TableColumnsType<BidDetails> = [
    {
      title: renderTableTitle("Job Title"),
      dataIndex: ["job", "title"],
      key: "name",
      width: "40rem",
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
          }>{renderTableStyledSpan(value)}
          </div>
        </Tooltip>
      ),
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
      render: (value, record) => (
        <Tooltip title={`Formatted Date: ${convertDateFormat(value)}`}>
          <div>
            {renderTableSpan(convertDateFormat(value))}
            {record?.bidProfile?.deletedAt && (
              <Tooltip title="This profile has been deleted">
                <Tag color="red">Deleted</Tag>
              </Tooltip>
            )}
          </div>
        </Tooltip>
      ),
      width: 200,
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
    },
    {
      title: renderTableTitle("Business Developer"),
      dataIndex: "user",
      key: "bidder",
      sorter: {
        compare: (a, b) => (a.user || "").localeCompare(b.user || ""),
        multiple: 4,
      },
      render: (value, record) => (
        <Tooltip title={value} placement="topLeft">
          <div>
            {renderTableSpan(value)}
            {record?.bidProfile?.deletedAt && <Tag color="red">Deleted</Tag>}
          </div>
        </Tooltip>
      ),
    },
    {
      title: renderTableTitle("Profile"),
      dataIndex: ["bidProfile", "name"],
      key: "profile",
      sorter: {
        compare: (a, b) =>
          (a.bidProfile?.name || "").localeCompare(b.bidProfile?.name || ""),
        multiple: 5,
      },
      render: (value, record) => (
        <Tooltip title={value} placement="topLeft">
          <div>
            {renderTableSpan(value)}
            {record?.bidProfile?.deletedAt && <Tag color="red">Deleted</Tag>}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "URL",
      dataIndex: "upworkProposalURL",
      key: "url",
      ellipsis: {
        showTitle: false,
      },
      width: 200,
      sorter: (a, b) =>
        (a.upworkProposalURL || "").localeCompare(b.upworkProposalURL || ""),
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          {renderTableSpan(
            <a href={value} target="_blank" rel="noreferrer">
              {value}
            </a>
          )}
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      align: "center",
      width: 90,
      render: (data) => (
        <div className="flex items-center">
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
          <Tooltip placement="top" title="View Comments">
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
  return proposalTableColumns;
};
