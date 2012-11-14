dojo.require("esri.map");
dojo.require("esri.layers.FeatureLayer");

var _questionCount;
var _current = 0;
var _maps = [];
var _maxQuestions = 10;
var _appId = undefined;
var _title = undefined;
var _subtitle = undefined;
var _editableFeatures;
var _quizLayer;

$(document).ready(function(){
    _questionCount = $(".questionHeader").length;
    resetLayout();
});

dojo.ready(function(){
    createNewQuestion();
    _quizLayer = new esri.layers.FeatureLayer("http://services.arcgis.com/nzS0F0zdNLvs7nc8/arcgis/rest/services/Treasure_Hunt_Questions/FeatureServer/0");
});

$(window).resize(function(){
    resetLayout();
});

var resetLayout = function(){
    $("#content").css("left",($(document).width() - $("#content").width())/2);
    $("#bannerArt").css("margin-left",($("#content").width()-406)/2);
    $(".mapWrapper").width($("#questionsWrapper").width()-6);
    $(".textInput").width($("#questionsWrapper").width()-12);
    $(".quizSettings").width($("#questionsWrapper").width()-12);
    $(".question").each(function(i){
        $(this).width($("#questionsWrapper").width()-$(".questionCount").eq(i).width()-$(".questionError").eq(i).width()-3);
    });
    dojo.forEach(_maps,function(map){
        if(map.currentIndex === _current){
            map.resize();
            map.reposition();
        }
    });
};

var queryQuiz = function () {
    if($("#appId").val() !== "" && $("#appId").val() !== "e.g. 135275324468467"){

        _appId = undefined;

        $("#appIdError").hide();

        var queryTask = new esri.tasks.QueryTask("http://services.arcgis.com/nzS0F0zdNLvs7nc8/arcgis/rest/services/Treasure_Hunt_Questions/FeatureServer/0");

        var query = new esri.tasks.Query();
        query.returnGeometry = false;
        query.outFields = ["*"];
        query.where = "App_ID = " + parseFloat($("#appId").val());

        queryTask.execute(query,editResults);

    }
    else{
        $("#appIdError").html("You must first provide a application ID to continue.");
        $("#appIdError").show();
    }
};

var editResults = function(results){
    if (results.features.length > 0){

        _editableFeatures = results.features;

        dojo.forEach(_maps,function(map){
            map.destroy();
        });

        _appId = results.features[0].attributes.App_ID;
        _title = results.features[0].attributes.App_Title;
        $("#appTitle").val(results.features[0].attributes.App_Title);
        _subtitle = results.features[0].attributes.App_Subtitle;
        $("#appSubtitle").val(results.features[0].attributes.App_Subtitle);

        _questionCount = 0;
        _current = 0;
        _maps = [];

        $("#questionsWrapper").html("");

        dojo.forEach(results.features,function(ftr,i) {
            createNewQuestion(i);
            $(".question").eq(i).val(ftr.attributes.Question).data("FID",ftr.attributes.FID);
            $(".name").eq(i).val(ftr.attributes.Title);
            $(".description").eq(i).val(ftr.attributes.Description);
            $(".hint").eq(i).val(ftr.attributes.Hint);
            $(".imgURL").eq(i).val(ftr.attributes.Image_URL);
            $(".latitude").eq(i).val(ftr.attributes.Lat);
            $(".longitude").eq(i).val(ftr.attributes.Long);
        });

        $(".question, .textInput, .quizSettings").each(function(){
        if ($(this).val() !== "Type a subtitle for your quiz here..." && $(this).val() !== "Type a title for your quiz here..." && $(this).val() !== "Type a question here..." && $(this).val() !== "Type a name for your location here..." && $(this).val() !== "Type a description for your location here..." && $(this).val() !== "Type a hint here..." && $(this).val() !== "Paste your image URL here... (e.g. http://www.awebsite.com/myimage.png)"){
            if($(this).val() !== ""){
                $(this).css("border-color","#fafafa");
            }
        }


        $("#launch").show();

        resetLayout();
    });

    }
    else{
        $("#appIdError").html("No results found for application: "+$("#appId").val());
        $("#appIdError").show();
    }
};

