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

    $.widget( "discovery.geoWidget" , {

        //Options to be used as defaults
        options: {
            someValue: null
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;

            var $el = this.$el = $(this.element);

            this.nodeMap = {};
            this.nodes = [];

            this.width = this.element.width();
            this.height = this.element.height();

            this.$map = $('<div class="geoMap"/>').appendTo($el);

            //this.map = L.map(this.element.attr('id'), {zoomControl: false});
            this.map = L.map(this.$map[0], {zoomControl: false});

            new L.control.zoom({ position: 'topright' }).addTo(this.map);

            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);

            this.map.setView([37.78, -122.4], 13);

            // _create will automatically run the first time
            // this widget is called. Put the initial widget
            // setup code here, then you can access the element
            // on which the widget was called via this.element.
            // The options defined above can be accessed
            // via this.options this.element.addStuff();
        },

        resize: function() {

            this.width = this.element.width();
            this.height = this.element.height();

            this.map.invalidateSize();

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

        add: function(nodes) {
            var self = this;

            for(var i = 0; i < nodes.length; i++){
                if(nodes[i].anchor in this.nodeMap){
                    // Anything to do?
                } else {

                    var hasGeo = false;
                    var lat = null;
                    var long = null;

                    Object.keys(nodes[i].properties).forEach(function(p){

                        if(p == "http://www.w3.org/2003/01/geo/wgs84_pos#long"){
                            hasGeo = true;

                            var values = nodes[i].properties[p];

                            Object.keys(values).forEach(function(v) {
                                long = v;
                            });

                        } else if(p == "http://www.w3.org/2003/01/geo/wgs84_pos#lat"){
                            hasGeo = true;

                            var values = nodes[i].properties[p];

                            Object.keys(values).forEach(function(v) {
                                lat = v;
                            });
                        }

                    });

                    if(hasGeo){
                        this.nodeMap[nodes[i].anchor] = {
                            node: nodes[i],
                            lat: lat,
                            long: long
                        }
                    }
                }
            }

            this.nodes = [];
            Object.keys(this.nodeMap).forEach(function(key){
                self.nodes.push(self.nodeMap[key].node);
            });

            this.draw();
        },

        draw: function(){
            var self = this;

            Object.keys(this.nodeMap).forEach(function(key){

                var n = self.nodeMap[key];

                var icon = L.icon({
                    iconUrl: n.node.icon,
                    iconSize: [32, 32]
                });

                if(n.marker == null){
                    n.marker = L.marker([n.lat, n.long], {icon: icon}).addTo(self.map);
                }

            });
        },

        seek: function(uri){
            var self = this;

            if(!(uri in this.nodeMap)){
                return;
            }

            var n = this.nodeMap[uri];

            this.map.panTo([n.lat, n.long]);

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