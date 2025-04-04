import { useRef } from 'react';
import { Button, Card, Popconfirm, Typography } from 'antd';
import { useEffect, useState } from 'react';
import './index.scss'; // Import your SCSS file

interface TimerProps {
  targetDate: string;
  stopWorkspaceDeletion: () => void;
}

const Timer: React.FC<TimerProps> = ({ targetDate, stopWorkspaceDeletion }) => {
  const [remainingTime, setRemainingTime] = useState<{ days: number; hours: number; minutes: number; seconds: number } | string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateRemainingTime = (deletionDate: string) => {
    const currentTime = new Date().getTime();
    const deletionTime = new Date(deletionDate).getTime();
    const timeDifference = deletionTime - currentTime;

    if (timeDifference > 0) {
      const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
      const seconds = Math.floor((timeDifference / 1000) % 60);
      return {
        days,
        hours,
        minutes,
        seconds,
      };
    } else {
      return "Expired";
    }
  };

  useEffect(() => {
    if (targetDate) {
      const remainingTime = calculateRemainingTime(targetDate);
      setRemainingTime(remainingTime);

      intervalRef.current = setInterval(() => {
        setRemainingTime(calculateRemainingTime(targetDate));
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [targetDate]);

  return (
    <Card bordered={false} className='my-2 w-100 flex justify-center items-center min-w-[650px] bg-gray-800'>
      <Card className='border-none p-0 m-0 bg-transparent'>
        <Typography.Title level={3} style={{ color: "white" }}>Time Remaining</Typography.Title>
        <div className='flex items-center'>
          {typeof remainingTime === 'string' ? (
            <Typography.Text style={{ fontSize: "24px", fontWeight: "bold" }}>
              {remainingTime}
            </Typography.Text>
          ) : (
            Object.keys(remainingTime).map((key, index) => (
              <div className="time-segment" key={key}>
                <span className="time-value">
                  {remainingTime[key as keyof typeof remainingTime]} {key}
                </span>
                {index < Object.keys(remainingTime).length - 1 && (
                  <div className="separator" />
                )}
              </div>
            ))
          )}
        </div>
      </Card>
      <div className='w-100 flex justify-end pr-8'>
        <Popconfirm
          title="Confirm!"
          description="This action will stop the Deletion"
          onConfirm={stopWorkspaceDeletion}
          okButtonProps={{ style: { backgroundColor: "#1A4895", color: "white" } }}
        >
          <Button type="primary" danger >
            Stop Deletion
          </Button>
        </Popconfirm>
      </div>
    </Card>
  );
};

export default Timer;
