const canvas = d3.select(".canva");

const svg = canvas.append("svg")
    .attr("width", 810)
    .attr("height", 400);

const margin = {top: 40, right: 80, bottom: 40, left: 80};
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const graph = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const populationTooltip = d3.tip()
    .attr('class', 'tooltip')
    .offset([-10, 0])
    .html(d => `<strong>Country:</strong> ${d.name}<br>
                <strong>Population:</strong> ${d3.format(",")(d.population)}`);
graph.call(populationTooltip);

Promise.all([
    d3.json('https://api.worldbank.org/v2/countries/THA/indicators/SP.POP.TOTL?format=json'),
    d3.json('https://api.worldbank.org/v2/countries/VNM/indicators/SP.POP.TOTL?format=json'),
    d3.json('https://api.worldbank.org/v2/countries/JPN/indicators/SP.POP.TOTL?format=json'),
    d3.json('https://api.worldbank.org/v2/countries/CHN/indicators/SP.POP.TOTL?format=json'),
]).then(([thaiPopData, vietnamData, japanPopData, chinaPopData]) => {
    const popCountries = [
        {name: "Thailand", population: thaiPopData[1][0].value, color: "blue"},
        {name: "Vietnam", population: vietnamData[1][0].value, color: "orange"},
        {name: "Japan", population: japanPopData[1][0].value, color: "magenta"},
        {name: "China", population: chinaPopData[1][0].value, color: "red"}
    ];

    console.log("Population Data:", popCountries);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(popCountries, d => d.population)])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(popCountries.map(d => d.name))
        .range([0, height])
        .padding(0.3);

    const xAxis = d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d3.format(".2s"));

    const yAxis = d3.axisLeft(yScale);

    graph.selectAll("rect")
        .data(popCountries)
        .enter()
        .append("rect")
        .attr("y", d => yScale(d.name))
        .attr("x", 0)
        .attr("height", yScale.bandwidth())
        .attr("width", 0)
        .attr("fill", d => d.color)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .on("mouseover", populationTooltip.show)
        .on("mouseout", populationTooltip.hide)
        .transition()
        .duration(1000)
        .attr("width", d => xScale(d.population))

    graph.selectAll(".label")
        .data(popCountries)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("y", d => yScale(d.name) + yScale.bandwidth() / 2 + 5)
        .attr("x", d => xScale(d.population) + 5)
        .text(d => d3.format(",")(d.population))
        .style("font-size", "12px")
        .style("fill", "black");

    graph.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

    graph.append("g")
        .call(yAxis);

    graph.append("text")
        .attr("x", width / 2)
        .attr("y", height + 35)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Population");
}).catch(err => console.error("Error:", err));
