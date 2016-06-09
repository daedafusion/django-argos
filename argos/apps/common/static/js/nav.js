var checkSessionInterval = null;

function checkSession(){

    swampdragon.callRouter('is_session_valid', 'session-router', null, function(context, data){
        if(!data.valid){
            clearInterval(checkSessionInterval);

            var $dialog = $('<div><p>Your session has timed out. Please login again</p></div>').appendTo($("body"));

            $dialog.dialog({
                title: 'Session Expired',
                modal: true,
                resizable: false,
                height: 200,
                width: 300,
                buttons: {
                    "Login": function(){
                        window.location = Urls['index']();
                    }
                }
            });
        }
    });

}

$(function(){

    var $notif = $('.notif').notif({
    });

    swampdragon.ready(function(){

        checkSessionInterval = setInterval(checkSession, 60000)

    });

});