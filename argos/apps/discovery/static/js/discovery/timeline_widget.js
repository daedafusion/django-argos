/*!
 * jQuery UI Widget-factory plugin boilerplate (for 1.8/9+)
 * Author: @addyosmani
 * Further changes: @peolanha
 * Licensed under the MIT license
 */

;(function ( $, window, document, undefined ) {

    // define your widget under a namespace of your choice
    //  with additional parameters e.g.
    // $.widget( "namespace.widgetname", (optional) - an
    // existing widget prototype to inherit from, an object
    // literal to become the widget's prototype );

    $.widget( "argos.timelineWidget" , {

        //Options to be used as defaults
        options: {
            someValue: null
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;

            this.nodeMap = {};
            this.nodes = [];

            this.width = this.element.width();
            this.height = this.element.height();

            var svg = this.svg = d3.select(this.element[0]).append("svg:svg")
                .attr("width", this.width)
                .attr("height", this.height);

            var timeScale = this.timeScale = d3.time.scale().range([0, this.width]);

            var timeAxis = this.timeAxis = d3.svg.axis()
                .scale(timeScale)
                .orient('bottom')
                .tickSize(-1*this.height, 1)
                .tickPadding(4);

            this.zoom = d3.behavior.zoom();

            svg.append("svg:rect")
                .attr('class', 'viewpane')
                .attr('fill', '#fff')
                .attr('width', this.width)
                .attr('height', this.height)
                .call(this.zoom.on("zoom", function(){
                    self._zoom(this);
                }));

            timeScale.domain([new Date(1999, 0, 1), new Date(2014, 0, 0)]);

            this.zoom.x(timeScale);

            svg.append("svg:g")
                .attr('class', 'time axis')
                .attr('transform', sprintf('translate(0, %d)', this.height));

            this.draw();

            // _create will automatically run the first time
            // this widget is called. Put the initial widget
            // setup code here, then you can access the element
            // on which the widget was called via this.element.
            // The options defined above can be accessed
            // via this.options this.element.addStuff();
        },

        // Destroy an instantiated plugin and clean up
        // modifications the widget has made to the DOM
        destroy: function () {

            // this.element.removeStuff();
            // For UI 1.8, destroy must be invoked from the
            // base widget
            $.Widget.prototype.destroy.call(this);
            // For UI 1.9, define _destroy instead and don't
            // worry about
            // calling the base widget
        },

        resize: function() {

            this.width = this.element.width();
            this.height = this.element.height();

            console.log("resize timeline :: "+this.width+" "+this.height);

            this.svg.attr("width", this.width)
                .attr("height", this.height);

            this.timeAxis.tickSize(-1*this.height, 1);

            this.timeScale.range([0, this.width]);
            this.zoom.x(this.timeScale);

            this.draw();
        },

        _zoom: function(svgElement){
            //d3.event.transform(this.timeScale);
            this.draw();
        },

        draw: function(){
            var self = this;

            self.timeScale.range([0, self.width]);

            self.svg.select('rect.viewpane')
                .attr('width', this.width)
                .attr('height', this.height);

            self.svg.select('g.time.axis')
                .attr('transform', sprintf('translate(0, %d)', this.height - 30))
                .call(self.timeAxis);

            var nodes = self.svg.selectAll('.node').data(self.nodes, function(d){return 'tl_'+d.anchor.idHash();});

            var node = nodes.enter().insert('svg:g')
                .attr('class', 'node')
                .attr('id', function(d){return 'tl_'+d.anchor.idHash();})
                .on('click', function(node, index){
                    self._nodeClick(this, node, index);
                });

            node.insert("svg:circle")
                .attr("class", "node_background")
                .attr("r", 16)
                .attr("stroke-width", 0)
                .attr("fill", "white")
                .attr("opacity", "0.75")
                .attr("x", "-16px")
                .attr("y", "-16px");

            node.insert("svg:image")
                .attr("class", "node_icon")
                .attr("xlink:href", function(d){return d.icon;})
                .attr("x", "-16px")
                .attr("y", "-16px")
                .attr("width", "32px")
                .attr("height", "32px");

            node.insert("svg:text")
                .attr("class", "node_text")
                .attr("dx", 16)
                .attr("dy", "0.25em")
                .text(function(d){
                   return d.label;
                });

            node.insert('svg:line')
                .attr('class', 'node_duration')
                .attr('x1', 0)
                .attr('y1', 12)
                .attr('x2', function(d){
                    return self.timeScale(new Date(self.nodeMap[d.anchor].extent.max)) - self.timeScale(new Date(self.nodeMap[d.anchor].extent.min));
                })
                .attr('y2', 12);

            node.each(function(d, i){
                var ticks = d3.select(this).selectAll('.time_tick').data(self.nodeMap[d.anchor].extent.events);

                var tick = ticks.enter().insert('svg:line')
                    .attr('class', 'time_tick')
                    .attr('x1', function(e){
                        return self.timeScale(new Date(e)) - self.timeScale(new Date(self.nodeMap[d.anchor].extent.min));
                    })
                    .attr('y1', 12)
                    .attr('y2', 18);
            });

            nodes.exit().remove();

            // Now everything should be drawn/removed.  Compute rank before transformation
            //var numRanks = self.height / 32;
            var ranks = [];
            //for(var i = 0; i < numRanks; i++){
            //    ranks[i] = Number.MIN_VALUE;
            //}

            for(var i = 0; i < self.nodes.length; i++){
                var n = self.nodes[i];
                var left = self.timeScale(new Date(self.nodeMap[n.anchor].extent.min));
                var right = Math.max(self.timeScale(new Date(self.nodeMap[n.anchor].extent.max)), left+$(sprintf('#tl_%s', n.anchor.idHash()))[0].getBBox().width);

                var fit = false;

                for(var j = 0; j < ranks.length; j++){

                    var collision = false;

                    for(var k = 0; k < ranks[j].length; k++){

                        if((left > ranks[j][k][0] && left < ranks[j][k][1]) ||
                            (right > ranks[j][k][0] && right < ranks[j][k][1]) ||
                            (left < ranks[j][k][0] && right > ranks[j][k][1])
                        ){
                            collision = true;
                        }

                    }

                    if(!collision){
                        fit = true;
                        self.nodeMap[n.anchor].extent.rank = j;
                        ranks[j].push([left, right]);
                        break;
                    }
                }

                if(!fit){
                    var newEntry = [left, right];
                    ranks.push([newEntry]);
                    self.nodeMap[n.anchor].extent.rank = ranks.length-1;
                }
            }

            //nodes = self.svg.selectAll('.node').data(self.nodes, function(d){return d.anchor.idHash();});

            nodes.transition().duration(0).attr('transform', function(d){
                return sprintf('translate(%d, %d)',
                    self.timeScale(new Date(self.nodeMap[d.anchor].extent.min)),
                    32 + self.nodeMap[d.anchor].extent.rank * 32);
            });
        },

        add: function(nodes) {
            var self = this;

            var rank = 0;

            for(var i = 0; i < nodes.length; i++){
                if(nodes[i].anchor in this.nodeMap){
                    // Do we need to merge anything? time maybe if it's been updated?
                } else {

                    var extent = null;

                    // Determine if this node has a time property
                    Object.keys(nodes[i].properties).forEach(function(p){
                        var pl = p.toLowerCase();

                        if(
                            (pl.endsWith('time') ||
                            pl.endsWith('date') ||
                            pl.endsWith('timestamp') ||
                            pl.endsWith('lastmodified')) && !pl.endsWith('update')
                        ){
                            var values = nodes[i].properties[p];

                            Object.keys(values).forEach(function(v) {

                                var d = new Date(v);
                                var t = d.getTime();

                                if (extent == null) {
                                    extent = {
                                        min: Number.MAX_VALUE,
                                        max: Number.MIN_VALUE,
                                        events: [],
                                        rank: rank++
                                    };
                                }

                                extent.events.push(t);

                                if (t < extent.min) {
                                    extent.min = t;
                                }
                                if (t > extent.max) {
                                    extent.max = t;
                                }
                            });
                        }
                    });

                    if(extent != null) {
                        this.nodeMap[nodes[i].anchor] = {
                            node: nodes[i],
                            extent: extent
                        };
                    }
                }
            }

            this.nodes = [];
            Object.keys(this.nodeMap).forEach(function(key){
                self.nodes.push(self.nodeMap[key].node);
            });

            this.nodes.sort(function(a, b){
                return self.nodeMap[a.anchor].extent.min < self.nodeMap[b.anchor].extent.min;
            });

            this.draw();
        },

        seek: function(uri){
            if(!(uri in this.nodeMap)){
                return;
            }

            var extent = this.nodeMap[uri].extent;

            var domain = this.timeScale.domain();

            var newDomain = [];

            var start = domain[0].getTime();
            var end = domain[1].getTime();

            if(extent.min > start && extent.min < end){
                var half = ((end - start)/2);
                var halfPt = start + half;

                if(extent.min < halfPt){
                    newDomain[0] = start - (halfPt - extent.min);
                    newDomain[1] = end - (halfPt - extent.min);
                } else {
                    newDomain[0] = start + (extent.min - halfPt);
                    newDomain[1] = end + (extent.min - halfPt);
                }

            } else if(extent.min < start){
                newDomain[0] = start - (start - extent.min) - ((end - start)/2);
                newDomain[1] = end - (end - extent.min) + ((end - start)/2);
            } else {
                newDomain[0] = start + (extent.min - start) - ((end - start)/2);
                newDomain[1] = end + (extent.min - end) + ((end - start)/2);
            }

            this.timeScale.domain(newDomain);

            this.zoom.x(this.timeScale);

            this.draw();
        },

        _nodeClick: function(svg, node, index){

            if(!node.selected){
                node.selected = true;
            } else if(node.selected && d3.event.shiftKey) {
                node.selected = false;
            }

            this.updateSelectedNodes();

            this._trigger(":node_click", d3.event, { node: node });

        },

        selectNodes: function(anchors) {
            this.svg.selectAll(".node").data(this.nodes, function(d){return 'tl_'+d.anchor.idHash();}).each(function(d){
                d.selected = anchors.indexOf(d.anchor) != -1;
            });

            this.updateSelectedNodes();
        },

        updateSelectedNodes: function() {
            var self = this;

            var nodes = this.svg.selectAll(".node").data(this.nodes, function(d){return 'tl_'+d.anchor.idHash();});

            nodes.each(function(d){
                if(d.selected) {

                    if($(this).find(".selected").length > 0){
                        return;
                    }

                    d3.select(this)
                        .insert("svg:image", ".node_icon")
                        .attr("class", "selected")
                        .attr("xlink:href", "/static/img/selection.svg")
                        .attr("x", "-20px")
                        .attr("y", "-20px")
                        .attr("width", "40px")
                        .attr("height", "40px");
                } else {
                    $(this).find(".selected").remove();
                }
            });
        },

        //methodB: function ( event ) {
        //    //_trigger dispatches callbacks the plugin user
        //    // can subscribe to
        //    // signature: _trigger( "callbackName" , [eventObject],
        //    // [uiObject] )
        //    // eg. this._trigger( "hover", e /*where e.type ==
        //    // "mouseenter"*/, { hovered: $(e.target)});
        //    console.log("methodB called");
        //},
        //
        //methodA: function ( event ) {
        //    this._trigger("dataChanged", event, {
        //        key: "someValue"
        //    });
        //},

        // Respond to any changes the user makes to the
        // option method
        _setOption: function ( key, value ) {
            switch (key) {
            case "someValue":
                //this.options.someValue = doSomethingWith( value );
                break;
            default:
                //this.options[ key ] = value;
                break;
            }

            // For UI 1.8, _setOption must be manually invoked
            // from the base widget
            $.Widget.prototype._setOption.apply( this, arguments );
            // For UI 1.9 the _super method can be used instead
            // this._super( "_setOption", key, value );
        }
    });

})( jQuery, window, document );