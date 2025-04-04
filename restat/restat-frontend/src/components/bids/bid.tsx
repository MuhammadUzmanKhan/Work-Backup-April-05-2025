import React, { useEffect, useState } from "react";
import {
  Dropdown,
  Menu,
  Typography,
  Divider,
  Button,
  Tag,
  Modal,
  DatePicker,
} from "antd";
import { BidDetails, BidStatus } from "../../services/types/bids";
import { apis } from "../../services";
import {
  AccountManagerProfile,
  BusinessManagerProfile,
  ProfileSource,
  ROLE,
} from "../../services/types/common";
import { images } from "../../assets";
import { DownOutlined } from "@ant-design/icons";
import "./bid.scss";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import { setUsers } from "../../services/redux/features/all-company-users/all-company-users.slice";
import { setProfiles } from "../../services/redux/features/company-upwork-profiles/upwork-profiles.slice";
import customNotification from "../notification";
import moment from "moment";

const Bid = React.memo(
  ({
    bidDetails,
    updateValue,
    role,
  }: {
    bidDetails: BidDetails;
    updateValue: (updates: {
      [key: string]: string | number | boolean;
    }) => void;
    role: string;
  }) => {
    const [isModalVisible, setIsModalVisible] = useState<{
      show: boolean;
      name: "Lead" | "Contract" | "";
    }>({ name: "", show: false });
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newStatus, setNewStatus] = useState<string>("");

    const accountManagers: AccountManagerProfile[] =
      useSelector((state: RootState) => state.companyAllUsers.users) ?? [];
    const businessManagers: BusinessManagerProfile[] =
      useSelector((state: RootState) => state.companyUpworkProfiles.profiles) ??
      [];

    const dispatch = useDispatch();

    const handleAccountManagerSelect = (e: any) => {
      const selectedItem = e.item.props;
      updateValue({
        user: e.key,
        bidUserId: selectedItem.id,
      });
    };

    const handleBusinessManagerSelect = (e: any) => {
      const selectedItem = e.item.props;
      updateValue({
        bidProfileBusinessManager: e.key,
        bidProfileId: selectedItem.id,
      });
    };

    const parseCoverLetter = (description: string) => {
      return description.replace(/\n/g, "<br>");
    };

    const handleStatusChange = async (e: any) => {
      const newStatus = e.key;
      try {
        if (newStatus !== bidDetails.status) {
          setNewStatus(newStatus);
          if (newStatus !== BidStatus.PENDING) {
            setIsModalVisible({
              name:
                newStatus === BidStatus.ACTIVE
                  ? "Lead"
                  : newStatus === BidStatus.COMPLETED
                    ? "Contract"
                    : "",
              show: true,
            });
          } else {
            await updateValue({
              status: newStatus,
            });
          }
        }
      } catch (error: any) {
        console.error("Error updating status:", error);
        customNotification.error(
          error?.response?.data?.message ||
          "An Error Occurred in updating status!"
        );
      }
    };

    const fetchBusinessAndAccountManagers = async () => {
      try {
        if (!businessManagers?.length) {
          const { data: upworkProfiles } =
            await apis.getAllCompanyUpworkProfiles(ProfileSource.UPWORK);
          dispatch(setProfiles(upworkProfiles?.profiles));
        }

        if (!accountManagers?.length) {
          const { data: companyUsers } = await apis.getAllCompanyUsers();
          dispatch(setUsers(companyUsers?.users));
        }
      } catch (error: any) {
        console.error(error);
        customNotification.error(
          error?.response?.data?.message || "An Error Occurred!"
        );
      }
    };

    const handleOk = async () => {
      if (selectedDate) {
        try {
          await updateValue({
            status: newStatus,
            ...(isModalVisible.name === "Lead"
              ? { responseDate: moment(selectedDate).format() }
              : isModalVisible.name === "Contract"
                ? { contractDate: moment(selectedDate).format() }
                : {}),
          });
          setIsModalVisible({ name: "", show: false });
        } catch (error: any) {
          console.error("Error updating status and date:", error);
          customNotification.error(
            error?.response?.data?.message ||
            "An Error Occurred in updating status and date!"
          );
        }
      } else {
        customNotification.error("Please select a date before proceeding");
      }
    };

    const handleCancel = () => {
      setIsModalVisible({ name: "", show: false });
    };

    useEffect(() => {
      fetchBusinessAndAccountManagers();
    }, []);

    const statusMenu = (
      <Menu onClick={handleStatusChange}>
        {!bidDetails?.isManual && (
          <Menu.Item key={BidStatus.PENDING}>Proposal</Menu.Item>
        )}
        <Menu.Item key={BidStatus.ACTIVE}>Lead</Menu.Item>
        <Menu.Item key={BidStatus.COMPLETED}>Contract</Menu.Item>
      </Menu>
    );

    const statusClass =
      {
        Active: "status-active",
        Pending: "status-pending",
        Completed: "status-completed",
      }[bidDetails.status || ""] || "";

    const accountManagersMenu = (
      <Menu onClick={handleAccountManagerSelect}>
        {accountManagers?.map((manager) => (
          <Menu.Item key={manager?.name} id={manager?.id}>
            {manager?.name}
          </Menu.Item>
        ))}
      </Menu>
    );

    const businessManagersMenu = (
      <Menu onClick={handleBusinessManagerSelect}>
        {businessManagers?.map((manager) => (
          <Menu.Item key={manager?.name} id={manager?.id}>
            {manager?.name}
          </Menu.Item>
        ))}
      </Menu>
    );
    return (
      <div className="bid-details">
        <div className="header flex justify-between items-center mb-4">
          <Typography.Title level={4} className="m-0">
            Proposal Details
          </Typography.Title>
          <div className="flex items-center">
            <a
              href={bidDetails?.upworkProposalURL}
              target="_blank"
              rel="noopener noreferrer"
              className="ant-btn ant-btn-link d-flex"
            >
              <Typography.Text className="text-gray-500 pr-3">
                View Proposal
              </Typography.Text>
              <img width={20} src={images.pointingArrow2} alt="pointer" />
            </a>
          </div>
        </div>
        <div className="detail-item mb-3 flex-container">
          <Typography.Text strong>Status:</Typography.Text>
          <Dropdown overlay={statusMenu} trigger={["click"]}>
            <button className={`status-button ${statusClass}`}>
              {bidDetails.status === BidStatus.ACTIVE
                ? "Lead"
                : bidDetails.status === BidStatus.PENDING
                  ? "Proposal"
                  : bidDetails.status === BidStatus.COMPLETED
                    ? "Contract"
                    : "Select Status"}
              <DownOutlined />
            </button>
          </Dropdown>
        </div>
        {(bidDetails?.job?.inviteOnly || bidDetails?.invite) && (
          <div className="detail-item mb-3">
            <Typography.Text strong>Invite Type: </Typography.Text>
            {bidDetails?.job?.inviteOnly && (
              <Tag color="magenta">Invite Only</Tag>
            )}
            {bidDetails?.invite && <Tag color="cyan">Invite</Tag>}
          </div>
        )}

        {bidDetails?.bidProfileAgency && (
          <div className="detail-item mb-3">
            <Typography.Text strong>Upwork Agency:</Typography.Text>
            <Typography.Text className="editable-field ml-2">
              {bidDetails?.bidProfileAgency}
            </Typography.Text>
          </div>
        )}

        {bidDetails?.bidProfileFreelancer && (
          <div className="detail-item mb-3">
            <Typography.Text strong>Freelancer:</Typography.Text>
            <Typography.Text className="editable-field ml-2">
              {bidDetails?.bidProfileFreelancer}
            </Typography.Text>
          </div>
        )}

        <div className="detail-item mb-3">
          <Typography.Text strong>Account Manager:</Typography.Text>
          {role === ROLE.COMPANY_ADMIN || role === ROLE.OWNER ? (
            <Dropdown overlay={accountManagersMenu} trigger={["click"]} arrow>
              <Typography.Link
                onClick={(e) => e.preventDefault()}
                className="editable-field ml-2"
              >
                {bidDetails?.user || "Select Account Manager"}{" "}
                {bidDetails?.deletedAt && <Tag color="red">Deleted</Tag>}
              </Typography.Link>
            </Dropdown>
          ) : (
            <text> {bidDetails?.user || "Select Account Manager"}</text>
          )}
        </div>

        <div className="detail-item mb-3">
          <Typography.Text strong>Business Manager:</Typography.Text>
          {role === ROLE.COMPANY_ADMIN || role === ROLE.OWNER ? (
            <Dropdown overlay={businessManagersMenu} trigger={["click"]} arrow>
              <Typography.Link
                onClick={(e) => e.preventDefault()}
                className="editable-field ml-2"
              >
                {bidDetails?.bidProfileBusinessManager ||
                  bidDetails?.bidProfile?.name ||
                  "Select Business Manager"}{" "}
                {bidDetails?.bidProfile?.deletedAt && (
                  <Tag color="red">Deleted</Tag>
                )}
              </Typography.Link>
            </Dropdown>
          ) : (
            <text>
              {" "}
              {bidDetails?.bidProfileBusinessManager ||
                bidDetails?.bidProfile?.name ||
                "Select Business Manager"}
            </text>
          )}
        </div>
        <div className="detail-item mb-3">
          <Typography.Text strong>Connects:</Typography.Text>
          <Typography.Text className="editable-field ml-2">
            {bidDetails?.connects ? bidDetails.connects : "N/A"}
          </Typography.Text>
        </div>
        <div className="detail-item mb-3">
          <Typography.Text strong style={{ paddingRight: "10px" }}>
            Boosted:
          </Typography.Text>
          <input
            type="checkbox"
            checked={bidDetails?.boosted ?? false}
            disabled
            aria-label="Boosted"
            className="small-checkbox"
          />
        </div>
        <div className="detail-item mb-3">
          <Typography.Text strong style={{ paddingRight: "10px" }}>
            IsManual:
          </Typography.Text>
          <input
            type="checkbox"
            checked={bidDetails?.isManual ?? false}
            disabled
            aria-label="Manual"
            className="small-checkbox"
          />
        </div>

        {bidDetails?.clickupTaskId && (
          <div className="detail-item mb-3">
            <Typography.Text strong>ClickUp Task:</Typography.Text>
            <Button
              type="primary"
              className="ml-2 text-black"
              onClick={() =>
                window.open(
                  `https://app.clickup.com/t/${bidDetails?.clickupTaskId}`,
                  "_blank"
                )
              }
            >
              View Task
              <img src={images.clickUp} className="w-5" alt="ClickUp" />
            </Button>
          </div>
        )}

        {bidDetails?.hubspotDealId && (
          <div className="detail-item mb-3">
            <Typography.Text strong>Hubspot Deal:</Typography.Text>
            <Button
              type="primary"
              className="ml-2 text-black"
              onClick={() =>
                window.open(
                  `https://app.hubspot.com/contacts/${bidDetails?.hub_id}/deal/${bidDetails?.hubspotDealId}`,
                  "_blank"
                )
              }
            >
              View Deal
              <img src={images.hubspot} className="w-5" alt="ClickUp" />
            </Button>
          </div>
        )}

        <Divider />

        <Typography.Title level={5}>Your Proposed Terms</Typography.Title>

        <div className="detail-item mb-3">
          <Typography.Text strong>Profile:</Typography.Text>
          <Typography.Text className="editable-field ml-2">
            {bidDetails?.proposedProfile}
          </Typography.Text>
        </div>

        <div className="detail-item mb-3">
          <Typography.Text strong>Rate:</Typography.Text>
          <Typography.Text className="editable-field ml-2">
            {bidDetails?.proposedRate ? bidDetails.proposedRate : "N/A"}
          </Typography.Text>
        </div>

        <div className="detail-item mb-3 flex justify-between items-center">
          <Typography.Text className="text-gray-500">
            The estimated amount you'll receive after service fees
          </Typography.Text>
          <Typography.Text className="editable-field">
            {bidDetails?.receivedAmount}
          </Typography.Text>
        </div>

        <div className="cover-letter-box mt-5 p-4 rounded-lg bg-gray-50">
          <Typography.Title level={5}>Cover Letter</Typography.Title>
          <Typography.Paragraph
            className="text-gray-500"
            style={{
              whiteSpace: "pre-wrap",
              maxHeight: "40rem",
              overflowY: "auto",
            }}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: parseCoverLetter(bidDetails?.coverLetter || ""),
              }}
            />
          </Typography.Paragraph>
        </div>

        <Modal
          title="Select a Date"
          open={isModalVisible.show}
          onOk={handleOk}
          okButtonProps={{
            style: { backgroundColor: "#1A4895", marginLeft: "10px" },
          }}
          onCancel={handleCancel}
        >
          <fieldset className="p-3">
            <legend className="pt-1">{isModalVisible.name} Date</legend>
            <DatePicker
              format="DD/MM/YYYY hh:mm A"
              onChange={(date: any) => setSelectedDate(new Date(date))}
              showTime={{ use12Hours: true }}
              style={{ width: "90%" }}
            />
          </fieldset>
        </Modal>
      </div>
    );
  }
);

export default Bid;
