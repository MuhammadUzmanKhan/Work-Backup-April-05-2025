import React, { useEffect, useState } from "react";
import { Card, Button, Typography, Row, Col, Badge, Tag, Tooltip, Popconfirm } from "antd";
import { CheckOutlined, CloseOutlined, ClockCircleOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { USER_OBJECT, apis, routes, useLoader } from "../../services";
import { images } from "../../assets";
import { BillingDetailType, Plan } from "../../services/types/payments";
import customNotification from "../notification";
import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
const { Title, Text, Paragraph } = Typography;

type PaymentPlansProps = {
  billingDetails: BillingDetailType;
  onPlanChange: (plan: Plan) => void;
};

const PaymentPlans: React.FC<PaymentPlansProps> = ({ onPlanChange, billingDetails }) => {
  const { loading, on, off } = useLoader(true)
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payNowLoading, setPayNowLoading] = useState<boolean>(false)

  const user = useSelector((state: RootState) => state.user.user);

  const hasTrialPlan = plans.some((plan) => plan.isTrial);
  const activeUsers = billingDetails.activeUsers || 0
  const currentPlan = billingDetails.plan || ''
  const isActive = billingDetails.isActive

  const handlePayNow = async (plan: Plan) => {
    try {
      setPayNowLoading(true)
      const resp = await apis.manualPayForPlan()
      if (resp.data?.success) {
        customNotification.success(resp.data?.message, '', 3);
        localStorage.setItem(USER_OBJECT, JSON.stringify({ ...user, company: { ...user.company, subscription: { isActive: true, allowedUsers: plan.maxUsers } } }))
        setTimeout(() => {
          window.location.href = routes.dashboard;
        }, 3000);
      } else customNotification.error(resp.data?.message)

    } catch (error: any) {
      console.error(error)
      customNotification.error(error?.response?.data?.message || error?.message)
    } finally { setPayNowLoading(false) }
  }

  const handlePlanChange = (plan: Plan) => {
    onPlanChange(plan);
  };

  const isPlanAvailable = (plan: Plan) => {
    if (plan.maxUsers === null) return true;
    return activeUsers <= plan.maxUsers;
  };

  const getAllPlans = async () => {
    try {
      on()
      const resp = await apis.getPaymentPlans();
      setPlans(resp?.data?.sort((a: Plan, b: Plan) => a.index - b.index));
    } catch (error) {
      console.error(error);
    } finally { off() }
  };

  useEffect(() => {
    getAllPlans();
  }, []);

  const renderActionButton = (plan: Plan) => {
    if (plan.name === currentPlan && isActive) {
      return (
        <Button
          type="text"
          icon={<CheckOutlined />}
          disabled
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
          }}
        >
          Active
        </Button>
      );
    } else if (plan.name === currentPlan && !isActive) {
      return (
        <Popconfirm
          title="Confirm Payment"
          description="Proceeding will charge the remaining balance."
          okText="Proceed"
          okButtonProps={{ style: { backgroundColor: "#1A4895", color: "white" } }}
          cancelText="Cancel"
          onConfirm={() => handlePayNow(plan)}
        >
          <Button
            type="text"
            icon={<ArrowRightOutlined />}
            style={{
              position: "absolute",
              right: 16,
              bottom: 16,
              backgroundColor: "#007BFF",
              borderColor: "#007BFF",
              color: "#fff",
            }}
            loading={payNowLoading}
          >
             Make Payment
          </Button>
        </Popconfirm>
      );
    }

    const isDowngrade = plans.find((p) => p.name === currentPlan)?.maxUsers! > (plan.maxUsers || Infinity);

    return (
      <Tooltip placement="top" title={!isPlanAvailable(plan) ? `You currently have ${activeUsers} active users. This plan doesn't suit your needs.` : null}>
        <Button
          type="primary"
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            backgroundColor: !isPlanAvailable(plan)
              ? "#d9d9d9" // Disabled background color
              : isDowngrade
              ? "#F57C00"
              : "#007BFF",
            borderColor: !isPlanAvailable(plan)
              ? "#d9d9d9" // Disabled border color
              : isDowngrade
              ? "#F57C00"
              : "#007BFF",
            color: !isPlanAvailable(plan) ? "#8c8c8c" : "#fff", // Disabled text color
            cursor: !isPlanAvailable(plan) ? "not-allowed" : "pointer", // Change cursor when disabled
          }}
          onClick={() => handlePlanChange(plan)}
          disabled={!isPlanAvailable(plan)}
        >
          {plan.isTrial ? 'Start Trial' : (isDowngrade ? "Downgrade" : "Upgrade")}
        </Button>
      </Tooltip>
    );
  };

  const renderFeatureList = (features: { name: string; available: boolean }[]) => {
    return (
      <ul style={{ padding: 0, listStyle: "none", margin: "16px 0" }}>
        {features.map((feature, index) => (
          <li key={index} style={{ marginBottom: 8, display: "flex", alignItems: "center" }}>
            {feature.available ? (
              <CheckOutlined style={{ color: "#4CAF50", marginRight: 8 }} />
            ) : (
              <CloseOutlined style={{ color: "#F44336", marginRight: 8 }} />
            )}
            <Text style={{ textAlign: "left" }}>{feature.name}</Text>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ justifySelf: "center" }}>
          <img width={200} src={images.logo} alt="Logo" />
        </div>
        <Paragraph style={{ color: "#7F8C8D", fontSize: "16px", maxWidth: "800px", margin: "0 auto" }}>
          <b style={{ color: "#2C3E50", }}>Choose Your Plan:</b> Restat offers flexible plans tailored to businesses of all sizes, empowering you to track, measure, and analyze KPIs effortlessly. Upgrade anytime as your team expands or your needs evolve.
        </Paragraph>
      </div>
      <Row gutter={[24, 24]} justify="center" className="px-8">
        {plans.map((plan) => (
          <Col xs={24} sm={12} md={12} lg={6} key={plan.id}>
            {plan.name === currentPlan &&
              <Badge.Ribbon
                text={isActive ? "Active" : 'Expired'}
                color={isActive ? "green" : 'red'}
                style={{ zIndex: 2 }}
              />
            }
            <Card
              loading={loading}
              title={<Title style={{ paddingTop: '20px' }} level={4}>{plan.name}</Title>}
              bordered={false}
              style={{
                background: !isPlanAvailable(plan)
                  ? "#F0F0F0" // Disabled background color
                  : hasTrialPlan && !plan.isTrial
                  ? "#F7F7F7" // Trial-specific background
                  : "#fff",
                boxShadow: !isPlanAvailable(plan)
                  ? "none" // No shadow for disabled
                  : hasTrialPlan && !plan.isTrial
                  ? "none"
                  : "0 4px 10px rgba(0, 0, 0, 0.1)",
                borderRadius: "12px",
                textAlign: "center",
                padding: "0px 10px",
                minHeight: "40rem",
                opacity: !isPlanAvailable(plan) ? 0.6 : 1, // Dim opacity for disabled
                cursor: !isPlanAvailable(plan) ? "not-allowed" : "default", // Show not-allowed cursor for disabled
              }}
            >
              <Title
                level={5}
                style={{
                  color: "#2C3E50",
                  marginBottom: 16,
                }}
              >
                ${plan.basePrice}/month
              </Title>
              {plan.extraUserPrice && (
                <Tag color="volcano" style={{ marginBottom: 16 }}>
                  Extra User: ${plan.extraUserPrice}/month
                </Tag>
              )}
              <Text style={{ display: "block", marginBottom: 16, color: "#7F8C8D" }}>
                {plan.description}
              </Text>
              {plan.isTrial && (
                <Text
                  style={{
                    display: "block",
                    marginBottom: 16,
                    color: "#3498DB",
                    fontWeight: "bold",
                  }}
                >
                  <ClockCircleOutlined /> {plan.trialDuration} Trial
                </Text>
              )}
              <div>{renderFeatureList(plan.features)}</div>
              {!hasTrialPlan || plan.isTrial ? renderActionButton(plan) : null}
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default PaymentPlans;
