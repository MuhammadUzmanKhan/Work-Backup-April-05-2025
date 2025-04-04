import { Dropdown, Button, MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";
import "./index.scss";

const RoleDropdown = ({
  options,
  onChange,
  value,
}: {
  options: { label: string, image: string }[];
  onChange: (option: any) => void;
  value: { label: string, image: string };
}) => {

  const handleMenuClick: MenuProps['onClick'] = (option) => {
    onChange(options.find(op => op.label === option.key));
  };

  const items: MenuProps['items'] = options.map(option => ({
    key: option.label,
    label: (
      <span style={{ display: 'flex', }}>
        <img src={option.image} alt={option.label} width={20} style={{ marginRight: 8 }} />
        {option.label}
      </span>
    ),
  }));

  const menuProps = {
    items,
    onClick: handleMenuClick,
  }

  return (
    <Dropdown menu={menuProps}>
      <Button style={{ minWidth: '250px', justifyContent: 'space-between' }} >
        <div style={{ display: 'flex' }}>
          <img src={value.image} alt={value.label} width={20} style={{ marginRight: 8 }} />
          {value.label}
        </div>
        <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default RoleDropdown;
