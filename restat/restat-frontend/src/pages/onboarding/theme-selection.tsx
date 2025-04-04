import { ThemeSelectionProps } from '../../services/types/on-boarding';
import './on-boarding.scss';

const ThemeSelection = ({ backgroundColor, backgroundColorCode, active, id, handleThemeSelection }: ThemeSelectionProps) => {
    return (
        <li className={active ? 'active' : ''} style={{ background: backgroundColorCode }} onClick={handleThemeSelection} id={id}>{backgroundColor}</li>
    )
}

export default ThemeSelection
