$.extend({
    distinct : function(anArray) {
       var result = [];
       $.each(anArray, function(i,v){
           if ($.inArray(v, result) == -1) result.push(v);
       });
       return result;
    }
});

var backend = '/services/cv/';
console.debug(document.URL);
if (document.URL.indexOf('file:') > -1) {
	backend = 'http://127.0.0.1:8080/services/cv/';
}

function SmartHomeMetro( backend ) {
	var _this = this;
	this.update = function(json) {
		console.debug("visu.update:", json);
		for (key in json) {
			if (json[key] === undefined || json[key] == "Uninitialized") {
				continue;
			}
		
			$('[data-trigger="' + key + '"]').attr("data-sh-current", json[key]);
		
			if ($('[data-value="' + key + '"]').attr("id") == "slider") {
				var valueAsNumber = Number(json[key]);
				$('[data-value="' + key + '"]').val(json[key]);
				if (valueAsNumber > 0) {
					$('[data-icon="' + key + '"]').removeClass("icon-lamp-2");
					$('[data-icon="' + key + '"]').addClass("icon-lamp");
				} else {
					$('[data-icon="' + key + '"]').removeClass("icon-lamp");
					$('[data-icon="' + key + '"]').addClass("icon-lamp-2");
				}
			} else {
				$('[data-value="' + key + '"]').text(json[key]);	
			}
	  }
	};
	
	this.updateDate = function() {
		var dayNames = new Array("Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag");
		var monthNames = new Array("Januar", "Februar", "M&auml;rz", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember");
		var currentDate = new Date();
		var currentDayName = dayNames[currentDate.getDay()];
		var currentMonthName = monthNames[currentDate.getMonth()];
		$('#weekdayname').text(currentDayName);
		$('#weekday').text(currentDate.getDate());
		$('#monthname')[0].innerHTML = currentMonthName;
	};
	
	this.connect = function() {
		_this.visu = new CometVisu(backend);
		_this.visu.resendHeaders = {'X-Atmosphere-tracking-id':null};
		_this.visu.headers= {'X-Atmosphere-Transport':'long-polling'};
		_this.visu.user = 'demo_user';
		_this.visu.update = _this.update;
		
		monitoringNodes = $("[data-value]").map(function() { 
			if ($(this).attr("data-type") == "number") {
				$(this).text("0 " + $(this).attr("data-format"));
			} else if ($(this).attr("data-type") == "text") {
				$(this).text("");
			}
			return $(this).attr("data-value"); 
		}).get();
		monitoringNodes = $.distinct(monitoringNodes);
		console.debug("monitoring nodes:", monitoringNodes);
		_this.visu.subscribe(monitoringNodes);
	};
	
	$(document).on("click", '[data-trigger]', function() { // Send Button
        console.debug("click", $(this));
		var path = $(this).attr('data-trigger');
		var val = $(this).attr("value");
		if ($(this).attr('data-sh-current') !== undefined) {
			if ($(this).attr('data-sh-current') > 0) {
				val = 0;
			}
		}
		_this.visu.write(path, val);
    });
	
	$('.slider').each(function( index, element ) {
		$(element).noUiSlider({
			start: 0,
			orientation: "horizontal",
			step: 1,
			range: {
				'min': 0,
				'max': 100
			}
		});
		$(element).on({
			set: function(){
				var intvalue = Math.floor( $(this).val());
				console.debug($(this).attr("data-value"), intvalue);
				_this.visu.write($(this).attr("data-value"), intvalue);
			}	
		});
	});
};
	
var request = $.ajax({url: '/services/fritz/callentries/10', dataType: 'json'});
request.done(function( json ) {
	console.debug(json);
	for(var i = 0; i < json.callentries.length; i++) {
		var obj = json.callentries[i];
		var text = obj.name;
		var dir = "icon-cancel2";
		if (obj.type == '4') {
			dir = "icon-arrow-up-right";
		} else if (obj.type == '1') {
			dir = "icon-arrow-down-right";
		}
		if (text == '') {
			text = "Unbekannt";
		}
		$("#phonelist").append("<div style='width: 100%; border-bottom:1px solid #616156;height:48px;padding-left:25px;'><span style='position:absolute; left:3px;padding-top:5px;' class='" + dir + "'/><div style='display:block;'><div style='float:right;margin-right:8px;'>" + obj.duration + "</div><div style='font-size:16px;margin: 6px 0 6px 0;'>" + text + "</div><div style='font-size:10px;'>" + obj.number + "</div></div></div>")
	}
});



	
var smartHomeMetro = new SmartHomeMetro(backend);
smartHomeMetro.connect();
smartHomeMetro.updateDate();
	