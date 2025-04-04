declare module 'react-google-charts' {
  import { Component } from 'react';

  interface ChartProps {
    chartType: string;
    data: Array<Array<any>>;
    options?: any;
    mapsId?: string;
    width?: string | number;
    height?: string | number;
    onLoad?: () => void;
  }

  export class Chart extends Component<ChartProps> {}
}
