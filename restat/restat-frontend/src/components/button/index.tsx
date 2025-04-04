import { PlusOutlined } from "@ant-design/icons"
import { Button, Tooltip } from "antd"

const ActionButton = (
  {
    text,
    onClick,
    icon,
    tooltip,
    disable,
  }: {
    text: string,
    onClick?: () => void,
    icon?: React.ReactNode
    tooltip?: string,
    disable?: boolean
  }
) => {
  return (
    <Tooltip title={tooltip}>
      <Button
        className={`bg-tertiary text-white rounded-none h-[2rem] text-[0.875rem] ${disable ? 'cursor-not-allowed pointer-events-none opacity-60' : 'cursor-pointer'}`}
        onClick={onClick}
        icon={icon ? icon : <PlusOutlined />}
      >
        {text}
      </Button>
    </Tooltip>
  )
}

export default ActionButton