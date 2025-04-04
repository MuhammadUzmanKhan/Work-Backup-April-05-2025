import { ErrorMessage } from "formik";
import { images } from "../../../assets";
import { Step4Props } from "../../../services/types/on-boarding";

const Step4 = ({ currentStep, values, handleChange, handleBlur }: Step4Props) => {
  return (
    <div className={`steps w-full step4 ${currentStep === 'websiteUrl' ? "" : "hidden"}`}>
      <h3>Got a Website?</h3>
      <p><strong>Promote your workspace, Add your website link.</strong>   It helps us learn more about you.</p>
      <label className='mb-3 flex'>this is optional</label>
      <div className="infield">
        <input className="custom-input" type="text" placeholder="https://www.example.com/basketball/bedroom.php" value={values.websiteUrl} name='websiteUrl' onChange={handleChange} onBlur={handleBlur} />
        <img className="field-icon-right" src={images.link} alt="link icon" />
      </div>
      <ErrorMessage name='websiteUrl'>
        {(msg) => <div className="error">{msg}</div>}
      </ErrorMessage>
    </div>
  )
}

export default Step4;