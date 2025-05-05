import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const LineChart = ({ data }) => {
  const svgRef = useRef();
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Clear any existing chart
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Group data by category
    const categories = Array.from(new Set(data.map(d => d.category)));
    
    // Create a color scale
    const color = d3.scaleOrdinal()
      .domain(categories)
      .range(d3.schemeCategory10);
    
    // Define the x and y scales
    const x = d3.scaleTime()
      .domain(d3.extent(sortedData, d => new Date(d.timestamp)))
      .range([0, width]);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(sortedData, d => d.value) * 1.1])
      .range([height, 0]);
    
    // Add the x-axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));
    
    // Add the y-axis
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Create a line generator
    const line = d3.line()
      .x(d => x(new Date(d.timestamp)))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);
    
    // Group data by category for line drawing
    const categoryData = Array.from(
      d3.group(sortedData, d => d.category),
      ([category, values]) => ({ category, values })
    );
    
    // Add the lines
    categoryData.forEach(category => {
      svg.append('path')
        .datum(category.values)
        .attr('fill', 'none')
        .attr('stroke', color(category.category))
        .attr('stroke-width', 2)
        .attr('d', line);
      
      // Add dots for each data point
      svg.selectAll(`.dot-${category.category.replace(/\s+/g, '-')}`)
        .data(category.values)
        .enter()
        .append('circle')
        .attr('class', `dot-${category.category.replace(/\s+/g, '-')}`)
        .attr('cx', d => x(new Date(d.timestamp)))
        .attr('cy', d => y(d.value))
        .attr('r', 4)
        .attr('fill', color(category.category))
        .on('mouseover', function(event, d) {
          d3.select(this)
            .attr('r', 6)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
          
          // Show tooltip
          tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          
          tooltip.html(`
            <strong>${d.label}</strong><br/>
            Category: ${d.category}<br/>
            Value: ${d.value}<br/>
            Time: ${new Date(d.timestamp).toLocaleString()}
          `)
            .style('left', (event.pageX) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('r', 4)
            .attr('stroke', 'none');
          
          // Hide tooltip
          tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        });
    });
    
    // Add legend
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data(categories)
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(0,${i * 20})`);
    
    legend.append('rect')
      .attr('x', width - 19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', d => color(d));
    
    legend.append('text')
      .attr('x', width - 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text(d => d);
    
    // Add x-axis label
    svg.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.top + 20})`)
      .style('text-anchor', 'middle')
      .text('Time');
    
    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Value');
    
    // Add tooltip div
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
    
    // Clean up the tooltip when the component unmounts
    return () => {
      d3.select('.tooltip').remove();
    };
  }, [data]);
  
  return (
    <div style={{ width: '100%', height: '400px' }}>
      {data && data.length > 0 ? (
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
      ) : (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          border: '1px dashed #ccc',
          borderRadius: '4px'
        }}>
          No data available to display
        </div>
      )}
    </div>
  );
};

export default LineChart;