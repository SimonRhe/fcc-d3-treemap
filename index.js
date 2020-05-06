// Simon Rhe
// May 2020

const TREEMAPDATA_URL = 'kickstarter-funding-data.json';

const SVG_DIV = d3.select('#chart-div');
let svgElement = d3.select('#chart-svg');
let legendElement = d3.select('#legend');

let treemapData;

// Load data then call generate treemap function
d3
	.json(TREEMAPDATA_URL)
	.then((parsedData) => {
		treemapData = parsedData;
		generateTreemap(SVG_DIV, svgElement, legendElement, treemapData);
	})
	.catch((error) => console.log('error: ' + error));

function generateTreemap(div, svg, legend, data) {
	const regexPx = /\d+/; // ignores decimals, 'px'
	const svgWidth = parseInt(svg.style('width').match(regexPx));
	const svgHeight = parseInt(svg.style('height').match(regexPx));

	// Creates a new treemap layout
	let treemapLayout = d3
		.treemap()
		.size([ svgWidth, svgHeight ])
		.padding(1) // note: need to remove to pass fCC test
		.round(true); // note: need to remove to pass fCC test
		// .paddingInner(1); // note: need to add to pass fCC test

	// Constructs a root node from the specified hierarchical data.
	// You must call root.sum before passing the hierarchy to the treemap layout.
	// You probably also want to call root.sort to order the hierarchy before computing the layout.
	let root = d3.hierarchy(data).sum((d) => d.value).sort((a, b) => b.value - a.value);
	let categories = root.children.map((c) => c.data.name);
	let leaves = root.leaves(); // Returns the array of leaf nodes in traversal order; leaves are nodes with no children.

	// Passes the hierarchy to the treemap layout, assigning the following properties on root and its descendants: x0, y0, x1, y1
	treemapLayout(root);

	// Generate color scale
	const colorScheme = categories.map((d, i) => d3.interpolateRainbow(i / categories.length));
	const colorScale = d3.scaleOrdinal(categories, colorScheme);

	// Generate tooltip
	let tooltipDiv = div.append('div').attr('id', 'tooltip').attr('class', 'tooltip-div').style('opacity', 0);

	// Creates <g> groups for tile and text, positions it
	let tileG = svg
		.selectAll('g')
		.data(leaves)
		.enter()
		.append('g')
		.attr('transform', (d) => 'translate(' + d.x0 + ',' + d.y0 + ')');

	// For each <g> group, draws a tile and assigns tooltip mouseover
	let currencyFormater = d3.format('$,');
	tileG
		.append('rect')
		.attr('class', 'tile')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', (d) => d.x1 - d.x0)
		.attr('height', (d) => d.y1 - d.y0)
		.attr('fill', (d) => colorScale(d.data.category))
		.attr('data-name', (d) => d.data.name)
		.attr('data-value', (d) => d.value)
		.attr('data-category', (d) => d.data.category)
		.on('mouseover', (d, i) => {
			let newHtml =
				'<strong>' +
				d.data.name +
				'</strong><br><em>' +
				d.data.category +
				'</em><br>' +
				currencyFormater(d.value);
			tooltipDiv
				.html(newHtml)
				.attr('data-value', d.value)
				.style('opacity', 0.9)
				.style('left', d3.event.pageX + 10 + 'px')
				.style('top', d3.event.pageY - 28 + 'px');
		})
		.on('mouseout', (d, i) => {
			tooltipDiv.style('opacity', 0);
		});

	// For each <g> group, adds name text on tile
	tileG
		.append('text')
		.attr('class', 'tile-text')
		.selectAll('tspan')
		.data((d) => {
			let str = d.data.name;
			let widthPx = d.x1 - d.x0;
			let heightPx = d.y1 - d.y0;
			let widthChar = Math.floor(widthPx / 7);
			let heightLines = Math.floor(heightPx / 15);
			let strArr = [];
			for (let i = 0; i < str.length && strArr.length < heightLines; i += widthChar) {
				strArr.push(str.substring(i, i + widthChar));
			}
			return strArr;
		})
		.enter()
		.append('tspan')
		.attr('x', 4)
		.attr('y', (d, i) => 12 + i * 10)
		.text((e) => e);

	// Draws legend on separate SVG
	let legendG = legend.selectAll('g').data(categories).enter().append('g').attr('transform', (d, i) => {
		let column = Math.floor(i / 5);
		let row = i % 5;
		return 'translate(' + (20 + (column * 125)) + ',' + (20 + (row * 20)) + ')';
	});
	legendG
		.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('height', 15)
		.attr('width', 15)
		.attr('class', 'legend-item')
		.attr('fill', (d) => colorScale(d));
	legendG.append('text').attr('x', 18).attr('y', 10).attr('class', 'legend-text').text((d) => d);
}
