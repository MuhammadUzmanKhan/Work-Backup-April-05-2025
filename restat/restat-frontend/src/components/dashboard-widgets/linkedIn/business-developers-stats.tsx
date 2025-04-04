import { Card, Col, Row, Statistic, StatisticProps, Tag } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import CountUp from 'react-countup';
import React from 'react';

const formatter: StatisticProps['formatter'] = (value) => (
  <CountUp end={value as number} separator="," />
);

export const BusinessDevelopersLinkedInStatsCard = React.memo(({ loading }: { loading: boolean }) => {

  const connectionsCountByBidders = useSelector((state: RootState) => state?.linkedinCounts?.connectsCountByBusinessDeveloper)

  return (
    <div className='w-[100%]'>
      <Card bordered={true} title="Business developers Stats" loading={loading}>
        <Row gutter={16} className='flex flex-wrap gap-y-4'>
          {connectionsCountByBidders?.length && connectionsCountByBidders?.map((bidder) =>
            <Col span={8}>
              <Card bordered={true} title={bidder?.deletedAt ? (<>
                {bidder?.name} <Tag color='red' className='ml-1'>Deleted</Tag>
              </>) : bidder?.name} loading={loading}>
                <Row>
                  <Col span={8}>
                    <Statistic title="Connections" value={bidder?.connectsCount} formatter={formatter} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Target Connections" value={bidder?.target} formatter={formatter} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Connection Acceptance Percentage" value={bidder?.connectsCount !== 0 ? bidder?.prospectsCount / bidder?.connectsCount * 100 : "No Connection"} precision={2} valueStyle={bidder?.prospectsCount / bidder?.connectsCount * 100 > 2 && bidder?.connectsCount ? { color: '#3f8600' } : { color: '#cf1322' }} suffix={bidder?.connectsCount !== 0 ? '%' : ''} />
                  </Col>
                  {/* <Col span={8}>
                    <Statistic title="Industry Connections" value={bidder.connectsCount !== 0 ? bidder.prospectsCount / bidder.connectsCount * 100 : "No Connection"} precision={2} valueStyle={bidder.prospectsCount / bidder.connectsCount * 100 > 2 && bidder.connectsCount ? { color: '#3f8600' } : { color: '#cf1322' }} suffix={bidder.connectsCount !== 0 ? '%' : ''} />
                  </Col> */}
                </Row>
              </Card>
            </Col>
          )}
        </Row>
      </Card>
    </div>
  )
})
