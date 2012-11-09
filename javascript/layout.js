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
    $(".mapWrapper").width($("#questionsWrapper").width()-2);
    dojo.forEach(_maps,function(map){
        map.resize();
        map.reposition();
    });
};

var createNewQuestion = function(){
    if (_questionCount < _maxQuestions){
      _current = _questionCount;
      $(".questionContent").slideUp();
      $("#questionsWrapper").append("<div class='questionHeader open'>"+(_questionCount+1)+". <input type='text' class='question'  placeholder='Type a question here...'></div>");
      $("#questionsWrapper").append("<div class='questionContent'><form class='questionForm'>Location's Name:<br><textarea class='name textInput' placeholder='Type a name for your location here...'></textarea><br>Location's Description:<br><textarea class='description textInput' placeholder='Type a description for your location here...'></textarea><br>Hint:<br><textarea class='hint textInput' placeholder='Type a hint here...'></textarea><br>Image URL:<br><textarea class='imgURL textInput' placeholder='Paste your image URL here... (e.g. http://www.awebsite.com/myimage.png) '></textarea><br>Add question to map:<br><div id='mapWrapper"+_questionCount+"' class='mapWrapper'><table class='locationTable'><tr><td colspan='2' style='vertical-align:bottom'><a href='#' class='addPoint modern embossed-link' onclick='addPoint("+_questionCount+")'>Find Location on Map</a><br><br><strong>OR</strong><br><br></td></tr><tr><td style='vertical-align:top; text-align:right;'>Latitude: <input type='text' class='latitude latLongText' onchange='updatePoint()'  placeholder='e.g. 34.056'></td><td style='vertical-align:top; text-align:left;'>Longitude: <input type='text' class='longitude latLongText' onchange='updatePoint()'  placeholder='e.g. -117.197'></td></tr></table><div id='map"+_questionCount+"' class='map'></div><div class='mapBlind'></div></div></form></div>");
      
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

var exportCSV = function(event){
    var csv = "\"Order\",\"Question\",\"Title\",\"Description\",\"Hint\",\"Image_URL\",\"Long\",\"Lat\"\n";
    $(".questionContent").each(function(i){
        var index = i.toString();
        var question = $(this).prev().children(".question").val();
        var title = $(this).children("form").children(".name").val();
        var description = $(this).children("form").children(".description").val();
        var hint = $(this).children("form").children(".hint").val();
        var img_URL = $(this).children("form").children(".imgURL").val();
        var geoPoint = esri.geometry.webMercatorToGeographic(_maps[i].questionLocation.graphics[0].geometry)
        var x = geoPoint.x.toString();
        var y = _geoPoint.y.toString();
        var csvAdd = "\""+index+"\",\""+question+"\",\""+title+"\",\""+description+"\",\""+hint+"\",\""+img_URL+"\",\""+x+"\",\""+y+"\"\n";  
        csv = csv+csvAdd;
    });
    
    saveFile(event,csv);
};

var saveFile = function(event,csv){
    $.generateFile({
    		filename	: 'geoQuiz.csv',
			content		: csv,
			script		: 'export.php'
		});
		
		event.preventDefault();
};