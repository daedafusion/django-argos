$(function() {

//    $(".js-toggle-minified").click(function(){
//        toggle_left_menu($(this));
//    });

//    $(".js-sub-menu-toggle").click(function(){
//        $(this).parent().toggleClass("active");
//        $(this).parent().find(".sub-menu").toggle();
//        $(this).find(".toggle-icon").toggleClass("fa-angle-down");
//    });

//    $(document).bind('keypress', '[', function(){
//        toggle_left_menu($(".js-toggle-minified"));
//    });

    $(window).resize(function(){
        resize_left_menu();
    });

    resize_left_menu();

});

function toggle_left_menu($div){
    $(".left-sidebar").toggleClass("minified");
    $(".content-wrapper").toggleClass("expanded");
    $div.find("i.fa").toggleClass("fa-fast-backward");
    $(".left-sidebar").find(".sub-menu").hide();

}

function resize_left_menu(){
    $(".left-sidebar").height($(window).height()-$(".top-bar").height()+'px');
}
