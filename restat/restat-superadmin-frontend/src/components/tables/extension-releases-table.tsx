import { Switch, Tag } from "antd";

const extensionRelasesTable = (
    {
        toggleActive,
    }: {
        toggleActive: (id: string, isActive: boolean) => void
    }
) => [
        {
            title: "#",
            dataIndex: "index",
            key: "index",
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: "Message",
            dataIndex: "message",
            key: "message",
            render: (value: string) => (
                <p>{value}</p>
            ),
        },
        {
            title: "Version",
            dataIndex: "version",
            key: "version",
        },
        {
            title: "Release Type",
            key: "forced",
            render: (_: any, record: any) => (
                <Tag color={record.forced ? "red" : "green"}>
                    {record.forced ? "Force Update" : "Optional Update"}
                </Tag>
            ),
        },
        {
            title: 'Is Active',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean, item: any) => (
                <Switch
                    checked={isActive}
                    onChange={(checked: boolean) => toggleActive(item.id, checked)}
                />
            ),
        }
    ]

export default extensionRelasesTable;
