export interface InputFormat {
    label: string;
    type: string;
    placeholder: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
    onBlur: React.FocusEventHandler<HTMLInputElement> | undefined;
    name: string;
    srcLeft: JSX.Element;
    errors?: string | undefined | any;
    touched?: boolean | undefined | any;
    disabled?: boolean
}