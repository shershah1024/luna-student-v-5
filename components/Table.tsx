import React, { useState, useEffect, useRef } from 'react';

export type TableProps = {
  headers: string[];
  rows: string[][];
  caption?: string;
  id: string;
  className?: string;
  colorScheme?: 'teal' | 'blue' | 'red' | 'purple' | 'orange' | 'pink';
  compact?: boolean;
  autoResize?: boolean;
};

export const Table = ({ 
  headers, 
  rows, 
  caption, 
  id, 
  className = '', 
  colorScheme = 'teal', 
  compact = false,
  autoResize = true
}: TableProps) => {
  // Define color schemes - modern PowerPoint style
  const colorSchemes = {
    teal: {
      headerBg: 'bg-teal-600',
      headerText: 'text-white',
      firstColBg: 'bg-teal-500',
      firstColText: 'text-white',
      cellBg: 'bg-gray-50',
      cellText: 'text-gray-800'
    },
    blue: {
      headerBg: 'bg-blue-600',
      headerText: 'text-white',
      firstColBg: 'bg-blue-500',
      firstColText: 'text-white',
      cellBg: 'bg-gray-50',
      cellText: 'text-gray-800'
    },
    red: {
      headerBg: 'bg-red-600',
      headerText: 'text-white',
      firstColBg: 'bg-red-500',
      firstColText: 'text-white',
      cellBg: 'bg-gray-50',
      cellText: 'text-gray-800'
    },
    purple: {
      headerBg: 'bg-purple-600',
      headerText: 'text-white',
      firstColBg: 'bg-purple-500',
      firstColText: 'text-white',
      cellBg: 'bg-gray-50',
      cellText: 'text-gray-800'
    },
    orange: {
      headerBg: 'bg-orange-500',
      headerText: 'text-white',
      firstColBg: 'bg-orange-400',
      firstColText: 'text-white',
      cellBg: 'bg-gray-50',
      cellText: 'text-gray-800'
    },
    pink: {
      headerBg: 'bg-pink-600',
      headerText: 'text-white',
      firstColBg: 'bg-pink-500',
      firstColText: 'text-white',
      cellBg: 'bg-gray-50',
      cellText: 'text-gray-800'
    }
  };
  
  const colors = colorSchemes[colorScheme];
  const tableRef = useRef<HTMLTableElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Function to calculate table dimensions and apply appropriate styles
  useEffect(() => {
    if (!tableRef.current || !containerRef.current || !autoResize) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (!tableRef.current || !containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const tableNaturalWidth = tableRef.current.scrollWidth;
      const columnCount = headers.length;
      
      // Calculate content density
      const maxCellContentLength = Math.max(
        ...headers.map(h => h.length),
        ...rows.flatMap(row => row.map(cell => cell.length))
      );
      
      // Calculate appropriate font size based on content and available width
      let fontSize = 16; // Default font size
      let cellPadding = 16; // Default padding
      
      if (tableNaturalWidth > containerWidth || maxCellContentLength > 15) {
        // Need to scale down
        const scaleFactor = Math.min(containerWidth / (tableNaturalWidth || 1), 1);
        fontSize = Math.max(Math.floor(16 * (0.8 + 0.2 * scaleFactor)), 12);
        cellPadding = Math.max(Math.floor(16 * scaleFactor), 8);
      } else if (columnCount <= 3 && maxCellContentLength < 10) {
        // Can scale up for small tables with little content
        fontSize = 18;
        cellPadding = 20;
      }
      
      // Apply calculated styles
      tableRef.current.style.setProperty('--table-font-size', `${fontSize}px`);
      tableRef.current.style.setProperty('--table-cell-padding', `${cellPadding}px`);
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [headers, rows, autoResize]);
  
  // Apply custom styles for the table
  const tableStyles = {
    '--table-font-size': compact ? '14px' : '16px',
    '--table-cell-padding': compact ? '8px' : '16px',
  } as React.CSSProperties;

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <table 
        ref={tableRef} 
        className="w-full border-separate border-spacing-0 shadow-lg" 
        style={{ ...tableStyles, tableLayout: 'auto' }}>
          {caption && (
            <caption className="sr-only">
              {caption}
            </caption>
          )}
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th
                  key={`${id}-header-${index}`}
                  scope="col"
                  className={`${colors.headerBg} ${colors.headerText} text-center font-medium ${index === 0 && 'rounded-tl-lg'} ${index === headers.length - 1 && 'rounded-tr-lg'}`}
                  style={{
                    fontSize: 'var(--table-font-size)',
                    padding: 'var(--table-cell-padding)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${id}-row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${id}-row-${rowIndex}-cell-${cellIndex}`}
                    className={`
                      ${cellIndex === 0 ? `${colors.firstColBg} ${colors.firstColText} font-medium` : `${colors.cellBg} ${colors.cellText}`}
                      text-center
                      ${rowIndex === rows.length - 1 && cellIndex === 0 && 'rounded-bl-lg'}
                      ${rowIndex === rows.length - 1 && cellIndex === row.length - 1 && 'rounded-br-lg'}
                      ${rowIndex > 0 ? 'border-t border-white' : ''}
                      ${cellIndex > 0 ? 'border-l border-white' : ''}
                    `}
                    style={{
                      fontSize: 'var(--table-font-size)',
                      padding: 'var(--table-cell-padding)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
};
