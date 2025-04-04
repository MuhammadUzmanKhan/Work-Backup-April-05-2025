import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { customNotification } from '../../components';
import { images } from "../../assets";
import { v4 as uuidv4 } from 'uuid';
import { Formik } from "formik";
import './on-boarding.scss';
import VerticalStepper from "./vertical-stepper";
import { COMPANY, USER_OBJECT, apis, multiStepFormList, routes, storage, useLoader } from "../../services";
import { onBoardingValidationSchema } from "../../services/utils/validation-schemas";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Categories, Themes } from "../../services/types/common";
import Loader from '../../components/loader';
import countries from '../../assets/countries';
import { Step1, Step2, Step3, Step4, Step5, Step6, Step7 } from "./steps";
import { MultiStepFormProps } from "../../services/types/on-boarding";
import { useDispatch } from "react-redux";
import { setUser } from "../../services/redux/features/user/user-slice";
import { setCompany } from "../../services/redux/features/company/company-slice";
import { useAuth } from "../../services/hooks/handleLogout";

const OnBoarding = () => {
  const [currentStep, setCurrentStep] = useState(multiStepFormList[0]);
  const [themes, setThemes] = useState<Themes[]>();
  const [categories, setCategories] = useState<Categories[]>();
  const [fileUploadingLoader, setFileUploadingLoader] = useState(false);
  const { on, off, loading } = useLoader();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const phoneNumber = location.state?.phoneNumber;

  const { handleLogout } = useAuth()

  const getAllThemes = async () => {
    try {
      const { data } = await apis.getAllThemes();
      setThemes(data);
    } catch (error: any) {
      if (error?.response?.data?.message) {
        customNotification.error(error.response.data.message)
      } else {
        customNotification.error("Something went wrong. Please check your internet connection and try again.")
      }
    }
  }

  const getAllCategories = async () => {
    try {
      const { data } = await apis.getAllCategories();
      setCategories(data);
    } catch (error: any) {
      if (error?.response?.data?.message) {
        customNotification.error(error.response.data.message)
      } else {
        customNotification.error("Something went wrong. Please check your internet connection and try again.")
      }
    }
  }
  useEffect(() => {
    getAllThemes();
    getAllCategories();
  }, [])

  const animateCircle = (event: React.MouseEvent<HTMLInputElement | HTMLButtonElement>) => {
    const indicator: any = document.querySelector('.nav-indicator')!;
    const items = document.querySelectorAll('.nav-item');
    const el = event.target as HTMLInputElement
    items.forEach(item => {
      item.classList.remove('is-active');
      item.removeAttribute('style');
    });

    indicator.style.height = `${el.offsetHeight}px`;
    indicator.style.top = `${el.offsetTop}px`;
    indicator.style.backgroundColor = el.getAttribute('active-color');
    el.classList.add('is-active');
    el.style.color = el.getAttribute('active-color')!;
  }

  const handleVerticleStepperClick = (event: React.MouseEvent<HTMLInputElement>) => {
    animateCircle(event);
    setCurrentStep(event.currentTarget.id);
  }

  const findLocation = (location: string) => {
    const country = countries.find((item) => item.code === location);
    if (country?.flag) {
      return country?.flag;
    }
    else {
      return "https://twemoji.maxcdn.com/2/svg/1f1fa-1f1f8.svg"
    }
  }

  const handleFileUpload = async (event: any, setFieldValue: any) => {
    try {
      setFileUploadingLoader(true);
      const file = event.target.files[0];
      if (!file) return;
      const imageName = `images/${uuidv4()}`
      const storageRef = ref(storage, imageName);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(ref(storage, imageName))
      setFieldValue("logoUrl", url);
      event.target.value = '';
    } catch (error) {
      customNotification.error("Something went wrong. Please check your internet connection and try again.")
    } finally {
      setFileUploadingLoader(false);
    }
  }

  const onNextClick = async () => {
    const index = multiStepFormList.findIndex(item => item === currentStep);
    document.getElementById(multiStepFormList[index + 1])?.click();
    setCurrentStep(multiStepFormList[index + 1]);
  }

  const handleSubmit = async (values: MultiStepFormProps) => {
    on();
    const { colorThemeId, name, logoUrl, websiteUrl, categories, location, companySize } = values;
    try {
      const [createCompanyRes,] = await Promise.all([
        apis.createCompany({ websiteUrl, logoUrl, companySize, name, phoneNumber }),
        apis.addUserProfile({ location, colorThemeId, categories })
      ])
      if (createCompanyRes?.data?.user) {
        dispatch(setUser(createCompanyRes.data.user))
        localStorage.setItem(USER_OBJECT, JSON.stringify(createCompanyRes.data.user));
        if (createCompanyRes?.data?.user?.companyId) {
          const { data: company } = await apis.getCompany(createCompanyRes.data.user.companyId);
          await localStorage.setItem(COMPANY, JSON.stringify(company))
          dispatch(setCompany(company));
        }
      }
      customNotification.success("You have successfully created the Workspace.");
      navigate(routes.dashboard);
    } catch (error: any) {
      if (error.response.config.url === "company") {
        const errorMessage = error.response.data.message || "Error creating the Workspace.";
        customNotification.error(errorMessage);
      }
      else if (error?.response?.config?.url === "user/add-user-profile") {
        const errorMessage = error.response.data.message || "Error adding user profile.";
        customNotification.error(errorMessage);
      } else {
        customNotification.error("Something went wrong. Please make sure you have stable internet connection.")
      }
    } finally {
      off();
    }
  }

  const logoutHandler = () => {
    handleLogout(
      "Would you like to log out?",
      "You'll be logged out of your current session.",
      "question",
      true,
      "#3085d6",
      "#d33",
      "Yes, Log Out"
    )
  }

  return (
    <div className='content flex'>
      <Formik
        enableReinitialize={true}
        validateOnMount={true}
        validationSchema={onBoardingValidationSchema}
        initialValues={{
          colorThemeId: themes && themes[0].id,
          name: '',
          logoUrl: '',
          websiteUrl: '',
          categories: [],
          location: 'US',
          companySize: 'Just me'
        }}
        onSubmit={handleSubmit}
      >{({
        values,
        setFieldValue,
        handleChange,
        handleBlur,
        submitForm,
        errors,
      }) => (
        <>
          <div id='recaptcha-container'></div>
          <div className='leftSide flex-1 flex flex-col'>
            <span className='onboard-header'>
              <img src={images.logo} alt="React Logo" />
              <button onClick={logoutHandler} className="logout">Logout</button>
            </span>
            <div className='inner-wrapper flex-1 flex'>
              <div className='onboarding-detail flex flex-col justify-center items-start w-full'>
                <div className='inDetil w-full'>
                  <Step1 values={values} setFieldValue={setFieldValue} currentStep={currentStep} themes={themes!} />
                  <Step2 values={values} currentStep={currentStep} handleChange={handleChange} handleBlur={handleBlur} />
                  <Step3 values={values} currentStep={currentStep} handleFileUpload={handleFileUpload} setFieldValue={setFieldValue} fileUploadingLoader={fileUploadingLoader} />
                  <Step4 values={values} currentStep={currentStep} handleBlur={handleBlur} handleChange={handleChange} />
                  <Step5 currentStep={currentStep} categories={categories!} handleChange={handleChange} />
                  <Step6 currentStep={currentStep} countries={countries} findLocation={findLocation} values={values} />
                  <Step7 currentStep={currentStep} values={values} setFieldValue={setFieldValue} />
                  {
                    currentStep === 'companySize' ?
                      <button className='btn blue-btn mt-5' type="submit" onClick={submitForm}>{loading ? <Loader /> : 'Submit'}</button>
                      :
                      <button className='btn blue-btn mt-10' onClick={onNextClick} disabled={Object.keys(errors).some(key => key === currentStep) || fileUploadingLoader}>Next Step</button>
                  }
                </div>
              </div>
            </div>
          </div>
          <VerticalStepper currentStep={currentStep} handleVerticleStepperClick={handleVerticleStepperClick} errors={errors} />
        </>
      )}
      </Formik>

    </div>
  )
}


export default OnBoarding;
