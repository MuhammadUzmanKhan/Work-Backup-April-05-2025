import React from "react";
import './index.scss'
import { Tooltip } from "antd";
import { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";

const Logo = React.memo((
  { ImgSrc, onClick, tooltip, active = false }:
    { ImgSrc: React.ForwardRefExoticComponent<Omit<AntdIconProps, "ref"> & React.RefAttributes<HTMLSpanElement>>; onClick?: () => void, tooltip?: string; active?: boolean }) => {

  const gradientStyle = active ? {
    background: `linear-gradient(to right, #ffb2a8, #cde1ff, #ffedaf)`,
  } : {};

  const originalStyle = !active ? {
    background: "#E5EEF5",
  } : {};


  return (
    <Tooltip title={tooltip}>
      <button
        onClick={onClick && onClick}
        className={`my-3 w-[3rem] h-[3rem] text-2xl flex overflow-hidden items-center justify-center ${active ? "rounded-lg" : "rounded-full"}`}
        style={{ ...gradientStyle, ...originalStyle }}
      >
        <ImgSrc />
      </button>
    </Tooltip>
  );
});

export default Logo;
