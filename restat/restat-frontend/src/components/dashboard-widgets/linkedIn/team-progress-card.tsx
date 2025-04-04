import { Card, Col, Row, Statistic, StatisticProps, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import React, { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import { ROLE } from '../../../services/types/common';

const formatter: StatisticProps['formatter'] = (value) => (
  <CountUp end={value as number} separator="," />
);

export const LinkedInTeamProgressCard = React.memo(({ loading, role }: { loading: boolean, role: string }) => {
  const [target, setTarget] = useState<number>(0);
  const [totalConnectsCount, setTotalConnectsCount] = useState<number>(0);

  const connectsCount = useSelector(
    (state: RootState) => state?.linkedinCounts.connectsCount
  );
  const connectCountByBidders = useSelector(
    (state: RootState) => state?.linkedinCounts?.connectsCountByBusinessDeveloper
  ) || [{ target: 0 }];

  const getTarget = () => {
    if (connectCountByBidders.length > 0) {
      const targetArr = connectCountByBidders?.map((b) => b.target);
      setTarget(targetArr.reduce((acc, curr) => acc + curr));
      return
    }
  }
  useEffect(() => {
    setTotalConnectsCount(connectsCount);
    getTarget();
  }, [connectsCount])

  return (
    <div className='w-[60%]'>
      <Card bordered={true} title={(role === ROLE.COMPANY_ADMIN || role === ROLE.OWNER) ? <Tooltip title="Team Progress">Team Progress</Tooltip> : role === ROLE.BIDDER ? <Tooltip title="My Progress">My Progress</Tooltip> : ''} loading={loading}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic title="Total Connections" value={totalConnectsCount} formatter={formatter} />
          </Col>
          <Col span={8}>
            <Statistic title="Target Connections" value={target} formatter={formatter} />
          </Col>
          <Col span={8}>
            <Statistic
              title="Percentage of Target completion"
              value={!target ? 'Unset' : totalConnectsCount / target * 100}
              precision={2}
              suffix={target > 0 ? '%' : ''}
              valueStyle={target ? (totalConnectsCount / target * 100) > 2 ? { color: '#3f8600' } : { color: '#cf1322' } : {color: '#999'}}
            />
          </Col>
        </Row>
      </Card>
    </div>
  )
})
