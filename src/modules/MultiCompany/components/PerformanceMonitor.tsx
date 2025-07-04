import React, { useState, useEffect } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  nodeCount: number;
  memoryUsage: number;
  fps: number;
  timestamp: number;
}

interface PerformanceMonitorProps {
  componentName: string;
  metrics: PerformanceMetrics;
  thresholds: {
    maxRenderTime: number;
    maxNodes: number;
    maxMemoryUsage: number;
    minFPS: number;
  };
  onThresholdExceeded?: (metric: string, value: number, threshold: number) => void;
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  componentName,
  metrics,
  thresholds,
  onThresholdExceeded,
  className = ''
}) => {
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  // Add metrics to history
  useEffect(() => {
    setHistory(prev => [...prev.slice(-9), metrics]);
    
    // Check thresholds
    const newAlerts: string[] = [];
    
    if (metrics.renderTime > thresholds.maxRenderTime) {
      newAlerts.push(`Render time (${metrics.renderTime}ms) exceeds threshold (${thresholds.maxRenderTime}ms)`);
      onThresholdExceeded?.('renderTime', metrics.renderTime, thresholds.maxRenderTime);
    }
    
    if (metrics.nodeCount > thresholds.maxNodes) {
      newAlerts.push(`Node count (${metrics.nodeCount}) exceeds threshold (${thresholds.maxNodes})`);
      onThresholdExceeded?.('nodeCount', metrics.nodeCount, thresholds.maxNodes);
    }
    
    if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
      newAlerts.push(`Memory usage (${Math.round(metrics.memoryUsage)}MB) exceeds threshold (${thresholds.maxMemoryUsage}MB)`);
      onThresholdExceeded?.('memoryUsage', metrics.memoryUsage, thresholds.maxMemoryUsage);
    }
    
    if (metrics.fps < thresholds.minFPS) {
      newAlerts.push(`FPS (${metrics.fps}) below threshold (${thresholds.minFPS})`);
      onThresholdExceeded?.('fps', metrics.fps, thresholds.minFPS);
    }
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
    }
  }, [metrics, thresholds, onThresholdExceeded]);

  // Calculate averages
  const averages = history.length > 0 ? {
    renderTime: history.reduce((sum, m) => sum + m.renderTime, 0) / history.length,
    nodeCount: history.reduce((sum, m) => sum + m.nodeCount, 0) / history.length,
    memoryUsage: history.reduce((sum, m) => sum + m.memoryUsage, 0) / history.length,
    fps: history.reduce((sum, m) => sum + m.fps, 0) / history.length
  } : null;

  const getStatusColor = (value: number, threshold: number, isLowerBetter = false) => {
    const ratio = isLowerBetter ? threshold / value : value / threshold;
    if (ratio >= 0.9) return 'text-green-600';
    if (ratio >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (value: number, threshold: number, isLowerBetter = false) => {
    const ratio = isLowerBetter ? threshold / value : value / threshold;
    if (ratio >= 0.9) return '🟢';
    if (ratio >= 0.7) return '🟡';
    return '🔴';
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className={`performance-monitor ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Performance Monitor: {componentName}
          </h3>
          <div className="text-sm text-gray-500">
            {new Date(metrics.timestamp).toLocaleTimeString()}
          </div>
        </div>

        {/* Current Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.renderTime.toFixed(1)}ms
            </div>
            <div className="text-sm text-gray-600">Render Time</div>
            <div className={`text-xs ${getStatusColor(metrics.renderTime, thresholds.maxRenderTime, true)}`}>
              {getStatusIcon(metrics.renderTime, thresholds.maxRenderTime, true)} 
              Threshold: {thresholds.maxRenderTime}ms
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.nodeCount}
            </div>
            <div className="text-sm text-gray-600">Nodes</div>
            <div className={`text-xs ${getStatusColor(metrics.nodeCount, thresholds.maxNodes)}`}>
              {getStatusIcon(metrics.nodeCount, thresholds.maxNodes)} 
              Threshold: {thresholds.maxNodes}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(metrics.memoryUsage)}MB
            </div>
            <div className="text-sm text-gray-600">Memory</div>
            <div className={`text-xs ${getStatusColor(metrics.memoryUsage, thresholds.maxMemoryUsage)}`}>
              {getStatusIcon(metrics.memoryUsage, thresholds.maxMemoryUsage)} 
              Threshold: {thresholds.maxMemoryUsage}MB
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.fps}
            </div>
            <div className="text-sm text-gray-600">FPS</div>
            <div className={`text-xs ${getStatusColor(metrics.fps, thresholds.minFPS, true)}`}>
              {getStatusIcon(metrics.fps, thresholds.minFPS, true)} 
              Threshold: {thresholds.minFPS}
            </div>
          </div>
        </div>

        {/* Averages */}
        {averages && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Averages (Last 10)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>Render: {averages.renderTime.toFixed(1)}ms</div>
              <div>Nodes: {Math.round(averages.nodeCount)}</div>
              <div>Memory: {Math.round(averages.memoryUsage)}MB</div>
              <div>FPS: {Math.round(averages.fps)}</div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-red-700 mb-2">Performance Alerts</h4>
            <div className="space-y-1">
              {alerts.slice(-5).map((alert, index) => (
                <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  ⚠️ {alert}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Chart */}
        {history.length > 1 && (
          <div className="h-20 bg-gray-50 rounded-lg p-2">
            <div className="flex items-end justify-between h-full space-x-1">
              {history.map((metric, index) => (
                <div
                  key={index}
                  className="flex-1 bg-blue-500 rounded-t"
                  style={{
                    height: `${Math.min(100, (metric.renderTime / thresholds.maxRenderTime) * 100)}%`,
                    opacity: 0.3 + (index / history.length) * 0.7
                  }}
                  title={`${metric.renderTime.toFixed(1)}ms`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setAlerts([])}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear Alerts
          </button>
          <button
            onClick={() => setHistory([])}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Reset History
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor; 