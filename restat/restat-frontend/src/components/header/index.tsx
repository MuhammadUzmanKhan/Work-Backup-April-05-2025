import { images } from "../../assets";
import { HeaderProps } from "../../services/types/common";
import './header.scss';

const Header = ({ title, subTitle, handleClick }: HeaderProps) => {
    return (
        <header className="header">
            <a href="/" className="brand-logo">
                <img src={images.logo} alt="React Logo" />
            </a>
            <div className="account">
                <p>{subTitle}</p>
                <button className="btn btn-sm blue-btn" onClick={handleClick}>{title}</button>
            </div>
        </header>
    )
}

export default Header;
