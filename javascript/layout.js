dojo.require("esri.map");

var _questionCount;
var _current = 0;
var _maps = [];
var _maxQuestions = 10;

$(document).ready(function(){
    _questionCount = $(".questionHeader").length;
    resetLayout();
});

dojo.ready(function(){
    createNewQuestion();
});

$(window).resize(function(){
    resetLayout();
});

var resetLayout = function(){
    $("#content").css("left",($(document).width() - $("#content").width())/2);
    $("#bannerArt").css("margin-left",($("#content").width()-406)/2);
    $(".mapWrapper").width($("#questionsWrapper").width()-6);
    $(".textInput").width($("#questionsWrapper").width()-12);
    $(".question").each(function(i){
        $(this).width($("#questionsWrapper").width()-$(".questionCount").eq(i).width()-$(".questionError").eq(i).width()-3);
    });
    dojo.forEach(_maps,function(map){
        map.resize();
        map.reposition();
    });
};

var createNewQuestion = function(){
    if (_questionCount < _maxQuestions){
      _current = _questionCount;
      $(".questionContent").slideUp();
      $("#questionsWrapper").append("<div class='questionHeader open'><span class='error questionError'>*</span><span class='questionCount'>"+(_questionCount+1)+". </span><input type='text' class='question'  placeholder='Type a question here...'></div>");
      $("#questionsWrapper").append("<div class='questionContent'><form class='questionForm'><span class='error nameError'>*</span>Location's Name:<br><textarea class='name textInput' placeholder='Type a name for your location here...'></textarea><br><span class='error descriptionError'>*</span>Location's Description:<br><textarea class='description textInput' placeholder='Type a description for your location here...'></textarea><br><span class='error hintError'>*</span>Hint:<br><textarea class='hint textInput' placeholder='Type a hint here...'></textarea><br><span class='error imgError'>*</span>Image URL:<br><textarea class='imgURL textInput' placeholder='Paste your image URL here... (e.g. http://www.awebsite.com/myimage.png) '></textarea><br><span class='error mapError'>*</span>Add question to map:<br><div id='mapWrapper"+_questionCount+"' class='mapWrapper'><table class='locationTable'><tr><td colspan='2' style='vertical-align:bottom'><a href='#' class='addPoint modern embossed-link' onclick='addPoint("+_questionCount+")'>Find Location on Map</a><br><br><strong>OR</strong><br><br></td></tr><tr><td style='vertical-align:top; text-align:right;'>Latitude: <input type='text' class='latitude latLongText' onchange='updatePoint()'  placeholder='e.g. 34.056'></td><td style='vertical-align:top; text-align:left;'>Longitude: <input type='text' class='longitude latLongText' onchange='updatePoint()'  placeholder='e.g. -117.197'></td></tr></table><div id='map"+_questionCount+"' class='map'></div><div class='mapBlind'></div></div></form></div>");
      
      $(".mapWrapper").width($("#questionsWrapper").width()-2);
      $(".mapBlind").fadeTo(0,"0.8");
      
      var map = new esri.Map("map"+_questionCount, {
        extent: new esri.geometry.Extent({xmin:-20098296,ymin:-2804413,xmax:5920428,ymax:15813776,spatialReference:{wkid:54032}})
      });
      map.cursor = "default";
    
      var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer");
      map.addLayer(basemap);
    
      var questionLocation = new esri.layers.GraphicsLayer();
      map.addLayer(questionLocation);
    
      map.questionLocation = questionLocation;
    
      dojo.connect(map, 'onLoad', function(theMap) {
        //resize the map when the browser resizes
        dojo.connect(dijit.byId('map'), 'resize', map,map.resize);
      });
    
      dojo.connect(map, 'onMouseOver', function() {
        map.setMapCursor(map.cursor);
      });
    
      dojo.connect(map, 'onClick', function(event) {
        if(map.cursor !== "default"){          
          var imgURL = "css/images/icons/QuizIconB"+(_current+1).toString()+".png";
          var symbol = new esri.symbol.PictureMarkerSymbol(imgURL, 30, 30);
          questionLocation.add(new esri.Graphic(event.mapPoint, symbol));
          var geoPoint = esri.geometry.webMercatorToGeographic(event.mapPoint);
          $(".latitude").eq(_current).val(geoPoint.y);
          $(".longitude").eq(_current).val(geoPoint.x);
          map.cursor = "default";
          map.setMapCursor("default");
          setTimeout(function(){
            $(".mapBlind").fadeTo("slow","0.8");
            $(".locationTable").fadeIn();
          },1000);
        }
      });
    
      _maps.push(map);

      _questionCount++;
      
      if (_questionCount === _maxQuestions){
        $("#newQuestion").fadeOut();
      }
      
    }
    $('.textInput').autosize();
    $(".questionHeader").click(function(){
        _current = $(this).index()/2;
        if(!$(this).next().is(":visible")){
            $(".questionContent").slideUp();
            $(this).next().slideDown();
            setTimeout(function() {
                resetLayout();
            }, 200);
        }
    });
    
    $(".question, .textInput").blur(function(){
        if($(this).val() !== ""){
            $(this).css("border-color","#fafafa");
        }
    });
    
    $(".question, .textInput").mouseover(function(){
        $(this).css("border-color","#dadada");
    });
    
    $(".question, .textInput").mouseout(function(){
        if(!$(this).is(":focus") && $(this).val() !== ""){
            $(this).css("border-color","#fafafa");
        }
    });
    
    setTimeout(function() {
        resetLayout();
    }, 200);
};

