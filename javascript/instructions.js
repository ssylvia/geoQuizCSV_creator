$(document).ready(function(){
    $(".stepContent").first().show();
    resetLayout();
    $(".stepHeader").click(function(){
        $(".stepContent").slideUp();
        $(this).next().slideDown();
    });
    
});

$(window).resize(function(){
    resetLayout();
});

var resetLayout = function(){
    $("#content").css("left",($(document).width() - $("#content").width())/2);
    $("#bannerArt").css("margin-left",($("#content").width()-406)/2);
    $(".screenshot").width($("#instuctionsWrapper").width()-6);
};