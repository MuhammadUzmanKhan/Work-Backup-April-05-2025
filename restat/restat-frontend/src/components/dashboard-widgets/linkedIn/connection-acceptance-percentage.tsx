import { Card, Col, Row, Statistic, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import React, { useEffect, useState } from 'react';


export const ConnectionAcceptanceCard = React.memo(({ loading }: { loading: boolean }) => {
  const [responseRate, setResponseRate] = useState<number>(0);

  const prospectsCount = useSelector(
    (state: RootState) => state?.linkedinCounts?.prospectsCount
  );
  const connectionsCount = useSelector(
    (state: RootState) => state?.linkedinCounts?.connectsCount
  )

  const getResponseRate = () => {

    if (!prospectsCount || !connectionsCount) {
      setResponseRate(0);
      return
    };
    const responsePercentage = prospectsCount / connectionsCount * 100;
    setResponseRate(responsePercentage);
  }
  useEffect(() => {
    getResponseRate();
  }, [prospectsCount, connectionsCount])

  return (
    <div className='w-[15%]'>
      <Card bordered={true} title={<Tooltip title="Connection Acceptance Percentage">Connection Acceptance</Tooltip>} loading={loading}>
        <Row gutter={16}>
          <Col span={20}>
            <Statistic
              title="Acceptance %"
              value={connectionsCount !== 0 ? responseRate : 'No Bids'}
              precision={2}
              valueStyle={responseRate > 2 ? { color: '#3f8600' } : { color: '#cf1322' }}
              suffix={connectionsCount !== 0 ? '%' : ''}
            />
          </Col>
        </Row>
      </Card>
    </div>
  )
})
