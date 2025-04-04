export const setResourcesPath = (id) => {
  switch (id) {
    case 1:
      return 'experts';
    case 2:
      return 'community';
    case 3:
      return 'guidebooks';
    case 4:
      return 'faqs';
    default:
      return 'experts';
  }
};

export const setTitleFromPath = (name) => name.substr(1).charAt(0).toUpperCase() + name.slice(2);

export const calculationLoanEMI = (ir, np, pv, fv = 0) => {
  /*
 ir - interest rate per month
 np - number of periods (months)
 pv - present value
 fv - future value (residual value)
 */
  let pmt = (ir * (pv * Math.pow(ir + 1, np) + fv)) / ((ir + 1) * (Math.pow(ir + 1, np) - 1));
  return Math.ceil(pmt);
};

export const calculationTotalInterest = (loanEMI, loanTenure) => loanEMI * loanTenure * 12;

export const getCalculation = (homeLoanAmount = 1, interestRate = 1, loanTenure = 1) => {
  const periodInmonths = loanTenure * 12;
  const rateInMonth = interestRate / 12 / 100;

  let array = [];
  let totalInterest = 0;

  for (let i = 1; i <= loanTenure * 12; i++) {
    let data = {};

    if (array.length) {
      data = {
        month: i,
        amount: array[i - 2].remainingPrincipalAmound,
        instalment: calculationLoanEMI(rateInMonth, periodInmonths, homeLoanAmount),
        interest: Math.round((array[i - 2].remainingPrincipalAmound * interestRate) / 1200),
        principalRepaid: Math.ceil(
          calculationLoanEMI(rateInMonth, periodInmonths, homeLoanAmount) -
            (array[i - 2].remainingPrincipalAmound * interestRate) / 1200
        ),
        remainingPrincipalAmound: Math.round(
          array[i - 2].remainingPrincipalAmound -
            (calculationLoanEMI(rateInMonth, periodInmonths, homeLoanAmount) -
              (array[i - 2].remainingPrincipalAmound * interestRate) / 1200)
        )
      };
      totalInterest =
        totalInterest + Math.round((array[i - 2].remainingPrincipalAmound * interestRate) / 1200);
    } else {
      data = {
        month: i,
        amount: +homeLoanAmount,
        instalment: calculationLoanEMI(rateInMonth, periodInmonths, homeLoanAmount),
        interest: Math.round((homeLoanAmount * interestRate) / 1200),
        principalRepaid:
          calculationLoanEMI(rateInMonth, periodInmonths, homeLoanAmount) -
          (homeLoanAmount * interestRate) / 1200,
        remainingPrincipalAmound: Math.round(
          homeLoanAmount -
            (calculationLoanEMI(rateInMonth, periodInmonths, homeLoanAmount) -
              (homeLoanAmount * interestRate) / 1200)
        )
      };
      totalInterest = totalInterest + (homeLoanAmount * interestRate) / 1200;
    }

    array.push(data);
  }

  console.log('array', array);
  return Math.ceil(totalInterest);
};

export const convertArabicToEnglish = (num) => {
  return num.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
}
export const StringToNum = (number) => {
  let num = number
  if (typeof num === 'number') return num
  num = convertArabicToEnglish(number)
  if (isNaN(parseInt(num.replace(',', '')))) {
    return false
  }
  return parseInt(num.replace(',', ''))
}
export const NumToString = (num) => {
  return num.toLocaleString('en-US')
}


export const removeSpaces = (html) => {
  var domEl = new DOMParser().parseFromString(html, 'text/html')
  const loop = true
  while (loop) {
    const nestedUL = domEl.querySelector('ul > ul')
    if (!nestedUL) break
    nestedUL.style.margin = 0
    const lastLi = nestedUL.previousElementSibling
    lastLi.appendChild(nestedUL)
  }

  const parsedHTML = domEl.body.innerHTML

  let sanitizedHtml = parsedHTML.replace(/<\/span>&nbsp;<\/p>/g, '</span></p>')
  sanitizedHtml = sanitizedHtml.replace(/<\/span>&nbsp;<\/li>/g, '</span></li>')
  sanitizedHtml = sanitizedHtml.replace(
    /<li\sstyle="margin-left:\d+\.*\d{0,2}[a-zA-Z]{2};">/g,
    '<li>'
  )
  sanitizedHtml = sanitizedHtml.replace(
    /<span\sstyle="margin-left:\d+\.*\d{0,2}[a-zA-Z]{2};">/g,
    '<span>'
  )
  sanitizedHtml = sanitizedHtml.replace(
    /<p\sstyle="margin-left:\d+\.*\d{0,2}[a-zA-Z]{2};">/g,
    '<p>'
  )
  // console.log(sanitizedHtml)
  return sanitizedHtml
}


// export const mapUrlToLinkedEntity = (type, id) => {
//   console.log(type, id)
//   switch (type) {
//     case 'FAQ':
//       return

//     default:
//       return
//   }
// }