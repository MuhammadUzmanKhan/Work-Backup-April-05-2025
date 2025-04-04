import { hasOwnProperty, isEqual } from 'lodash';
import { toast } from 'react-toastify';

export const getObjectDiff = function getObjectDiff(obj1, obj2) {
  return Object.keys(obj1).reduce((result, key) => {
    if (!hasOwnProperty.call(obj2, key)) {
      result.push(key);
    } else if (isEqual(obj1[key], obj2[key])) {
      const resultKeyIndex = result.indexOf(key);
      result.splice(resultKeyIndex, 1);
    }
    return result;
  }, Object.keys(obj2));
};

export const successToast = (msg) => {
  toast(msg, { type: 'success' });
};

export const failureToast = (msg) => {
  toast(msg, { type: 'error' });
};

export const deleteFuncToast = (msg = 'Delete functionality is under development.') => {
  toast(msg, { type: 'info' })
}

export const fileTooLarge = (msg = 'Image size is too large.') => {
  toast(msg, { type: 'error' })
}

export const publishDevToast = (msg = 'Publish functionality is under development.') => {
  toast(msg, { type: 'info' })
}

export const infoFuncToast = (msg) => {
  toast(msg, { type: 'info' })
}


export const getErrorStringPart = (error) => {
  const check = error.split('-')[0]
  let rePhrase = error.split('-')[0]
  let last = error.split('-')[1]
  switch (true) {
    case /^productFilterQnAs\[[\d]+\]\.question?$/.test(check):
      rePhrase = 'Filter Question '
      break

    case /^productFilterRanges\[[\d]+\]\.label?$/.test(check):
      rePhrase = 'Filter Question '
      break
    case /^productFilterCheckBoxes\[[\d]+\]\.label?$/.test(check):
      rePhrase = 'Filter Question '
      break
    case /^productFilterQnAs\[[\d]+\]\.answers\[[\d]+\]\.answer$/.test(check):
      rePhrase = 'Filter Answer '
      break
    case /^categoryIds$/.test(check):
      rePhrase = 'Category '
      break
    case /^authorId$/.test(check):
      rePhrase = 'Author '
      break
    case 'productFilterRanges[0].tagIds':
    case /^productFilterRanges\[[\d]\]\.tagIds?$/.test(check):
      rePhrase = 'Filter Slider tags '
      break
    case /^points$/.test(check):
      rePhrase = 'Point'
      break

    default:
      break
  }
  return `${rePhrase} ${rePhrase ? last : ''}`
}