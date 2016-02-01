app.controller('GmapController', function($scope,$window, $modal, $log, dataService) {
  
	$scope.isCollapsed = false;
	
	$scope.dataRamps = [];
	$scope.mainRoadSensors = [];
	
	$scope.open = function (size,template,controller) {

		var modalInstance = $modal.open({
			templateUrl: template,
			controller: controller,
			size: size,
			resolve: {
				items: function () {
				return $scope.items;
				}
			}
		});

		modalInstance.result.then(function (selectedItem) {
			$scope.response = selectedItem;
			console.log($scope.response);
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		});
	
	};
/*	
	$scope.$on('broadcastRamps', function(){ // listens for updated ramp list
		$scope.dataRamps = dataService.rampList;
		$scope.mainRoadSensors = dataService.mainRoadSensors;
	//	console.log($scope.mainRoadSensors);
	});
	
	$scope.$on('broadcastMainRoadEvent', function(){ // listens for updates from sensors on main road
		var event = dataService.currentMainRoadEvent;
		
		var sensorLocation = event.attributes.location;
//		console.log(sensorLocation);
		console.log($scope.mainRoadSensors);
		for (var i=0; i < $scope.mainRoadSensors.length; i++)
		{
			if ($scope.mainRoadSensors[i].location === sensorLocation){
				$scope.mainRoadSensors[i].density = event.attributes.average_density;
				$scope.mainRoadSensors[i].speed = event.attributes.average_speed;
				$scope.mainRoadSensors[i].flow = event.attributes.average_flow;		
				console.log("found");
			}
				
		}
		
		// updates the polyline properties depending on densities
		changeDensityLinesProperties(sensorLocation);
	});
	
	$scope.$on('broadcastShowRampOnMap', function(){ // listens for updated ramp id to show location of on map
		moveMapToLocation($scope.dataRamps[dataService.rampSelected].lat,$scope.dataRamps[dataService.rampSelected].lng);
	});

	*/
	
	//////////////////////////// variables for polyline snap
	var poly;
	var polys = [];
	var dirservice = new google.maps.DirectionsService();
	var paths = [];
	////////////////////////////////////////////////////////
	
//	var d3 = $window.d3; // adds d3 library in the context of the directive
	
	// applies all changes to map based on previous events
/*
	$scope.$on("broadcastRawEventList", function(){
		var eventList = dataService.rawEventList;
		console.log(eventList);
		setTimeout(function (){
		for (var j = 0 ; j < 17 ; j++)
		{
			var currentRamp = j;
			
			for (var i = eventList.length-1; i>=0 ;i++){
				
				if (eventList[i]!=undefined){
				var event = eventList[i];
				
				if((event.name == "Congestion" || event.name == "PredictedCongestion") && currentRamp == dataService.rampLocationToId(event.attributes.location))
					displayCongestion(event);
				else if(event.name == "ClearCongestion" && currentRamp == dataService.rampLocationToId(event.attributes.location))
					break;		
			}}
		}
		}, 200);
	});
*/	

/*
	$scope.$on('broadcastMapEvent', function(){
		var event = dataService.currentMapEvent;
		if (event.name == "Congestion" || event.name == "PredictedCongestion")
			displayCongestion(event);
		else if(event.name == "ClearCongestion")
			clearCongestion(event);
	});
    */
	/////////////////////////////////////////////////////////////
	
	
	var infowindow = new google.maps.InfoWindow({
    content: '<div id="divVideo" style="width: 500px; height: 300px"></div>'
	});
	var infowindowCongestion = new google.maps.InfoWindow({
		content: '<div id="divCongestion" style="width: 300px; height: 150px; font-size:15px"></div>'
	});
	
	var activeMapCircles = [];
	var imgRamp =
	{
		url: 'img/traffic_light_icon.png',
		// This marker is 15 pixels wide by 15 pixels tall.
		size: new google.maps.Size(31, 31),
		// The origin for this image is 0,0.
		origin: new google.maps.Point(0, 0),
		// The anchor for this image is the base of the flagpole at 8,8 (centre).
		anchor: new google.maps.Point(16, 20)
	};
	function initialize() {
		// Create an array of styles.
		var styles = [
		  {
		    "featureType": "road.highway",
		    "elementType": "geometry",
		    "stylers": [
		      { "saturation": -35 },
		      { "hue": "#00c3ff" }
		    ]
		  },{
		    "featureType": "administrative",
		    "stylers": [
		      { "visibility": "off" }
		    ]
		  },{
		    "featureType": "landscape",
		    "stylers": [
		      { "visibility": "off" }
		    ]
		  },{
		    "featureType": "poi",
		    "stylers": [
		      { "visibility": "off" }
		    ]
		  },{
		    "featureType": "transit",
		    "stylers": [
		      { "visibility": "simplified" },
		      { "hue": "#ff8000" }
		    ]
		  },{
		    "featureType": "water",
		    "stylers": [
		      { "hue": "#0091ff" },
		      { "saturation": -48 }
		    ]
		  },{
		    "featureType": "road.local",
		    "stylers": [
		      { "visibility": "off" }
		    ]
		  },{
		    "featureType": "road.highway",
		    "elementType": "labels",
		    "stylers": [
		      { "saturation": -100 },
		      { "visibility": "simplified" }
		    ]
		  },{
		    "featureType": "road.arterial",
		    "elementType": "labels",
		    "stylers": [
		      { "saturation": -100 },
		      { "visibility": "simplified" }
		    ]
		  }
		];

		var styledMap = new google.maps.StyledMapType(styles,
			{ name: "Road" });

		var mapOptions =
		{
			center: new google.maps.LatLng(45.1841656, 5.7155425),
			zoom: 13,
			// disable map controls
			disableDefaultUI: true,
			streetViewControl: false,
			scrollwheel: true,
			navigationControl: true,
			mapTypeControl: true,
			scaleControl: true,
			draggable: true,
			//
			mapTypeControlOptions: {
				mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
			}
		};
		$scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);
		 
		
		//Associate the styled map with the MapTypeId and set it to display.
		$scope.map.mapTypes.set('map_style', styledMap);
		$scope.map.setMapTypeId('map_style');
		
		$scope.markers = [];
		 
		 
		
	//////////////////
	var infoWindow = new google.maps.InfoWindow();
		
	}
	
	function addMarkers(){
		var createMarker = function (ramp){
			
			var marker = new MarkerWithLabel({
				map: $scope.map,
				position: new google.maps.LatLng(ramp.lat, ramp.lng),
				title: "Ramp "+ramp.id,
				icon: imgRamp,
				labelAnchor: new google.maps.Point(3, -13),
				labelContent: ramp.id.toString(),
				labelClass: "markerlabel", // the CSS class for the label
				lane: ramp.lane
			});

			google.maps.event.addListener(marker, 'click', seeCam);
			
			$scope.markers.push(marker);
			
		}  
		
		for (i = 0; i < $scope.dataRamps.length; i++){
			createMarker($scope.dataRamps[i]);
		} // creates ramp markers on map

		$scope.openInfoWindow = function(e, selectedMarker){
			e.preventDefault();
			google.maps.event.trigger(selectedMarker, 'click');
		}
	}
	
	function drawPolylineFromAtoB(a,b,sensor1,sensor2){	// inspired by http://people.missouristate.edu/chadkillingsworth/mapsexamples/snaptoroad.htm
			
			var path = new google.maps.MVCArray();
			poly = new google.maps.Polyline({ map: $scope.map});
			
			path.push(a);
			poly.setPath(path);
			
			dirservice.route({
		        	origin: a,
		        	destination: b,
		        	travelMode: google.maps.DirectionsTravelMode.DRIVING
		      	}, function(result, status) {
			       		if (status == google.maps.DirectionsStatus.OK) {
			          		for (var i = 0, len = result.routes[0].overview_path.length; i < len; i++) {
			            		path.push(result.routes[0].overview_path[i]);
			          		}
			        	}
		      	   }
			);
			
//			paths.push(paths);
			
			// add behaviour
			poly.start = sensor1;
			poly.end = sensor2;
			// add event listener on section click							change currently selected poly						opens driver compliance modal
			google.maps.event.addDomListener(poly, 'click', function(){ dataService.polylineSelectionChanged(poly); $scope.open("","views/driverComplianceModal.html","DriverComplianceModalController")});
			
			polys.push(poly);
	
	}
	
	
	// this function draws a line between 2 consecutive sensors on the road
	function drawDensityLines (){
		var start,end;
		var i = 0;
		var j = 0;

		console.log($scope.mainRoadSensors.length);
		for (var i = 0; i < $scope.mainRoadSensors.length-1; i++)
		{
			if ($scope.mainRoadSensors[i].lane != "fast"){
				start = new google.maps.LatLng($scope.mainRoadSensors[i].lat, $scope.mainRoadSensors[i].lng);
				end = new google.maps.LatLng($scope.mainRoadSensors[i+1].lat, $scope.mainRoadSensors[i+1].lng);
				
				drawPolylineFromAtoB(start,end,$scope.mainRoadSensors[i],$scope.mainRoadSensors[i+1]);
			}
		}
		
//		console.log("HOW MANY LINES? -->" + polys.length);
		console.log(polys);
		changeAllDensityLinesProperties();
	}
	
	
	
	// this function updates the appearence of the road polyline depending on average sensor data received for a specific sensor 
	// the colour of the polyline is the average of the latest density values from sensors between which it's drawn
	function changeDensityLinesProperties(loc){
		var once = 0;
		var colorScale = d3.scale.linear()
				   .domain([0, 100])
				   .range(["green","red"]);
				   
		for (var i = 0; i < polys.length; i++)
		{
			if (polys[i].start.location == loc && once == 0)
			{
				var dens1 = (polys[i].start.density + polys[i].end.density)/2;
				var dens2 = (i>0)? (polys[i].start.density + polys[i-1].start.density)/2 : dens1;
				
				polys[i].setOptions({ strokeColor: colorScale(dens1)});
				if (i>0)
					polys[i-1].setOptions({ strokeColor: colorScale(dens2)});
				
				once++;
			}
			else if (polys[i].end.location == loc && once == 0)
			{
				var dens1 = (polys[i].end.density + polys[i].start.density)/2;
				var dens2 = (i>0)? (polys[i].end.density + polys[i-1].end.density)/2 : dens1;
				
				polys[i].setOptions({ strokeColor: colorScale(dens1)});
				if (i>0)
					polys[i-1].setOptions({ strokeColor: colorScale(dens2)});
				
				once++;
			}
		}
		
	}
	
	
	// this functions initialises the road polyline overlay with the values from DATASERVICE -- currently random
	function changeAllDensityLinesProperties(){

		var colorScale = d3.scale.linear()
				   .domain([0, 100])
				   .range(["green","red"]);
				   
		for (var i = 0; i < polys.length; i++)
		{
			var dens1 = (polys[i].start.density);// + polys[i].end.density)/2;
				
			polys[i].setOptions({ strokeColor: colorScale(dens1), strokeWeight: 10});
			
			
		}	
//		polys[10].setOptions({ strokeWeight: 20});
	}
	
	function drawCirclesAlert(lat,lng,name,certainty,problem_id)
	{// draw on map using gmaps api
		
		// determine color of circle (from name) and fill opacity (from certainty)
		var color;
		var circleOpacity = 0;
		var opacityScale = d3.scale.linear()
				   .domain([0, 1])
				   .range([0, 0.8]);


		if (name == "Congestion") {
			color = "orangered";
		}
		else if (name == "PredictedCongestion") {
			color = "steelblue";
		}
		else {
			color = "C4C4C4";
		}
		circleOpacity = (opacityScale(certainty)).toFixed(2);

		// draw circle
		var circle = new google.maps.Circle({
			center: new google.maps.LatLng(lat, lng),
			radius: 200,
			clickable: true,
			strokeColor: "black",
			strokeOpacity: 0.8,
			strokeWeight: 1,
			fillColor: color,//"red",
			fillOpacity: circleOpacity,
			problemID: problem_id,
			map: $scope.map
		});
		// add event to circle
		google.maps.event.addListener(circle, 'click', displayCongestionInfo);
		
		return circle;
	}
	
	function displayCongestionInfo()
	{
	//	infowindowCongestion.open(map, this.getCenter());

		var circle = this;
		setTimeout(function () {
			var pos = circle.getCenter();

			// sets position of infowindow at circle centre
			infowindowCongestion.setPosition(pos);
			infowindowCongestion.open($scope.map);
			
			// modifies the infowindow content
			for (var i = 0; i < activeMapCircles.length; i++)
			{
				if (activeMapCircles[i].problemID == circle.problemID)
				{
					d3.select("#divCongestion").selectAll("p").remove();
					d3.select("#divCongestion")
						.append("p").text("problem name: "+activeMapCircles[i].name)
						.append("p").text("time of occurence: "+new Date(activeMapCircles[i].timestamp).toString())
						.append("p").text("certainty: "+activeMapCircles[i].certainty)
						.append("p").text("problem id: "+activeMapCircles[i].problemID)
						.append("p").text("av. density: "+activeMapCircles[i].density);
				}
			}
			
			
		}, 50);
	}
	
	// draws a circle at the position of detected and predicted congestion
	function displayCongestion(m) 
	{
		clearCongestion(m); // clears any event with the same problem_id 
		
		var rampId = dataService.rampLocationToId(m.attributes.location);
		
		var pos = {lat: $scope.dataRamps[rampId].lat, lng: $scope.dataRamps[rampId].lng}
		var circle = drawCirclesAlert(pos.lat, pos.lng, m.name, m.attributes.Certainty,m.attributes.problem_id);

		var problem = { name: 0, timestamp: 0, sensorID: 0, problemID: 0, certainty:0, density:0, mapCircle: 0 };
		problem.name = m.name;
		problem.timestamp = m.timestamp;
		problem.sensorID = m.attributes.location;
		problem.problemID = m.attributes.problem_id;
		problem.mapCircle = circle;
		problem.certainty = m.attributes.Certainty;
		problem.density = m.attributes.average_density;

		// stores all detected and predicted congestions
		activeMapCircles.push(problem);
		// moves map to location
		moveMapToLocation(pos.lat,pos.lng);
	}
	
	function moveMapToLocation(lat,lng)
	{
		var location = new google.maps.LatLng(lat, lng);

		$scope.map.setCenter(location);
		$scope.map.setZoom(16);

	}
	
	// clears Congestion display on map
	function clearCongestion(m)
	{
		infowindowCongestion.close(); // closes previously opened infoWindow
		
		var rampId = dataService.rampLocationToId(m.attributes.location);
		
		var pos = {lat: $scope.dataRamps[rampId].lat, lng: $scope.dataRamps[rampId].lng}
		var problemID = m.attributes.problem_id;
		
		var circlesToDelete = [];

		for (var i = activeMapCircles.length-1; i >= 0; i--)
		{
			if (activeMapCircles[i].problemID == problemID)
			{
				// removes circle from map
				activeMapCircles[i].mapCircle.setMap(null);
				// removes circle from active circles array
				activeMapCircles.splice(i,1); // doesn't work if multiple circles have same problemID
			}
		}
	}
	
	function seeCam()   // function to view cam at the selected marker location
	{
		infowindow.open($scope.map, this);

		var marker = this;

		setTimeout(function () {
			var pos = marker.getPosition();
			
			// maps API fails without this
			pano = new google.maps.StreetViewPanorama(document.getElementById("divVideo"),
			{
				disableDefaultUI: true,
			});

			pano.setPosition(pos);
			pano.setVisible(true);
		}, 50);
		
	}

//	drawCirclesAlert(45.1841656, 5.7155425,"Congestion",0.5);
/*
	google.maps.event.addDomListener($window, 'load', initialize);
	// wait for map to initialize then add markers
	setTimeout(addMarkers,2000);
	
	setTimeout(drawDensityLines,5000);
    */
});

function clone(obj) {/////////////////// function from http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

/*
var circularMap = d3.xml("img/last.svg", "image/svg+xml", function(xml) {
  var it = document.getElementById("circularMap").appendChild(xml.documentElement);
  it.width = "800px";
});
*/

var circularMap;

function serveSvg (){
    circularMap = document.getElementById("circularMap").contentDocument;
}