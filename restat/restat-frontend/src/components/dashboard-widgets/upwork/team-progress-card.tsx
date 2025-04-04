import { Card, Col, Row, Space, Statistic, Tooltip, Typography } from 'antd';
import { useSelector } from 'react-redux';
import React, { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import { RootState } from '../../../services/redux/store';
import { ROLE } from '../../../services/types/common';

export const TeamProgressCard = React.memo(({ loading, role }: { loading: boolean, role: string }) => {
  const [target, setTarget] = useState<number>(0);
  const [totalProposalsCount, setTotalProposalsCount] = useState<number>(0);
  const [responseTime, setResponseTime] = useState<string>('')

  const bidsCount = useSelector(
    (state: RootState) => state?.bidderBids?.bidsCount
  );
  const bidsCountByBidders = useSelector(
    (state: RootState) => state?.bidderBids?.bidsCountByBidders
  ) || [{ target: 0 }];

  const { Text } = Typography

  const getData = () => {
    if (bidsCountByBidders.length) {
      // Sum targets
      const targetArr = bidsCountByBidders.map((b) => b.target);
      setTarget(targetArr.reduce((acc, curr) => acc + curr, 0));

      // Process response times
      const responseArr = bidsCountByBidders
        .map((b) => b.responseTime)
        .filter(Boolean);

      if (responseArr.length) {
        let totalSeconds = 0;

        responseArr.forEach((time) => {
          const regex = /(?:(\d+)\s*days?\s*)?(\d+):(\d+):(\d+)(?:\.\d+)?/; // Match days, hours, minutes, seconds
          const match = time?.match(regex);

          if (match) {
            const [, days = 0, hours, minutes, seconds] = match.map((val) =>
              val ? parseInt(val, 10) : 0
            );
            totalSeconds +=
              days * 24 * 3600 + hours * 3600 + minutes * 60 + seconds;
          }
        });

        const avgSeconds = totalSeconds / responseArr.length;

        // Convert average seconds back to days, hours, minutes, and seconds
        const avgDays = Math.floor(avgSeconds / (24 * 3600));
        const remainingSecondsAfterDays = avgSeconds % (24 * 3600);
        const avgHours = Math.floor(remainingSecondsAfterDays / 3600);
        const remainingSecondsAfterHours = remainingSecondsAfterDays % 3600;
        const avgMinutes = Math.floor(remainingSecondsAfterHours / 60);
        const avgRemainingSeconds = Math.floor(remainingSecondsAfterHours % 60);

        // Construct formatted average response time
        const formattedAverage = [
          avgDays > 0 ? `${avgDays} day${avgDays > 1 ? 's' : ''}` : null,
          avgHours > 0 ? `${avgHours}h` : null,
          avgMinutes > 0 ? `${avgMinutes}m` : null,
          avgRemainingSeconds > 0 ? `${avgRemainingSeconds}s` : null,
        ]
          .filter(Boolean)
          .join(' ');

        setResponseTime(formattedAverage || 'N/A');
      } else {
        setResponseTime('N/A');
      }

    } else {
      setTarget(0)
      setResponseTime('N/A');
    }
  };

  useEffect(() => {
    setTotalProposalsCount(bidsCount);
    getData();
  }, [bidsCount, bidsCountByBidders])

  return (
    <div className='w-[50%]'>
      <Card bordered={true} title={(role === ROLE.COMPANY_ADMIN || role === ROLE.OWNER) ? <Tooltip title="Team Progress">Team Progress</Tooltip> : role === ROLE.BIDDER ? <Tooltip title="My Progress">My Progress</Tooltip> : ''} loading={loading}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Proposals"
              value={
                !target
                  ? `${totalProposalsCount || 0}`
                  : `${totalProposalsCount || 0}/${target || 0}`
              }
              formatter={(value: any) => {
                if (value.includes('/')) {
                  const [bidsCount, targetValue] = value.split('/').map(Number);
                  return (
                    <Space size="small" style={{ fontWeight: 500, color: '#595959' }}>
                      <Tooltip title="Proposals">
                        <Text strong style={{ fontSize: '22px' }}>
                          <CountUp end={bidsCount} separator="," />
                        </Text>
                      </Tooltip>
                      <Text style={{ color: '#8c8c8c' }}>/</Text>
                      <Tooltip title="Target">
                        <Text strong style={{ fontSize: '16px' }}>
                          <CountUp end={targetValue} separator="," />
                        </Text>
                      </Tooltip>
                    </Space>
                  );
                }
                return (
                  <Tooltip title="Proposals">
                    <Text strong style={{ fontSize: '22px', fontWeight: 500 }}>
                      <CountUp end={Number(value)} separator="," />
                    </Text>
                  </Tooltip>
                );
              }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Response Time"
              value={responseTime}
              formatter={(value: any) => (
                <Tooltip title="Average Response Time">
                  <Text strong style={{ fontSize: '18px', fontWeight: 500, color: value === 'N/A' ? '#999' : '#595959' }}>
                    {value === 'N/A' ? 'N/A' : value}
                  </Text>
                </Tooltip>
              )}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Percentage of Target completion"
              value={target < 1 ? 'Unset' : totalProposalsCount / target * 100}
              precision={2}
              suffix={target > 0 ? '%' : ''}
              valueStyle={target ? (totalProposalsCount / target * 100) > 2 ? { color: '#3f8600' } : { color: '#cf1322' } : { color: '#999' }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  )
})
