d3.csv('datasets/life-exp/life-expectancy.csv').then(function(data) {
    const covidYears = [2020, 2021];
    const preCovidYear = 2019;

    const filteredData = data.filter(d => d['Period life expectancy at birth - Sex: total - Age: 0'] !== '');
    const preCovidData = filteredData.filter(d => d.Year == preCovidYear);
    const covidData = filteredData.filter(d => covidYears.includes(d.Year));

    const mergedData = preCovidData.map(pre => {
        const covidEntry = covidData.find(covid => covid.Entity === pre.Entity && covid.Code === pre.Code);
        if (covidEntry) {
            return {
                Entity: pre.Entity,
                lifeExpectancyPreCovid: +pre['Period life expectancy at birth - Sex: total - Age: 0'],
                lifeExpectancyCovid: +covidEntry['Period life expectancy at birth - Sex: total - Age: 0'],
                lifeExpectancyChange: +covidEntry['Period life expectancy at birth - Sex: total - Age: 0'] - +pre['Period life expectancy at birth - Sex: total - Age: 0']
            };
        }
        return null;
    }).filter(d => d !== null);

    mergedData.sort((a, b) => Math.abs(b.lifeExpectancyChange) - Math.abs(a.lifeExpectancyChange));
    const topChanges = mergedData.slice(0, 10);

    const svg = d3.select('#life-expectancy-chart').append('svg')
        .attr('width', '100%')
        .attr('height', 600);

    const margin = { top: 40, right: 20, bottom: 40, left: 200 };
    const width = svg.attr('width') - margin.left - margin.right;
    const height = svg.attr('height') - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
        .domain([d3.min(topChanges, d => d.lifeExpectancyChange), d3.max(topChanges, d => d.lifeExpectancyChange)])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(topChanges.map(d => d.Entity))
        .range([0, height])
        .padding(0.1);

    svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .selectAll('.bar')
        .data(topChanges)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => yScale(d.Entity))
        .attr('width', d => xScale(Math.abs(d.lifeExpectancyChange)))
        .attr('height', yScale.bandwidth())
        .attr('fill', d => d.lifeExpectancyChange < 0 ? 'red' : 'green');

    svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top + height})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .selectAll('.tick text')
        .attr('class', 'axis-label');

    svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .call(d3.axisLeft(yScale).ticks(10))
        .selectAll('.tick text')
        .attr('class', 'axis-label');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -margin.top)
        .attr('y', margin.left / 2)
        .style('text-anchor', 'middle')
        .text('Country/Region');

    svg.append('text')
        .attr('x', width / 2 + margin.left)
        .attr('y', height + margin.top + 30)
        .style('text-anchor', 'middle')
        .text('Life Expectancy Change (Years)');
}).catch(function(error) {
    console.error('Error loading the CSV file:', error);

    
});