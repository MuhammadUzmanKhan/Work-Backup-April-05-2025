import { Card, Col, Row, Space, Statistic, StatisticProps, Tag, Tooltip, Typography } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import CountUp from 'react-countup';
import React from 'react';

const formatter: StatisticProps['formatter'] = (value) => (
  <CountUp end={value as number} separator="," />
);

export const BusinessDevelopersStatsCard = React.memo(({ loading }: { loading: boolean }) => {
  const { Text } = Typography;

  const bidsCountByBidders = useSelector((state: RootState) => state.bidderBids.bidsCountByBidders);



  return (
    <div className='w-[100%]'>
      <Card bordered={true} title="Business developers Stats" loading={loading}>
        <Row gutter={16} className='flex flex-wrap gap-y-4'>
          {bidsCountByBidders && bidsCountByBidders?.map((bidder) =>
            <Col span={8}>
              <Card bordered={true} title={bidder?.userDeletedAt ? (
                <>
                  {bidder?.name} <Tag color='red' className='ml-1'>Deleted</Tag>
                </>
              ) : bidder?.name} loading={loading}>
                <Row>
                  <Col span={8}>
                    <Statistic
                      title='Proposals'
                      value={
                        !bidder?.target
                          ? `${bidder?.bidsCount || 0}`
                          : `${bidder?.bidsCount || 0}/${bidder?.target || 0}`
                      }
                      formatter={(value: any) => {
                        if (value.includes('/')) {
                          const [bidsCount, target] = value.split('/').map(Number);
                          return (
                            <Space size="small" style={{ fontWeight: 500, color: '#595959' }}>
                              <Tooltip title='Proposals'>
                                <Text strong style={{ fontSize: '16px' }}>
                                  <CountUp end={bidsCount} separator="," />
                                </Text>
                              </Tooltip>
                              <Text style={{ color: '#8c8c8c' }}>/</Text>
                              <Tooltip title='Target'>
                                <Text strong style={{ fontSize: '14px' }}>
                                  <CountUp end={target} separator="," />
                                </Text>
                              </Tooltip>
                            </Space>
                          );
                        }
                        return (
                          <Tooltip title='Proposals'>
                            <Text strong style={{ fontSize: '22px', fontWeight: 500 }}>
                              <CountUp end={Number(value)} separator="," />
                            </Text>
                          </Tooltip>
                        );
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Response Time"
                      value={bidder?.responseTime || 'N/A'}
                      formatter={(value: any) => {
                        if (value === 'N/A') {
                          return <span style={{ fontSize: '18px', color: '#999', fontWeight:'bold' }}>N/A</span>;
                        }

                        try {
                          // Define regular expressions for different formats
                          const daysFormatRegex = /(\d+)\s*days?\s*(\d+):(\d+):(\d+)(?:\.\d+)?/;
                          const timeFormatRegex = /(\d+):(\d+):(\d+)(?:\.\d+)?/;

                          let formattedResponseTime = '';

                          // Match 'x days x:xx:xx' format
                          const daysMatch = value.match(daysFormatRegex);
                          if (daysMatch) {
                            const [_, days, hours, minutes] = daysMatch;
                            const totalDays = parseInt(days, 10);
                            const totalHours = parseInt(hours, 10);
                            const totalMinutes = parseInt(minutes, 10);

                            if (totalDays > 0) formattedResponseTime += `${totalDays} day${totalDays > 1 ? 's' : ''} `;
                            if (totalHours > 0 || totalMinutes > 0) {
                              formattedResponseTime += `${totalHours}h ${totalMinutes}m`;
                            }

                            return <Text style={{ fontWeight: 500, fontSize: '16px' }}>{formattedResponseTime}</Text>;
                          }

                          // Match 'HH:mm:ss.SSS' or 'HH:mm:ss' format
                          const timeMatch = value.match(timeFormatRegex);
                          if (timeMatch) {
                            const [_, hours, minutes, seconds] = timeMatch;
                            const totalHours = parseInt(hours, 10);
                            const totalMinutes = parseInt(minutes, 10);
                            const totalSeconds = parseInt(seconds, 10);

                            if (totalHours > 0) formattedResponseTime += `${totalHours}h `;
                            if (totalMinutes > 0 || totalHours > 0) {
                              formattedResponseTime += `${totalMinutes}m `;
                            }
                            if (totalSeconds > 0) formattedResponseTime += `${totalSeconds}s`;

                            return <Text style={{ fontWeight: 500, fontSize: '16px' }}>{formattedResponseTime}</Text>;
                          }

                          // If format doesn't match, show as invalid
                          return <span style={{ color: '#8c8c8c' }}>Invalid Time</span>;
                        } catch (error) {
                          return <span style={{ color: '#8c8c8c' }}>Invalid Time (e)</span>;
                        }
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Target Completion"
                      value={bidder?.target ? (+bidder?.bidsCount / bidder?.target) * 100 : "Unset"}
                      precision={2}
                      valueStyle={bidder?.target ? (((+bidder?.bidsCount / bidder?.target) * 100 > 2 && bidder?.bidsCount ? { color: '#3f8600' } : { color: '#cf1322' })) : { color: '#999' }}
                      suffix={bidder?.target ? '%' : ''}
                    />
                  </Col>

                  <Col span={8}>
                    <Statistic title="Leads" value={bidder?.securedJobsCount} formatter={formatter} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Contracts" value={bidder?.totalLeadsWonCount} formatter={formatter} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Response Rate" value={+bidder?.bidsCount !== 0 ? +bidder?.securedJobsCount / +bidder?.bidsCount * 100 : "No Proposals"} precision={2} valueStyle={bidder?.securedJobsCount / bidder?.bidsCount * 100 > 2 && bidder?.bidsCount ? { color: '#3f8600' } : { color: '#cf1322' }} suffix={bidder?.bidsCount !== 0 ? '%' : ''} />
                  </Col>

                  <Col span={8}>
                    <Statistic title="Invites" value={bidder?.invitesCount} formatter={formatter} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Direct Leads" value={+bidder?.directLeadsCount} formatter={formatter} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="MQLs" value={+bidder?.totalSecuredJobsCount} formatter={formatter} />
                  </Col>

                </Row>
              </Card>
            </Col>
          )}
        </Row>
      </Card>
    </div>
  )
})
