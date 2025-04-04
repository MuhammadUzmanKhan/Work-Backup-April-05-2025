import { images } from "../../assets";
import './header.scss';

const Header = () => {
    return (
        <header className="header">
            <a href="/" className="brand-logo">
                <img src={images.logo} alt="React Logo" />
            </a>
            <div className="account">
            </div>
        </header>
    )
}

export default Header;
