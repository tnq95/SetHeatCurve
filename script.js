window.onload = function() {

function log(msg) {
    console.log(msg);
    return
}

var svg = d3.select("svg");
var margin = 100;
var marginHalf = margin / 2;
var width  = svg.attr("width") - margin;
var height = svg.attr("height") - margin;
    
var lineWidth = 1.5;
var circleRadius = 10;
var primaryColor = "cornflowerblue"; // steelblue

let points = [[-30, 20, 0], [-20, 60, 1], [-5, 40, 2], [10, 30, 3], [30, 30, 4], [40, 20, 5]];

let domains = {
    x: [-40, 40],
    y: [0, 80]
}



var x = d3.scaleLinear()
    .rangeRound([0, width]);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);

var xAxis = d3.axisBottom(x);
var yAxis = d3.axisLeft(y);

x.domain(domains.x);
y.domain(domains.y);



var line = d3.line()
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); });

let drag = d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
        
svg.append('rect')
    .attr('class', 'zoom')
    .attr('pointer-events', 'all')
    .attr('width', width)
    .attr('height', height)
    .attr('transform', 'translate(' + marginHalf + ',' + marginHalf + ')')
    .on('mouseover', mouseover)
    .on('mousemove', mousemove)
    .on('mouseout', mouseout);


var focus = svg.append("g")
    .attr("transform", "translate(" + marginHalf + "," + marginHalf + ")");

// Render line
focus.append("path")
    .datum(points)
    .attr("fill", "none")
    .attr("stroke", primaryColor)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", lineWidth)
    .attr("d", line);

// Render Circles
focus.selectAll('circle')
    .data(points)
    .enter()
    .append('circle')
    .attr('r', circleRadius)
    .attr('cx', function(d) { return x(d[0]);  })
    .attr('cy', function(d) { return y(d[1]); })
    .attr("class", "point")
    .style('cursor', 'pointer')
    .style('fill', primaryColor);    
    
focus.selectAll('circle')
    .call(drag);    

// Render Tooltips
renderTooltips(focus, points);

// Render Axis
focus.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);

focus.append('g')
    .attr('class', 'axis axis--y')
    .call(yAxis);

function renderTooltips(_focus, _points) {
    var tooltips = focus.selectAll("g")
        .data(_points)
        .enter().append("g")
        .attr('class', 'tooltip')
        .attr("transform", function(d) { return "translate(" +  x(d[0]) + "," +  y(d[1]) + ")"; });

    tooltips.append('rect')
        .attr('x', - 10)
        .attr('y', 10)
        .attr('width', 65)
        .attr('height', 20)
        .style('fill', "white");

    tooltips.append('text')
        .attr('x', 0)
        .attr('y', 25)
        .text( function(d) { return "" + d[0] + ", " + d[1];  })
}
function updateTooltips(_points) {
    var tooltips = focus.selectAll("g")
        .data(_points)
        .attr("transform", function(d) { return "translate(" +  x(d[0]) + "," +  y(d[1]) + ")"; });

    tooltips.selectAll('text')
        .text( function(d) { return "" + Math.round(d[0]) + ", " + Math.round(d[1]);  })
}

function dragstarted(d) {
    d3.select(this).raise().classed('active', true);
}

function dragged(d) {
    var xMove = x.invert(d3.event.x);
    var yMove = y.invert(d3.event.y);
    
    // Bounds of focus
    if (xMove <= domains.x[0]) xMove = domains.x[0]; 
    else if (xMove >= domains.x[1]) xMove = domains.x[1]; 
    if (yMove <= domains.y[0]) yMove = domains.y[0]; 
    else if (yMove >= domains.y[1]) yMove = domains.y[1]; 

    // Bounds of prev and next points
    var id = d[2];
    if (id <= 0) {
        var next = points[id+1];
        if (xMove >= next[0] - 1) xMove = next[0] - 1
    }
    else if (id > 0 && id < points.length - 1) {
        var prev = points[id-1];
        var next = points[id+1];
        if (xMove <= prev[0] + 1) xMove = prev[0] + 1
        else if (xMove >= next[0] - 1) xMove = next[0] - 1
    }
    else {
        var prev = points[id-1];
        if (xMove <= prev[0] + 1) xMove = prev[0] + 1
    }

    d[0] = xMove;
    d[1] = yMove;

    d3.select(this)
        .attr('cx', x(d[0]))
        .attr('cy', y(d[1]))

    focus.select('path').attr('d', line);
    updateTooltips(points);

    updatePoints(points)
    updateMarker(d[0], d[1])
}

function dragended(d) {
    d3.select(this).classed('active', false);
}


// Aktuellt Börvärde och Mätvärde 30:10
var reads = focus.append('g')
    .attr('class', "reads")

var stepPoints = genPoints(points);
// renderPoints(stepPoints);

