import { TableColumnsType, Tag, Tooltip } from "antd";
import { DeleteOutlined, MailOutlined } from "@ant-design/icons";
import { convertDateFormat } from "../utils/convertDate";
import { ROLE } from "../types/common";
import moment from "moment";
;

export const getPendingInvitesColumns = ({
  resendEmail,
  deleteInvite
}:
  {
    resendEmail: any,
    deleteInvite: any
  }) => {
  const industryTableColumns: TableColumnsType<any> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      sorter: {
        compare: (a, b) => a.name.localeCompare(b.name),
        multiple: 1
      },
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          {value}
        </Tooltip>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: {
        compare: (a, b) => a.email.localeCompare(b.email),
        multiple: 2
      },
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          {value}
        </Tooltip>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      sorter: {
        compare: (a, b) => a.role.localeCompare(b.role),
        multiple: 1
      },
      render: (value) => (
        <Tooltip title={value === ROLE.OWNER ? "Owner" : value === ROLE.BIDDER ? "Business Developer" : value === ROLE.COMPANY_ADMIN ? "Admin" : ""} placement="topLeft">
          {value === ROLE.BIDDER &&
            <Tag className="d-flex align-items-center justify-content-center" color="blue">Business Developer</Tag>
          }
          {value === ROLE.COMPANY_ADMIN &&
            <Tag className="d-flex align-items-center justify-content-center" color="magenta">Admin</Tag>
          }
          {
            value === ROLE.OWNER &&
            <Tag className="d-flex align-items-center justify-content-center" color="green">Owner</Tag>
          }
        </Tooltip>
      ),
    },
    {
      title: "Invitaion Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: {
        compare: (a, b) => moment(a.createdAt).diff(moment(b.createdAt)),
        multiple: 4,
      },
      render: (value) => (
        <Tooltip title={convertDateFormat(value)} placement="topLeft">
          <p style={{ fontSize: "13px" }}>{convertDateFormat(value)}</p>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (data) => (
        <div className="flex items-center gap-3 ml-2">
          <Tooltip title='Resend Invitation'>
            <MailOutlined onClick={() => resendEmail(data)} className="text-blue-500 cursor-pointer text-2xl" />
          </Tooltip>
          <Tooltip title='Delete Invitation'>
            <DeleteOutlined onClick={() => deleteInvite(data)} className="text-red-500 cursor-pointer text-2xl" />
          </Tooltip>
        </div>
      ),
    }
  ];
  return industryTableColumns;
};