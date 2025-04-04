import React, { useState } from "react";
import { Modal, Button, Typography } from "antd";
import { CardElement, useStripe, useElements, AddressElement } from "@stripe/react-stripe-js";
import { customNotification } from "../..";
import { apis } from "../../../services";
import { useSelector } from "react-redux";
import { RootState } from "../../../services/redux/store";
// import { apis } from "../../../services";

const { Title, Text } = Typography;

interface UpdateCardModalProps {
  isVisible: boolean;
  onClose: (success?: boolean) => void;
}

const UpdateCardModal: React.FC<UpdateCardModalProps> = ({ isVisible, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const user = useSelector((state: RootState) => state.user.user);

  const handleUpdateCard = async () => {
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

      // Update payment method
      const resp = await apis.updatePaymentMethod({
        customerId: customer.data.id,
        paymentMethodId: paymentMethod.id,
      });

      if (resp.data?.success) customNotification.success(resp.data?.message || 'Updated Successfully.');
      onClose(true);
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || error.message || "Error processing request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isVisible}
      onCancel={() => onClose(false)}
      footer={null}
      title={<Title level={4}>Update Card Details</Title>}
      className="update-card-modal"
    >
      <div className="flex flex-col space-y-6">
        <Text className="text-gray-400">
          Enter your new card details below. This card will be used for future payments.
        </Text>

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
          <CardElement
            options={{
              hidePostalCode: true,
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

        <Button
          type="primary"
          onClick={handleUpdateCard}
          loading={loading}
          className="bg-black hover:bg-gray-800 h-12 text-lg"
        >
          Update Card
        </Button>
      </div>
    </Modal>
  );
};

export default UpdateCardModal;
