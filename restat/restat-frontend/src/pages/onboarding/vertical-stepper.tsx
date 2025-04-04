import { StepProps, VerticalStepperProps } from '../../services/types/on-boarding';
import './on-boarding.scss';

const VerticalStepper = ({ currentStep, handleVerticleStepperClick, errors }: VerticalStepperProps) => {
  return (
    <div className='rightSide flex items-center justify-center p-10 text-center'>
      <div className='inner-rightSide'>
        <h2>Welcome!</h2>
        <p>Add your details & personalize your space. let's get you started right away</p>
        <ul className='nav'>
          <Step currentStep={currentStep} id="colorThemeId" stepTitle="Color Theme" stepNumber='01' handleVerticleStepperClick={handleVerticleStepperClick} />
          <Step currentStep={currentStep} id="name" stepTitle="Workspace" stepNumber='02' handleVerticleStepperClick={handleVerticleStepperClick} />
          <Step currentStep={currentStep} disable={errors.name ? true : false} id="logoUrl" stepTitle="Workspace Logo" stepNumber='03' handleVerticleStepperClick={handleVerticleStepperClick} />
          <Step currentStep={currentStep} disable={errors.name ? true : false} id="websiteUrl" stepTitle="Website" stepNumber='04' handleVerticleStepperClick={handleVerticleStepperClick} />
          <Step currentStep={currentStep} disable={errors.name ? true : false} id="categories" stepTitle="Category" stepNumber='05' handleVerticleStepperClick={handleVerticleStepperClick} />
          <Step currentStep={currentStep} disable={errors.name ? true : errors.categories ? true : false} id="location" stepTitle="Location" stepNumber='06' handleVerticleStepperClick={handleVerticleStepperClick} />
          <Step currentStep={currentStep} disable={errors.name ? true : errors.categories ? true : false} id="companySize" stepTitle="Workspace Size" stepNumber='07' handleVerticleStepperClick={handleVerticleStepperClick} />
          <span className="nav-indicator"></span>
        </ul>
      </div>

    </div>
  )
}

const Step = ({ currentStep, id, stepTitle, stepNumber, handleVerticleStepperClick, disable }: StepProps) => {
  return (
    <li className={`nav-item ${currentStep === id ? 'active' : ''} ${disable ? 'disable' : ''}`} id={id} onClick={handleVerticleStepperClick}><span>{stepTitle} <span>{stepNumber}</span></span></li>
  )
}
export default VerticalStepper;
