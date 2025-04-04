import {
  Modal,
  Button,
  Descriptions,
  Popconfirm,
  message,
  Tooltip,
  Input,
  List,
  Avatar,
  Form,
} from "antd";
import { Contact, BidDetails, Job as IJob } from "../../services/types/bids";
import Job from "./job";
import Bid from "./bid";
import { useState } from "react";
import Account from "./contact";
import { apis, routes } from "../../services";
import { customNotification } from "..";
import { INTEGRATION_OPTIONS, ROLE } from "../../services/types/common";
import { convertDateFormat } from "../../services/utils/convertDate";
import { images } from "../../assets";
import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  SnippetsOutlined,
} from "@ant-design/icons";
import { Comment } from "@ant-design/compatible";
import { useComments } from "../../services/hooks/useComments";

const { TextArea } = Input;

interface EditorProps {
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  submitting: boolean;
  value: string;
}

const CommentList = ({ comments }: { comments: any[] }) => (
  <>
    <List
      dataSource={comments}
      className="overflow-auto h-[20%]"
      itemLayout="horizontal"
      renderItem={(items) => (
        <Comment
          avatar={
            <Avatar
              src={items.avatar || "https://joeschmoe.io/api/v1/random"}
              alt={items.author}
            />
          }
          author={items?.user?.name || items?.author}
          content={items?.commentText || items?.content}
        />
      )}
    />
  </>
);

const Editor = ({ onChange, onSubmit, submitting, value }: EditorProps) => (
  <div>
    <Form.Item style={{ marginBottom: "10px" }}>
      <TextArea rows={4} onChange={onChange} value={value} />
    </Form.Item>
    <Form.Item style={{ marginBottom: 0 }}>
      <Button
        htmlType="submit"
        loading={submitting}
        onClick={onSubmit}
        type="primary"
        style={{ backgroundColor: "blueviolet", marginBottom: 0 }}
      >
        Add Comment
      </Button>
    </Form.Item>
  </div>
);

