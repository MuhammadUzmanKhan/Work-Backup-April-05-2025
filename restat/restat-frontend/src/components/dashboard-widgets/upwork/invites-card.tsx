import { Card, Col, Row, Statistic, StatisticProps, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import CountUp from 'react-countup';
import React from 'react';

const formatter: StatisticProps['formatter'] = (value) => (
  <CountUp end={value as number} separator="," />
);

export const InvitesCard = React.memo(({ loading }: { loading: boolean })=> {

  const totalInvitesCount = useSelector(
    (state: RootState) => state?.bidderBids?.invitesCount
  );

  return (
    <div className='w-[32%]'>
      <Card bordered={true} title={<Tooltip title="Invites">Invites</Tooltip>} loading={loading}>
        <Row gutter={16}>
          <Col span={16}>
              <Statistic title="Total Invites" value={totalInvitesCount} formatter={formatter} />
          </Col>
        </Row>
      </Card>
    </div>
  )
})
