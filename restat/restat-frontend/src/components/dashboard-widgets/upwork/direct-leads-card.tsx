import { Card, Col, Row, Statistic, StatisticProps, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import CountUp from 'react-countup';
import React from 'react';

const formatter: StatisticProps['formatter'] = (value) => (
  <CountUp end={value as number} separator="," />
);

export const DirectLeadsCard = React.memo(({ loading }: { loading: boolean })=> {

  const directLeadsCount = useSelector(
    (state: RootState) => state?.bidderBids?.directCount
  );

  return (
    <div className='w-[32%]'>
      <Card bordered={true} title={<Tooltip title="Direct Leads">Direct Leads</Tooltip>} loading={loading}>
        <Row gutter={16}>
          <Col span={18}>
              <Statistic title="Total Direct Leads" value={directLeadsCount} formatter={formatter} />
          </Col>
        </Row>
      </Card>
    </div>
  )
})
