import { routeTitles } from '../constants';

export const getPageTitle = (pathname: string): string => {
  for (const route in routeTitles) {
    const routeRegex = new RegExp(`^${route.replace(/:[^\s/]+/g, '[^/]+').replace(/\*/g, '.*')}$`);    
    if (routeRegex.test(pathname)) {
      return routeTitles[route];
    }
  }
  return 'Restat'; 
};
