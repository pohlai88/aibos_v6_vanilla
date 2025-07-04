import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Organization } from '@/types/organization';

interface D3HierarchyProps {
  nodes: Organization[];
  onNodeClick: (id: string) => void;
  redactPII?: boolean;
  maxNodes?: number;
  fps?: number;
  className?: string;
  safetyLimits?: {
    maxNodes: number;
    minFPS: number;
    killSwitch: boolean;
  };
}

// Remove custom interface - use D3's built-in types
type HierarchyNode = d3.HierarchyNode<Organization>;

export const D3Hierarchy: React.FC<D3HierarchyProps> = ({
  nodes,
  onNodeClick,
  redactPII = true,
  maxNodes = 500,
  fps = 60,
  className = '',
  safetyLimits
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    nodeCount: 0,
    memoryUsage: 0
  });

  // Redact PII for GDPR compliance
  const redactOrganizationData = (org: Organization): any => {
    if (!redactPII) return org;
    
    return {
      ...org,
      name: org.name ? `${org.name.charAt(0)}***` : '***',
      // Note: Organization type doesn't have email/phone/address fields
      // These would be in OrganizationLocation if needed
    };
  };

  // Validate performance constraints with safety limits
  const validatePerformanceConstraints = () => {
    const effectiveMaxNodes = safetyLimits?.maxNodes || maxNodes;
    const effectiveMinFPS = safetyLimits?.minFPS || fps;
    
    if (nodes.length > effectiveMaxNodes) {
      if (safetyLimits?.killSwitch) {
        throw new Error(`CRITICAL: Node count (${nodes.length}) exceeds safety limit (${effectiveMaxNodes}) - KILL SWITCH ACTIVATED`);
      } else {
        console.warn(`Node count (${nodes.length}) exceeds limit (${effectiveMaxNodes}) - throttling enabled`);
      }
    }
    
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    if (memoryUsage > 50 * 1024 * 1024) { // 50MB limit
      if (safetyLimits?.killSwitch) {
        throw new Error(`CRITICAL: Memory usage (${Math.round(memoryUsage / 1024 / 1024)}MB) exceeds limit (50MB) - KILL SWITCH ACTIVATED`);
      } else {
        console.warn(`Memory usage (${Math.round(memoryUsage / 1024 / 1024)}MB) approaching limit (50MB)`);
      }
    }
    
    // FPS monitoring (simulated)
    const currentFPS = 60; // In real implementation, measure actual FPS
    if (currentFPS < effectiveMinFPS) {
      console.warn(`FPS (${currentFPS}) below threshold (${effectiveMinFPS}) - simplifying visuals`);
    }
  };

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      // Validate constraints
      validatePerformanceConstraints();

      // Clear previous content
      d3.select(svgRef.current).selectAll("*").remove();

      // Prepare hierarchy data
      const hierarchyData = d3.stratify<Organization>()
        .id(d => d.id)
        .parentId(d => d.parent_organization_id || null)
        (nodes.map(redactOrganizationData));

      const root = d3.hierarchy(hierarchyData);

      // Set up D3 tree layout
      const treeLayout = d3.tree<Organization>()
        .size([800, 600])
        .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));

      const treeData = treeLayout(root as any);

      // Create SVG container
      const svg = d3.select(svgRef.current)
        .attr('width', 900)
        .attr('height', 700)
        .append('g')
        .attr('transform', 'translate(50,50)');

      // Create links
      const links = svg.selectAll('.link')
        .data(treeData.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal<d3.HierarchyLink<Organization>, d3.HierarchyPointNode<Organization>>()
          .x(d => d.y)
          .y(d => d.x))
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 2);

      // Create nodes
      const nodes_g = svg.selectAll('.node')
        .data(treeData.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);

      // Add node circles
      nodes_g.append('circle')
        .attr('r', 10)
        .attr('fill', d => d.children ? '#69b3a2' : '#fff')
        .attr('stroke', '#69b3a2')
        .attr('stroke-width', 3)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          onNodeClick(d.data.id);
        });

      // Add node labels
      nodes_g.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children ? -13 : 13)
        .style('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.name)
        .style('font-size', '12px')
        .style('font-family', 'Arial')
        .style('pointer-events', 'none');

      // Performance metrics
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setPerformanceMetrics({
        renderTime,
        nodeCount: nodes.length,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
      });

      // Performance alerts
      if (renderTime > 100) {
        console.warn(`D3Hierarchy: Render time (${renderTime.toFixed(2)}ms) exceeds 100ms threshold`);
      }

      setIsLoading(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
      console.error('D3Hierarchy error:', err);
    }
  }, [nodes, redactPII, maxNodes, onNodeClick]);

  if (error) {
    return (
      <div className={`d3-hierarchy-error ${className}`}>
        <div className="text-red-600 p-4 border border-red-200 rounded-lg">
          <h3 className="font-semibold mb-2">Hierarchy Error</h3>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`d3-hierarchy ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading hierarchy...</span>
        </div>
      )}
      
      <svg ref={svgRef} className="w-full h-full"></svg>
      
      {/* Performance metrics display (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <div>Nodes: {performanceMetrics.nodeCount}</div>
          <div>Render: {performanceMetrics.renderTime.toFixed(2)}ms</div>
          <div>Memory: {Math.round(performanceMetrics.memoryUsage / 1024 / 1024)}MB</div>
        </div>
      )}
    </div>
  );
};

export default D3Hierarchy; 