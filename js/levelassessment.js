
function ReadXlsxToArray(excelFileUrl) {
	/*Checks whether the browser supports HTML5*/
	if (typeof (XMLHttpRequest) == "undefined")	{
		alert("Your browser does not support HTML5!");
		return;
	}
	
	var httpReq = new XMLHttpRequest();
	httpReq.responseType = "arraybuffer";
	httpReq.onload = function(e) {
		/* convert data to binary string */
		var data = new Uint8Array(httpReq.response);
		
		var arr = new Array();
		for (var i = 0; i != data.length; ++i) {
			arr[i] = String.fromCharCode(data[i]);
		}
		
		var excelFileArray = arr.join("");
		
		/*Converts the excel data in to object*/
		var workbook = XLSX.read(excelFileArray, { type: 'binary' });

		/*Loop through each sheet in the workbook*/
		workbook.SheetNames.forEach(function(sheetName) {
			/*Convert the cell value to Json*/
			var excelJson = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
			BindButtons(excelJson, sheetName, '#mainsection');
		});
		
		$('#exceltable').show();
	}
	
	httpReq.open("GET", excelFileUrl, true);
	httpReq.send();
}

function BindButtons(jsonData, sheetName, sectionId) {
	$(sectionId).append($('<h2/>').html(sheetName));
	var columns = GetJsonColumns(jsonData);
	
	for (var i = 0; i < jsonData.length; i++) {
		var phrase = jsonData[i][columns[0]];
		if (phrase == null) phrase = "";
		var level = jsonData[i][columns[1]];
		if (level == null) level = 1;
		var weight = jsonData[i][columns[2]];
		if (weight == null) weight = 1;

		var row$ = $('<label class="switch switch-slide"/>');
		row$.append($('<input class="switch-input" type="checkbox" data-level="' + level + '" data-weight="' + weight + '"  data-phrase="' + phrase + '" />'));
		row$.append($('<span class="switch-label" data-on="' + phrase + '" data-off="' + phrase + '" />'));
		row$.append($('<span class="switch-handle" />'));
		$(sectionId).append(row$);
	}
}
		
function GetJsonColumns(jsonData) {
	var columnSet = [];
	for (var i = 0; i < jsonData.length; i++) {
		var rowHash = jsonData[i];
		for (var key in rowHash) {
			if (rowHash.hasOwnProperty(key)) {
				if ($.inArray(key, columnSet) == -1) {
					columnSet.push(key);
				}
			}
		}
	}
	
	return columnSet;
}

function ClearCheckboxes() {
	var cbs = $("#mainsection input:checked");
	cbs.each( function() {
		$(this).prop("checked", false);
	});
}

function Level(levelNum, numSelected, numItems, selectedWeightTotal, weightTotal) {
	this.levelNum = levelNum;
	this.numSelected = numSelected;
	this.numItems = numItems;
	this.selectedWeightTotal = selectedWeightTotal;
	this.weightTotal = weightTotal;
}

function SendAssessment() {
	var levels = new Array();
	var cbs = $("#mainsection input");
	cbs.each( function() {
		var level = parseInt($(this).attr('data-level'), 10);
		var weight = parseFloat($(this).attr('data-weight'));
		var phrase = $(this).attr('data-phrase');
		var selected = false;
		if (this.checked) {
			selected = true;
		}
		
		if (levels[level] == undefined) {
			levels[level] = new Level(level, // levelNum
									selected ? 1 : 0, // numSelected
									1, // numItems
									selected ? weight : 0, // selectedWeightTotal
									weight ); // weightTotal
		} else {
			levels[level].numItems += 1;
			levels[level].weightTotal += weight;
			if (selected) {
				levels[level].numSelected += 1;
				levels[level].selectedWeightTotal += weight;
			}
		}
	});
	
	var levelSuggestion = CalculateLevel(levels);
	console.log("level suggestion: " + levelSuggestion);
}

function CalculateLevel(levels) {
	var levelSuggestion = 0;
	// var currentHighLevel = 0;
	var weightCalculation = 0.0;
	$(levels).each( function() {
		var level = this;
		if (level instanceof Level){
			console.log("level: " + level.levelNum + "; weights/totals: " + level.selectedWeightTotal + "/" + level.weightTotal + "; numSelected: " + level.numSelected);
			var wgt = level.selectedWeightTotal / level.levelNum;
			if (wgt > weightCalculation) {
				levelSuggestion = level.levelNum;
				weightCalculation = wgt;
			}
			// if (level.numSelected > currentHighLevel) {
				// levelSuggestion = level.levelNum;
				// currentHighLevel = level.numSelected;
			// }
		}
	});
	
	return levelSuggestion;
}
