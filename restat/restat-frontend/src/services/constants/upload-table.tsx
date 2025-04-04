import { TableColumnsType, Tag, Tooltip, Typography } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";


const validateRequiredFields = (record: any) => {
  const errors: { [key: string]: boolean } = {};

  if (!record.name) errors.name = true;
  if (!record.description) errors.description = true;
  if (!record.type) errors.type = true;

  if (!record.urls?.length) errors.linkd = true;

  return errors;
};

export const getUploadTable = (currentPage: number, pageSize: number): TableColumnsType<any> => {
  return [
    {
      title: "Index",
      dataIndex: "index",
      key: "index",
      align: "center",
      render: (_: any, __: any, index: number) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "name",
      dataIndex: "name",
      key: "name",
      align: "center",
      sorter: (a, b) => a?.name?.localeCompare(b.name),
      render: (value: string, record) => {
        const errors = validateRequiredFields(record);
        return (
          <Tooltip title={value || (errors.name ? "Name is required" : "")}>
            <p
              style={{
                margin: 0,
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                color: errors.name ? "red" : "inherit",
              }}
            >
              {errors.name ? <Tooltip title="name is required">
                <Tag color="red">
                  <ExclamationCircleOutlined />
                </Tag>
              </Tooltip> : value}
            </p>
          </Tooltip>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      align: "center",
      sorter: (a, b) => a?.description?.localeCompare(b.description),
      render: (value: string, record) => {
        const errors = validateRequiredFields(record);
        return (
          <Tooltip title={value || (errors.description ? "Description is required" : "")}>
            <p
              style={{
                margin: 0,
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                color: errors.description ? "red" : "inherit",
              }}
            >
              {errors.description ? <Tooltip title="Description is required">
                <Tag color="red">
                  <ExclamationCircleOutlined />
                </Tag>
              </Tooltip> : value}
            </p>
          </Tooltip>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      align: "center",
      render: (value: string, record) => {
        const errors = validateRequiredFields(record);
        return (
          <Tooltip title={value || (errors.type ? "Type is required" : "")}>
            <Tag
              color={errors.type ? "red" : value === "CASE_STUDY" ? "green" : value === "PROJECT" ? "blue" : "purple"}
            >
              {errors.type ? <ExclamationCircleOutlined /> : value}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "links",
      dataIndex: "links",
      key: "links",
      align: "center",
      render: (value, record) => {
        const errors = validateRequiredFields(record);

        return (
          <>
            {value?.length !== 0 ? value.map((link: any, index: number) => (
              <div key={index}>
                <Tag color="pink">{link?.title}</Tag>
                <Typography.Link
                  href={link?.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: errors.links ? "red" : "inherit" }}
                >
                  {errors.links ? <ExclamationCircleOutlined /> : link?.url}
                </Typography.Link>
              </div>
            )
            ) : (
              <Tooltip title={errors.links ? "At least one URL is required" : "Optional"}>
                <Tag color="red">
                  <ExclamationCircleOutlined />
                </Tag>
              </Tooltip>
            )}
          </>
        );
      },
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      align: "center",
      render: (tags: any[]) => (
        <>
          {tags?.length > 0
            ? tags.map((tag: string, index: number) => {
              const color = tag.length > 5 ? 'geekblue' : 'green';
              return (
                <Tag key={index} color={color} style={{ marginBottom: '4px' }}>
                  {tag.toUpperCase()}
                </Tag>
              );
            })
            : <Tag color="yellow">No tags</Tag>}
        </>
      ),
    },
  ];
};
