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

    $.widget( "argos.partitionTable" , {

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

            var $e = this.$e = $(this.element);
            var $table = this.$table = $('<table/>').appendTo($e);

            $table.DataTable({
                ajax: Urls['administration:partition_table'](),
                columns: [
                    {
                        title: "uuid",
                        visible: false
                    },
                    { title: "Name" },
                    { title: "Tags" }
                ],
                //scrollCollapse: true,
                paging: false,
                info: false,
                scrollY: 400
            });

            $table.on('click', 'tr', function(event){
                if ( $(this).hasClass('selected') ) {
                    $(this).removeClass('selected');
                }
                else {
                    $table.DataTable().$('tr.selected').removeClass('selected'); // remove existing selections
                    $(this).addClass('selected');
                    //console.log($table.DataTable().row(this).data());
                    self._trigger(":row_selected", event, {
                        uuid: $table.DataTable().row(this).data()[0]
                    });
                }
            });

            $('body').on('partitions:modified', function(){
                self.refresh();
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

        refresh: function() {
            var self = this;

            this.$table.DataTable().ajax.reload();
        },

        methodB: function ( event ) {
            //_trigger dispatches callbacks the plugin user
            // can subscribe to
            // signature: _trigger( "callbackName" , [eventObject],
            // [uiObject] )
            // eg. this._trigger( "hover", e /*where e.type ==
            // "mouseenter"*/, { hovered: $(e.target)});
            console.log("methodB called");
        },

        methodA: function ( event ) {
            this._trigger("dataChanged", event, {
                key: "someValue"
            });
        },

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