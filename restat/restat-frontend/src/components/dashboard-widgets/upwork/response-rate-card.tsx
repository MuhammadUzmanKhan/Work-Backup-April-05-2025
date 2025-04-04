import { Card, Col, Row, Statistic, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import React, { useEffect, useState } from 'react';


export const ResponseRateCard = React.memo(({ loading }: { loading: boolean }) => {
  const [responseRate, setResponseRate] = useState<number>(0);

  const leadsCount = useSelector(
    (state: RootState) => state?.bidderBids?.leadsCount
  );
  const bidsCount = useSelector(
    (state: RootState) => state?.bidderBids?.bidsCount
  )

  const getResponseRate = () => {
    
    if (!bidsCount || !leadsCount) {
      setResponseRate(0);
      return
    };
    const responsePercentage = leadsCount / bidsCount * 100;
    setResponseRate(responsePercentage);
  }
  useEffect(() => {
    getResponseRate();
  }, [bidsCount, leadsCount])

  return (
    <div className='w-[15%]'>
      <Card bordered={true} title={<Tooltip title="Response Rate">Response Rate</Tooltip>} loading={loading}>
        <Row gutter={16}>
          <Col span={18}>
            <Tooltip placement="right" title="Total leads generated / total proposals submitted, multiplied by 100">
              <Statistic
                title="Response Rate"
                value={bidsCount !== 0 ? responseRate : 'No Proposal'}
                precision={2}
                valueStyle={responseRate > 2 ? { color: '#3f8600' } : { color: '#cf1322' }}
                suffix={bidsCount !== 0 ? '%' : ''}
              />
            </Tooltip>
          </Col>
        </Row>
      </Card>
    </div>
  )
})
