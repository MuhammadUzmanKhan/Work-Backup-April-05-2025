import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Row } from "antd";
import { BillingDetailType, Plan } from "../../services/types/payments";
import { BillingDetail, Invoices, Layout, PaymentPlans, StripeForm } from "../../components";
import { setHeaderData } from "../../services/redux/features/page-header/page-header.slice";
import { apis } from "../../services";
const Payments: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingDetail, setBillingDetail] = useState<BillingDetailType>({
    subscriptionId: "",
    billingCycle: "",
    nextBillingDate: "",
    paidAmount: "",
    nextExpectedAmount: "",
    isActive: false,
    plan: "",
    basePrice: 0,
    cardBrand: "",
    cardLast4: "",
    cardExpMonth: "",
    cardExpYear: "",
    activeUsers: 0,
    isTrial: false
  });

  const dispatch = useDispatch()
  
  const handlePlanChange = (plan: Plan) => {
    setSelectedPlan(plan)
  };
  const fetchBillingDetails = async () => {
    const { data } = await apis.getBillingDetails();
    setBillingDetail({
      subscriptionId: data?.subscription?.id,
      billingCycle: data?.subscription?.billingCycle,
      nextBillingDate: data?.subscription?.nextBillingDate,
      nextExpectedAmount: data?.subscription?.nextExpectedAmount,
      paidAmount: data?.subscription?.paidAmount,
      isActive: data?.subscription?.isActive,
      plan: data?.subscription?.plan?.name,
      basePrice: data?.subscription?.plan?.basePrice,
      isTrial: data?.subscription?.plan?.isTrial,
      cardBrand: data?.subscription?.details?.cardBrand,
      cardLast4: data?.subscription?.details?.cardLast4,
      cardExpMonth: data?.subscription?.details?.cardExpMonth,
      cardExpYear: data?.subscription?.details?.cardExpYear,
      activeUsers: data?.activeUsers,
    });
  };

  useEffect(() => {
    dispatch(setHeaderData({
      title: "Billing",
    }));
    fetchBillingDetails();
  }, []);

  return (
    selectedPlan ? <StripeForm plan={selectedPlan} activeUsers={billingDetail.activeUsers} onBack={() => setSelectedPlan(null)} /> :
      <Layout>
        <div className="min-h-screen bg-primary px-5 pb-5">
          <PaymentPlans
            billingDetails={billingDetail}
            onPlanChange={handlePlanChange}
          />
          <Row justify="center" className="px-8">
            <BillingDetail fetchData={fetchBillingDetails} billingDetail={billingDetail} />
          </Row>
          <Row justify="center" className="px-8">
            <Invoices />
          </Row>
        </div>
      </Layout>
  );
};

export default Payments;
