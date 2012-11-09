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

var launchApp = function(){
    if ($("#webmap").val() !== ""){
        window.open = "http://storymaps.esri.com/stories/2012/treasure-hunt/?webmap="+$("#webmap").val();
    }
    else{
        alert("You must first provide a webmap ID in the text box above.");
    }
}