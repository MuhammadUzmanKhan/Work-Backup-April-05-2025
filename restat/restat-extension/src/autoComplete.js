import { handleRuntimeMessage } from "./utility/parserHelper";

const _debounce = (func, wait, immediate) => {
  var timeout;
  return function executedFunction() {
    var context = this;
    var args = arguments;
    var later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

const autoComplete = _debounce((minLength, target, loader) => {
  if (target.value.length >= minLength) {
    _autoComplete(target, loader);
  }
}, 1000);

const _autoComplete = (target, loader) => {
  loader(".form-title");
  _fetchData(target);
}

const _fetchData = async (target) =>  {
  handleRuntimeMessage({ message: "search-templates", object: target.value })
}

export {
  autoComplete
};