import React, { useState } from "react";
import "./index.scss";
import { CreatePortfolioProps } from "../../services/types/common";
import Portfolio from "./portfolio";
import { PORTFOLIO_TYPE } from "../../services/types/portfolio_types";
import UploadFile from "../upload";
import ActionButton from "../button";

const CreatePortfolio = React.memo(
  ({
    title,
    showLinks,
    type,
    bg,
    tooltipText,
    icon
  }:
    CreatePortfolioProps &
    {
      tooltipText?: string,
      icon: string,
      left?: string
    }
  ) => {
    const [showModal, setShowModal] = useState(false);
    const openModal = () => {
      setShowModal(true);
    };

    const closeModal = () => {
      setShowModal(false);
    };

    return (
      <>
        <ActionButton
          text={title}
          tooltip={tooltipText}
          onClick={() => setShowModal(true)}
        />


        {
          type !== PORTFOLIO_TYPE.IMPORT ?
            <Portfolio
              showLinks={showLinks}
              type={type}
              title={title}
              showModal={showModal}
              closeModal={closeModal}
              openModal={openModal}
            /> :
            <UploadFile
              type={type}
              title={title}
              showModal={showModal}
              closeModal={closeModal}
              openModal={openModal}
            />
        }
      </>
    );
  }
);

export default CreatePortfolio;
