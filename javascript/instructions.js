$(document).ready(function(){
    resetLayout();
});

$(window).resize(function(){
    resetLayout();
});

var resetLayout = function(){
    $("#content").css("left",($(document).width() - $("#content").width())/2);
    $("#bannerArt").css("margin-left",($("#content").width()-406)/2);
};