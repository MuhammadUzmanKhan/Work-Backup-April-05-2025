import { images } from "../../assets";
import { BidDetails } from "../types/bids";
import { TableColumnsType, Tag, Tooltip } from "antd";
import { convertDateFormat } from "../utils/convertDate";
import { routes } from ".";
import {
  ClockCircleOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { renderTableSpan, renderTableStyledSpan } from "./helpers";

export const getLeadsTableHeadings = ({
  handleLeadsViewIcon,
  handleViewLeadLogsIcon,
  handleViewCommentsLogsIcon,
  navigation,
}: {
  handleLeadsViewIcon: (data: BidDetails) => void;
  handleViewLeadLogsIcon?: (data: BidDetails) => void;
  handleViewCommentsLogsIcon?: (data: BidDetails) => void;
  navigation: (path: string) => void;
}) => {
  const leadsTableColumns: TableColumnsType<BidDetails> = [
    {
      title: "Job Title",
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
              handleLeadsViewIcon(data);
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
      title: "Lead Date",
      dataIndex: "responseDate",
      key: "responseDate",
      ellipsis: {
        showTitle: false,
      },
      sorter: {
        compare: (a, b) => moment(a.responseDate).diff(moment(b.responseDate)),
        multiple: 2,
      },
      render: (value) => (
        <Tooltip title={convertDateFormat(value)}>
          {renderTableSpan(convertDateFormat(value))}
        </Tooltip>
      ),
      width: 200,
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
              {record?.deletedAt && <Tag color="red">Deleted</Tag>}
            </>
          }
          placement="topLeft"
        >
          <span>
            {renderTableSpan(value)}
            {record?.deletedAt && (
              <Tag color="red" style={{ marginLeft: "5px" }}>
                Deleted
              </Tag>
            )}
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
      render: (value, record) => (
        <Tooltip
          title={
            <>
              {value}
              {record?.bidProfile?.deletedAt && <Tag color="red">Deleted</Tag>}
            </>
          }
          placement="topLeft"
        >
          <span>
            {renderTableSpan(value)}
            {record?.bidProfile?.deletedAt && (
              <Tag color="red" style={{ marginLeft: "5px" }}>
                Deleted
              </Tag>
            )}
          </span>
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
  return leadsTableColumns;
};
