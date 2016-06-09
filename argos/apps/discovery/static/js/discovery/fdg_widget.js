/*!
 * jQuery UI Widget-factory plugin boilerplate (for 1.8/9+)
 * Author: @addyosmani
 * Further changes: @peolanha
 * Licensed under the MIT license
 */

// From http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length == 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

String.prototype.idHash = function(){
    return "id_"+this.hashCode();
}

;(function ( $, window, document, undefined ) {

    // define your widget under a namespace of your choice
    //  with additional parameters e.g.
    // $.widget( "namespace.widgetname", (optional) - an
    // existing widget prototype to inherit from, an object
    // literal to become the widget's prototype );

    $.widget( "argos.fdgWidget" , {

        //Options to be used as defaults
        options: {
            showLinkLabels: false
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;

            this.width = this.element.width();
            this.height = this.element.height();

            // HACK -- When I added the grid-stack work, the element no longer has fixed
            // width and height.  If we don't give it some now the brush <g> will be 0x0
            if(this.width == 0 || this.height == 0){
                this.width = 1226;
                this.height = 702;
            }

            this._initControlMenu();

            this.nodeMap = {};

            this.force = null;

            // This is an optimization so we don't have to go through all of this.force to see if multiple nodes are selected
            this.multipleNodesSelected = false;

            this.drag = d3.behavior.drag()
                .on("dragstart", function(d) {
                    d3.event.sourceEvent.stopPropagation();
                    self.force.resume();
                    d.fixed = true;
                })
                .on("drag", function(d){
                    //d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);

                    if(self.currentLayout != null){
                        self.currentLayout.drag(d, d3.event);
                    } else {
                        d.px += d3.event.dx;
                        d.py += d3.event.dy;
                        d.x = d3.event.x;
                        d.y = d3.event.y;
                    }
                    d3.select(this).attr("transform", "translate("+ d.x +","+ d.y+")");

                    // Also move
                    var nodes = self.graph.selectAll(".node").data(self.force.nodes(), function(p){return p.anchor.idHash();});
                    nodes.each(function(p){
                        if(p.selected){
                            if(p.anchor == d.anchor){
                                return;
                            }
                            p.fixed = true;
                            p.px += d3.event.dx;
                            p.py += d3.event.dy;
                            p.x += d3.event.dx;
                            p.y += d3.event.dy;

                            d3.select(this).attr("transform",
                                "translate("+ p.x +","+ p.y+")");
                        }
                    });
                })
                .on("dragend", function(d){
                    self.force.resume();
                });

            this.xScale = d3.scale.linear().domain([0, this.width]).range([0, this.width]);
            this.yScale = d3.scale.linear().domain([0, this.height]).range([0, this.height]);

            this.zoom = d3.behavior.zoom()
                .x(this.xScale)
                .y(this.yScale);

            this.svg = d3.select(this.element[0]).append("svg:svg")
                .attr("pointer-events", "all")
                .attr("id", "fdg_canvas")
                .call(this.zoom.on("zoom", function(){
                    self._rescale();
                }))
                .on("mousemove", function(){
                    self._graphMousemove();
                })
                .on("mousedown", function(){
                    self._graphMousedown();
                })
                .on("mouseup", function(){
                    self._graphMouseup();
                })
                .on("click", function(){
                    self._graphClick();
                })
                .on("contextmenu", function(){
                    self._graphContext(this);
                });

            this.svg.append("defs").append("marker")
                .attr('id', 'arrowhead')
                .attr('refX', 20)
                .attr('refY', 2)
                .attr('stroke', 'grey')
                .attr('fill', 'grey')
                .attr('markerWidth', 20)
                .attr('markerHeight', 20)
                .attr('orient', 'auto')
                .append('path')
                    .attr('d', "M 0,0 V 4 L6,2 Z");

            this.resize();

            this.shiftKey = false;

            this.savedZoomScaleX = null;
            this.savedZoomScaleY = null;
            this.savedScale = null;
            this.savedTrans = null;

            this.brush = this.svg.append("svg:g")
                .datum(function() { return {selected: false, previouslySelected: false}; })
                .attr("class", "brush")
                .call(d3.svg.brush()
                    .x(d3.scale.identity().domain([0, self.width]))
                    .y(d3.scale.identity().domain([0, self.height]))
//                    .x(self.zoom.x())
//                    .y(self.zoom.y())
                    .on("brushstart", function(d){
                        console.log("brushstart");

                        // We need to save off the current zoom scale & translate values
                        self.savedZoomScaleX = self.zoom.x().copy();
                        self.savedZoomScaleY = self.zoom.y().copy();
                        self.savedScale = self.zoom.scale();
                        self.savedTrans = self.zoom.translate();

                        var nodes = self.graph.selectAll(".node").data(self.force.nodes(), function(p){return p.anchor.idHash();});
                        nodes.each(function(p){p.previouslySelected = self.shiftKey && p.selected;});

                        if(!self.shiftKey){
                            d3.event.target.clear();
                            d3.select(this).call(d3.event.target);
                        }
                    })
                    .on("brush", function(){
                        if(self.shiftKey){
                            var extent = d3.event.target.extent();
                            var nodes = self.graph.selectAll(".node").data(self.force.nodes(), function(d){return d.anchor.idHash();});

//                            var extentRect = d3.select("rect.extent");
//
//                            var rangeWidth  = extentRect.attr("width");
//                            var rangeHeight = extentRect.attr("height");
//                            var rangeLeft = extentRect.attr("x");
//                            var rangeTop = extentRect.attr("y");
//
//                            var x0 = 1*rangeLeft;
//                            var x1 = 1*rangeLeft+1*rangeWidth;
//                            var y0 = 1*rangeTop;
//                            var y1 = 1*rangeTop+1*rangeHeight;

//                            var scaledExtent = [
//                                [self.xScale(extent[0][0]), self.yScale(extent[0][1])],
//                                [self.xScale(extent[1][0]), self.yScale(extent[1][1])]
//                            ];
//
//                            var x0 = scaledExtent[0][0];
//                            var x1 = scaledExtent[1][0];
//                            var y0 = scaledExtent[0][1];
//                            var y1 = scaledExtent[1][1];

                            var x0 = extent[0][0];
                            var x1 = extent[1][0];
                            var y0 = extent[0][1];
                            var y1 = extent[1][1];

                            nodes.each(function(d){
                                var _x = self.savedZoomScaleX(d.x);
                                var _y = self.savedZoomScaleY(d.y);
                                d.selected = d.previouslySelected ^ (
                                    x0 <= _x && _x < x1 &&
                                        y0 <= _y && _y < y1
                                    );

                                if(d.selected){
                                    console.log("selecting node");
                                } else if (d.previouslySelected ) {
                                    console.log("deselecting node");
                                }

                            });

//                            nodes.classed("selected", function(d){
//                                return d.selected = d.previouslySelected ^ (
//                                    extent[0][0] <= d.x && d.x < extent[1][0] &&
//                                        extent[0][1] <= d.y && d.y < extent[1][1]
//                                    );
//                            });

                        } else {
                            d3.event.target.clear();
                            d3.select(this).call(d3.event.target);
                        }
                    })
                    .on("brushend", function(){
                        d3.event.target.clear();
                        d3.select(this).call(d3.event.target);
                        self.updateSelectedNodes();
                        self.zoom.scale(self.savedScale);
                        self.zoom.translate(self.savedTrans);
                        self.savedScale = null;
                        self.savedTrans = null;
                    }));

            this.rect = this.svg.append('rect')
                .attr('pointer-events', 'all')
                .attr('width', this.width)
                .attr('height', this.height)
                .style('fill', 'none');

            this.graph = this.svg.append("svg:g");

            this._initialize();

            this.redraw();

            d3.select(window).on("keydown", function(){
                self.shiftKey = d3.event.shiftKey;
                if(self.shiftKey){
                    self.rect = self.rect.attr('pointer-events', 'none');
                } else {
                    self.rect = self.rect.attr('pointer-events', 'all');
                }
            });

            d3.select(window).on("keyup", function(){
                self.shiftKey = d3.event.shiftKey;
                if(self.shiftKey){
                    self.rect = self.rect.attr('pointer-events', 'none');
                } else {
                    self.rect = self.rect.attr('pointer-events', 'all');
                }
            });

            this.layouts = {
                columns: new ColumnLayout(this.force, this.graph),
                timeline: new TimelineLayout(this, this.force, this.graph)
            };

            this.currentLayout = null;

            // _create will automatically run the first time
            // this widget is called. Put the initial widget
            // setup code here, then you can access the element
            // on which the widget was called via this.element.
            // The options defined above can be accessed
            // via this.options this.element.addStuff();
        },

        _initialize: function() {
            var self = this;

            this.force = d3.layout.force()
                .size([self.width, self.height])
                .distance(200)
                .charge(-400)
                .gravity(0.1);

            this.force.start();
        },

        _initControlMenu: function(){
            var self = this;

            this.$controlMenu = $('<div class="btn-group fdg-control-menu"/>').appendTo(this.element);

            $('<button data-toggle="dropdown" class="btn dropdown-toggle"><i class="fa fa-gears"/></button>').appendTo(this.$controlMenu);

            var $subMenu = $('<ul class="dropdown-menu dropdown-menu-right"></ul>').appendTo(this.$controlMenu);

            var $fix = $('<li><a href="#">Fix All Nodes</a></li>').appendTo($subMenu);
            $fix.click(function(){
                self.force.nodes().forEach(function(d){
                    d.fixed = true;
                });
            });

            var $free = $('<li><a href="#">Free All Nodes</a></li>').appendTo($subMenu);
            $free.click(function(){
                self.force.nodes().forEach(function(d){
                    d.fixed = false;
                });

                if(self.currentLayout != null){
                    self.currentLayout.clean();
                    self.currentLayout = null;
                }

                self.force.resume();
            });

            $('<li class="divider"/>').appendTo($subMenu);
            var $resetView = $('<li><a href="#">Reset View</a></li>').appendTo($subMenu);
            $resetView.click(function(){
                self.resetView();
            });
            var $columns = $('<li><a href="#">Show Columns</a></li>').appendTo($subMenu);
            $columns.click(function(){
                if(self.currentLayout != null){
                    self.currentLayout.clean();
                }

                self.layouts.columns.layout();
                self.currentLayout = self.layouts.columns;
            });
            var $clusters = $('<li><a href="#">Show Clusters</a></li>').appendTo($subMenu);
            var $timeline = $('<li><a href="#">Show Timeline</a></li>').appendTo($subMenu);
            $timeline.click(function(){
                if(self.currentLayout != null){
                    self.currentLayout.clean();
                }

                self.layouts.timeline.layout();
                self.currentLayout = self.layouts.timeline;
            });
            var $labels = $('<li><a href="#">Toggle Link Labels</a></li>').appendTo($subMenu);
            $labels.click(function(){

                self.options.showLinkLabels = !self.options.showLinkLabels;

                if(!self.options.showLinkLabels){
                    self.graph.selectAll(".link-label").remove();
                } else {
                    // TODO this is the same code as redraw... refactor
                    var links = self.graph.selectAll(".link").data(self.force.links(), function(d){ return d.anchor; });
                    links.insert("svg:text")
                        .attr("class", "link-label")
                        .attr("text-anchor", "middle")
                        .attr("fill", "black")
                        .attr("stroke-width", 0)
                        .attr("dx", 0)
                        .attr("dy", 10)
                        .text(function(d){
                        // This isn't great
                        if(Ontology.ont != null){
                            return self._getLabel(Ontology.classes[d.source.type].opMap[d.predicate].labels, d.predicate);
                        } else {
                            return d.predicate;
                        }
                    });

                    if(self.currentLayout != null){
                        self.currentLayout.layout();
                    } else {
                        self.force.resume();
                    }
                }

            });

            $('<li class="divider"/>').appendTo($subMenu);
            var $clearNodes = $('<li><a href="#">Clear Nodes</a></li>').appendTo($subMenu);
            $clearNodes.click(function(){
                self.clearNodes();
            });
            $('<li class="divider"/>').appendTo($subMenu);
            var $export = $('<li><a href="#">Export</a></li>').appendTo($subMenu);
            $export.find("a").click(function(){

                //var svg = d3.select("svg")[0][0];
                var svg = ($("svg").clone())[0];

                // Convert images to inline
                $(svg).find('image').each(function(){
                    var i = new Image();
                    i.src = $(this).attr('href');

                    var can = document.createElement('canvas');
                    can.width = 32;
                    can.height = 32;
                    can.getContext("2d").drawImage(i,0,0,32,32);
                    var url = can.toDataURL('image/png');

                    $(this).attr('href', url);
                });
                $(svg).find('text').each(function(){
                    $(this).attr('font-size', '13px');
                });

                var img = new Image();
                var serializer = new XMLSerializer();
                var svgStr = serializer.serializeToString(svg);

                img.src = 'data:image/svg+xml;utf8,'+svgStr;

                var canvas = document.createElement('canvas');

                canvas.width = self.width;
                canvas.height = self.height;
                canvas.getContext("2d").drawImage(img,0,0,self.width,self.height);

                var dl = canvas.toDataURL('image/png');
                this.href = dl;
                this.download = "workspace.png";

            });
        },

        resize: function() {

            this.width = this.element.width();
            this.height = this.element.height();

            // HACK -- When I added the grid-stack work, the element no longer has fixed
            // width and height.  If we don't give it some now the brush <g> will be 0x0
            if(this.width == 0 || this.height == 0){
                this.width = 1226;
                this.height = 702;
            }

            this.svg.attr("width", this.width)
                .attr("height", this.height);

        },

        _rescale: function() {

            if(this.shiftKey){
                return;
            }

            var trans = d3.event.translate;
            var scale = d3.event.scale;

            this.graph.attr("transform", "translate("+trans+") scale("+scale+")");
        },

        redraw: function() {
            var self = this;

            var links = this.graph.selectAll(".link").data(this.force.links(), function(d){ return d.anchor; }); // update func with node id

            var link = links.enter().insert("svg:g", ":first-child")
                .attr("id", function(d){return d.anchor;})
                .attr("class", "link");

            link.insert("svg:line", ":first-child")
                .attr("class", "link-line")
                .attr("stroke", "grey")
                .attr("stroke-width", "1")
                .attr("x1", function(d){ return d.source.x; })
                .attr("y1", function(d){ return d.source.y; })
                .attr("x2", function(d){ return d.target.x; })
                .attr("y2", function(d){ return d.target.y; })
                .attr("title", function(d){
                    // This isn't great
                    if(Ontology.ont != null){
                        return self._getLabel(Ontology.classes[d.source.type].opMap[d.predicate].labels, d.predicate);
                    } else {
                        return d.predicate;
                    }
                });

            if(self.options.showLinkLabels){

                link.insert("svg:text")
                    .attr("class", "link-label")
                    .attr("text-anchor", "middle")
                    .attr("fill", "black")
                    .attr("stroke-width", 0)
                    .attr("dx", 0)
                    .attr("dy", 10)
                    .text(function(d){
                    // This isn't great
                    if(Ontology.ont != null){
                        return self._getLabel(Ontology.classes[d.source.type].opMap[d.predicate].labels, d.predicate);
                    } else {
                        return d.predicate;
                    }
                });

            }
//                .attr("marker-end", "url(#arrowhead)");

            // Can't do this -- causes dragging errors as the animation fades
            //link.each(function(){
            //    $(this).tooltip();
            //});

            links.exit().remove();

            var nodes = this.graph.selectAll(".node").data(this.force.nodes(), function(d){return d.anchor.idHash();});

            var node = nodes.enter().insert("svg:g")
                .attr("class", "node")
                .attr("id", function(d){return d.anchor.idHash();})
                .attr("title", function(d){
                    // This isn't great
                    if(Ontology.ont != null){
                        return self._getLabel(Ontology.classes[d.type].labels, d.type);
                    } else {
                        return d.type;
                    }
                })
                .on("mousedown", function(d, i){
                    self._nodeMousedown(this, d, i);
                })
                .on("mouseup", function(d, i){
                    self._nodeMouseup(this, d, i);
                })
                .on("mousemove", function(d, i){
                    self._nodeMousemove(this, d, i);
                })
                .on("dblclick", function(node, index){
                    self._nodeDoubleClick(this, node, index);
                })
                .on("click", function(node, index){
                    self._nodeClick(this, node, index);
                })
                .on("contextmenu", function(node, index){
                    self._nodeRightClick(this, node, index);
                })
                .call(self.drag);

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

            node.insert("svg:title")
                .text(function(d){
                    // This isn't great
                    if(Ontology.ont != null){
                        return self._getLabel(Ontology.classes[d.type].labels, d.type);
                    } else {
                        return d.type;
                    }
                });

            // Can't do this -- causes dragging errors as the animation fades
            //node.each(function(){
            //    $(this).tooltip();
            //});

            nodes.exit().remove();

            this.force.on("tick", function(){
                links.select(".link-line")
                    .attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

                if(self.options.showLinkLabels){
                    links.select(".link-label")
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
                }

                nodes.attr("transform", function(d){ return "translate("+ d.x+","+ d.y+")"; });
            });

            if(d3.event) {
                d3.event.preventDefault();
            }

            this.force.start();

            if(this.currentLayout != null){
                this.currentLayout.layout();
            }
        },

        _nodeMousemove: function(){

        },

        _nodeMousedown: function(svg, node, index){

            if(!d3.event.shiftKey && !node.selected){
                this.clearSelectedNodes();
            }

        },

        _nodeMouseup: function(){

        },

        _nodeClick: function(svg, node, index) {

            //console.log("node click ("+node.x+", "+node.y+") -- ("+this.xScale(node.x)+", "+this.yScale(node.y)+")");

            if(!node.selected){
                node.selected = true;
            } else if(node.selected && d3.event.shiftKey) {
                node.selected = false;
            }

            this.updateSelectedNodes();

            this._trigger(":node_click", d3.event, { svg: svg, node: node });

            if(d3.event) {
                d3.event.stopPropagation();
            }

        },

        _nodeDoubleClick: function(svg, node, index){

            this._trigger(":node_dblclick", d3.event, { svg: svg, node: node, multiSelect: this.multipleNodesSelected });

            if(d3.event) {
                d3.event.stopPropagation();
            }
        },

        _nodeRightClick: function(svg, node, index){
            this._trigger(":node_rightclick", d3.event, { svg: svg, node: node, multiSelect: this.multipleNodesSelected });

            if(d3.event) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        },

        _graphMousedown: function() {

        },

        _graphMousemove: function() {

        },

        _graphMouseup: function() {

        },

        _graphClick: function() {
            // Completing a brush causes a graph click, but we don't want to clear nodes after a brush
            // Looking at shift is a bit hacky, but it should be consistent
            if(!this.shiftKey){
                this.clearSelectedNodes();
            }

            this._trigger(":graph_click", d3.event, {});

        },

        _graphContext: function(svg) {
            this._trigger(":graph_rightclick", d3.event, { svg: svg });

            if(d3.event) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        },

        resetView: function() {
            this.zoom.scale(1);
            this.zoom.translate([0,0]);
            this.graph.transition().duration(500).attr("transform", "translate(0,0) scale(1)");
        },

        selectNodes: function(anchors) {
            this.graph.selectAll(".node").data(this.force.nodes(), function(d){return d.anchor.idHash();}).each(function(d){
                if(anchors.indexOf(d.anchor) != -1){
                    d.selected = true;
                } else {
                    d.selected = false;
                }
            });

            this.updateSelectedNodes();
        },

        getSelectedNodes: function() {
            var nodes = [];

            this.graph.selectAll(".node").data(this.force.nodes(), function(d){return d.anchor.idHash();}).each(function(d){
                if(d.selected){
                    nodes.push({
                        node: d,
                        svg: this
                    });
                }
            });

            return nodes;
        },

        getNodes: function() {
            var nodes = [];

            this.graph.selectAll(".node").data(this.force.nodes(), function(d){return d.anchor.idHash();}).each(function(d){
                nodes.push({
                    node: d,
                    svg: this
                });
            });

            return nodes;
        },

        clearSelectedNodes: function() {
            var nodes = this.graph.selectAll(".node").data(this.force.nodes(), function(d){return d.anchor.idHash();});
            nodes.each(function(d){
                d.selected = false;
            });
            this.multipleNodesSelected = false;
            this.updateSelectedNodes();
        },

        clearNodes: function(){
            this.force.nodes([]);
            this.force.links([]);

            this.nodeMap = {};
            this.multipleNodesSelected = false;

            if(this.currentLayout != null){
                this.currentLayout.clean();
            }

            this.graph.selectAll(".node").data(this.force.nodes(), function(d){return d.anchor.idHash();}).exit().remove();
            this.graph.selectAll(".link").data(this.force.links()).exit().remove();

            this._trigger(":post_clear", null, { nodes: this.force.nodes(), links: this.force.links() });
        },

        updateSelectedNodes: function() {
            var self = this;

            var nodes = this.graph.selectAll(".node").data(this.force.nodes(), function(d){return d.anchor.idHash();});

            var count = 0;

            var selected = {};

            nodes.each(function(d){
                if(d.selected) {
                    count++;
                    selected[d.anchor] = true;

                    if(count > 2){
                        self.multipleNodesSelected = true;
                    }

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

            var links = this.graph.selectAll(".link").data(this.force.links(), function(d){ return d.anchor; }); // update func with node id

            links.each(function(l){
                if(l.target.anchor in selected){
                    d3.select(this).attr("stroke", "orange");
                } else if (l.source.anchor in selected){
                    d3.select(this).attr("stroke", "blue");
                } else {
                    d3.select(this).attr("stroke", "grey");
                }
            });
        },

        load: function(graph){
            var self = this;

            if(graph == null){
                return;
            }

            this.nodeMap = {};

            for(var i=0; i < graph.nodes.length; i++){
                this.nodeMap[graph.nodes[i].anchor] = graph.nodes[i];
            }

            var nodeList = [];
            Object.keys(this.nodeMap).forEach(function(key){
                nodeList.push(self.nodeMap[key]);
            });

            var links = graph.links;

            links.forEach(function(e){
                var source = e.source;
                var target = e.target;
                e.source = self.nodeMap[source];
                e.target = self.nodeMap[target];
            });

            this.force.nodes(nodeList).links(links).start();

            this.redraw();

            // TODO execute describe on all nodes to fill in properties

            this._trigger(":post_load", null, { nodes: this.force.nodes(), links: this.force.links() });
        },

        add: function(nodes) {
            var self = this;

            //var nodeList = this.force.nodes();

            for(var i=0; i < nodes.length; i++){

                if(nodes[i].anchor in this.nodeMap){
                    this._mergeNode(this.nodeMap[nodes[i].anchor], nodes[i]);
                } else {
                    this.nodeMap[nodes[i].anchor] = nodes[i];
                    //nodeList.push(nodes[i]);
                }
            }

            var nodeList = [];
            Object.keys(this.nodeMap).forEach(function(key){
                nodeList.push(self.nodeMap[key]);
            });

            var links = this._buildLinks();

            this.force.nodes(nodeList).links(links).start();

            this.redraw();

            this._trigger(":post_add", null, { nodes: this.force.nodes(), links: this.force.links() });
        },

        // Need this routine to fill in features of a graph (properties, references) w/o triggering save
        fill: function(nodes) {
            var self = this;

            //var nodeList = this.force.nodes();

            for(var i=0; i < nodes.length; i++){

                if(nodes[i].anchor in this.nodeMap){
                    this._mergeNode(this.nodeMap[nodes[i].anchor], nodes[i]);
                } else {
                    this.nodeMap[nodes[i].anchor] = nodes[i];
                    //nodeList.push(nodes[i]);
                }
            }

            var nodeList = [];
            Object.keys(this.nodeMap).forEach(function(key){
                nodeList.push(self.nodeMap[key]);
            });

            var links = this._buildLinks();

            this.force.nodes(nodeList).links(links).start();

            this.redraw();

            this._trigger(":post_fill", null, { nodes: this.force.nodes(), links: this.force.links() });
        },

        addNoMerge: function(nodes) {
            var self = this;

            for(var i=0; i < nodes.length; i++){

                // Overwrite
                this.nodeMap[nodes[i].anchor] = nodes[i];
            }

            var nodeList = [];
            Object.keys(this.nodeMap).forEach(function(key){
                nodeList.push(self.nodeMap[key]);
            });

            var links = this._buildLinks();

            this.force.nodes(nodeList).links(links).start();

            this.redraw();

            this._trigger(":post_add", null, { nodes: this.force.nodes(), links: this.force.links() });
        },

        hide: function(anchor) {
            var self = this;

            var nodeList = [];

            delete this.nodeMap[anchor];

            var nodeList = [];
            Object.keys(this.nodeMap).forEach(function(key){
                nodeList.push(self.nodeMap[key]);
            });

            var links = this._buildLinks();

            this.force.nodes(nodeList).links(links).start();

            this.redraw();

            this._trigger(":post_hide", null, { nodes: this.force.nodes() });
        },

        hideSelected: function() {
            var self = this;

            var nodes = this.getSelectedNodes();

            nodes.forEach(function(e){
                delete self.nodeMap[e.node.anchor];
            });

            var nodeList = [];
            Object.keys(this.nodeMap).forEach(function(key){
                nodeList.push(self.nodeMap[key]);
            });

            var links = this._buildLinks();

            this.force.nodes(nodeList).links(links).start();

            this.redraw();

            this._trigger(":post_hide", null, { nodes: this.force.nodes() });
        },

        invertSelected: function() {
            this.graph.selectAll(".node").data(this.force.nodes(), function(d){return d.anchor.idHash();}).each(function(d){
                if(d.selected){
                    d.selected = false;
                } else {
                    d.selected = true;
                }
            });

            this.updateSelectedNodes();
        },

        _mergeNode: function(existingNode, newNode) {

            var toMerge = ['properties', 'references'];

            toMerge.forEach(function(e){
                Object.keys(newNode[e]).forEach(function(predicate){
                    if(predicate in existingNode[e]){
                        Object.keys(newNode[e][predicate]).forEach(function(object){
                            if(object in existingNode[e][predicate]){
                                Object.keys(newNode[e][predicate][object]).forEach(function(partition){
                                    if(partition in existingNode[e][predicate][object]){
                                        //skip
                                    } else {
                                        existingNode[e][predicate][object][partition] = newNode[e][predicate][object][partition];
                                    }
                                });
                            } else {
                                existingNode[e][predicate][object] = newNode[e][predicate][object];
                            }
                        });
                    } else {
                        existingNode[e][predicate] = newNode[e][predicate];
                    }
                });
            });

        },

        _buildLinks: function(){
            var self = this;

            var links = [];
            var count = 0;

            for(var anchor in this.nodeMap){
                var node = this.nodeMap[anchor];

                Object.keys(node.references).forEach(function(predicate){
                    Object.keys(node.references[predicate]).forEach(function(object){
                        if(object in self.nodeMap){
                            var link = {
                                anchor: (''+node.anchor+self.nodeMap[object].anchor+predicate).idHash(),
                                source: node,
                                target: self.nodeMap[object],
                                predicate: predicate
                            };
                            links.push(link);
                        }
                    });
                });
            }

            return links;
        },

        _getLabel: function(labelSet, defaultValue){
            return labelSet.length > 0 ? labelSet[0].value : defaultValue;
        },

        // Destroy an instantiated plugin and clean up
        // modifications the widget has made to the DOM
        destroy: function () {

            this.svg.remove();

            // this.element.removeStuff();
            // For UI 1.8, destroy must be invoked from the
            // base widget
            $.Widget.prototype.destroy.call(this);
            // For UI 1.9, define _destroy instead and don't
            // worry about
            // calling the base widget
        },

//        methodB: function ( event ) {
//            //_trigger dispatches callbacks the plugin user
//            // can subscribe to
//            // signature: _trigger( "callbackName" , [eventObject],
//            // [uiObject] )
//            // eg. this._trigger( "hover", e /*where e.type ==
//            // "mouseenter"*/, { hovered: $(e.target)});
//            console.log("methodB called");
//        },
//
//        methodA: function ( event ) {
//            this._trigger("dataChanged", event, {
//                key: "someValue"
//            });
//        },

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