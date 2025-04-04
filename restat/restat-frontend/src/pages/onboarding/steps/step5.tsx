import { ErrorMessage } from "formik";
import CheckBoxItem from "../check-box-item";
import { Step5Props } from "../../../services/types/on-boarding";

const Step5 = ({ currentStep, categories, handleChange }: Step5Props) => {
    return (
        <div className={`steps w-full step5 ${currentStep === 'categories' ? "" : "hidden"}`}>
            <h3>Select your area of expertise</h3>
            <p><strong>We'd like to know the stuff you're good at</strong>, helps us cater the functionalities depending on your information.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-7">
                {
                    categories?.map((item, index) => {
                        return (
                            <div key={index}>
                                <CheckBoxItem title={item.name} handleChange={handleChange} name='categories' value={item.id} />
                            </div>
                        )
                    })
                }
                <ErrorMessage name='categories'>
                    {(msg) => <div className="error">{msg}</div>}
                </ErrorMessage>
            </div>
        </div>
    )
}

export default Step5;
