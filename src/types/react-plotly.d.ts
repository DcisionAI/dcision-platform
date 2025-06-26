declare module 'react-plotly.js' {
  import React from 'react';
  
  interface PlotProps {
    data: any[];
    layout?: any;
    config?: any;
    style?: React.CSSProperties;
    className?: string;
    onClick?: (event: any) => void;
    onHover?: (event: any) => void;
    onUnHover?: (event: any) => void;
    onSelected?: (event: any) => void;
    onDeselect?: (event: any) => void;
    onDoubleClick?: (event: any) => void;
    onRelayout?: (event: any) => void;
    onRestyle?: (event: any) => void;
    onUpdate?: (event: any) => void;
    onPurge?: (event: any) => void;
    onAfterPlot?: (event: any) => void;
    onAfterExport?: (event: any) => void;
    onBeforeExport?: (event: any) => void;
    onAnimated?: (event: any) => void;
    onAnimatingFrame?: (event: any) => void;
    onAnimationInterrupted?: (event: any) => void;
    onAutoSize?: (event: any) => void;
    onBeforeHover?: (event: any) => void;
    onButtonClicked?: (event: any) => void;
    onClickAnnotation?: (event: any) => void;
    onDeselect?: (event: any) => void;
    onDoubleClick?: (event: any) => void;
    onFramework?: (event: any) => void;
    onHover?: (event: any) => void;
    onLegendClick?: (event: any) => void;
    onLegendDoubleClick?: (event: any) => void;
    onRelayout?: (event: any) => void;
    onRestyle?: (event: any) => void;
    onSelected?: (event: any) => void;
    onSelecting?: (event: any) => void;
    onSliderChange?: (event: any) => void;
    onSliderEnd?: (event: any) => void;
    onSliderStart?: (event: any) => void;
    onSunburstClick?: (event: any) => void;
    onTransitionInterrupted?: (event: any) => void;
    onTransitioning?: (event: any) => void;
    onUnHover?: (event: any) => void;
    onUpdate?: (event: any) => void;
    useResizeHandler?: boolean;
    debug?: boolean;
    clearOnUnmount?: boolean;
    divId?: string;
    onInitialized?: (figure: any) => void;
    onUpdate?: (figure: any) => void;
    revision?: number;
    onError?: (error: any) => void;
  }
  
  const Plot: React.FC<PlotProps>;
  export default Plot;
} 