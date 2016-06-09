
$(function(){

    var $table = $(".partition-table").partitionTable();

    //$fdg.on('fdgwidget:post_add fdgwidget:post_clear', function(event, data){
    //    workspaces.currentWorkspace.setNodes(data.nodes);
    //});

    var $props = $(".partition-description").partitionProps();

    $table.on('partitiontable:row_selected', function(event, data){
        $props.partitionProps('show', data.uuid);
    });

    $(".new-partition-button").click(function(){

        var $dialog = $('<div/>').appendTo($('body'));

        $dialog.load(Urls['administration:partition_new'](), function(){
            $dialog.dialog({
                title: 'New Partition',
                autoOpen: true,
                closeOnEscape: true,
                width: 600,
                height: 300,
                buttons: [
                    {
                        text: "Save",
                        click: function(){
                            var name = $("#partition-name").val();
                            var tags = $("#partition-tags").val();

                            var promise = $.ajax({
                                url: Urls['administration:partition_new'](),
                                type: 'POST',
                                data: {
                                    name: name,
                                    tags: tags
                                }
                            });

                            promise.done(function(data){
                                $.jGrowl("Partition saved");
                                $table.partitionTable('refresh');
                            });
                            promise.fail(function(){
                                $.jGrowl("Error saving partition");
                            });
                            promise.always(function(){
                                $dialog.dialog("close");
                                $dialog.remove();
                            });
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



    });

});