import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { customNotification } from "../../components";
import { Input } from "antd";
import { Header } from "../../components";
import { apis, AUTH_TOKEN, routes, useLoader, USER_OBJECT } from "../../services";
import { authenticateUser } from "../../services/apis-helper";
import { setUser } from "../../services/redux/features/user/user-slice";

const OtpVerification = () => {
    const { idToken } = useParams();
    const { on, off, loading } = useLoader();
    const dispatch = useDispatch();
    const [otp, setOtp] = useState<string>('');
    const navigate = useNavigate();

    const handleChange = async (value: string) => {
        try {
            setOtp(value);
            on();
            const { data: { token, user } } = await apis.verifyOtp({ otp: value, idToken: idToken! });
            localStorage.setItem(USER_OBJECT, JSON.stringify(user));
            localStorage.setItem(AUTH_TOKEN, token);
            dispatch(setUser(user));
            customNotification.success('OTP verified successfully.');
            navigate(routes.dashboard)
        } catch (error: any) {
            if (error?.response?.data?.message) {
                customNotification.error(error?.response?.data?.message);
            } else {
                customNotification.error("Something went wrong. Please try again.");
            }

        } finally {
            off();
        }
    };

    const handleResendPassword = async () => {
        try {
            // Clear OTP fields on error
            setOtp('');
            on();
            await authenticateUser({ idToken: idToken! });
        } catch {
            customNotification.error("Something went wrong. Please try again.");
        } finally {
            off();
        }
    };

    return (
        <div className="content">
            <Header />
            <div className="form-card">
                <h2>Hey, Please verify your otp!</h2>
                <div className="flex items-center justify-center">
                    <Input.OTP
                        length={6}
                        size="large"
                        value={otp} // Controlled input value
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>
                <div className="flex items-end justify-end pt-5">
                    <button onClick={handleResendPassword}>
                        Resend OTP
                    </button>
                </div>
                {loading && (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OtpVerification;
