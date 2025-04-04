import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import Layout from "../../components/layout";
import { setHeaderData } from "../../services/redux/features/page-header/page-header.slice";

const ContactUs: React.FC = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setHeaderData({
      title: "Contact Us",
    }));
  }, []);
  return (
    <Layout>
      <iframe
        title="Contact us here"
        className="clickup-embed clickup-dynamic-height"
        src="https://forms.clickup.com/3316051/f/356ak-73198/C4NQHJD02M6VX0Y90D"
        width="100%"
        height="100%"
        style={{
          background: "transparent",
          border: "1px solid #ccc",
          height: "100%",
          overflowY: "auto",
        }}
      ></iframe>
      <script async src="https://app-cdn.clickup.com/assets/js/forms-embed/v1.js"></script>
    </Layout>
  );
};

export default ContactUs;
