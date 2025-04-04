import { Card, Col, Row, Statistic, StatisticProps, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import CountUp from 'react-countup';
import React from 'react';

const formatter: StatisticProps['formatter'] = (value) => (
  <CountUp end={value as number} separator="," />
);

export const MqlCard = React.memo(({ loading }: { loading: boolean }) => {

  const totalLeadsCount = useSelector(
    (state: RootState) => state?.bidderBids?.totalLeadsCount
  );

  return (
    <div className='w-[32%]'>
      <Card bordered={true} title={<Tooltip title="Marketing Qualified Leads">MQLs</Tooltip>} loading={loading}>
        <Row gutter={16}>
          <Col span={16}>
            <Tooltip placement="right" title="Includes leads, direct leads, and invites">
              <Statistic title="Total MQLs" value={totalLeadsCount} formatter={formatter} />
            </Tooltip>
          </Col>
        </Row>
      </Card>
    </div>
  )
})
