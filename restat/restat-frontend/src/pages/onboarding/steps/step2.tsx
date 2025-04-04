import { ErrorMessage } from "formik";
import { images } from "../../../assets";
import { Step2Props } from "../../../services/types/on-boarding";

const Step2 = ({ currentStep, values, handleChange, handleBlur }: Step2Props) => {
    return (
        <div className={`steps w-full step2 ${currentStep === 'name' ? "" : "hidden"}`}>
            <h3>Create your Workspace!</h3>
            <p><strong>Give your workspace an awesome name.</strong> Your workspace is where you'll save your work and collaborate with others.</p>
            <div className="infield">
                <input className="custom-input" type="text" placeholder="minimum 8 characters" value={values.name} onChange={handleChange} onBlur={handleBlur} name='name' />
                <img className="field-icon-right" src={images.face} alt="smile icon" />
            </div>
            <ErrorMessage name='name'>
                {(msg) => <div className="error">{msg}</div>}
            </ErrorMessage>
        </div>
    )
}

export default Step2;
