import { Step7Props } from "../../../services/types/on-boarding";

const Step7 = ({ currentStep, values, setFieldValue }: Step7Props
) => {
  return (
    <div className={`steps w-full step7 ${currentStep === 'companySize' ? "" : "hidden"}`}>
      <h3>Workspace Size</h3>
      <p><strong>How many awesome people work with you.</strong> It helps us to manage your workspace better.</p>
      <div className='companySize-list'>
        <ul className='flex'>
          <li className={values.companySize === 'Just me' ? 'active' : ''} onClick={() => setFieldValue('companySize', 'Just me')}><span className='flex items-center justify-center mr-3 mb-3 px-3'>Just me</span></li>
          <li className={values.companySize === 'Small' ? 'active' : ''} onClick={() => setFieldValue('companySize', 'Small')}><span className='flex items-center justify-center mr-3 mb-3 px-3' >Small</span></li>
          <li className={values.companySize === 'Medium' ? 'active' : ''} onClick={() => setFieldValue('companySize', 'Medium')}><span className='flex items-center justify-center mr-3 mb-3 px-3' >Medium</span></li>
          <li className={values.companySize === 'Enterprise' ? 'active' : ''} onClick={() => setFieldValue('companySize', 'Enterprise')}><span className='flex items-center justify-center mr-3 mb-3 px-3' >Enterprise</span></li>
        </ul>
      </div>
    </div>
  )
}

export default Step7;
