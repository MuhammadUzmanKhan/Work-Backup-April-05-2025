import { Field } from "formik"
import { Step6Props } from "../../../services/types/on-boarding";



const Step6 = ({ currentStep, values, countries, }: Step6Props) => {
  return (
    <div className={`steps w-full step6 ${currentStep === 'location' ? "" : "hidden"}`}>
      <h3>Select your Country</h3>
      <p><strong>We are a huge family at restat</strong>, we'd like to know where are you joining us from.</p>
      <div className="infield country-select flex items-center">
        <span className="flag">
          <a className={`fi fi-${values.location.toLowerCase()}`}></a>
        </span>

        <Field as="select" className='w-full' name="location" value={values.location}>
          {
            countries.map((item, index) => {
              return (
                <option key={index} value={item.code}>{item.name}</option>
              )
            })
          }
        </Field>
      </div>
    </div>
  )
}

export default Step6