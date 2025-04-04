import React, { useState } from "react";
import { Button, Card, Popconfirm } from "antd";
import { CreditCardOutlined } from "@ant-design/icons";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import ReactivateSubscriptionModal from "./reactive-subscription";
import UpdateCardModal from "./update-card-modal";
import BaseCardBilling from "../payments/base-card";
import customNotification from "../notification";
import DeleteWorkspace from "../delete-workspace";
import { apis } from "../../services";
import { convertDateOnlyFormat } from "../../services/utils/convertDate";
import { BillingDetailType } from "../../services/types/payments";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY as string);

const BillingDetail: React.FC<{ billingDetail: BillingDetailType, fetchData: () => void }> = ({ billingDetail, fetchData }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isReactivationModalVisible, setReactivationModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCloseCardModel = (success: boolean = false) => {
    success && fetchData && fetchData()
    setIsModalVisible(false)
  }

  const handleCancelSubscription = async () => {
    setLoading(true);
    const response = await apis.cancelSubscription();
    if (response.data.success) {
      customNotification.success(response.data.message);
    }
    fetchData();
    setLoading(false);
  }

  const handleReactivateSubscription = async () => {
    try {
      setLoading(true);
      const response = await apis.reactiveSubscription();
      if (response.data.success) {
        customNotification.success(response.data.message);
        fetchData();
      } else {
        customNotification.error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      customNotification.error(error.response.data.message || 'An error occurred while reactivating the subscription.');
    } finally {
      setLoading(false);
      setReactivationModalVisible(false);
    }
  }

  return (
    <Elements stripe={stripePromise}>
      <BaseCardBilling title="Billing">
        {
          billingDetail?.plan ?
            <Card className="w-full shadow-lg">
              <div className="mb-5">
                <h3 className="text-lg font-semibold mb-4">Renewal information</h3>
                <div className="flex justify-between items-center p-5 border shadow-md rounded-lg">
                  <div className="flex flex-col justify-center items-center">
                    <p className="text-gray-600">Your plan</p>
                    <p className="font-bold text-base">{billingDetail?.plan}</p>
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <p className="text-gray-600">Billing Status</p>
                    <p className="font-bold text-base">{billingDetail?.isActive ? <span className="text-green-500">Active</span> : <span className="text-red-500">In Active</span>}</p>
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <p className="text-gray-600 mr-2">Paid</p>
                    <p className="font-bold text-base"> {billingDetail?.paidAmount ? `$${billingDetail?.paidAmount}` : '-'} </p>
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <p className="text-gray-600">Billing Cycle</p>
                    <p className="font-bold text-base">{billingDetail?.billingCycle}</p>
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <p className="text-gray-600">Next billing date</p>
                    <p className="font-bold text-base">{billingDetail?.nextBillingDate ? convertDateOnlyFormat(billingDetail?.nextBillingDate) : "-"}</p>
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <p className="text-gray-600 mr-2">Expected Total</p>
                    <p className="font-bold text-base">{billingDetail?.nextExpectedAmount ? `$${billingDetail?.nextExpectedAmount}` : '-'}</p>
                  </div>
                </div>
              </div>
              {!billingDetail?.nextBillingDate && (
                <div className="my-6">
                  <h3 className="text-lg font-semibold mb-2">Manage Subscription</h3>
                  <Button
                    type="primary"
                    className="bg-tertiary text-white"
                    onClick={() => setReactivationModalVisible(true)}
                  >
                    Reactivate Subscription
                  </Button>
                </div>
              )}
              {billingDetail?.cardBrand && <div>
                <h3 className="text-lg font-semibold mb-4">Payment method</h3>
                <div className="flex items-center justify-start border shadow-md rounded-md p-4 mb-4 gap-2">
                  <CreditCardOutlined className="text-3xl text-blue-500" />
                  <div className="flex items-center justify-between gap-4 w-full">
                    <div className="font-bold text-lg">
                      {billingDetail?.cardBrand?.toUpperCase()}  <span className="font-bold"> ....{billingDetail?.cardLast4}</span>
                    </div>
                    <div className="flex justify-center items-center gap-5">
                      <p>Expires {billingDetail?.cardExpMonth}/{billingDetail?.cardExpYear}</p>
                      <Button
                        className="bg-tertiary text-white"
                        onClick={() => setIsModalVisible(true)}
                      >
                        Update Card
                      </Button>
                    </div>
                  </div>
                </div>
              </div>}
              {!billingDetail?.isTrial &&
                <div className="flex justify-between items-center p-5 border-2 border-red-500 border-dashed shadow-md rounded-lg bg-red-50">
                  <div className="flex flex-col justify-center items-start gap-3">
                    <p className="text-gray-600">{billingDetail?.nextBillingDate ? "Cancel Subscription" : <span className="text-red-500 text-3xl">Subscription Cancelled</span>}</p>
                    {!billingDetail?.nextBillingDate ? <>
                      <DeleteWorkspace />
                    </> : <Popconfirm
                      title="Are you sure you want to cancel your subscription?"
                      onConfirm={handleCancelSubscription}
                      okText="Yes"
                      cancelText="No"
                      okButtonProps={{ style: { backgroundColor: 'red', borderColor: 'red', color: 'white' } }}
                    >
                      <Button
                        type="primary"
                        danger
                      >
                        Cancel Subscription
                      </Button>
                    </Popconfirm>}
                  </div>
                </div>}
            </Card> :
            <Card className="w-full shadow-lg text-center">
              <p className="text-gray-500">No billing details available</p>
            </Card>
        }

        {/* Models  */}
        <UpdateCardModal
          isVisible={isModalVisible}
          onClose={handleCloseCardModel}
        />
        <ReactivateSubscriptionModal
          loading={loading}
          visible={isReactivationModalVisible}
          onClose={() => setReactivationModalVisible(false)}
          onReactivate={handleReactivateSubscription}
        />
      </BaseCardBilling>
    </Elements>
  );
};

export default BillingDetail;