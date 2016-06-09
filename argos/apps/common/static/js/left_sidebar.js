$(function() {

    $(".js-toggle-minified").click(function(){
        toggle_left_sidebar($(this));
    });

    $(".js-sub-menu-toggle").click(function(){
        $(this).parent().toggleClass("active");
        $(this).parent().find(".sub-menu").toggle();
        $(this).find(".toggle-icon").toggleClass("fa-angle-down");
    });

    $(document).bind('keypress', '[', function(){
        toggle_left_sidebar($(".js-toggle-minified"));
    });

    $(window).resize(function(){
        resize_left_sidebar();
    });

    resize_left_sidebar();

});

function toggle_left_sidebar($div){
    $(".left-sidebar").toggleClass("minified");
    $(".content-wrapper").toggleClass("expanded");
    $div.find("i.fa").toggleClass("fa-fast-forward");
    $(".left-sidebar").find(".sub-menu").hide();

}

function resize_left_sidebar(){
    $(".left-sidebar").height($(window).height()-$(".top-bar").height()+'px');
}
