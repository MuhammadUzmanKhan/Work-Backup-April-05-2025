import { TableColumnsType, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { formattedDateAndTime } from "../../services/utils/date";
import { ROLE } from "../types/common";
import moment from "moment";

export const getIndustriesTableHeadings = ({
  handleEditIndustry,
  handleDeleteIndustry
}:
  {
    handleEditIndustry: any,
    handleDeleteIndustry: any
  }) => {

  const userRole = JSON.parse(localStorage.getItem("USER_OBJECT") as string)

  const industryTableColumns: TableColumnsType<any> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: '30rem',
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
      title: "Description",
      dataIndex: "description",
      key: "description",
      sorter: {
        compare: (a, b) => a.description?.localeCompare(b?.description),
        multiple: 2
      },
      render: (value) => (
        <Tooltip title={value} placement="topLeft">
          {value}
        </Tooltip>
      ),
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: '25%',
      sorter: {
        compare: (a, b) => moment(a.createdAt).diff(moment(b.createdAt)),
        multiple: 3,
      },
      render: (value: string) => (
        <Tooltip title={formattedDateAndTime(value)} placement="topLeft">
          {formattedDateAndTime(value)}
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: 'right',
      align: 'center',
      width: 120,
      render: (data) => (
        <div className="flex items-center ">
          <Tooltip title="Edit" placement="top">
            <button onClick={() => handleEditIndustry(data)} style={{ display: 'flex', justifyContent: 'center', width: '70%' }}>
              <EditOutlined />
            </button>
          </Tooltip>
          {(userRole.role === ROLE.COMPANY_ADMIN || userRole.role || ROLE.OWNER) && <Tooltip title="delete" placement="top">
            <button onClick={() => handleDeleteIndustry(data)} style={{ display: 'flex', justifyContent: 'center', width: '70%' }}>
              <DeleteOutlined />
            </button>
          </Tooltip>}
        </div>
      ),
    },
  ];
  return industryTableColumns;
};