

import React, { ReactNode } from 'react';

interface BaseCardBillingProps {
  children: ReactNode;
  title?: string;
}

const BaseCardBilling: React.FC<BaseCardBillingProps>= ({ children, title }) => {
  return (
    <div className="w-[75%] my-5">
      <p className="font-semibold text-4xl text-start mb-5">{title}</p>
      {children}
    </div>
  )
}

export default BaseCardBilling