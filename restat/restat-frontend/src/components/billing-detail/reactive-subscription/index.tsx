import { Modal, Button } from "antd";
import React from "react";

interface ReactivateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onReactivate: () => void;
  loading: boolean;
}

const ReactivateSubscriptionModal: React.FC<ReactivateSubscriptionModalProps> = ({
  visible,
  onClose,
  onReactivate,
  loading,
}) => {
  return (
    <Modal
      title="Reactivate Subscription"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          className="bg-tertiary text-white"
          key="reactivate"
          onClick={onReactivate}
          loading={loading}
        >
          Reactivate
        </Button>,
      ]}
    >
      <p>
        Are you sure you want to reactivate your subscription? This will resume billing based on your current plan.
      </p>
    </Modal>
  );
};

export default ReactivateSubscriptionModal;
