import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type EnhancedTableProps = {
  headers: string[];
  rows: string[][];
  caption?: string;
  id: string;
  className?: string;
  colorScheme?: 'teal' | 'blue' | 'red' | 'purple' | 'orange' | 'pink';
  compact?: boolean;
  autoResize?: boolean;
  verticalPadding?: 'none' | 'small' | 'medium' | 'large' | 'extra-large' | 'xxl' | 'huge' | 'massive' | 'extreme';
};

export const EnhancedTable = ({
  headers,
  rows,
  caption,
  id,
  className = '',
  colorScheme = 'teal',
  compact = false,
  autoResize = true,
  verticalPadding = 'medium'
}: EnhancedTableProps) => {
  // Define color schemes
  const colorSchemes = {
    teal: {
      headerBg: 'bg-teal-600',
      headerText: 'text-white',
      firstColBg: 'bg-teal-500',
      firstColText: 'text-white',
      evenRowBg: 'bg-gray-50',
      oddRowBg: 'bg-white',
      cellText: 'text-gray-800'
    },
    blue: {
      headerBg: 'bg-blue-600',
      headerText: 'text-white',
      firstColBg: 'bg-blue-500',
      firstColText: 'text-white',
      evenRowBg: 'bg-gray-50',
      oddRowBg: 'bg-white',
      cellText: 'text-gray-800'
    },
    red: {
      headerBg: 'bg-red-600',
      headerText: 'text-white',
      firstColBg: 'bg-red-500',
      firstColText: 'text-white',
      evenRowBg: 'bg-gray-50',
      oddRowBg: 'bg-white',
      cellText: 'text-gray-800'
    },
    purple: {
      headerBg: 'bg-purple-600',
      headerText: 'text-white',
      firstColBg: 'bg-purple-500',
      firstColText: 'text-white',
      evenRowBg: 'bg-gray-50',
      oddRowBg: 'bg-white',
      cellText: 'text-gray-800'
    },
    orange: {
      headerBg: 'bg-orange-500',
      headerText: 'text-white',
      firstColBg: 'bg-orange-400',
      firstColText: 'text-white',
      evenRowBg: 'bg-gray-50',
      oddRowBg: 'bg-white',
      cellText: 'text-gray-800'
    },
    pink: {
      headerBg: 'bg-pink-600',
      headerText: 'text-white',
      firstColBg: 'bg-pink-500',
      firstColText: 'text-white',
      evenRowBg: 'bg-gray-50',
      oddRowBg: 'bg-white',
      cellText: 'text-gray-800'
    }
  };
  
  const colors = colorSchemes[colorScheme];
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  
  // State for dynamic sizing
  const [tableSize, setTableSize] = useState({
    fontSize: compact ? 'text-sm' : 'text-base',
    padding: compact ? 'p-1.5' : 'p-3',
    width: 'w-full'
  });
  
  // Function to calculate and apply responsive sizing
  useEffect(() => {
    if (!containerRef.current || !tableRef.current || !autoResize) return;
    
    const calculateOptimalSize = () => {
      const containerWidth = containerRef.current?.clientWidth || 0;
      const columnCount = headers.length;
      
      // Calculate content density
      const maxCellContentLength = Math.max(
        ...headers.map(h => h.length),
        ...rows.flatMap(row => row.map(cell => cell.length))
      );
      
      // Determine optimal font size and padding based on content and container
      let fontSize = 'text-base';
      let padding = 'p-3';
      
      if (columnCount >= 4 || maxCellContentLength > 15) {
        // More columns or longer content needs smaller text and padding
        fontSize = 'text-sm';
        padding = 'p-2';
      }
      
      if (columnCount >= 6 || maxCellContentLength > 25) {
        // Even more columns or longer content
        fontSize = 'text-xs';
        padding = 'p-1.5';
      }
      
      // Apply compact mode if specified
      if (compact) {
        fontSize = fontSize === 'text-base' ? 'text-sm' : 'text-xs';
        padding = 'p-1.5';
      }
      
      setTableSize({
        fontSize,
        padding,
        width: 'w-full'
      });
    };
    
    // Run calculation immediately
    calculateOptimalSize();
    
    // Set up resize observer for responsive behavior
    const resizeObserver = new ResizeObserver(() => {
      calculateOptimalSize();
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [headers, rows, compact, autoResize]);

  // Determine vertical padding class
  const getVerticalPaddingClass = () => {
    switch (verticalPadding) {
      case 'none': return '';
      case 'small': return 'py-3';
      case 'medium': return 'py-6';
      case 'large': return 'py-10';
      case 'extra-large': return 'py-16';
      case 'xxl': return 'py-20';
      case 'huge': return 'py-24';
      case 'massive': return 'py-32';
      case 'extreme': return 'py-40'; // 10rem (160px) padding top and bottom
      default: return 'py-6';
    }
  };

  return (
    <div ref={containerRef} className={cn("w-full relative", getVerticalPaddingClass(), className)}>
      <div className="rounded-lg overflow-hidden shadow-lg">
        <Table ref={tableRef} className={cn("w-full border-collapse", tableSize.width)}>
          {caption && <TableCaption>{caption}</TableCaption>}
          
          <TableHeader>
            <TableRow className={cn(colors.headerBg, "border-0")}>
              {headers.map((header, index) => (
                <TableHead 
                  key={`${id}-header-${index}`}
                  className={cn(
                    colors.headerText, 
                    "text-center font-medium border-0",
                    tableSize.fontSize,
                    tableSize.padding,
                    "whitespace-nowrap"
                  )}
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow 
                key={`${id}-row-${rowIndex}`} 
                className={cn(
                  "border-0",
                  rowIndex % 2 === 0 ? colors.evenRowBg : colors.oddRowBg
                )}
              >
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={`${id}-row-${rowIndex}-cell-${cellIndex}`}
                    className={cn(
                      cellIndex === 0 ? cn(colors.firstColBg, colors.firstColText, "font-medium") : colors.cellText,
                      "text-center border-0",
                      tableSize.fontSize,
                      tableSize.padding,
                      "whitespace-nowrap"
                    )}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
