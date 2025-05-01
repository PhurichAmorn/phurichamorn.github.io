const canvas = d3.select(".canva");

const svg = canvas.append("svg")
    .attr("width", 800)
    .attr("height", 600);

const margin = { top: 20, right: 20, bottom: 70, left: 70 };
const graphWidth = 600 - margin.left - margin.right;
const graphHeight = 600 - margin.top - margin.bottom;

const graph = svg.append("g")
    .attr("width", graphWidth)
    .attr("height", graphHeight)
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const xAxisGroup = graph.append("g")
    .attr("transform", `translate(0, ${graphHeight})`);
const yAxisGroup = graph.append("g");

xAxisGroup.append("text")
    .attr("x", graphWidth / 2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .style("font-size", "14px")
    .text("Year");

yAxisGroup.append("text")
    .attr("x", -graphHeight / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("fill", "black")
    .style("font-size", "14px")
    .text("Birth Rate (per 1,000 people)");

var tip = d3.tip()
    .attr('class', 'tooltip')
    .offset([-20, 100])
    .html(d => 
        `<strong>Country:</strong> ${d.country.value}<br>
        <strong>Year:</strong> ${d.date}<br>
        <strong>Birth rate: </strong> ${d.value} per 1,000 people`);
graph.call(tip);


Promise.all([
    d3.json('https://api.worldbank.org/v2/countries/THA/indicators/SP.DYN.CBRT.IN?format=json'),
    d3.json('https://api.worldbank.org/v2/countries/JPN/indicators/SP.DYN.CBRT.IN?format=json'),
    d3.json('https://api.worldbank.org/v2/countries/CHN/indicators/SP.DYN.CBRT.IN?format=json'),
    d3.json('https://api.worldbank.org/v2/countries/VNM/indicators/SP.DYN.CBRT.IN?format=json'),
]).then(([thaiData, japanData, chinaData, vietnamData]) => {
    const countries = [
        {name: "Thailand", data: thaiData[1], color: "blue"},
        {name: "Japan", data: japanData[1], color: "magenta"},
        {name: "China", data: chinaData[1], color: "red"},
        {name: "Vietnam", data: vietnamData[1], color: "orange"}
    ];

    countries.forEach(country => {
        country.data.forEach(item => {
            item.date = +item.date;
            item.value = +item.value;
        });

        country.data = country.data.filter(item => item.value !== null && !isNaN(item.value) && !isNaN(item.date) && item.date < 2024); // filter the data

        country.data.sort((a, b) => a.date - b.date);
    });


    const allData = countries.flatMap(country => country.data); 
    const x = d3.scaleLinear()
        .domain(d3.extent(allData, d => d.date))
        .range([0, graphWidth]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(allData, d => d.value)])
        .range([graphHeight, 0]);

    const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(y);

    xAxisGroup.call(xAxis);
    yAxisGroup.call(yAxis);

    countries.forEach(country => {
        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.value))
            .curve(d3.curveMonotoneX);

        const path = graph.append("path")
            .data([country.data])
            .attr("fill", "none")
            .attr("stroke", country.color)
            .attr("stroke-width", 3)
            .attr("d", line)

        const totalLength = path.node().getTotalLength(); // Get the total length of the path

        path
            .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
            .attr("stroke-dashoffset", totalLength)
            .transition() 
            .duration(2000) 
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
            
        graph.selectAll(`.data-circle-${country.name}`)
            .data(country.data)
            .enter()
            .append("circle")
            .attr("class", `data-circle-${country.name}`)
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.value))
            .attr("r", 5)
            .attr("fill", "transparent")
            .on("mouseover", tip.show)
            .on("mouseout", tip.hide);

        const legendGroup = svg.append("g")
        .attr("transform", `translate(${graphWidth + margin.right + 20}, ${margin.top})`);

        countries.forEach((country, i) => {
            const legendRow = legendGroup.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendRow.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", country.color);

            legendRow.append("text")
                .attr("x", 15)
                .attr("y", 10)
                .attr("text-anchor", "start")
                .attr("fill", "black")
                .style("font-size", "12px")
                .text(country.name);
        });
    });
}).catch(error => console.error('Error:', error));

