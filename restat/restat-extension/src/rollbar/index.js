import Rollbar from 'rollbar';
import config from '../../rollbar.config';

export const rollbarThrow = new Rollbar(config);

export default {
  install(app) {
    app.config.errorHandler = (error, vm, info) => {
      rollbarThrow.error(error, { vueComponent: vm, info });
      if (app.config.devtools) {
        // console.log(error);
      }
    };
    app.provide('rollbar', rollbarThrow);
  },
};