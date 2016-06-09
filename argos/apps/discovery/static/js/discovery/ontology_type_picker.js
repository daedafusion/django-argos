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

    $.widget( "argos.typePicker" , {

        //Options to be used as defaults
        options: {
            someValue: null
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;

            // _create will automatically run the first time
            // this widget is called. Put the initial widget
            // setup code here, then you can access the element
            // on which the widget was called via this.element.
            // The options defined above can be accessed
            // via this.options this.element.addStuff();
            this.$el = $(this.element);

            this.$dialog = $('<div/>').appendTo(this.$el);

            this.$dialog.dialog({
                autoOpen: false,
                closeOnEscape: false,
                width: "35%",
                height: 500,
                buttons: [
                    {
                        text: "New",
                        click: function(){
                            if(self.callback != null){
                                var selected = self.$tree.jstree(true).get_selected(true)[0].data.rdfType;
                                self.callback(selected);
                            }
                            self.close();
                        }
                    },{
                        text: "Cancel",
                        click: function(){
                            self.close();
                        }
                    }
                ]
            });
        },

        // Destroy an instantiated plugin and clean up
        // modifications the widget has made to the DOM
        destroy: function () {

            // this.element.removeStuff();
            this.$dialog.dialog('destroy').remove();
            // For UI 1.8, destroy must be invoked from the
            // base widget
            $.Widget.prototype.destroy.call(this);
            // For UI 1.9, define _destroy instead and don't
            // worry about
            // calling the base widget
        },

        close: function(){

            this.$dialog.dialog('close');

            this._trigger(":close", event, {});
        },

        open: function(callback){
            var self = this;

            this.$dialog.on('dialogopen', function(e, ui){
                self.$newButton = $(".ui-dialog-buttonset button:first-child");
                self.$newButton.button('option', 'disabled', true);
            });

            this.callback = callback;
            this.$dialog.dialog('open');

            var ont = Ontology.ont;

            this.$tree = $("<div/>").appendTo(this.$dialog);

            var tree_data = {};

            var tree_json = [];

            ont.classes.forEach(function(c) {

                if(!c.isAbstract) {
                    var element = {
                        type: c.rdfType,
                        label: c.labels.length > 0 ? c.labels[0].value : c.rdfType.substring(c.rdfType.indexOf("#"))
                    };

                    if (tree_data.hasOwnProperty(c.namespacePrefix)) {
                        tree_data[c.namespacePrefix].push(element);
                    } else {
                        tree_data[c.namespacePrefix] = [element];
                    }
                }

            });

            Object.keys(tree_data).forEach(function(prefix){
                var node = {
                    text: prefix,
                    children: []
                };
                tree_data[prefix].forEach(function(c){
                    node.children.push({
                        text: c.label,
                        data: {
                            rdfType: c.type
                        }
                    });
                });
                tree_json.push(node);
            });

            tree_json.sort(function(a, b){
                return a.text.localeCompare(b.text);
            });

            this.$tree.jstree({
                core: {
                    data: tree_json,
                    themes : {
                        name: 'proton',
                        dots : false
                    }
                },
                plugins: ["search"]
            });
            this.$tree.on('changed.jstree', function(e, data){
                self.$newButton.button('option', 'disabled', false);
            });

            this._trigger(":open", event, {});
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