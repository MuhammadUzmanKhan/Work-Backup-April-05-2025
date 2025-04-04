import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apis, useLoader } from "../../services"
import './accept-invite.scss';
import Loader from "../../components/loader";
import { customNotification } from "../../components";

const AcceptInvite = () => {
  const { id } = useParams();
  const { on, off, loading } = useLoader();
  const navigate = useNavigate();
  const hasEffectRun = useRef(false);

  const acceptInvite = async () => {
    try {
      on();
      const res = await apis.acceptInvite(id!);
      customNotification.success(res.data.message);
      navigate('/sign-in');
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message);
    } finally {
      off();
    }
  };

  useEffect(() => {
    if (!hasEffectRun.current) {
      hasEffectRun.current = true;
      acceptInvite();
    }
  }, [id]);

  return (
    <div className="center">
      {loading ? <Loader /> : null}
    </div>
  );
};

export default AcceptInvite;
