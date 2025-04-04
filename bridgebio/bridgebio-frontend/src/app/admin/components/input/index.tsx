import React from 'react';

interface InputProps extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    label: string;
    error?: string;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    ...props
}) => {
    return (
        <div className='w-full my-3'>
            <label className='text-primary'>
                {label}
            </label>
            <input {...props} className='w-full rounded bg-white border border-primary p-2 my-2 text-gray-300' />
            <div className='text-red-500 text-sm font-light'>
                {error}
            </div>
        </div>
    );
};

export default Input;