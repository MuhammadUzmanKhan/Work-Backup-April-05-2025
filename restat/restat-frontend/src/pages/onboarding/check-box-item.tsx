import { CheckBoxItemProps } from "../../services/types/on-boarding";

const CheckBoxItem = ({ title, handleChange, name, value }: CheckBoxItemProps) => {
    return (
        <div className="flex items-center">
            <label className="on-checkmark">
                <input type="checkbox" value={value} onChange={handleChange} name={name} />
                <span className="checkmark"></span>
                <span>{title}</span>
            </label>
        </div>
    )
}

export default CheckBoxItem;
