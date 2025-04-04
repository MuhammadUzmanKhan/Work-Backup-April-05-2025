import { Card, Col, Row, Statistic, StatisticProps, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import CountUp from 'react-countup';
import React from 'react';
import { RootState } from '../../../services/redux/store';

const formatter: StatisticProps['formatter'] = (value) => (
  <CountUp end={value as number} separator="," />
);

export const TotalContractsCard = React.memo(({ loading }: { loading: boolean })=> {

  const totalContractsCount = useSelector(
    (state: RootState) => state?.bidderBids?.totalContractsCount
  );

  return (
    <div className='w-[15%]'>
      <Card bordered={true} title={<Tooltip title="Total Contracts">Contracts</Tooltip>} loading={loading}>
        <Row gutter={16}>
          <Col span={18}>
            <Tooltip placement="right" title="Includes all types of contracts">
              <Statistic title="Total Contracts" value={totalContractsCount} formatter={formatter} />
            </Tooltip>
          </Col>
        </Row>
      </Card>
    </div>
  )
})
