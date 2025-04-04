import { TableColumnsType, Tag, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ROLE } from "../types/common";
import { convertDateFormat } from "../utils/convertDate";
import ClickupConnection from "../../components/clickup-connection";
import moment from "moment";

export const getUsersTableHeadings = ({
  handleEditUser,
  handleDeleteUser,
}:
  {
    handleEditUser: any,
    handleDeleteUser: any

  }) => {
  const usersTableColumns: TableColumnsType<any> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: '20rem',
      fixed: "left",
      sorter: {
        compare: (a, b) => a.name.localeCompare(b.name),
        multiple: 1
      },
      render: (value, record) => (
        <Tooltip title={value} placement="topLeft">
          {value} {record?.role === ROLE.OWNER && <Tag color="green">Owner</Tag>}
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
      width: 180,
      sorter: {
        compare: (a, b) => a.role.localeCompare(b.role),
        multiple: 3
      },
      render: (value) => (
        <Tooltip title={value === ROLE.OWNER ? "Owner" : value === ROLE.BIDDER ? "Business Developer" : value === ROLE.COMPANY_ADMIN ? "Admin" : ""} placement="topLeft">
          {
            value === ROLE.OWNER ?
              <Tag className="d-flex align-items-center justify-content-center" color="green">Owner</Tag> :
              value === ROLE.BIDDER ?
                <Tag className="d-flex align-items-center justify-content-center" color="blue">Business Developer</Tag> :
                value === ROLE.COMPANY_ADMIN ?
                  <Tag className="d-flex align-items-center justify-content-center" color="magenta">Admin</Tag> :
                  <></>
          }
        </Tooltip>
      ),
    },
    {
      title: "Joining Date",
      dataIndex: "joiningDate",
      key: "joiningDate",
      width: 270,
      sorter: {
        compare: (a, b) => moment(a.joiningDate).diff(moment(b.joiningDate)),
        multiple: 4,
      },
      render: (value) => (
        <Tooltip title={convertDateFormat(value)} placement="topLeft">
          {convertDateFormat(value)}
        </Tooltip>
      ),
    },
    {
      title: "Clickup Connection",
      key: "clickupConnection",
      sorter: {
        compare: (a, b) => {
          if (a.clickupUsername && !b.clickupUsername) {
            return -1;
          }
          if (!a.clickupUsername && b.clickupUsername) {
            return 1;
          }
          return 0;
        },
        multiple: 5,
      },
      render: (value) => <ClickupConnection value={value} />,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: 'right',
      align: 'center',
      width: 120,
      render: (data, record) => (
        <div className="flex items-center justify-center gap-7">
          {
            record?.role !== ROLE.OWNER ?
              <Tooltip title="Edit" placement="top">
                <button onClick={() => handleEditUser(data)} style={{ display: 'flex', justifyContent: 'center' }}>
                  <EditOutlined />
                </button>
              </Tooltip>
              : <Tooltip title="Sorry! You can't edit the owner of the workspace." placement="top">
                <button className="cursor-not-allowed" style={{ display: 'flex', justifyContent: 'center' }}>
                  <EditOutlined style={{ width: "20px", color: "lightgrey" }} />
                </button>
              </Tooltip>

          }

          {record?.role === ROLE.OWNER ?
            <Tooltip title="Sorry! You can't delete the owner of the workspace." placement="top">
              <button className="cursor-not-allowed" style={{ display: 'flex', justifyContent: 'center' }}>
                <DeleteOutlined style={{ width: "20px", color: "lightgrey" }} />
              </button>
            </Tooltip>
            : (
              <Tooltip title="Delete" placement="top">
                <button onClick={() => handleDeleteUser(data)} style={{ display: 'flex', justifyContent: 'center' }}>
                  <DeleteOutlined style={{ width: "20px" }} />
                </button>
              </Tooltip>
            )
          }
        </div>
      ),
    },
  ];
  return usersTableColumns;
};