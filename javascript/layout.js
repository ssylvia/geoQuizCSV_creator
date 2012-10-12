dojo.require("esri.map");

var _questionCount;
var _maps = [];
var cursorURL = "url(http://assets.sunlightfoundation.com.s3.amazonaws.com/reporting/hac_map/red.png),auto";
var imgURL = "http://assets.sunlightfoundation.com.s3.amazonaws.com/reporting/hac_map/red.png";

$(document).ready(function(){
    _questionCount = $(".questionHeader").length;
});

dojo.ready(function(){
    createNewQuestion();
});

var createNewQuestion = function(){
    $("#questionsWrapper").append("<div class='questionHeader open'>Question "+ (_questionCount+1)+"</div>");
    $("#questionsWrapper").append("<div class='questionContent'><form class='questionForm'>Enter a question:<br><textarea class='question'></textarea><br><br>Enter a Hint:<br><textarea class='hint'></textarea><br>Add question to map:<button type='button' class='addPoint' onclick='addPoint("+_questionCount+")'>Add point</button><br><div id='map"+_questionCount+"' class='map'></div></form></div>");
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
            var symbol = new esri.symbol.PictureMarkerSymbol(imgURL, 20, 34);
            questionLocation.add(new esri.Graphic(event.mapPoint, symbol));
            map.cursor = "default";
            map.setMapCursor("default");
        }
    });
    
    _maps.push(map);

    _questionCount++;
};

var addPoint = function(i){
    $(".addPoint").eq(i).html("Move Point");
    _maps[i].questionLocation.clear();
    _maps[i].cursor = cursorURL;
}

var exportCSV = function(event){
    var csv = "\"order\",\"question\",\"hint\",\"x\",\"y\"\n"
    $(".questionContent").each(function(i){
        var index = i.toString();
        var question = $(this).children("form").children(".question").val();
        var hint = $(this).children("form").children(".hint").val();
        var x = _maps[i].questionLocation.graphics[0].geometry.x.toString();
        var y = _maps[i].questionLocation.graphics[0].geometry.y.toString();
        var csvAdd = "\""+index+"\",\""+question+"\",\""+hint+"\",\""+x+"\",\""+y+"\"\n";  
        csv = csv+csvAdd;
    });
    
    saveFile(event,csv);
}

var saveFile = function(event,csv){
    $.generateFile({
    		filename	: 'geoQuiz.csv',
			content		: csv,
			script		: 'download.php'
		});
		
		event.preventDefault();
}