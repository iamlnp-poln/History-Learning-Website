import React, { useState } from 'react';
import { HISTORY_STAGES } from '../data';

const EventDistributionChart: React.FC = () => {
  const [hoveredData, setHoveredData] = useState<{
    idx: number;
    type: 'vn' | 'world';
    count: number;
    label: string;
    x: number;
    y: number;
  } | null>(null);

  // 1. Process Data
  const chartData = HISTORY_STAGES.map(stage => ({
    label: stage.period.split('-')[0].trim(), // e.g., "1940"
    fullPeriod: stage.period,
    vn: stage.vietnam.length,
    world: stage.world.length,
  }));

  // 2. Chart Dimensions & Scales
  const height = 220;
  const padding = { top: 20, right: 0, bottom: 30, left: 0 };
  
  // Calculate Max Value for scaling
  const maxVal = Math.max(...chartData.map(d => Math.max(d.vn, d.world))) + 2; 

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 w-full animate-slide-up mb-6">
      <div className="flex justify-between items-end mb-4">
        <div>
            <h3 className="text-lg font-bold font-serif text-history-dark">Thống Kê Sự Kiện</h3>
            <p className="text-xs text-gray-500">Số lượng sự kiện qua các thời kỳ</p>
        </div>
        <div className="flex gap-3 text-[10px] font-bold">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-history-red"></span> VN</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> TG</div>
        </div>
      </div>

      <div className="w-full h-[220px] flex items-end justify-between gap-2 md:gap-4 font-sans text-xs">
          {chartData.map((d, i) => {
              const vnHeight = (d.vn / maxVal) * 100;
              const worldHeight = (d.world / maxVal) * 100;
              
              return (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                      {/* Bars Container */}
                      <div className="flex items-end gap-1 w-full justify-center h-full">
                          {/* VN Bar */}
                          <div 
                            className="w-2 md:w-4 bg-history-red rounded-t-sm transition-all duration-500 hover:bg-red-700 relative"
                            style={{ height: `${vnHeight}%` }}
                          >
                             {/* Tooltip On Hover (CSS only for simplicity on mobile) */}
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                VN: {d.vn}
                             </div>
                          </div>
                          
                          {/* World Bar */}
                          <div 
                            className="w-2 md:w-4 bg-blue-500 rounded-t-sm transition-all duration-500 hover:bg-blue-600 relative"
                            style={{ height: `${worldHeight}%` }}
                          >
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                TG: {d.world}
                             </div>
                          </div>
                      </div>
                      
                      {/* X-Axis Label */}
                      <div className="mt-2 text-[10px] md:text-xs text-gray-400 font-medium rotate-0 md:rotate-0">
                          {d.label}s
                      </div>
                  </div>
              )
          })}
      </div>
    </div>
  );
};

export default EventDistributionChart;