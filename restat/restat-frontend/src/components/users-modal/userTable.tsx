import React from "react";
import { Table, Switch } from "antd";
import type { TableProps } from "antd";
import { apis } from "../../services";
import { UserStatus, userStatus } from "../../services/types/common";
import customNotification from "../notification";

interface DataType {
  key: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

const UsersTable = React.memo(
  ({
    data,
    handleSetDataSource,
  }: {
    data: DataType[];
    handleSetDataSource: any;
  }) => {
    // const [dataSource, setDataSource] = useState<DataType[]>(data);
    const handleSwitchChange = async (key: string, checked: boolean) => {
      const newDataSource = data.map((item) => {
        if (item.key === key) {
          return { ...item, isActive: checked };
        }
        return item;
      });
      try {
        const id = key;
        const status = checked ? userStatus.ACTIVE : userStatus.INACTIVE;
        const statusOfUser: UserStatus = { status };
        await apis.updateUserStatus(id, statusOfUser);
        checked ? customNotification.success("User Has been Activated!") : customNotification.warning("User Has Been Inactivated!")
        handleSetDataSource(newDataSource);
      } catch (err) {
        console.error(err);
        customNotification.error("An Error Occurred!");
      }
    };

    const columns: TableProps<DataType>["columns"] = [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (text) => <a>{text}</a>,
        width: 150, // Set the width of the Name column
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        width: 200, // Set the width of the Email column
      },
      {
        title: "Role",
        dataIndex: "role",
        key: "role",
        width: 150, // Set the width of the Role column
      },
      {
        title: "Change Status",
        key: "isActive",
        render: (_, record) => (
          <Switch
            checked={record.isActive}
            onChange={(checked) => handleSwitchChange(record.key, checked)}
          />
        ),
        width: 100, // Set the width of the Activate / Inactivate column
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        scroll={{ y: 700 }} // Set the height after which the table becomes scrollable
      />
    );
  }
);

export default UsersTable;
