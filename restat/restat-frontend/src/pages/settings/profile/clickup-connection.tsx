import { Avatar, Card, Button, Row, Col, Typography } from 'antd';
import { UserOutlined, LinkOutlined } from '@ant-design/icons';
import { IClickupUser } from '../../../context';
import { images } from '../../../assets';

const { Text } = Typography;

const ClickUpConnection = ({ context, handleConnectToClickup }: { context: { clickupUser: IClickupUser }, handleConnectToClickup: () => void }) => {
  return (
    <Card
      style={{
        maxWidth: 500,
        margin: 'auto',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        padding: 10,
      }}
    >
      {context.clickupUser.clickupId ? (
        <Row gutter={16} align="middle">
          <Col span={8} style={{ textAlign: 'center' }}>
            <Avatar
              size={100}
              src={context.clickupUser.clickupProfilePicture ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(context.clickupUser.clickupUsername)}&background=random&size=200&color=ffffff&bold=true`}
              icon={<UserOutlined />}
            />
          </Col>
          <Col span={16} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Text strong style={{ fontSize: 18, color: '#333' }}>
              {context.clickupUser.clickupUsername}
            </Text>
            <Text type="secondary" style={{ fontSize: 14, color: '#888' }}>
              {context.clickupUser.clickupEmail}
            </Text>
          </Col>
          <Col span={24} style={{ textAlign: 'center', marginTop: 24 }}>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={handleConnectToClickup}
              style={{ fontSize: 14, padding: '7px 10px', height: 'auto', backgroundColor: '#1b4895', border: 'none' }}
            >
              Connected
            </Button>
          </Col>
          <Col span={24} style={{ display:'flex', justifyContent:'center', textAlign: 'center', marginTop: 16 }}>
            <img src={images.logoIcon} alt='Restat Icon' style={{ width: 50, marginRight: 20 }} />
            <img src={images.connectedIcon} alt='Connect' style={{ width: 40, marginRight: 20 }} />
            <img src={images.clickUp} alt='Clickup Icon' style={{ width: 50 }} />
          </Col>
        </Row>
      ) : (
        <Row justify="center" align="middle" style={{ textAlign: 'center', marginTop: 20 }}>
          <Col style={{display:'flex', justifyContent:'center'}} span={24}>
            <img src={images.logoIcon} alt='Restat Icon' style={{ width: 50, marginRight: 20 }} />
            <img src={images.connectIcon} alt='Connect' style={{ width: 40, marginRight: 20 }} />
            <img src={images.clickUp} alt='Clickup Icon' style={{ width: 50 }} />
          </Col>
          <Col span={24} style={{ textAlign: 'center', marginTop: 24 }}>
            <Button
              type="dashed"
              icon={<LinkOutlined />}
              onClick={handleConnectToClickup}
              style={{ fontSize: 16, padding: '10px 20px', height: 'auto' }}
            >
              Click to connect your ClickUp profile to Restat
            </Button>
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default ClickUpConnection;
