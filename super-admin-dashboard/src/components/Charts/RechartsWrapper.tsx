import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Cell as RechartsCell,
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  AreaChart as RechartsAreaChart,
  Area as RechartsArea,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid as RechartsCartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer as RechartsResponsiveContainer
} from 'recharts';

// Wrapper components to prevent React 19 DOM prop warnings
// These components filter out Recharts-specific props before they reach DOM elements

interface PieChartProps {
  children?: React.ReactNode;
  width?: number;
  height?: number;
  [key: string]: any;
}

export const PieChart: React.FC<PieChartProps> = ({ children, ...props }) => {
  return <RechartsPieChart {...props}>{children}</RechartsPieChart>;
};

interface PieProps {
  data?: any[];
  cx?: string | number;
  cy?: string | number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  paddingAngle?: number;
  dataKey?: string;
  nameKey?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  label?: boolean | ((entry: any) => string);
  labelLine?: boolean;
  children?: React.ReactNode;
  [key: string]: any;
}

export const Pie: React.FC<PieProps> = ({ children, ...props }) => {
  return <RechartsPie {...props}>{children}</RechartsPie>;
};

interface CellProps {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  [key: string]: any;
}

export const Cell: React.FC<CellProps> = (props) => {
  return <RechartsCell {...props} />;
};

interface BarChartProps {
  data?: any[];
  width?: number;
  height?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  children?: React.ReactNode;
  [key: string]: any;
}

export const BarChart: React.FC<BarChartProps> = ({ children, ...props }) => {
  return <RechartsBarChart {...props}>{children}</RechartsBarChart>;
};

interface BarProps {
  dataKey?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number | [number, number, number, number];
  [key: string]: any;
}

export const Bar: React.FC<BarProps> = (props) => {
  return <RechartsBar {...props} />;
};

interface LineChartProps {
  data?: any[];
  width?: number;
  height?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  children?: React.ReactNode;
  [key: string]: any;
}

export const LineChart: React.FC<LineChartProps> = ({ children, ...props }) => {
  return <RechartsLineChart {...props}>{children}</RechartsLineChart>;
};

interface LineProps {
  type?: 'basis' | 'basisClosed' | 'basisOpen' | 'linear' | 'linearClosed' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter';
  dataKey?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  dot?: boolean | object;
  activeDot?: boolean | object;
  name?: string;
  [key: string]: any;
}

export const Line: React.FC<LineProps> = (props) => {
  return <RechartsLine {...props} />;
};

interface AreaChartProps {
  data?: any[];
  width?: number;
  height?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  children?: React.ReactNode;
  [key: string]: any;
}

export const AreaChart: React.FC<AreaChartProps> = ({ children, ...props }) => {
  return <RechartsAreaChart {...props}>{children}</RechartsAreaChart>;
};

interface AreaProps {
  type?: 'basis' | 'basisClosed' | 'basisOpen' | 'linear' | 'linearClosed' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter';
  dataKey?: string;
  stackId?: string | number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  dot?: boolean | object;
  activeDot?: boolean | object;
  [key: string]: any;
}

export const Area: React.FC<AreaProps> = (props) => {
  return <RechartsArea {...props} />;
};

interface XAxisProps {
  dataKey?: string;
  axisLine?: boolean;
  tickLine?: boolean;
  tick?: boolean | object;
  interval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd';
  angle?: number;
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit';
  height?: number;
  [key: string]: any;
}

export const XAxis: React.FC<XAxisProps> = (props) => {
  return <RechartsXAxis {...props} />;
};

interface YAxisProps {
  dataKey?: string;
  axisLine?: boolean;
  tickLine?: boolean;
  tick?: boolean | object;
  interval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd';
  width?: number;
  domain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax'];
  [key: string]: any;
}

export const YAxis: React.FC<YAxisProps> = (props) => {
  return <RechartsYAxis {...props} />;
};

interface CartesianGridProps {
  strokeDasharray?: string;
  stroke?: string;
  horizontal?: boolean;
  vertical?: boolean;
  [key: string]: any;
}

export const CartesianGrid: React.FC<CartesianGridProps> = (props) => {
  return <RechartsCartesianGrid {...props} />;
};

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  labelFormatter?: (label: any) => React.ReactNode;
  formatter?: (value: any, name: any, entry: any) => [React.ReactNode, React.ReactNode];
  separator?: string;
  cursor?: boolean | object;
  content?: React.ComponentType<any>;
  [key: string]: any;
}

export const Tooltip: React.FC<TooltipProps> = (props) => {
  return <RechartsTooltip {...props} />;
};

interface LegendProps {
  verticalAlign?: 'top' | 'middle' | 'bottom';
  height?: number;
  iconType?: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
  layout?: 'horizontal' | 'vertical';
  align?: 'left' | 'center' | 'right';
  [key: string]: any;
}

export const Legend: React.FC<LegendProps> = (props) => {
  return <RechartsLegend {...props} />;
};

interface ResponsiveContainerProps {
  width?: string | number;
  height?: string | number;
  aspect?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  debounce?: number;
  children?: React.ReactNode;
  [key: string]: any;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ children, ...props }) => {
  return <RechartsResponsiveContainer {...props}>{children}</RechartsResponsiveContainer>;
};