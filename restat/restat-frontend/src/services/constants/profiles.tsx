import { TableColumnsType, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { CONTACT_SOURCE, ROLE } from "../../services/types/common";
import { formattedDateAndTime } from "../../services/utils/date";
import { images } from "../../assets";
import moment from "moment";
import ClickupConnection from "../../components/clickup-connection";

export const getProfileTableHeadings = ({
  handleProfileViewIcon,
  handleProfileDeleteIcon
}: {
  handleProfileViewIcon: (data: any) => void;
  handleProfileDeleteIcon: (data: any) => void;
}): TableColumnsType<any> => {

  const userRole = JSON.parse(localStorage.getItem("USER_OBJECT") as string)

  return [
    {
      title: "Name",
      dataIndex: "profileName",
      key: "profileName",
      width: '25rem',
      fixed: "left",
      sorter: {
        compare: (a, b) => a.profileName.localeCompare(b.profileName),
        multiple: 1
      },
      render: (value: string) => (
        <Tooltip title={value} placement="topLeft">
          {value}
        </Tooltip>
      ),
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "profileURL",
      width: '28%',
      ellipsis: {
        showTitle: false,
      },
      sorter: {
        compare: (a, b) => a.url.localeCompare(b.url),
        multiple: 2,
      },
      render: (value: string) => (
        <Tooltip title={value} placement="topLeft">
          {value}
        </Tooltip>
      ),
    },
    {
      title: "Created Date",
      dataIndex: "createdDate",
      key: "createdDate",
      width: '20%',
      sorter: {
        compare: (a, b) => moment(a.createdDate).diff(moment(b.createdDate)),
        multiple: 3,
      },
      render: (value: string) => (
        <Tooltip title={formattedDateAndTime(value)} placement="topLeft">
          {formattedDateAndTime(value)}
        </Tooltip>
      ),
    },
    {
      title: "Clickup Connection",
      key: "clickupUsername",
      width: '25%',
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
        multiple: 4,
      },
      render: (value: string) => <ClickupConnection value={value} />,
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: '8%',
      sorter: {
        compare: (a, b) => a.source.localeCompare(b.source),
        multiple: 5
      },
      render: (value: string) => (
        <Tooltip title={value} placement="topLeft">
          <img width={25} src={value === CONTACT_SOURCE.UPWORK ? images.upwork : value === CONTACT_SOURCE.LINKEDIN ? images.linkedin : null} />
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: 'right',
      align: 'center',
      width: 120,
      render: (record: any) => (
        <div className="flex items-center">
          <button
            onClick={() => handleProfileViewIcon(record)}
            style={{ display: 'flex', justifyContent: 'center', width: '70%' }}
          >
            <EditOutlined />
          </button>
          {(userRole.role === ROLE.COMPANY_ADMIN || userRole.role === ROLE.OWNER) && <button
            onClick={() => handleProfileDeleteIcon(record)}
            style={{ display: 'flex', justifyContent: 'center', width: '70%' }}
          >
            <DeleteOutlined />
          </button>}
        </div>
      ),
    },
  ];
};
