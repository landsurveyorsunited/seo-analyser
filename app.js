angular.module("seo", ["importio"]);

importio.init({
	"auth": {
		"userGuid": "e4aa58c3-bb28-4468-87a0-d574f4dbc778",
		"apiKey": "Ayv5OkcvJMFqqXchUlvYPuSGAv3bO7BAMsa2lv0+hLN3DJ3aA/hS/8uPB2p0mYUld1PcFUZA2JUNhMDg9h4cqw=="
	}
});

angular.module("seo").controller("SEO", function($scope, safeApply, ioquery) {

	$scope.inputUrl = "https://import.io";

	$scope.rows = [];

	$scope.notPresent = "(Not present)";
	$scope.notLabelled = "(Unlabelled)";
	$scope.noHeadings = "(No headings)";

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

	$scope.addUrl = function(inputUrl) {
		for (var i = 0; i < $scope.rows.length; i++) {
			if ($scope.rows[i].url == inputUrl) {
				$scope.inputUrl = "";
				return;
			}
		}
		var newRow = {
			"url": inputUrl,
			"data": false,
			"loading": false,
			"expanded": true,
			"failed": false
		}
		$scope.rows.map(function(row) {
			row.expanded = false;
		});
		$scope.rows.unshift(newRow);
		$scope.refreshRow(newRow);
		$scope.inputUrl = "";
	}

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