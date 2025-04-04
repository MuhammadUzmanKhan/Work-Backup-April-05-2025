import { Step1Props } from "../../../services/types/on-boarding"
import ThemeSelection from "../theme-selection"

const Step1 = ({ currentStep, themes, values, setFieldValue }: Step1Props) => {
  return (
    <div className={`steps w-full step1 ${currentStep === 'colorThemeId' ? "" : "hidden"}`}>
      <h3>Color Selection</h3>
      <p>Personalize your experience, Try out different colors and see what works with your workspace. <strong>Make your workspace special.</strong></p>
      <ul className='colors-list flex flex-wrap'>
        {
          themes && themes.map((item, index) => {
            return (
              <ThemeSelection key={index} backgroundColor={item.name} backgroundColorCode={item.colors.primaryColor} id={item.id} active={values.colorThemeId === item.id} handleThemeSelection={(event: any) => setFieldValue("colorThemeId", event.currentTarget.id)} />
            )
          })
        }
      </ul>
    </div>
  )
}

export default Step1;