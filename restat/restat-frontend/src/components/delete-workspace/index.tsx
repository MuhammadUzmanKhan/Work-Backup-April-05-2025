import { useEffect, useState } from "react";
import { Button, Input, Modal, Space } from "antd";
import Timer from "./timer";
import { apis } from "../../services";
import customNotification from "../notification";
import { convertDateFormat } from "../../services/utils/convertDate";

const DeleteWorkspace: React.FC = () => {
  const [accountDeletionDate, setAccountDeletionDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch account deletion info
  const fetchDeletionAccount = async () => {
    setLoading(true);
    try {
      const response = await apis.getWorkspaceDeletionInfo();
      setAccountDeletionDate(response?.data?.deletedWorkspace?.deletionDate || null);
    } catch (error: any) {
      console.error("Failed to fetch deletion info:", error);
    } finally {
      setLoading(false);
    }
  };

  // Stop workspace deletion
  const stopWorkspaceDeletion = async () => {
    setLoading(true);
    try {
      await apis.stopWorkspaceDeletion();
      setAccountDeletionDate(null);
      customNotification.success("Deletion stopped successfully");
    } catch (error: any) {
      customNotification.error(error.response?.data?.message || "Failed to stop deletion");
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const deleteAccount = async () => {
    if (!otp) {
      customNotification.error("Please enter the OTP");
      return;
    }
    setLoading(true);
    try {
      const response = await apis.deleteWorkspace(otp);
      setAccountDeletionDate(response?.data?.deletedWorkspace?.deletionDate || null);
      customNotification.success("Account deletion scheduled successfully");
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || "Failed to delete account");
      console.error("Error deleting account:", error);
    } finally {
      setLoading(false);
      setModalVisible(false);
      setOtpModalVisible(false);
      setOtp("");
    }
  };

  // Send OTP
  const sendOtp = async () => {
    setLoading(true);
    try {
      await apis.workpsaceDeletionOtp();
      setOtpModalVisible(true);
      customNotification.success("OTP sent successfully");
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || "Failed to send OTP");
      console.error("Error sending OTP:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accountDeletionDate) {
      fetchDeletionAccount();
    }
  }, [accountDeletionDate]);

  return (
    <div>
      <p className="text-lg text-red-500 pb-5">
        {`By proceeding, you agree that all data will be permanently deleted after ${accountDeletionDate ? "the below timer" : "30 days"
          } and cannot be recovered.`}
      </p>

      {!accountDeletionDate && (
        <Button type="primary" danger onClick={() => setModalVisible(true)}>
          Delete Account
        </Button>
      )}

      {accountDeletionDate && (
        <>
          <Timer targetDate={accountDeletionDate} stopWorkspaceDeletion={stopWorkspaceDeletion} />
          <div>
            <span>Account Deletion Date:</span>
            <h3>{convertDateFormat(accountDeletionDate)}</h3>
          </div>
        </>
      )}

      <Modal
        title="Delete Workspace"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>,
          otpModalVisible ? (
            <Button
              key="verify"
              type="primary"
              style={{ background: "#1A4895", color: "#fff" }}
              onClick={deleteAccount}
              disabled={loading || !otp}
              loading={loading}
            >
              Verify OTP
            </Button>
          ) : (
            <Button
              key="delete"
              type="primary"
              danger
              onClick={sendOtp}
              disabled={loading}
              loading={loading}
            >
              Delete Workspace
            </Button>
          ),
        ]}
      >
        {otpModalVisible ? (
          <div className="flex justify-center items-center flex-col py-10">
            <h2>OTP Verification</h2>
            <Space className="otp-verification__input">
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    deleteAccount();
                  }
                }}
                size="large"
                placeholder="Enter OTP"
              />
            </Space>
          </div>
        ) : (
          <p>
            All data associated with the account will be permanently deleted. The account cannot be recovered after
            deletion. Any associated workspaces or data will also be deleted.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default DeleteWorkspace;
