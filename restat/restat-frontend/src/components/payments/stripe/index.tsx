import React, { useState } from "react";
import { useSelector } from "react-redux";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, AddressElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button, Typography, Checkbox } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { RootState } from "../../../services/redux/store";
import { USER_OBJECT, apis, routes } from "../../../services";
import { customNotification } from "../..";
import { Plan } from "../../../services/types/payments";
import { images } from "../../../assets";
import "./index.css";

const { Title, Text } = Typography;

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY as string);

interface CheckoutFormProps {
  onBack: () => void;
  plan: Plan;
  activeUsers: number
}

const calculateTotalAmount = (plan: Plan, activeUsers: number, extraUsers: number) => {
  if (plan.maxUsers) return plan.basePrice;
  return plan.basePrice + (extraUsers * plan.extraUserPrice!)
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onBack, plan, activeUsers }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  const user = useSelector((state: RootState) => state.user.user);
  const extraUsers = activeUsers - plan.includedUsers!
  const totalAmount = calculateTotalAmount(plan, activeUsers, extraUsers)

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      customNotification.error("Stripe is not loaded yet!");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    const addressElement = elements.getElement(AddressElement);

    if (!cardElement || !addressElement) {
      customNotification.error("Required elements not found!");
      return;
    }

    try {
      setLoading(true);

      // Fetch address details
      const addressDetails = await addressElement.getValue();
      const billingDetails = addressDetails.value;

      if (!billingDetails || !billingDetails.name) {
        customNotification.error("Please provide complete billing details.");
        return;
      }

      // Create payment method with card details
      const { error: paymentError, paymentMethod } = await stripe.createPaymentMethod({
        card: cardElement,
        billing_details: billingDetails,
        type: "card",
      });

      if (paymentError) {
        customNotification.error(paymentError.message || "Error creating payment method");
        return;
      }

      // Create customer
      const customer = await apis.createCustomer({
        name: billingDetails.name,
        email: user.email,
        paymentMethod: paymentMethod.id,
      });

      // Send paymentMethod and billing details to the backend
      const response = await apis.createSubscription({
        customerId: customer.data?.id,
        paymentMethodId: paymentMethod.id,
        planId: plan.id,
      });

      if (response.data?.success) {
        customNotification.success("Subscription created and payment confirmed successfully!");
        setLoading(false);
      }

      if (response.data?.status === "requires_action") {
        const { clientSecret } = response.data;

        const result = await stripe.confirmCardPayment(clientSecret, {
          save_payment_method: true
        });

        if (result.error) {
          customNotification.error(result.error.message || 'Payment Failed! Please contact support.')
        } else {

          customNotification.success("Subscription activated successfully. Thank you for subscribing!", '', 3);
          localStorage.setItem(USER_OBJECT, JSON.stringify({ ...user, company: { ...user.company, subscription: { isActive: true, allowedUsers: plan.maxUsers } } }))   
          setTimeout(() => {
            window.location.href = routes.dashboard;
          }, 3000);
        }
      } else {
        customNotification.error(response.data?.message || "Failed to create subscription");
      }

    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || error?.message || "Error processing payment");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen w-full">
      {/* Left Panel */}
      <div className="flex flex-col w-1/2 bg-white p-8">
        <div className="flex items-center mb-6">
          <Button
            type="text"
            onClick={onBack}
            icon={<ArrowLeftOutlined />}
            className="text-gray-600"
          >
            Back
          </Button>
        </div>
        <div className="flex flex-col justify-center items-center h-full">
          <div className="max-w-md w-full">
            <Title level={2} className="mb-6 text-center">Payment</Title>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Billing Details</label>
                <div className="address-element-container">
                  <AddressElement
                    options={{
                      mode: "billing",
                      fields: { phone: "never" },
                    }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Card Details</label>
                <CardElement
                  options={{
                    hidePostalCode: true,
                    iconStyle: 'solid',
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#424770",
                        "::placeholder": { color: "#aab7c4" },
                      },
                      invalid: { color: "#9e2146" },
                    },
                  }}
                  className="p-3 border rounded-md bg-white"
                  onChange={(event) => {
                    if (event.error) {
                      setCardError(event.error.message);
                    } else {
                      setCardError(null);
                    }
                  }}
                />
                {cardError && (
                  <div className="text-red-500 text-sm mt-2">{cardError}</div>
                )}
              </div>

              <div className="flex gap-4 mb-4">
                <Checkbox
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="text-primary"
                />
                <Text className="text-gray-500 text-sm">
                  By providing your card information, you allow Audienceful to charge your card
                  for future payments in accordance with their terms.
                </Text>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full bg-black hover:bg-gray-800 h-12 text-lg"
                disabled={!isChecked}
              >
                Pay ${totalAmount}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col justify-center items-center w-1/2 bg-white p-8 rounded-lg shadow-2xl space-y-6">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center">
            <img src={images.logo} alt={plan.name} className="" />
          </div>
          <Title level={3} className="text-gray-800">
            Subscribe to <span className="text-tertiary">{plan.name}</span>
          </Title>
          <Text className="text-gray-500">
            {plan.description}
          </Text>
        </div>

        <div className="w-full max-w-lg space-y-6">
          <div className="bg-primary p-6 rounded-lg shadow-inner space-y-4">
            <div className="flex justify-between">
              <Text className="text-gray-600 font-bold">Plan</Text>
              <Text strong className="text-gray-800 font-bold">{plan.name}</Text>
            </div>
            <div className="flex justify-between">
              <Text className="text-gray-600 font-bold">Base Price</Text>
              <Text strong className="text-gray-800 font-semibold">${plan.basePrice}/month</Text>
            </div>
            {plan.maxUsers !== null && (
              <div className="flex justify-between">
                <Text className="text-gray-600 font-bold">Max Users</Text>
                <Text strong className="text-gray-800 font-semibold">{plan.maxUsers}</Text>
              </div>
            )}
            {plan.extraUserPrice !== null && (
              <div className="flex justify-between">
                <Text className="text-gray-600 font-bold">Extra User Price</Text>
                <Text strong className="text-gray-800 font-semibold">${plan.extraUserPrice}/user</Text>
              </div>
            )}
            <div>
              <Text className="text-gray-600 font-bold">Features:</Text>
              <ul className="list-disc pl-6">
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    className={
                      feature.available ? "text-gray-800" : "text-gray-400 italic"
                    }
                  >
                    {feature.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-primary font-semibold px-6 py-4 rounded-lg shadow-md">
            <div className="flex justify-between my-1">
              <Text>Total Active Users</Text>
              <Text strong>{activeUsers}</Text>
            </div>
            {extraUsers && extraUsers > 0 ? <div className="flex justify-between my-1">
              <Text>Extra Users</Text>
              <Text strong> {extraUsers}</Text>
            </div> : null}
          </div>
          <div className="flex justify-between bg-primary font-semibold px-6 py-4 rounded-lg shadow-md">
            <Text strong>Total Due Today</Text>
            <Text strong>${totalAmount}</Text>
          </div>
        </div>
      </div>
    </div>
  );
};

const StripeForm: React.FC<CheckoutFormProps> = ({ onBack, plan, activeUsers }) => (
  <Elements stripe={stripePromise}>
    <CheckoutForm activeUsers={activeUsers} plan={plan} onBack={onBack} />
  </Elements>
);

export default StripeForm;