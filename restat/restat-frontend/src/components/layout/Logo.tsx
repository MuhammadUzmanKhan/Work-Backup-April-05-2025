import React from "react";
import { Tooltip } from "antd";

const Logo = React.memo((
  {
    imgSrc,
    onClick,
    tooltip,
    active = false,
    customIcon
  }: {
    imgSrc?: string;
    onClick?: () => void;
    tooltip?: string;
    dashBoardLogo?: boolean;
    active?: boolean;
    antd?: boolean;
    antdComponent?: any;
    customIcon?: JSX.Element
  }) => {

  return (
    <Tooltip title={tooltip} placement="right">
      <button
        onClick={onClick && onClick}
        className={`sidebar-icon my-2 w-full h-[2.3rem] ${active ? "bg-[#5865F2]" : "bg-transparent"} flex items-center justify-center`}
      >
        {customIcon ? (
          <div className="inline-block" >
            {customIcon}
          </div>
        ) : (
          <img
            src={imgSrc}
            alt="Icons"
            className='inline-block object-contain'
          />
        )}
      </button>
    </Tooltip>
  );
});

export default Logo;
