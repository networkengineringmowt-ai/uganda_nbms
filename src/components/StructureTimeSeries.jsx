import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import 'echarts-gl';
import DigitalTwin from './DigitalTwin';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getConditionLabel } from '../utils/dataDictionary';

// Simulated condition projection model (simplified Markov/deterioration curve)
const generateTimeSeries = (baseRating, yearBuilt, currentYear) => {
  const startYear = yearBuilt || 1990;
  const rating2017 = baseRating || 7;
  
  const series = [];
  let currentRating = 9; // Max condition when built
  
  for (let year = startYear; year <= currentYear + 10; year++) {
    if (year === 2017) {
      currentRating = rating2017;
    } else if (year > 2017) {
      // Degrade over time
      currentRating = Math.max(1, currentRating - 0.15 * Math.random());
    } else {
      // Interpolate past
      const factor = (year - startYear) / (2017 - startYear);
      currentRating = 9 - (9 - rating2017) * factor;
    }
    
    // Add periodic minor maintenance bumps
    if (year > startYear && year % 15 === 0) {
      currentRating = Math.min(9, currentRating + 1.5);
    }
    
    series.push({ year, rating: parseFloat(currentRating.toFixed(1)) });
  }
  
  return series;
};

export default function StructureTimeSeries({ bridges }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const bridge = bridges[currentIndex];

  const timeSeriesData = useMemo(() => {
    if (!bridge) return [];
    return generateTimeSeries(
      bridge.OverallConditionRating || bridge.LegacyData?.overall_rating,
      parseInt(bridge.LegacyData?.year_compl, 10),
      2026
    );
  }, [bridge]);

  const line3DOption = useMemo(() => {
    const data = timeSeriesData.map(d => [String(d.year), d.rating, 0]);
    return {
      tooltip: {
        formatter: (params) => `${params.value?.[0] || ''}: ${getConditionLabel(params.value?.[1])}`
      },
      visualMap: {
        show: false,
        min: 1,
        max: 9,
        inRange: {
          color: ['#be3a34', '#e3a008', '#168257']
        }
      },
      xAxis3D: { type: 'category', name: 'Year' },
      yAxis3D: { type: 'value', name: 'Condition', axisLabel: { formatter: (value) => getConditionLabel(value) } },
      zAxis3D: { type: 'value', name: '' },
      grid3D: {
        boxWidth: 200,
        boxDepth: 20,
        viewControl: { alpha: 10, beta: 10 }
      },
      series: [{
        type: 'line3D',
        data: data,
        lineStyle: { width: 6, color: '#0ea5e9' }
      }]
    };
  }, [timeSeriesData]);

  if (!bridge) return null;

  return (
    <div className="time-series-container">
      <div className="ts-header">
        <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}><ChevronLeft /></button>
        <div className="ts-title">
          <h2>{bridge.BridgeNumber} - {bridge.BridgeName}</h2>
          <span>{bridge.Region} Region | Built: {bridge.LegacyData?.year_compl || 'Unknown'}</span>
        </div>
        <button onClick={() => setCurrentIndex(Math.min(bridges.length - 1, currentIndex + 1))}><ChevronRight /></button>
      </div>

      <div className="ts-layout">
        <div className="ts-twin-pane glass-card">
          <DigitalTwin asset={bridge} isCulvert={false} />
        </div>
        <div className="ts-chart-pane glass-card">
          <h3 className="card-title">Condition Deterioration Lifecycle</h3>
          <ReactECharts option={line3DOption} style={{ height: 350, width: '100%' }} />
        </div>
      </div>

      <style>{`
        .time-series-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px 0;
        }
        .ts-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.4);
          padding: 20px;
          border-radius: 12px;
        }
        .ts-title {
          text-align: center;
        }
        .ts-title h2 {
          margin: 0;
          font-size: 24px;
          color: #fff;
        }
        .ts-title span {
          color: #94a3b8;
          font-size: 14px;
        }
        .ts-header button {
          background: #2563eb;
          border: none;
          color: white;
          padding: 10px;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.3s;
        }
        .ts-header button:hover {
          background: #1d4ed8;
        }
        .ts-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .ts-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
