import { handleExtensionError } from "./parserHelper";

export const linkedinPagesWrapMethods = (methods) => {
    const wrappedMethods = {};
  
    for (const key in methods) {
      if (methods && typeof methods[key] === 'function') {
        wrappedMethods[key] = async function(...args) {
          await handleExtensionError(() => methods[key].apply(this, args));
        };
      }
    }
  
    return wrappedMethods;
  };
  