function genPoints(_points) {
    var data = [[domains.x[0], domains.y[0]], ..._points, [domains.x[1], domains.y[1]]]
    var stepPoints = [data[0]]

    data.map((d, i) => {
        if (i < data.length - 1) {
            var d1 = data[i];
            var d2 = data[i+1];

            var k = ( ( d2[1] - d1[1] ) / ( d2[0] - d1[0] ) );
            
            var steps = d3.range(d1[0] + 1, d2[0]);
            
            var sY = d1[1];

            steps.map((_x, j) => {
                sY = sY + k;
                stepPoints.push([_x, sY])
            })

            stepPoints.push(d2)
        }
    })
    
    return stepPoints
}
function renderPoints(_stepPoints) {
    reads.append("path")
        .datum(stepPoints)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", "1")
        .attr("d", line);

    reads.selectAll('circle')
        .data(stepPoints)
        .enter()
        .append('circle')
        .attr('r', 3)
        .attr('cx', function(d) { return x(d[0]);  })
        .attr('cy', function(d) { return y(d[1]); })
        .attr("class", "point")
        .style('cursor', 'pointer')
        .style('fill', "green");

    focus.selectAll('circle').raise()
}
function updatePoints(_points) {
    var stepPoints = genPoints(_points);
    reads.select("path").attr("d", line(stepPoints));

    reads.selectAll('circle')
        .data(stepPoints)
        .attr('cx', function(d) { return x(d[0]);  })
        .attr('cy', function(d) { return y(d[1]); });

    focus.selectAll('circle').raise()
}

function mouseover() { 
    stepPoints = genPoints(points);
    focus.selectAll('circle').raise()
}
function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]);
    var i = bisect(stepPoints, x0, 1);
    
    var xStep = stepPoints[i][0]
    var yStep = stepPoints[i][1]
    
    var xMinPoint = points[0][0]
    var xMaxPoint = points[points.length - 1][0]
    
    var yPoints = points.map(p => p[1])
    var yMinPoint = Math.min(...yPoints)
    var yMaxPoint = Math.max(...yPoints)
    
    if (yStep <= yMinPoint) yStep = yMinPoint
    else if (yStep >= yMaxPoint && xStep === xMaxPoint) yStep = yMaxPoint
    
    if (xStep <= xMinPoint) {
        xStep = xMinPoint
        yStep = yPoints[0]
    }
    else if (xStep >= xMaxPoint) {
        xStep = xMaxPoint
        yStep = yPoints[yPoints.length - 1]   
    }
    
    
    updateMarker(xStep, yStep)
}
function mouseout() {
    
}

var bisect = d3.bisector(function(d) { return d[0]; }).left;

var marker = focus.append('g').attr('class', "marker_wrap")
marker.append('circle').attr('cx', x(0)).attr('cy', y(0)).attr('r', 5).attr('fill', 'red').attr('class', 'marker')
marker.append('rect')
    .attr('x', x(0))
    .attr('class', 'marker-rect')
    .attr('width', 1)
    .attr('opacity', 0.25)
    .attr('height', height + 30)
    .attr('fill', 'red');
marker.append('rect')
    .attr('y', y(0))
    .attr('class', 'marker-rect-2')
    .attr('width', width + 30)
    .attr('opacity', 0.25)
    .attr('height', 1)
    .attr('fill', 'red')
    .attr('transform', 'translate(-30,0)');


// LIB ----------------------------------------------------------------------------------
var transformElement = function(args) {
    var transform = args.element.attr('transform')
    var x = parseInt(transform.split('(')[1].split(',')[0])
    var y = parseInt(transform.split(', ')[1].split(')')[0])
    
    var attr = {
        element: args.element,
        x: args.x ? args.x : x,
        y: args.y ? args.y : y,
    }

    attr.element.attr('transform', 'translate(' + attr.x + ', ' + attr.y + ')')
}

function textBox(args) {
    var attr = {
        element: args.element,
        x: args.x ? args.x : 0,
        y: args.y ? args.y : 0,
        height: args.height ? args.height : 30,
        width: args.width ? args.width : 30,
        offset: args.offset ? args.offset : true,
        fill: args.fill ? args.fill : 'green',
        stroke: args.stroke ? args.stroke : '',
        strokeWidth: args.strokeWidth ? args.strokeWidth : 1,
        color: args.color ? args.color : 'black',
        text: args.text ? args.text : '',
    }

    var g = attr.element.append('g')
        .attr('transform', 'translate(' + attr.x + ', ' + attr.y + ')')
        .attr('class', 'textBox')

    g.append('rect')
        .attr('x', attr.offset ? - (attr.width / 2) : x)
        .attr('y', attr.offset ? - (attr.height / 2) : y)
        .attr('width', attr.width)
        .attr('height', attr.height)
        .attr('fill', attr.fill)
        .attr('stroke', attr.stroke)
        .attr('stroke-width', attr.strokeWidth)

    g.append('text')
        .text(attr.text)
        .attr('alignment-baseline', 'middle')
        .attr('text-anchor', 'middle')
        .attr('fill', attr.color)

    return g
}

// MARKER ------------------------------------------------------------------------------------------

var xMarkerBox = textBox({
    element: marker,
    x: x(0),
    y: y(-2.5),
    width: 50,
    height: 30,
    text: "y",
    fill: "white",
    stroke: "red",
})
var yMarkerBox = textBox({
    element: marker,
    x: x(-42.25),
    y: y(0),
    width: 50,
    height: 30,
    text: "x",
    fill: "white",
    stroke: "red",
})

function updateMarker(xStep, yStep) {
    marker.select('.marker').attr('cx', x(xStep)).attr('cy', y(yStep))
    marker.select('.marker-rect').attr('x', x(xStep))
    marker.select('.marker-rect-2').attr('y', y(yStep))
    marker.select('.marker-rect-2').attr('width', x(xStep) + 30)
    
    transformElement({
        element: xMarkerBox,
        x: x(xStep),
    })
    transformElement({
        element: yMarkerBox,
        y: y(yStep),
    })
    
    xMarkerBox.select('text').text(Math.round(xStep))
    yMarkerBox.select('text').text(Math.round(yStep))
}














}
