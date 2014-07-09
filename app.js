angular.module("seo", ["importio"]);

importio.init({
	"auth": {
		"userGuid": "e4aa58c3-bb28-4468-87a0-d574f4dbc778",
		"apiKey": "Ayv5OkcvJMFqqXchUlvYPuSGAv3bO7BAMsa2lv0+hLN3DJ3aA/hS/8uPB2p0mYUld1PcFUZA2JUNhMDg9h4cqw=="
	}
});

angular.module("seo").controller("SEO", function($scope, $timeout, safeApply, ioquery) {

	$scope.inputUrl = "https://import.io";

	$scope.rows = [];

	$scope.notPresent = "(Not present)";
	$scope.notLabelled = "(Unlabelled)";
	$scope.noHeadings = "(No headings)";

	$scope.inputChanged = function(url) {
		var matches = url.match(/https?:\/\/[^\s;,]+/ig);
		if (matches && matches.length > 1) {
			collapseAllRows();
			matches.map(function(url) {
				$scope.addUrl(url, true);
			});
			$scope.inputUrl = "";
		}
	}

	$scope.removeRow = function(idx) {
		$scope.rows.splice(idx, 1);
	}

	$scope.refreshRow = function(row) {
		if (row.loading) {
			return;
		}
		row.loading = true;
		ioquery.query({
			"connectorGuids": ["7f8a9f9f-f7f4-4ea2-8af7-477c28af3e62"],
			"input": {
				"webpage/url": row.url
			}
		}).then(function(data) {
			row.data = data[0].data;
			for (var i = 1; i <= 6; i++) {
				var heading = "h" + i;
				if (!row.data.hasOwnProperty(heading)) {
					row.data[heading] = [];
					continue;
				}
				if (Object.prototype.toString.call(row.data[heading]) !== '[object Array]') {
					row.data[heading] = [row.data[heading]];
					continue;
				}
			}
			if (row.data.hasOwnProperty("robots")) {
				if (Object.prototype.toString.call(row.data.robots) !== '[object Array]') {
					row.data.robots = [row.data.robots];
				}
			}
			row.loading = false;
			row.failed = false;
			safeApply($scope);
		}, function() {
			row.data = false;
			row.loading = false;
			row.failed = true;
			safeApply($scope);
		});
	}

	$scope.openCSV = function() {
		var data = {};
		var checkFieldInitialised = function(heading) {
			if (!data.hasOwnProperty(heading)) {
				data[heading] = [];
			}
		}
		var normaliseDataLengths = function() {
			var maxLength = 0;
			for (var k in data) {
				if (data[k].length > maxLength) {
					maxLength = data[k].length;
				}
			}
			for (var k in data) {
				while(data[k].length < maxLength) {
					data[k].push("");
				}
			}
		}
		var enquote = function(input) {
			if (!input) {
				return "";
			}
			if (Object.prototype.toString.call(input) === '[object Array]') {
				input = input.join("; ");
			}
			input = input.replace(/,/g, "\\,");
			if (input.indexOf(",") >= 0 || input.indexOf("\n") >= 0 || input.indexOf('"') >= 0 || input.indexOf(';') >= 0) {
				return '"' + input.replace(/"|“|”/ig, '""').replace(/\n|\r/ig, "") + '"';
			}
			return input;
		}
		$scope.rows.map(function(row) {
			checkFieldInitialised("url");
			for (var k in row.data) {
				checkFieldInitialised(k);
			}
			
			normaliseDataLengths();
			data.url.push(row.url);
			for (var k in row.data) {
				data[k].push(row.data[k]);
			}
		});
		var csv = "";
		var headings = Object.keys(data);
		csv += headings.map(enquote).join(",") + "\n";
		for (var i = 0; i < data.url.length; i++) {
			var row = [];
			for (var j = 0; j < headings.length; j++) {
				row.push(data[headings[j]][i]);
			}
			csv += row.map(enquote).join(",") + "\n";
		}
		window.open("data:application/csv;charset=utf-8," + encodeURIComponent(csv));
	}

	var collapseAllRows = function() {
		$scope.rows.map(function(row) {
			row.expanded = false;
		});
	}

	$scope.hasMoreHeadings = function(row, count) {
		for (var i = 1; i <= 6; i++) {
			var heading = "h" + i;
			if (row.data[heading].length > count) {
				return true;
			}
		}
		return false;
	}

	$scope.addUrl = function(inputUrl, bulk) {
		for (var i = 0; i < $scope.rows.length; i++) {
			if ($scope.rows[i].url == inputUrl) {
				$scope.inputUrl = "";
				return;
			}
		}
		if (!inputUrl.match(/^https?:\/\//i)) {
			inputUrl = "http://" + inputUrl;
		}
		var newRow = {
			"url": inputUrl,
			"data": false,
			"loading": false,
			"expanded": true,
			"failed": false,
			"states": {
				"expanded": {
					"keywords": false,
					"links": false,
					"images": false,
					"headings": false
				}
			}
		}
		if (!bulk) {
			collapseAllRows();
		}
		$scope.rows.unshift(newRow);
		$scope.refreshRow(newRow);
		$scope.inputUrl = "";
	}
	$timeout(function() {
		$scope.addUrl($scope.inputUrl);
	}, 1000);

});

angular.module("seo").factory("safeApply", function($rootScope) {

	return function($scope) {
		try {
			if (!$scope) {
				console.error("safeApply not applied as no scope was provided");
				return;
			}
			if ($scope.$root.$$phase != "$apply" && $scope.$root.$$phase != "$digest") {
				$scope.$apply();
			}
		} catch (e) {
			console.error("safeApply threw error", e);
		}
	}

});