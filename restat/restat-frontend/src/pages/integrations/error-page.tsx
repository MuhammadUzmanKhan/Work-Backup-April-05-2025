import React from 'react';
import { Typography, Alert, Layout, Button, Image } from 'antd';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../services';
import { images } from '../../assets';

const { Title } = Typography;
const { Content } = Layout;

interface IError {
  error: string;
  message: string;
  statusCode: number;
}

const ErrorPage: React.FC<{ error: IError }> = ({ error }) => {
  const navigate = useNavigate()
  return (
    <Layout style={{ minHeight: '100vh', display:'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Content style={{ display:'flex', flexDirection:'column',  justifyContent:'center', alignItems:'center' }}>
        <Image src={images.logoIcon} width={100} preview={false} />
        <Title level={1}>{error.error}</Title>
        <Alert message={error.message} type="error"  />
        <Button size='large' style={{margin: '100px'}} onClick={() => navigate(routes.settings)}>Back to settings</Button>
      </Content>
    </Layout>
  );
};

export default ErrorPage;