var addPoint = function(i){
    $(".mapText").eq(i).html("Move Point");
    _maps[i].questionLocation.clear();
    _maps[i].cursor = "crosshair";
    $(".mapBlind").eq(i).fadeOut();
    $(".locationTable").eq(i).fadeOut();
};

var updatePoint = function(){
    if ($(".latitude").eq(_current).val() !== "" && $(".longitude").eq(_current).val() !== ""){
        _maps[_current].questionLocation.clear();
        var imgURL = "css/images/icons/QuizIconB"+(_current+1).toString()+".png";
        var symbol = new esri.symbol.PictureMarkerSymbol(imgURL, 30, 30);
        _maps[_current].questionLocation.add(new esri.Graphic(esri.geometry.geographicToWebMercator(new esri.geometry.Point(parseFloat($(".longitude").eq(_current).val()),parseFloat($(".latitude").eq(_current).val()))), symbol));
    }
};

var errorCheck = function(){
    
    $(".error").hide();
    $("#errorMessages").html("");
    
    var noError = true;
    
    var errorMessages = [];
    
    $(".questionContent").each(function(i){
        var question = $(this).prev().children(".question").val();
        var title = $(this).children("form").children(".name").val();
        var description = $(this).children("form").children(".description").val();
        var hint = $(this).children("form").children(".hint").val();
        var img_URL = $(this).children("form").children(".imgURL").val();
        var geoPoint = _maps[i].questionLocation.graphics[0];
        
        if (question === ""){
            noError = false;
            errorMessages.push("Question "+(i+1)+": Enter a question.");
            $(".questionError").eq(i).show();
        }
        if (title === ""){
            noError = false;
            errorMessages.push("Question "+(i+1)+": Enter a name for the location.");
            $(".nameError").eq(i).show();
        }
        if (description === ""){
            noError = false;
            errorMessages.push("Question "+(i+1)+": Enter a description for the location.");
            $(".descriptionError").eq(i).show();
        }
        if (hint === ""){
            noError = false;
            errorMessages.push("Question "+(i+1)+": Enter a hint for the question.");
            $(".hintError").eq(i).show();
        }
        if (img_URL === ""){
            noError = false;
            errorMessages.push("Question "+(i+1)+": Enter an image URL for the picture to be displayed with location.");
            $(".imgError").eq(i).show();
        }
        if (geoPoint === undefined){
            noError = false;
            errorMessages.push("Question "+(i+1)+": Add the location to the map.");
            $(".mapError").eq(i).show();
        }
    });
    
    if(!noError){
        dojo.forEach(errorMessages,function(msg) {
            $("#errorMessages").append("<li>"+msg+"</li>");
        });
        $("#mainError").slideDown("fast");
        resetLayout();
    }
    
    
    return noError;
};

var exportCSV = function(event){
    if (errorCheck()){
        var csv = "\"Order\",\"Question\",\"Title\",\"Description\",\"Hint\",\"Image_URL\",\"Long\",\"Lat\"\n";
        $(".questionContent").each(function(i){
            var index = i.toString();
            var question = $(this).prev().children(".question").val();
            var title = $(this).children("form").children(".name").val();
            var description = $(this).children("form").children(".description").val();
            var hint = $(this).children("form").children(".hint").val();
            var img_URL = $(this).children("form").children(".imgURL").val();
            var geoPoint = esri.geometry.webMercatorToGeographic(_maps[i].questionLocation.graphics[0].geometry);
            var x = geoPoint.x.toString();
            var y = geoPoint.y.toString();
            var csvAdd = "\""+index+"\",\""+question+"\",\""+title+"\",\""+description+"\",\""+hint+"\",\""+img_URL+"\",\""+x+"\",\""+y+"\"\n";  
            csv = csv+csvAdd;
        });
        
        saveFile(event,csv);
    }
};

var saveFile = function(event,csv){
    $.generateFile({
    		filename	: 'treasureHunt.csv',
			content		: csv,
			script		: 'export.php'
		});
		
		event.preventDefault();
};