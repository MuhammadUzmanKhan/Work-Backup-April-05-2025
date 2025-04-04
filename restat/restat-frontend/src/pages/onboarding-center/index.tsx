import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Steps, Button, Progress } from "antd";
import { FastForwardOutlined } from "@ant-design/icons";

import { setHeaderData } from "../../services/redux/features/page-header/page-header.slice";
import { ActionButton, customNotification, Layout } from "../../components";
import { IOnboardingStepType } from "../../services/types/onboarding-steps";
import { apis, USER_OBJECT } from "../../services";
import { RootState } from "../../services/redux/store";
import { ROLE } from "../../services/types/common";
import { setUser } from "../../services/redux/features/user/user-slice";
import stepsDescription from "./steps.constant";

const { Step } = Steps;

const OnBoardingCenter = () => {
  const dispatch = useDispatch();
  const { user: { user } } = useSelector((state: RootState) => state);
  const [completedSteps, setCompletedSteps] = useState<IOnboardingStepType[]>([]);
  const [filteredSteps, setFilteredSteps] = useState(stepsDescription);

  const skipSteps = [IOnboardingStepType.addYourTeam, IOnboardingStepType.expandYourReach];

  useEffect(() => {
    if (user.role === ROLE.BIDDER) {
      setFilteredSteps(stepsDescription.filter((step) => !skipSteps.includes(step.key)));
    }
  }, [user.role]);

  const progress = Math.round((completedSteps.length / filteredSteps.length) * 100);

  const handleMarkComplete = async (stepKey: IOnboardingStepType, link: string | undefined) => {
    window.open(link, '_blank');
    if (!completedSteps.includes(stepKey)) {
      try {
        const response = await apis.updateOnboardingStep({ key: stepKey });
        if (response.status === 200) {
          setCompletedSteps([...completedSteps, stepKey]);
          fetchOnboardingData();
        }
      } catch (error: any) {
        customNotification.error(error.response.data.message || "Failed to mark step as complete");
      }
    }
  };

  const fetchOnboardingData = async () => {
    try {
      const { data } = await apis.getOnboardingSteps();
      const completed = Object.keys(IOnboardingStepType)
        .filter((key) => data[key])
        .map((key) => key as IOnboardingStepType);
      setCompletedSteps(completed);
    } catch (error) {
      console.error("Failed to fetch onboarding data", error);
    }
  };

  const onBoardingCompleted = async () => {
    try {
      await apis.onBoardingCompleted(true);
      localStorage.setItem(
        USER_OBJECT,
        JSON.stringify({ ...user, onBoardingCompleted: true })
      );
      dispatch(setUser({ ...user, onBoardingCompleted: true }));
      customNotification.success("Onboarding marked as complete successfully");
    } catch (error: any) {
      customNotification.error("Failed to mark onboarding as complete");
    }
  };

  useEffect(() => {
    if (progress >= 100) {
      onBoardingCompleted();
      dispatch(setUser({ ...user, onBoardingCompleted: true }));
    }

  }, [completedSteps]);

  useEffect(() => {
    fetchOnboardingData();
  }, []);

  useEffect(() => {
    dispatch(
      setHeaderData({
        title: "Onboarding Center",
        progress: <Progress percent={progress} status={progress === 100 ? "success" : "active"} />,
        actionButtons: progress >= 50 ? [
          <ActionButton
            text="Skip Onboarding"
            tooltip="Skip Onboarding"
            onClick={onBoardingCompleted}
            icon={<FastForwardOutlined />}
          />
        ] : null
      })
    );
  }, [dispatch, progress]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Steps direction="vertical" className="space-y-8">
          {filteredSteps.map((step) => {
            const isCompleted = completedSteps.includes(step.key);
            return (
              <Step
                key={step.key}
                className="relative"
                status={isCompleted ? "finish" : "wait"}
                title={
                  <div
                    className={`transition-transform duration-200 origin-left inline-block ${isCompleted ? "scale-105" : "scale-100"
                      }`}
                  >
                    <h3 className="font-semibold text-lg leading-snug">{step.title}</h3>
                  </div>
                }
                description={
                  <div
                    className={`transition-transform duration-200 origin-left inline-block ${isCompleted ? "scale-105" : "scale-100"
                      }`}
                  >
                    <p className="text-base text-gray-600 leading-relaxed">{step.description}</p>
                    <div className="flex gap-4 items-center mt-3">
                      <Button
                        type="link"
                        className="p-0 text-blue-500 hover:underline"
                        onClick={() => handleMarkComplete(step.key, step.link)}
                      >
                        Go to Step
                      </Button>
                    </div>
                  </div>
                }
              />
            );
          })}
        </Steps>
      </div>
    </Layout>
  );
};

export default OnBoardingCenter;
