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

    $.widget( "namespace.partitionProps" , {

        //Options to be used as defaults
        options: {
            someValue: null
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {

            this.$e = $(this.element);
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

        show: function(uuid) {
            var self = this;
            console.log("show "+uuid);

            this.$e.load(Urls['administration:partition_props']()+"?uuid="+uuid, function(){

                self._wire(uuid);

            });
        },

        clear: function() {
            this.$e.html("");
        },

        _wire: function(uuid) {
            var self = this;

            self.$e.find('.p-read .perm-add').click(function(){
                var readPerms = [];
                self.$e.find('.p-read .entry>span').each(function(i, elem){
                    readPerms.push($(elem).html());
                });
                self._permDialog(self.$e.find('.p-read .entry-list'), readPerms);
            });

            self.$e.find('.p-write .perm-add').click(function(){
                var readPerms = [];
                self.$e.find('.p-write .entry>span').each(function(i, elem){
                    readPerms.push($(elem).html());
                });
                self._permDialog(self.$e.find('.p-write .entry-list'), readPerms);
            });

            self.$e.find('.p-admin .perm-add').click(function(){
                var readPerms = [];
                self.$e.find('.p-admin .entry>span').each(function(i, elem){
                    readPerms.push($(elem).html());
                });
                self._permDialog(self.$e.find('.p-admin .entry-list'), readPerms);
            });

            self.$e.find('.delete-partition-button').click(function(){
                // TODO alert confirmation

                var promise = $.ajax({
                    url: Urls['administration:partition_delete'](),
                    type: "POST",
                    data: {
                        uuid: uuid
                    }
                });

                promise.done(function(data){
                    $.jGrowl("Partition deleted");
                    $('body').trigger("partitions:modified");
                });
                promise.fail(function(){
                    $.jGrowl("Error deleting partition");
                });
                promise.always(function(){
                    self.clear();
                });
            });

            self.$e.find('.save-partition-button').click(function(){

                var partition = {
                    uuid: uuid,
                    name: self.$e.find('#partition-name').val(),
                    tags: self.$e.find('#partition-tags').val(),
                    read: self.$e.find('.p-read .entry>span').map(function(i, e){
                        return $(e).html();
                    }).get(),
                    write: self.$e.find('.p-write .entry>span').map(function(i, e){
                        return $(e).html();
                    }).get(),
                    admin: self.$e.find('.p-admin .entry>span').map(function(i, e){
                        return $(e).html();
                    }).get()
                };

                var promise = $.ajax({
                    url: Urls['administration:partition_update'](),
                    type: "POST",
                    data: {
                        uuid: uuid,
                        partition: JSON.stringify(partition)
                    }
                });

                promise.done(function(data){
                    $.jGrowl("Partition saved");
                    $('body').trigger("partitions:modified");
                });
                promise.fail(function(){
                    $.jGrowl("Error saving partition");
                });
                promise.always(function(){
                    self.clear();
                });
            });
        },

        _permDialog: function($entryList, selectedElements) {
            var self = this;

            var $dialog = $('<div/>').appendTo($('body'));

            $dialog.load(Urls['administration:partition_perms'](), function(){

                selectedElements.forEach(function(e){
                    $dialog.find('option[value="'+e+'"]').attr("selected", "selected");
                });

                $dialog.dialog({
                    title: 'Edit Permissions',
                    autoOpen: true,
                    closeOnEscape: true,
                    width: 300,
                    height: 400,
                    buttons: [
                        {
                            text: "Save",
                            click: function(){
                                $entryList.find(".entry").not("[readonly]").remove();
                                $dialog.find('#identity-list :selected').each(function(){
                                    var elem = $(this).val();
                                    var $entry = $('<div class="entry"><span>'+elem+'</span></div>');
                                    $entry.appendTo($entryList);
                                });

                                $(this).dialog("close");
                                $dialog.remove();
                            }
                        },{
                            text: "Cancel",
                            click: function(){
                                $(this).dialog("close");
                                $dialog.remove();
                            }
                        }
                    ]
                });

            });
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