import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const BarChart = ({ data }) => {
  const svgRef = useRef();
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
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
    
    // Group data by category and calculate average value
    const categoryData = Array.from(
      d3.group(data, d => d.category),
      ([category, values]) => ({
        category,
        value: d3.mean(values, d => d.value)
      })
    );
    
    // Define the x and y scales
    const x = d3.scaleBand()
      .domain(categoryData.map(d => d.category))
      .range([0, width])
      .padding(0.1);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(categoryData, d => d.value) * 1.1])
      .range([height, 0]);
    
    // Add the x-axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end');
    
    // Add the y-axis
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Add the bars
    svg.selectAll('.bar')
      .data(categoryData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.category))
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value))
      .attr('fill', '#4a90e2')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('fill', '#ffa500');
        
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        
        tooltip.html(`<strong>${d.category}</strong><br/>Value: ${d.value.toFixed(2)}`)
          .style('left', (event.pageX) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('fill', '#4a90e2');
        
        // Hide tooltip
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
    
    // Add x-axis label
    svg.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.top + 20})`)
      .style('text-anchor', 'middle')
      .text('Category');
    
    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Average Value');
    
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

export default BarChart;