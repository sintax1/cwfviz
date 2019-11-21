/* Credit: https://maxdemarzi.com/2012/02/02/graph-visualization-and-neo4j-part-three/ */

var r1 = 960 / 2,
    r0 = r1 - 120;

var fill = d3.scale.category20c();

var chord = d3.layout.chord()
    .padding(.04)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending);

var arc = d3.svg.arc()
    .innerRadius(r0)
    .outerRadius(r0 + 20);

var svg = d3.select("body").append("svg")
    .attr("width", r1 * 2)
    .attr("height", r1 * 2)
  .append("g")
    .attr("transform", "translate(" + r1 + "," + r1 + ")");

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
  var indexByName = {},
      nameByIndex = {},
      matrix = [],
      n = 0;

  function title(title) {
    return title
  }

  // Compute a unique index for each name.
  paths.forEach(function(wr) {
    wr = title(wr.title);
    if (!(wr in indexByName)) {
      nameByIndex[n] = wr;
      indexByName[wr] = n++;
    }
  });

  // Construct a square matrix counting relationships.
  paths.forEach(function(wr) {
    var source = indexByName[title(wr.title)],
        row = matrix[source];
    if (!row) {
     row = matrix[source] = [];
     for (var i = -1; ++i < n;) row[i] = 0;
    }
    wr.related.forEach(function(wr) { row[indexByName[title(wr)]]++; });
  });

  chord.matrix(matrix);

  var g = svg.selectAll("g.group")
      .data(chord.groups)
    .enter().append("g")
      .attr("class", "group");

  g.append("path")
      .style("fill", function(d) { return fill(d.index); })
      .style("stroke", function(d) { return fill(d.index); })
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
      .text(function(d) { return nameByIndex[d.index]; });

  svg.selectAll("path.chord")
      .data(chord.chords)
    .enter().append("path")
      .attr("class", "chord")
      .style("stroke", function(d) { return d3.rgb(fill(d.source.index)).darker(); })
      .style("fill", function(d) { return fill(d.source.index); })
      .attr("d", d3.svg.chord().radius(r0));

}

d3.json("wr-paths", draw);