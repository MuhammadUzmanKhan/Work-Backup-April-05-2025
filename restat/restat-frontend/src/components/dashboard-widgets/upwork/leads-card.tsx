import { Card, Col, Row, Statistic, StatisticProps, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import CountUp from 'react-countup';
import React from 'react';

const formatter: StatisticProps['formatter'] = (value) => (
  <CountUp end={value as number} separator="," />
);

export const LeadsCard = React.memo(({ loading }: { loading: boolean })=> {

  const leadsCount = useSelector(
    (state: RootState) => state?.bidderBids?.leadsCount
  );

  return (
    <div className='w-[15%]'>
      <Card bordered={true} title={<Tooltip title="Leads">Leads</Tooltip>} loading={loading}>
        <Row gutter={16}>
          <Col span={18}>
              <Statistic title="Total Leads" value={leadsCount} formatter={formatter} />
          </Col>
        </Row>
      </Card>
    </div>
  )
})
