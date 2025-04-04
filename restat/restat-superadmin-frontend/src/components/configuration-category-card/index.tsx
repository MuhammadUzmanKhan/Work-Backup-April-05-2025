import { Card } from 'antd';
import "./configuration-category-card.scss";

interface IConfigurationCategoryCard {
    title: string;
    onClick: () => void;
}

const { Meta } = Card;

const ConfigurationCategoryCard = ({ title, onClick }: IConfigurationCategoryCard) => {
    return (
        <div className="card-container" onClick={onClick}>
            <Card className="custom-card">
                <Meta
                    title={title}
                />
            </Card>
        </div>
    );
};

export default ConfigurationCategoryCard;
