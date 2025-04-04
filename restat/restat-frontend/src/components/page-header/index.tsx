import { FC, ReactNode, useState } from "react";
import { Row, Col } from "antd";
import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import { images } from "../../assets";
import DealFilters from "../filters/deals";

const PageHeader: FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { title, actionButtons, tabs, date, select, search, filters, progress } = useSelector(
    (state: RootState) => state.pageHeader
  );
  // const filters = useSelector((state: RootState) => state.filters);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };


  return (
    <div className="min-h-[7.25rem] h-[7.25rem] px-4 w-full sticky top-0 z-50">
      <Row justify="space-between" align="middle" className="pt-3 w-full">
        <Col>
          <span className="text-tertiary text-xl font-bold">{title}</span>
        </Col>
        <Col>
          <Row gutter={[8, 8]}>
            {actionButtons?.map((button: ReactNode, index: number) => (
              <Col key={index}>{button}</Col>
            ))}
          </Row>
        </Col>
      </Row>
      {!progress ? <Row justify="space-between" align="middle" className="pt-3 w-full min-w-[34.375rem]">
        <Col>
          <Row gutter={[16, 16]}>
            <Col span={24}>{tabs}</Col>
          </Row>
        </Col>
        <Col>
          <Row gutter={[8, 8]}>
            {date && (
              <Col>
                <Row gutter={[8, 8]}>
                  <Col>{date.range}</Col>
                  <Col>{date.status}</Col>
                </Row>
              </Col>
            )}
            {search && <Col>{search}</Col>}
            {select && <Col>{select}</Col>}
            {filters && <Col>
              <div
                className="cursor-pointer flex items-center justify-center w-[32px] h-[32px] border border-gray-300 rounded-md box-border"
                onClick={showModal}
              >
                <img src={images.filter} alt="Filter Icon" className="w-6 h-6" />
              </div>
            </Col>
            }
          </Row>
        </Col>
      </Row>
        : <Row justify="space-between" align="middle" className="pt-3 w-full min-w-[34.375rem]">
          <Col span={24}>
            {progress}
          </Col>
        </Row>
      }
      {isModalVisible && <DealFilters open={isModalVisible} onClose={handleCancel} />}
    </div>
  );
};

export default PageHeader