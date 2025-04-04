import { ErrorMessage } from "formik";
import { InputFormat } from "../../services/types/input";
import { useState } from "react";
import { images } from "../../assets";

const Input = ({
  label,
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  name,
  srcLeft,
  errors,
  touched,
  disabled
}: InputFormat) => {
  const [inputType, setInputType] = useState<string>(type);

  return (
    <div className={`field ${touched ? errors ? 'error' : 'success' : ''}`}>
      <label>{label} <span>*</span></label>
      <div className="infield">
        <input className="custom-input" disabled={disabled} type={inputType} placeholder={placeholder} name={name} value={value} onChange={onChange} onBlur={onBlur} />
        {srcLeft}
        {
          type === "password" && <img className="field-icon-right cursor-pointer" src={images.eye} alt='eye icon' onClick={() => setInputType(inputType === "password" ? "text" : "password")} />
        }
      </div>
      <ErrorMessage name={name}>
        {(msg) => <div className="error">{msg}</div>}
      </ErrorMessage>
    </div>
  )
}

export default Input;
