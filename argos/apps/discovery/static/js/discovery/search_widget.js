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

    $.widget( "argos.searchBar" , {

        //Options to be used as defaults
        options: {
            someValue: null
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;

            this.$el = $(this.element);

            this.$input = $('<input type="text" class="form-control" placeholder="Search..."/>').appendTo(this.$el);

            this.$timeBtn = $('<button type="button" class="btn btn-default time-filter-btn"><span class="glyphicon glyphicon-time"></span></button>').appendTo(this.$el);

            this.start = null;
            this.end = null;

            // _create will automatically run the first time
            // this widget is called. Put the initial widget
            // setup code here, then you can access the element
            // on which the widget was called via this.element.
            // The options defined above can be accessed
            // via this.options this.element.addStuff();
            this.$input.prop("disabled", true);

            this._initialize();

            this.$input.keypress(function(event){

                var keycode = (event.keyCode ? event.keyCode : event.which);
                if(keycode == '13'){
                    self.executeSearch($(this).val());
                }

            });

            this.$timeBtn.daterangepicker({
                    timePicker: true,
                    opens: 'left',
                    locale: {
                        cancelLabel: 'Clear'
                    }
                }
                //function(start, end) {
                //    console.log(+start);
                //    console.log(+end);
                //    self.start = +start;
                //    self.end = +end;
                //    self.$timeBtn.addClass('time-filter-applied');
                //}
            );

            this.$timeBtn.on('apply.daterangepicker', function(e, picker){
                self.start = +picker.startDate;
                self.end = +picker.endDate;
                self.$timeBtn.addClass('time-filter-applied');
            });

            this.$timeBtn.on('cancel.daterangepicker', function(e, picker){
                self.start = null;
                self.end = null;
                self.$timeBtn.removeClass('time-filter-applied');
            });
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

        _initialize: function() {
            var self = this;

            check(function(){
                self.$input.prop('disabled', false);

                self.$input.typeahead({
                    hint: true,
                    highlight: true,
                    minLength: 1
                },{
                    name: 'ontology',
                    displayKey: 'value',
                    source: self._ontologyAutocomplete(Ontology.ont)
                });
            });
        },

        _ontologyAutocomplete: function(data) {
            var classes = {};

            var dpMap = {};

            var prefixRef = {};
            var tagRef = {};

            data.classes.forEach(function(c, i){
                prefixRef[c.rdfType] = c.namespacePrefix;

                var tag = c.rdfType.substring(c.rdfType.indexOf("#")+1);

                if(tag in classes){
                    // Make both prefixed
                    var prevClassPrefix = prefixRef[tagRef[tag]];

                    var renamedTag = prevClassPrefix+tag;

                    classes[renamedTag] = classes[tag];

                    delete classes[tag];

                    tag = c.namespacePrefix+tag;
                }

                tagRef[tag] = c.rdfType;

                classes[tag] = {};

                c.dataProperties.forEach(function(dp, j){
                    var dpSlug = dp.uri.substring(dp.uri.indexOf("#")+1);
                    classes[tag][dpSlug] = "";

                    if(!(dpSlug in dpMap)){
                        dpMap[dpSlug] = [];
                    }

                    dpMap[dpSlug].push(dp.uri);
                });

                c.objectProperties.forEach(function(op, j){
                    var range = [];

                    op.range.forEach(function(r, k){
                        range.push(r.substring(r.indexOf("#")+1));
                    });

                    classes[tag][op.uri.substring(op.uri.indexOf("#")+1)] = range.join(" - ");
                });
            });

            // TODO probably need to resolve object property range to prefix+tag entries
            // See WhereClauseListener.java#185

            return function build(q, cb){

                // split string on non-quoted spaces
                var clauses = q.match(/(?:[^\s"]+|"[^"]*")+/g);

                // select last clause to work with
                var clause = clauses[clauses.length-1];

                if(clause.indexOf(":") != -1){
                    var sides = clause.split(":");
                    var litPrefix = sides[1];
                    var dpSlug = sides[0].substring(sides[0].lastIndexOf("|")+1);

                    if(litPrefix.length < 2){
                        cb([]);
                        return;
                    }

                    var promise = $.ajax({
                        url: Urls['discovery:literal_prefix_lookup'](),
                        type: "POST",
                        data: {
                            uris: JSON.stringify(dpMap[dpSlug]),
                            lit: litPrefix
                        }
                    });

                    promise.done(function(data){
                        cb(data.map(function(e){
                            return { value: q.substring(0, q.lastIndexOf(":")+1)+e };
                        }));
                    });

                    promise.fail(function(){
                        console.log("TODO :: ERROR");
                        cb([]);
                    });

                    return;
                }

                var elements = clause.split("|");

                var pointer = null;
                var matches = [];

                for(var i = 0; i < elements.length; i++){
                    var current = elements[i];

                    if(i == elements.length-1){
                        // last element
                        if(pointer == null) {
                            for (var c in classes){
                                if(c.match(new RegExp(current, "i"))) {
                                    matches.push({value: clauses.length > 1 ? q.substr(0, q.lastIndexOf(" ")+1)+c : c});
                                }
                            }
                        } else {
                            for(var p in classes[pointer]){
                                if(p.match(new RegExp(current, "i"))) {
                                    matches.push({value: q.substr(0, q.lastIndexOf("|")+1)+p});
                                }
                            }
                        }
                    } else {
                        if(pointer == null){
                            // starting
                            if(current in classes){
                                pointer = current;
                            }
                        } else {
                            var next = classes[pointer][current];

                            if(next == ""){
                                // DP expecting ":" next
                            } else {
                                pointer = next;
                            }
                        }
                    }
                }

                cb(matches);
            };
        },

        executeSearch: function(query) {
            var self = this;

            var id = generateUUID();

            $(document).trigger("spinner:add", [{
                id: id,
                title: query
            }]);

            var data = {
                query: query
            };

            if(this.start != null){
                data.start = this.start;
            }
            if(this.end != null){
                data.end = this.end;
            }

            var promise = $.ajax({
                url: Urls['discovery:knowledge_search'](),
                type: 'POST',
                data: data
            });

            promise.done(function(data){
                //workspaces.current().setNodes(data);
                self._trigger(":results", null, { nodes: data });
            });
            promise.fail(function(){
                console.log("TODO :: ERROR");
            });
            promise.always(function(){
                $(document).trigger("spinner:remove", [{
                    id: id
                }]);
            });
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