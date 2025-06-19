import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../layout/ThemeContext';

interface MermaidChartProps {
  content: string;
}

const MermaidChart: React.FC<MermaidChartProps> = ({ content }) => {
  const { theme } = useTheme();
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      fontSize: 12,
      flowchart: {
        htmlLabels: false,
        curve: 'basis',
        useMaxWidth: true,
        padding: 20,
        nodeSpacing: 50,
        rankSpacing: 50
      }
    });

    // Force re-render of the diagram
    mermaid.contentLoaded();
  }, [content]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newZoom = Math.min(Math.max(zoom + delta * 10, 10), 150);
    setZoom(newZoom);
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(Number(e.target.value));
  };

  // Clean up the content by replacing HTML tags with line breaks
  const cleanContent = content
    .replace(/<br\/?>/g, '\n')
    .replace(/<div[^>]*>/g, '')
    .replace(/<\/div>/g, '')
    .replace(/class=/g, 'class_')
    .trim();

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-end space-x-4 px-4">
        <label className="text-sm text-gray-600 dark:text-gray-300">Zoom: {Math.round(zoom)}%</label>
        <input
          type="range"
          min="10"
          max="150"
          step="5"
          value={zoom}
          onChange={handleZoomChange}
          className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
      </div>
      <div 
        ref={containerRef}
        className="mermaid-wrapper overflow-hidden p-8 border border-gray-200 dark:border-gray-700 rounded-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          height: '600px',
          background: theme === 'dark' ? '#1e1e1e' : '#ffffff'
        }}
      >
        <div 
          className="mermaid text-center min-w-[1600px] min-h-[1000px]"
          style={{
            transform: `scale(${zoom / 100}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.2s ease-in-out'
          }}
        >
          {cleanContent}
        </div>
      </div>
      <style jsx global>{`
        .mermaid {
          background: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
          font-size: 12px;
        }
        .mermaid .node rect,
        .mermaid .node circle,
        .mermaid .node polygon,
        .mermaid .node path {
          fill: ${theme === 'dark' ? '#2d2d2d' : '#f8f8f8'};
          stroke: ${theme === 'dark' ? '#666' : '#333'};
          stroke-width: 2px;
        }
        .mermaid .cluster rect {
          fill: ${theme === 'dark' ? '#2d2d2d' : '#f8f8f8'};
          stroke: ${theme === 'dark' ? '#666' : '#333'};
        }
        .mermaid .label {
          color: ${theme === 'dark' ? '#fff' : '#333'};
          font-weight: 500;
          font-size: 12px;
        }
        .mermaid .edgeLabel {
          background-color: ${theme === 'dark' ? '#2d2d2d' : '#f8f8f8'};
          color: ${theme === 'dark' ? '#fff' : '#333'};
          font-size: 12px;
        }
        .mermaid .edgeLabel span {
          color: ${theme === 'dark' ? '#fff' : '#333'};
          font-size: 12px;
        }
        .mermaid .text-lg {
          font-size: 12px;
          line-height: 1.5;
          color: ${theme === 'dark' ? '#fff' : '#333'};
          font-weight: 500;
        }
        .mermaid .node-hover {
          opacity: 0.8;
          cursor: pointer;
        }
        .mermaid .selected-node rect,
        .mermaid .selected-node circle,
        .mermaid .selected-node polygon {
          stroke: ${theme === 'dark' ? '#00bcd4' : '#2196f3'};
          stroke-width: 3px;
        }
        .mermaid .edgePath {
          stroke: ${theme === 'dark' ? '#666' : '#333'};
          stroke-width: 1.5px;
        }
        .mermaid .edgePath .path {
          stroke: ${theme === 'dark' ? '#666' : '#333'};
          stroke-width: 1.5px;
        }
        .mermaid .marker {
          fill: ${theme === 'dark' ? '#666' : '#333'};
        }
      `}</style>
    </div>
  );
};

export default MermaidChart; 