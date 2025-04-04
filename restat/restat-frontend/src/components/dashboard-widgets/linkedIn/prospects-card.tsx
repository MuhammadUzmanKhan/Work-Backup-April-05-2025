import { Card, Col, Row, Statistic, StatisticProps, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import CountUp from 'react-countup';
import React from 'react';

const formatter: StatisticProps['formatter'] = (value) => (
  <CountUp end={value as number} separator="," />
);

export const ProspectsCard = React.memo(({ loading }: { loading: boolean }) => {

  const totalProspectsCount = useSelector(
    (state: RootState) => state?.linkedinCounts?.prospectsCount
  );

  return (
    <div className='w-[15%]'>
      <Card bordered={true} title={<Tooltip title="Total Prospects">Total Prospects</Tooltip>} loading={loading}>
        <Row gutter={16}>
          <Col span={16}>
            <Statistic title="Total Prosp.." value={totalProspectsCount} formatter={formatter} />
          </Col>
        </Row>
      </Card>
    </div>
  )
})
