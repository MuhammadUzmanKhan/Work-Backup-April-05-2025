import { FormikHandlers, FormikProps, FormikErrors } from "formik";
import { Categories, Themes } from "./common";

interface VerticalStepperProps {
    currentStep: string;
    handleVerticleStepperClick: (event: React.MouseEvent<HTMLInputElement>) => void;
    errors: FormikErrors<MultiStepFormProps>;
}

interface StepProps {
    currentStep: string;
    id: string;
    stepTitle: string;
    stepNumber: string;
    handleVerticleStepperClick: (event: any) => void,
    disable?: boolean;
}

interface CheckBoxItemProps extends Pick<FormikProps<FormikHandlers>, 'handleChange'> {
    title: string,
    name: string,
    value: string
}



interface ThemeSelectionProps {
    backgroundColor: string;
    backgroundColorCode: string;
    active?: boolean;
    id: string;
    handleThemeSelection: React.MouseEventHandler<HTMLLIElement> | undefined
}

interface MultiStepFormProps {
    colorThemeId: string | undefined;
    name: string;
    logoUrl: string;
    websiteUrl: string;
    categories: string[],
    location: string;
    companySize: string;
}

interface StepsCommonProps {
    currentStep: string;
    values: MultiStepFormProps;
}

interface Step1Props extends StepsCommonProps {
    themes: Themes[];
    setFieldValue: any;
}

interface Step2Props extends Pick<FormikProps<FormikHandlers>, 'handleChange' | 'handleBlur'>, StepsCommonProps {
}

interface Step3Props extends StepsCommonProps {
    handleFileUpload: (e: any, setFieldValue: any) => void;
    setFieldValue: any;
    fileUploadingLoader: boolean
}

interface Step4Props extends Pick<FormikProps<FormikHandlers>, 'handleChange' | 'handleBlur'> {
    currentStep: string;
    values: MultiStepFormProps;
}

interface Step5Props extends Pick<FormikProps<FormikHandlers>, 'handleChange'>, Pick<StepsCommonProps, "currentStep"> {
    categories: Categories[];
}

interface Countries {

    name: string;
    code: string;
    flag?: string;
}

interface Step6Props extends StepsCommonProps {
    findLocation: (value: string) => string | undefined;
    countries: Countries[]
}

interface Step7Props extends StepsCommonProps {
    setFieldValue: any
}


export { VerticalStepperProps, StepProps, CheckBoxItemProps, ThemeSelectionProps, MultiStepFormProps, Step1Props, Step2Props, Step3Props, Step4Props, Step5Props, Step6Props, Step7Props }