const BidModal = ({
  title,
  showModal,
  closeModal,
  bidDetails,
  openDrawer,
  fetchData,
}: {
  title: string;
  showModal: boolean;
  closeModal: any;
  openDrawer: any;
  bidDetails: BidDetails;
  fetchData?: () => void;
}) => {
  const [data, setData] = useState<BidDetails>(bidDetails);
  const proposalDate = bidDetails.createdAt || "";
  const [iconClicked, setIconClicked] = useState(false);
  const responseDate = bidDetails.responseDate || "";
  const contractDate = bidDetails.contractDate || "";
  const updatedDate = bidDetails.job?.updatedAt || "";
  const { comments, value, submitting, handleSubmit, handleChange, user } =
    useComments(bidDetails.id as string);

  const updateBidValue = (updates: {
    [key: string]: string | number | boolean;
  }) => {
    setData((prevData) => ({ ...prevData, ...updates }));
  };

  const updateAccountValue = (
    key: keyof Contact,
    value: string | number | boolean
  ) => {
    if (value !== "N/A")
      setData({ ...data, contact: { ...data.contact, [key]: value } });
  };

  const updatejobValue = (
    key: keyof IJob,
    value: string | number | boolean
  ) => {
    setData({ ...data, job: { ...data.job, [key]: value } });
  };
  const userRole = JSON.parse(localStorage.getItem("USER_OBJECT") as string);

  const updateDetails = async () => {
    try {
      const resp = await apis.updateBidDetails(bidDetails.id as string, data);
      customNotification.success(
        "Success!",
        resp?.data?.message ?? "Proposal Updated Successfully."
      );
      fetchData && fetchData();
      closeModal();
    } catch (error: any) {
      if (error.response.statusText === "Unauthorized")
        customNotification.error(
          error?.response?.data?.message ||
          "You are not authorized to update the proposal."
        );
      customNotification.error(
        error?.response?.data?.message || "Proposal Update Failed."
      );
    }
  };

  const handleResyncBid = async () => {
    try {
      if (bidDetails.clickupTaskId) {
        const res = await apis.resyncBid(
          bidDetails.id as string,
          INTEGRATION_OPTIONS.CLICKUP
        );
        if (res.data.resyncedData.status) {
          customNotification.success(
            "Success!",
            res?.data?.resyncedData?.message ||
            "Proposal Successfully Resynced with Clickup."
          );
        } else {
          customNotification.error(
            "Error!",
            res?.data?.resyncedData?.message ||
            "Proposal Resync Failed with Clickup."
          );
        }
      } else if (bidDetails.hubspotDealId) {
        const res = await apis.resyncBid(
          bidDetails.id as string,
          INTEGRATION_OPTIONS.HUBSPOT
        );
        if (res?.data?.resyncedData?.status) {
          customNotification.success(
            "Success!",
            res?.data?.resyncedData?.message ||
            "Proposal Successfully Resynced with Hubspot."
          );
        } else {
          customNotification.error(
            "Error!",
            res?.data?.resyncedData?.message ||
            "Proposal Resync Failed with Hubspot."
          );
        }
      }
    } catch (error: any) {
      customNotification.error("Error!", error?.data?.resyncedData?.message);
    }
  };

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3>{`${title} Details`}</h3>
          <div className="d-flex gap-3 mr-14 mb-14">
            {bidDetails?.status &&
              (bidDetails?.clickupTaskId || bidDetails?.hubspotDealId) && (
                <Popconfirm
                  title="Are you sure you want to resync the proposal?"
                  description="This action isn't reversible and will override any data that is on the integrated CRM. Do you want to proceed?"
                  okText="Confirm"
                  okButtonProps={{
                    style: { backgroundColor: "#1A4895", color: "white" },
                  }}
                  cancelText="Cancel"
                  onConfirm={handleResyncBid}
                >
                  <Button type="primary" className="bg-[#1A4895] text-white">
                    Resync
                    <img src={images.refresh} alt="sync" width={13} />
                  </Button>
                </Popconfirm>
              )}
            <Tooltip title="Copy Link">
              <Button
                type="primary"
                size={"middle"}
                className="bg-[#1A4895] text-white"
                onClick={() => {
                  setIconClicked(true);
                  navigator.clipboard.writeText(
                    `${window.location.origin}${routes.deals}/${data.slug}`
                  );
                  message.success("Link Copied to Clipboard", 0.5);
                  setTimeout(() => setIconClicked(false), 500);
                }}
              >
                Copy Link
                {iconClicked ? <CheckSquareOutlined /> : <SnippetsOutlined />}
              </Button>
            </Tooltip>
            <Tooltip title="Logs">
              <Button
                type="primary"
                className="bg-[#1A4895] text-white"
                onClick={() => openDrawer(bidDetails)}
              >
                <ClockCircleOutlined />
              </Button>
            </Tooltip>
          </div>
        </div>
      }
      open={showModal}
      onCancel={closeModal}
      footer={[
        <>
          <Button key="close" onClick={closeModal}>
            Close
          </Button>
          {(userRole.role === ROLE.COMPANY_ADMIN ||
            userRole.role === ROLE.OWNER) && (
              <Popconfirm
                title="Update the Proposal"
                description="Please note that you are going to update the information so we need a confirmation!"
                okText="Confirm"
                okButtonProps={{
                  style: { backgroundColor: "#1A4895", color: "white" },
                }}
                cancelText="Cancel"
                onConfirm={updateDetails}
              >
                <Button
                  danger
                  key="save"
                  type="primary"
                  style={{ backgroundColor: "#1A4895", marginLeft: "10px" }}
                >
                  Update
                </Button>
              </Popconfirm>
            )}
        </>,
      ]}
      width="80%"
      style={{ top: 20 }}
      styles={{ body: { maxHeight: "80vh", overflowY: "auto" } }}
    >
      <Descriptions
        title="Proposal Information"
        bordered
        layout="vertical"
        size="small"
      >
        <Descriptions.Item
          label={<span style={{ fontWeight: "bold" }}>Dates</span>}
        >
          <div className="date-list">
            {bidDetails.createdAt && (
              <div className="date-item">
                <span className="date-label text-gray-500">
                  Proposal Date:{" "}
                </span>
                {convertDateFormat(proposalDate)}
              </div>
            )}
            {bidDetails.responseDate && (
              <div className="date-item">
                <span className="date-label text-gray-500">Lead Date: </span>
                {convertDateFormat(responseDate)}
              </div>
            )}
            {bidDetails.contractDate && (
              <div className="date-item">
                <span className="date-label text-gray-500">
                  Contract Date:{" "}
                </span>
                {convertDateFormat(contractDate)}
              </div>
            )}
            {bidDetails.job?.updatedAt && (
              <div className="date-item">
                <span className="date-label text-gray-500">Updated Date: </span>
                {convertDateFormat(updatedDate)}
              </div>
            )}
          </div>
        </Descriptions.Item>
      </Descriptions>
      <div style={{ display: "flex", marginTop: "16px" }}>
        <div style={{ flex: 1, paddingRight: "8px" }}>
          <Bid
            updateValue={updateBidValue}
            bidDetails={data}
            role={userRole?.role}
          />
        </div>
        <div style={{ flex: 1, paddingLeft: "8px" }}>
          <Job
            bidDetails={bidDetails}
            updateValue={updatejobValue}
            role={userRole?.role}
          />
          <Account
            updateValue={updateAccountValue}
            bidDetails={data}
            role={userRole?.role}
          />
        </div>
      </div>

      <div className="text-primary font-bold">
        {comments.length}{" "}
        {comments.length > 1
          ? "Comments"
          : comments.length === 1
            ? "Comment"
            : "Comments"}
      </div>
      <hr />
      <Comment
        avatar={
          <Avatar src="https://joeschmoe.io/api/v1/random" alt="Han Solo" />
        }
        content={
          <Editor
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitting={submitting}
            value={value}
          />
        }
        author={user.name}
      />
      <CommentList comments={comments} />
    </Modal>
  );
};

export default BidModal;