var createNewQuestion = function(i){
    _questionCount = i || _questionCount;
    if (_questionCount < _maxQuestions){
      _current = _questionCount;
      $(".questionContent").slideUp();
      $("#questionsWrapper").append("<div class='questionHeader open'><span class='error questionError'>*</span><span class='questionCount'>"+(_questionCount+1)+". </span><input type='text' class='question'  placeholder='Type a question here...'></div>");
      $("#questionsWrapper").append("<div class='questionContent'><form class='questionForm'><span class='error nameError'>*</span>Location's Name:<br><textarea class='name textInput' placeholder='Type a name for your location here...'></textarea><br><span class='error descriptionError'>*</span>Location's Description:<br><textarea class='description textInput' placeholder='Type a description for your location here...'></textarea><br><span class='error hintError'>*</span>Hint:<br><textarea class='hint textInput' placeholder='Type a hint here...'></textarea><br><span class='error imgError'>*</span>Image URL:<br><textarea class='imgURL textInput' placeholder='Paste your image URL here... (e.g. http://www.awebsite.com/myimage.png)'></textarea><br><span class='error mapError'>*</span>Add question to map:<br><div id='mapWrapper"+_questionCount+"' class='mapWrapper'><table class='locationTable'><tr><td colspan='2' style='vertical-align:bottom'><a href='#mapWrapper"+_questionCount+"' class='addPoint modern embossed-link' onclick='addPoint("+_questionCount+")'>Find Location on Map</a><br><br><strong>OR</strong><br><br></td></tr><tr><td style='vertical-align:top; text-align:right;'>Latitude: <input type='text' class='latitude latLongText' onchange='updatePoint()'  placeholder='e.g. 34.056'></td><td style='vertical-align:top; text-align:left;'>Longitude: <input type='text' class='longitude latLongText' onchange='updatePoint()'  placeholder='e.g. -117.197'></td></tr></table><div id='map"+_questionCount+"' class='map'></div><div class='mapBlind'></div></div></form></div>");
      $(".mapWrapper").width($("#questionsWrapper").width()-2);
      $(".mapBlind").fadeTo(0,"0.8");

      var map = new esri.Map("map"+_questionCount, {
        extent: new esri.geometry.Extent({xmin:-20098296,ymin:-2804413,xmax:5920428,ymax:15813776,spatialReference:{wkid:54032}}),
        sliderStyle:"small"
      });
      map.cursor = "default";

      var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer");
      map.addLayer(basemap);

      var questionLocation = new esri.layers.GraphicsLayer();
      map.addLayer(questionLocation);

      map.questionLocation = questionLocation;
      map.currentIndex = _current;

      dojo.connect(map, 'onLoad', function(theMap) {
        //resize the map when the browser resizes
        dojo.connect(dijit.byId('map'), 'resize', map,map.resize);
      });

      dojo.connect(map, 'onMouseOver', function() {
        map.setMapCursor(map.cursor);
      });

      dojo.connect(map, 'onUpdateEnd', function() {
          if (!map.locationAdded){
              map.locationAdded = true;
            if($(".longitude").eq(map.currentIndex).val() !== "" && $(".longitude").eq(map.currentIndex).val() !== "e.g. -117.197" && $(".latitude").eq(map.currentIndex).val() !== "" && $(".latitude").eq(map.currentIndex).val() !== "e.g. 34.056"){
                map.questionLocation.clear();
                var imgURL = "css/images/icons/QuizIconB"+(map.currentIndex+1).toString()+".png";
                var symbol = new esri.symbol.PictureMarkerSymbol(imgURL, 30, 30);
                map.questionLocation.add(new esri.Graphic(esri.geometry.geographicToWebMercator(new esri.geometry.Point(parseFloat($(".longitude").eq(map.currentIndex).val()),parseFloat($(".latitude").eq(map.currentIndex).val()))), symbol));
            }
          }
      });

      dojo.connect(map, 'onClick', function(event) {
        if(map.cursor !== "default"){
          var imgURL = "css/images/icons/QuizIconB"+(map.currentIndex+1).toString()+".png";
          var symbol = new esri.symbol.PictureMarkerSymbol(imgURL, 30, 30);
          questionLocation.add(new esri.Graphic(event.mapPoint, symbol));
          var geoPoint = esri.geometry.webMercatorToGeographic(event.mapPoint);
          $(".latitude").eq(map.currentIndex).val(geoPoint.y);
          $(".longitude").eq(map.currentIndex).val(geoPoint.x);
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

    $(".question, .textInput, .quizSettings").blur(function(){
        if ($(this).val() !== "Type a question here..." && $(this).val() !== "Type a name for your location here..." && $(this).val() !== "Type a description for your location here..." && $(this).val() !== "Type a hint here..." && $(this).val() !== "Paste your image URL here... (e.g. http://www.awebsite.com/myimage.png)"){
            if($(this).val() !== ""){
                $(this).css("border-color","#fafafa");
            }
        }
    });

    $(".question, .textInput, .quizSettings").mouseover(function(){
        $(this).css("border-color","#dadada");
    });

    $(".question, .textInput, .quizSettings").mouseout(function(){
        if ($(this).val() !== "Type a question here..." && $(this).val() !== "Type a name for your location here..." && $(this).val() !== "Type a description for your location here..." && $(this).val() !== "Type a hint here..." && $(this).val() !== "Paste your image URL here... (e.g. http://www.awebsite.com/myimage.png)"){
            if(!$(this).is(":focus") && $(this).val() !== ""){
                $(this).css("border-color","#fafafa");
            }
        }
    });

    $('input[placeholder], textarea[placeholder]').placeholder();

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

var saveQuiz = function(view){
    if (errorCheck()){

        _quizLayer = new esri.layers.FeatureLayer("http://services.arcgis.com/nzS0F0zdNLvs7nc8/arcgis/rest/services/Treasure_Hunt_Questions/FeatureServer/0");

        if(_appId === undefined){
            _appId = parseFloat(new Date().getTime().toString() + Math.floor(Math.random()*99).toString());
            $("#appId").val(_appId);
            $("#launch").show();
        }
        if(_title === undefined){
            _title = $("#appTitle").val() || "Enter a title for your quiz here...";
        }
        if(_subtitle === undefined){
            _subtitle = $("#appSubtitle").val() || "Enter a subtitle for your quiz here...";
        }

        if (view === true){
            openInfo();
        }

        var quizAdd =[];
        var quizUpdate =[];

        $(".questionContent").each(function(i){

            var feature;

            var question = $(this).prev().children(".question").val();
            var title = $(this).children("form").children(".name").val();
            var description = $(this).children("form").children(".description").val();
            var hint = $(this).children("form").children(".hint").val();
            var img_URL = $(this).children("form").children(".imgURL").val();
            var geoPoint = esri.geometry.webMercatorToGeographic(_maps[i].questionLocation.graphics[0].geometry);
            var x = geoPoint.x.toString();
            var y = geoPoint.y.toString();

            var attr = {
                App_ID:_appId,
                App_Subtitle:_subtitle,
                App_Title:_title,
                Description:description,
                Hint:hint,
                Image_URL:img_URL,
                Lat:y,
                Long:x,
                MinScale:null,
                Question:question,
                Title:title
            };

            if($(this).prev().children(".question").data("FID")){
                attr.FID = $(this).prev().children(".question").data("FID");
                feature = new esri.Graphic(_maps[i].questionLocation.graphics[0].geometry,null,attr);
                quizUpdate.push(feature);
            }
            else{
                feature = new esri.Graphic(_maps[i].questionLocation.graphics[0].geometry,null,attr);
                quizAdd.push(feature);
            }
        });

        _quizLayer.applyEdits(quizAdd,quizUpdate,null,function(){
             var queryTask = new esri.tasks.QueryTask("http://services.arcgis.com/nzS0F0zdNLvs7nc8/arcgis/rest/services/Treasure_Hunt_Questions/FeatureServer/0");

            var query = new esri.tasks.Query();
            query.returnGeometry = true;
            query.outFields = ["*"];
            query.where = "App_ID = " + _appId;

            queryTask.execute(query,function(results){
                 dojo.forEach(results.features,function(ftr,i) {
                    $(".question").eq(i).val(ftr.attributes.Question).data("FID",ftr.attributes.FID);
                 });
            });
        });
    }
};

var deleteQuiz = function () {
    if(confirm("Are you sure you want to delete you quiz?")){
        if(_appId !== undefined){

            var queryTask = new esri.tasks.QueryTask("http://services.arcgis.com/nzS0F0zdNLvs7nc8/arcgis/rest/services/Treasure_Hunt_Questions/FeatureServer/0");

            var query = new esri.tasks.Query();
            query.returnGeometry = true;
            query.outFields = ["*"];
            query.where = "App_ID = " + _appId;

            queryTask.execute(query,function(results){


                deleteFeatures = [];

                dojo.forEach(results.features,function(ftr){
                    var feature = new esri.Graphic(null,null,ftr.attributes);
                    deleteFeatures.push(feature);
                });

                _quizLayer.applyEdits(null,null,deleteFeatures);

            });

        }

        dojo.forEach(_maps,function(map){
            map.destroy();
        });

        _appId = undefined;
        _title = undefined;
        $("#appTitle").val("");
        _subtitle = undefined;
        $("#appSubtitle").val("");

        $(".quizSettings").css("border-color","#dadada");

        _questionCount = 0;
        _current = 0;
        _maps = [];

        $("#questionsWrapper").html("");

        createNewQuestion();
    }
};

var launchApp = function(){
    saveQuiz(true);
};

var openInfo = function(){
    $("#modal").fadeTo("slow","0.7");
    $("body").css("overflow","hidden");
    $("#viewContent").css({
        "left":($(window).width()-600)/2,
        "top":($(window).height()-200)/2
    });
    $("#quizID").html(_appId);
    $("#viewContent").fadeIn();
};

var goToQuiz = function () {
    $("#modal").fadeOut();
    $("#viewContent").fadeOut();
    $("body").css("overflow","auto");

    window.open("http://storymaps.esri.com/lee/treasure-hunt-template/?appid="+_appId);
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

        window.location = "instructions.html";
};