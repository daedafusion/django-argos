if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

function TimelineLayout(fdg, force, graph) {
    this.fdg = fdg;
    this.force = force;
    this.graph = graph;

    this.placement = {};
}

TimelineLayout.prototype.clean = function() {

    this.placement = {};
    this.graph.selectAll('g.x.axis').remove();

};

TimelineLayout.prototype.layout = function() {
    var self = this;

    this.force.stop();

    var extent = this._computeExtent();

    // Add buffer
    var buf = (extent.max - extent.min) * 0.1;

    extent.min = extent.min - buf;
    extent.max = extent.max + buf;

    var viewportWidth = this.fdg.width;
    var viewportHeight = this.fdg.height;

    //var customTimeFormat = d3.time.format.multi([
    //  [".%L", function(d) { return d.getMilliseconds(); }],
    //  [":%S", function(d) { return d.getSeconds(); }],
    //  ["%I:%M", function(d) { return d.getMinutes(); }],
    //  ["%I %p", function(d) { return d.getHours(); }],
    //  ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
    //  ["%b %d %Y", function(d) { return d.getDate() != 1; }],
    //  ["%B", function(d) { return d.getMonth(); }],
    //  ["%Y", function() { return true; }]
    //]);

    // Figure out best format
    var format = d3.time.format.iso;

    if(extent.max - extent.min < (1000*60*60)){ // hour
        format = d3.time.format("%Y-%m-%dT%H:%M");
    } else if (extent.max - extent.min < (1000*60*60*24)) { // day
        format = d3.time.format("%Y-%m-%d %I%p");
    } else if (extent.max - extent.min < (1000*60*60*24*30)) { // month
        format = d3.time.format("%Y-%m-%d");
    } else if (extent.max - extent.min < (1000*60*60*24*30*365)) { // year
        format = d3.time.format("%b %d %Y");
    } else if (extent.max - extent.min > (1000*60*60*24*30*365)) { // year
        format = d3.time.format("%b %Y");
    }

    var x = d3.time.scale().range([0, viewportWidth]);
    var xAxis = d3.svg.axis().scale(x).orient('bottom').tickSize(-1*viewportHeight + 100, 0).tickPadding(6).tickFormat(format);

    this.graph.append("svg:g")
        .attr('class', 'x axis')
        .attr('transform', sprintf('translate(0, %d)', viewportHeight-40));

    x.domain([new Date(extent.min), new Date(extent.max)]);

    self.force.nodes().forEach(function(n){
        if(self.placement[n.anchor] == null){
            if(n.y > 0) {
                n.y = -0.5 * n.y;
                n.py = n.y;
            }
        } else {
            var xpt = x(new Date(self.placement[n.anchor]));
            n.x = xpt;
            n.px = n.x;
            if(n.y < 100){
                n.y = 100;
                n.py = n.y;
            } else if(n.y > viewportHeight){
                n.y = n.y % viewportHeight;
                n.py = n.y;
            }
        }
    });

    self.graph.select('g.x.axis').call(xAxis);

    var nodes = self.graph.selectAll(".node").data(self.force.nodes(), function(n){return n.anchor.idHash();});

    nodes.transition().duration(1000).attr('transform', function(d){
        return sprintf("translate(%d, %d)", d.x, d.y);
    });

    var links = self.graph.selectAll(".link").data(self.force.links(), function(d){ return d.anchor; });

    links.select(".link-line").transition().duration(1000)
        .attr("x1", function(d){ return d.source.x; })
        .attr("y1", function(d){ return d.source.y; })
        .attr("x2", function(d){ return d.target.x; })
        .attr("y2", function(d){ return d.target.y; });

    // TODO
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
};

TimelineLayout.prototype._computeExtent = function(){
    var self = this;

    var extent = {
        min: Number.MAX_VALUE,
        max: Number.MIN_VALUE
    };

    this.force.nodes().forEach(function(n){

        n.fixed = true;

        var earliest = Number.MAX_VALUE;
        //var latest = Number.MIN_VALUE;

        self.placement[n.anchor] = null;

        Object.keys(n.properties).forEach(function(p){

            var pl = p.toLowerCase();

            if(
                (pl.endsWith('time') ||
                pl.endsWith('date') ||
                    pl.endsWith('timestamp') ||
                    pl.endsWith('lastmodified')) && !pl.endsWith('update')
            ){
                var values = n.properties[p];

                Object.keys(values).forEach(function(v){

                    var d = new Date(v);
                    var t = d.getTime();

                    if(t < earliest){
                        earliest = t;
                    }

                    if(t < extent.min){
                        extent.min = t;
                    }
                    if(t > extent.max){
                        extent.max = t;
                    }

                });

            }

        });

        if(earliest != Number.MAX_VALUE){
            self.placement[n.anchor] = earliest;
        }

    });

    return extent;

};

TimelineLayout.prototype.drag = function(d, e){
    if(this.placement[d.anchor] == null) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x = d3.event.x;
        d.y = d3.event.y;
    } else {
        // Only apply y
        d.py += d3.event.dy;
        d.y = d3.event.y;
    }
};