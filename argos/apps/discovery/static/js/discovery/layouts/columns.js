
function ColumnLayout(force, graph) {
    this.force = force;
    this.graph = graph;

    this.columns = [];
}

ColumnLayout.prototype.clean = function() {
    this.columns = [];
    this.graph.selectAll("g.column_header_g").remove();
};

ColumnLayout.prototype.layout = function() {
    var self = this;

    this.force.stop();

    this.columns = [];

    var types = this._computeTypes();

    // Add any new types
    Object.keys(types).forEach(function(t){
        if($.inArray(t, self.columns) == -1){
            self.columns.push(t);
        }
    });


    var columnWidthCounter = 0;

    var columnHeaders = this.columns.map(function(type, index, arr){

        var thisWidth = 300; // minimum width

        types[type].forEach(function(n, row){

            // getBoundingClientRect() is affected by zoom! getBBox() does not seem to be affected
            var gW = $("#"+ n.anchor.idHash())[0].getBBox().width+40; // icon width
            thisWidth = Math.max(gW, thisWidth);

            n.x = columnWidthCounter;
            n.y = (row+1) * 40; // icon height
            n.px = columnWidthCounter;
            n.py = (row+1) * 40;
            row++;
        });

        var tmp = columnWidthCounter;
        columnWidthCounter += thisWidth;

        return {
            title: type,
            x: tmp,
            y: 0,
            width: thisWidth
        };

    });

    var nodes = this.graph.selectAll(".node").data(this.force.nodes(), function(d){return d.anchor.idHash();});

    nodes.transition().duration(1000).attr("transform", function(d){
        return sprintf("translate(%d, %d)", d.x, d.y);
    });

    var links = this.graph.selectAll(".link").data(this.force.links(), function(d){ return d.anchor; });

    links.select(".link-line").transition().duration(1000)
        .attr("x1", function(d){ return d.source.x; })
        .attr("y1", function(d){ return d.source.y; })
        .attr("x2", function(d){ return d.target.x; })
        .attr("y2", function(d){ return d.target.y; });

    // TODO move this to some common code
    links.select(".link-label").transition().duration(1000)
        .attr("x", function(d){
            return (d.source.x+ d.target.x)/2;
        })
        .attr("y", function(d){
            return (d.source.y+ d.target.y)/2;
        })
        .attr("transform", function(d){

            var quadX = d.source.x - d.target.x;
            var quadY = d.source.y - d.target.y;

            var r = Math.atan(Math.abs(quadY)/Math.abs(quadX)) * (180.0/Math.PI);

            if(quadX > 0 && quadY > 0){
                r = 180+r;
            } else if(quadX < 0 && quadY < 0){
                r = r;
            } else if(quadX > 0 && quadY < 0){
                r = 180-r;
            } else if(quadX < 0 && quadY > 0){
                r = 360-r;
            }

            return sprintf("rotate(%d %d %d)", r, (d.source.x+ d.target.x)/2, (d.source.y+ d.target.y)/2);
        });

    var headers = this.graph.selectAll("g.column_header_g").data(columnHeaders, function(d){return d.title.idHash();});

    var header = headers.enter().append("svg:g")
        .attr("id", function(d){return d.title.idHash();})
        .attr("class", "column_header_g");

    header.insert("svg:rect")
        .attr("class", "column_header")
        .attr("x", "-20")
        .attr("y", "-20")
        .attr("fill", "lightgray")
        .attr("stroke", "black")
        .attr("stroke-width", "1px")
        .attr("width", function(d){return d.width;})
        .attr("height", 40);

    header.insert("svg:text")
        .attr("class", "column_header_title")
        .attr("dx", 70)
        .attr("dy", "0.35em")
        .text(function(d){return d.title.substring(d.title.indexOf("#")+1);});

    headers.exit().remove();

    headers.transition().duration(1000).attr("transform", function(d){return sprintf("translate(%d, %d)", d.x, d.y);});
};

ColumnLayout.prototype._computeTypes = function() {

    var types = {};

    this.force.nodes().forEach(function(n){

        n.fixed = true;

        if(n.type in types){
            types[n.type].push(n);
            return;
        }

        types[n.type] = [n];

    });

    return types;
};

ColumnLayout.prototype.drag = function(d, e){
    d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x = d3.event.x;
    d.y = d3.event.y;
};