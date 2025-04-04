import { TableColumnsType, Tooltip } from "antd";
import { convertDateFormat } from "../utils/convertDate";
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import moment from "moment";

export const getPortfolioTableHeadings = ({
  handlePortfolioViewIcon,
  handlePortfolioDeleteIcon,

}: {
  handlePortfolioViewIcon: (data: any) => void;
  handlePortfolioDeleteIcon: (data: any) => void;
}): TableColumnsType<any> => {
  return [
    {
      title: "Title",
      dataIndex: "name",
      key: "name",
      width: '40rem',
      fixed: "left",
      sorter: {
        compare: (a, b) => a.name.localeCompare(b.name),
        multiple: 1
      },
      render: (value: string) => (
        <Tooltip title={value} placement="topLeft">
          {value}
        </Tooltip>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: '15%',
      ellipsis: {
        showTitle: false,
      },
      sorter: {
        compare: (a, b) => a.type.localeCompare(b.type),
        multiple: 2
      },
      render: (value: string) => (
        <Tooltip title={value} placement="topLeft">
          {value}
        </Tooltip>
      ),
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      width: '25%',
      sorter: {
        compare: (a, b) => (a.tags.length - b.tags.length),
        multiple: 3
      },
      render: (tags: any[]) => (
        <div className="mt-3 tags-container text-gray-500">
          {tags.slice(0, 4).map((tag: any, index: number) => (
            <div className="portfolioTagsTag" key={index}>
              <span>{tag?.name}</span>
            </div>
          ))}
          {tags.length > 4 && (
            <div className="restOfTags">
              <span>+ {tags.length - 4}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Updated Date",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: '20%',
      sorter: {
        compare: (a, b) => moment(a.updatedAt).diff(moment(b.updatedAt)),
        multiple: 4
      },
      render: (value: string) => (
        <Tooltip title={convertDateFormat(value)} placement="topLeft">
          {convertDateFormat(value)}
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: 'right',
      align:'center',
      width: 120,
      render: (record: any) => (
        <div className="flex items-center">
          <button onClick={() => handlePortfolioViewIcon(record)} style={{ display: 'flex', justifyContent: 'center', width: '70%' }}>
            <EditOutlined />
          </button>
          <button onClick={() => handlePortfolioDeleteIcon(record)} style={{ display: 'flex', justifyContent: 'center', width: '70%' }}>
            <DeleteOutlined />
          </button>
        </div>
      ),
    },
  ];
};
