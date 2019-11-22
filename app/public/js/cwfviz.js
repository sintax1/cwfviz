/* Based on Max's work here: https://maxdemarzi.com/2012/02/02/graph-visualization-and-neo4j-part-three/ */

var r1 = 960 / 2,
    r0 = r1 - 120;

var fill = d3.scale.category20c();

function colorscale(color) {
  color2 = d3.hsl(color).darker(10);
  return d3.scale.linear()
  .domain([1, 20])
  .range([color, color2]);
}

var chord = d3.layout.chord()
    .padding(.04)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending);

var arc = d3.svg.arc()
    .innerRadius(r0)
    .outerRadius(r0 + 20);

var svg = d3.select("body").append("svg")
    .attr("width", r1 * 2 + 40)
    .attr("height", r1 * 2 + 40)
  .append("g")
    .attr("transform", "translate(" + r1 + "," + r1 + ")");

/** Text wrap */
function wrap(text, width) {
  text.each(function () {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineHeight = 1.1, // ems
          x = 0,
          y = text.attr("y"),
          dy = 0,
          tspan = text.text(null)
                      .append("tspan")
                      .attr("x", x)
                      .attr("y", y)
                      .attr("dy", dy + "em");
      while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan")
                          .attr("x", x)
                          .attr("y", y)
                          .attr("dy", function() { return lineHeight + dy + "em"; })
                          .text(word);
          }
      }
  });
}

var category_colors = {
  SP: '#eb4034',
  OM: '#00a87e',
  OV: '#2677e0',
  PR: '#e02692',
  AN: '#cc780a',
  CO: '#029600',
  IN: '#945dc7'
}

function categoryToColor(cat) {
  return category_colors[cat];
}
/** Returns an event handler for fading a given chord group. */
function fade(opacity) {
  return function(g, i) {
    svg.selectAll("g path.chord")
        .filter(function(d) {
          return d.source.index != i && d.target.index != i;
        })
      .transition()
        .style("opacity", opacity);
  };
}
  
function draw(paths) {
  var indexByTitle = {},
      titleByIndex = {},
      catByIndex = {},
      matrix = [],
      n = 0;

  function toStr(str) {
    return str
  }

  // Compute a unique index for each workrole
  paths.forEach(function(wr) {
    title = toStr(wr.title);
    if (!(title in indexByTitle)) {
      titleByIndex[n] = title;
      catByIndex[n] = toStr(wr.category);
      indexByTitle[title] = n++;
    }
  });

  // Construct a square matrix counting relationships.
  paths.forEach(function(wr) {
    var source = indexByTitle[toStr(wr.title)],
        row = matrix[source];
    if (!row) {
     row = matrix[source] = [];
     for (var i = -1; ++i < n;) row[i] = 0;
    }
    wr.related.forEach(function(wr) { row[indexByTitle[toStr(wr)]]++; });
  });

  chord.matrix(matrix);

  var g = svg.selectAll("g.group")
      .data(chord.groups)
    .enter().append("g")
      .attr("class", "group");

  g.append("path")
      .style("fill", function(d) { return categoryToColor(catByIndex[d.index]); })
      .style("stroke", function(d) { return categoryToColor(catByIndex[d.index]); })
      .attr("d", arc)
      .on("mouseover", fade(0))
      .on("mouseout", fade(1));
      
  g.append("text")
      .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
      .attr("transform", function(d) {
        return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
            + "translate(" + (r0 + 26) + ")"
            + (d.angle > Math.PI ? "rotate(180)" : "");
      })
      .text(function(d) { return titleByIndex[d.index]; })
      .call(wrap, 120);

  svg.selectAll("path.chord")
      .data(chord.chords)
    .enter().append("path")
      .attr("class", "chord")
      .style("stroke", function(d) { return d3.rgb(categoryToColor(catByIndex[d.source.index])).darker(); })
      .style("fill", function(d) { return categoryToColor(catByIndex[d.source.index]); })
      .attr("d", d3.svg.chord().radius(r0));
}

d3.json("wr-paths", draw);