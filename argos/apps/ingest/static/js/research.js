$(function(){

    var $table = $('<table/>').appendTo($('.research-requests-wrapper'));

    $table.DataTable({
        ajax: Urls['ingest:research_table'](),
        columns: [
            {
                title: 'uuid',
                visible: false
            },
            { title: 'Research Type' },
            { title: 'Submit Date' },
            { title: 'Status' }
        ],
        paging: false,
        info: false,
        scrollY: 500
    });

    $('.new-research-wrapper').load(Urls['ingest:research_new'](), function(){

        $('.new-research-wrapper .option button').click(function(){
            var type = $(this).attr('rtype');

            var $dialog = $('<div/>').appendTo($('body'));
            $dialog.load(Urls['ingest:research_new_dialog'](), function(){
                $dialog.dialog({
                    title: 'New Research',
                    autoOpen: true,
                    closeOnEscape: true,
                    width: 400,
                    height: 300,
                    buttons: [
                        {
                            text: "Save",
                            click: function(){
                                var targets = $("#research-targets").val();

                                var promise = $.ajax({
                                    url: Urls['ingest:research_new'](),
                                    type: 'POST',
                                    data: {
                                        targets: targets,
                                        type: type
                                    }
                                });

                                promise.done(function(data){
                                    $.jGrowl("Starting research");
                                    $table.DataTable().ajax.reload();
                                });
                                promise.fail(function(){
                                    $.jGrowl("Error starting research");
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

});