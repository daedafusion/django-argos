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

    $.widget( "argos.workspaceOpen" , {

        //Options to be used as defaults
        options: {
            someValue: null
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;

            this.$el = $(this.element);

            this.$el.addClass('workspace-open');

            this.$dialog = this.$el;

            this.$dialog.dialog({
                autoOpen: false,
                closeOnEscape: false,
                width: 600,
                height: 500,
                title: "Open Workspace",
                buttons: [
                    {
                        text: "Open",
                        click: function(){

                            var sel = self.$table.DataTable().row('.selected').data();
                            self._trigger(":open", event, {uuid: sel.uuid});

                            self.close();
                        }
                    },{
                        text: "Cancel",
                        click: function(){
                            self.close();
                        }
                    },{
                        text: "Delete",
                        click: function(){
                            var row = self.$table.DataTable().row('.selected');
                            var sel = row.data();
                            row.remove().draw(false);
                            self._trigger(":delete", event, {uuid: sel.uuid});
                        }
                    }
                ]
            });

            // Move delete button to left side
            $('.ui-dialog-buttonset').css('float','none');
            $('.ui-dialog-buttonset>button:last-child').css('float','left');

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

        open: function(workspaces){
            var self = this;

            this.workspaces = workspaces;
            console.log(workspaces);

            self.$dialog.dialog('open');

            var $table = this.$table = $('<table/>').appendTo(this.$dialog);

            $table.dataTable({
                data: workspaces,
                columns: [
                    {
                        title: 'Name',
                        data: 'name'
                    },{
                        title: 'Tags',
                        data: 'tags'
                    }
                ],
                //columnDefs: [
                //    {
                //        render: function(data, type, row){
                //            if(data == null){
                //                return "Untitled Workspace";
                //            }
                //        },
                //        targets: 0
                //    }
                //],
                paging: false,
                info: false,
                scrollY: 300
            });

            $table.on('click', 'tr', function(){
                if ( $(this).hasClass('selected') ) {
                    $(this).removeClass('selected');
                }
                else {
                    $table.$('tr.selected').removeClass('selected');
                    $(this).addClass('selected');
                }
            });

            this._trigger(":open", event, {});
        },

        close: function(){

            this.$dialog.dialog('close');

            this._trigger(":close", event, {});
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