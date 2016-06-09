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

    $.widget( "argos.queryEditor" , {

        //Options to be used as defaults
        options: {
            someValue: null
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;

            this.$e = $(this.element);

            this.$e.addClass('query-editor-dialog');

            this.$container = $('<div class="query-editor-container"/>').appendTo(this.$e);

            this.$e.dialog({
                title: 'Sparql Query',
                dialogClass: "no-close",
                autoOpen: false,
                closeOnEscape: true,
                width: 600,
                height: 600,
                buttons: [
                    {
                        text: "Search",
                        click: function(){
                            self.query();
                        }
                    },
                    {
                        text: "Cancel",
                        click: function(){
                            self.close();
                        }
                    }
                ]
            });

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

        open: function() {
            var self = this;

            this._render();

            this.$e.dialog('open');
        },

        close: function() {
            this.$e.dialog('close');
        },

        _render: function(){
            var self = this;

            this.$textArea = $('<textarea/>').appendTo(this.$container);

            this.$textArea.val('prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
                'prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n' +
                'prefix xsd: <http://www.w3.org/2001/XMLSchema#>\n' +
                'construct where {\n' +
                '?s ?p ?o .\n' +
                '}\n' +
                'limit 50');
        },

        query: function(){
            var query = this.$textArea.val();

            SparqlEngine.sparqlQuery(query);

            this.close();
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