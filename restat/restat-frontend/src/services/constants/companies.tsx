import { TableColumnsType, Tooltip } from "antd";
import { EyeOutlined } from "@ant-design/icons";

export const getCompaniesTableHeadings = (
  handleViewDetailsIcon: (slug: string) => void,
): TableColumnsType<any> => {
  return [
    {
      title: "Company Name",
      dataIndex: "name",
      key: "name",
      width: '22%',
      fixed: "left",
      ellipsis: { showTitle: false },
      sorter: {
        compare: (a, b) => a?.name?.localeCompare(b?.name),
        multiple: 1
      },
      render: (name: string) => {
        return (
          <Tooltip title={name} placement="topLeft">
            {name}
          </Tooltip>
        );
      }
    },
    {
      title: "Location",
      key: "location",
      width: '15%',
      ellipsis: { showTitle: false },
      sorter: {
        compare: (a, b) => a?.location?.localeCompare(b?.location),
        multiple: 2
      },
      render: (row: any) => {
        return (
          <Tooltip title={row.location} placement="topLeft">
            {row.location}
          </Tooltip>
        );
      }
    },
    {
      title: "Business Type",
      key: "buisnessType",
      width: '15%',
      ellipsis: { showTitle: false },
      sorter: {
        compare: (a, b) => a?.buisnessType?.localeCompare(b?.buisnessType),
        multiple: 3
      },
      render: (row: any) => {
        return (
          <Tooltip title={row.buisnessType} placement="topLeft">
            {row.buisnessType}
          </Tooltip>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: '10%',
      render: ({ slug }) => (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Tooltip arrow title={'View Details'} >
            <EyeOutlined
              style={{ fontSize: "20px", color: "grey" }}
              onClick={() => handleViewDetailsIcon(slug)}
            />
          </Tooltip>
        </div>
      ),
    }
  ];
};
