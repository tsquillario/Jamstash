describe("Subsonic controller", function() {
	'use strict';


	var scope, $rootScope, subsonicCtrl, subsonic, deferred;

	beforeEach(function() {
		module('jamstash.subsonic.ctrl');

		jasmine.addCustomEqualityTester(angular.equals);

		inject(function ($controller, _$rootScope_, utils, globals, map, _subsonic_, notifications, $q) {
			$rootScope = _$rootScope_;
			scope = $rootScope.$new();
			subsonic = _subsonic_;

			deferred = $q.defer();

			spyOn(subsonic, 'getStarred').and.returnValue(deferred.promise);

			subsonicCtrl = $controller('SubsonicCtrl', {
				$scope: scope,
				$rootScope: $rootScope,
				$routeParams: {},
				utils: utils,
				globals: globals,
				map: map,
				subsonic: subsonic,
				notifications: notifications
			});
		});
	});

	describe("getStarred -", function() {

		it("given that my library contains 3 starred songs, when getting all the starred songs, the scope contains 3 starred songs", function() {
			scope.getStarred('add', 'artist');

			deferred.resolve({song: [{id:"2548"},{id:"8986"},{id:"2986"}]});
			$rootScope.$apply();

			expect(subsonic.getStarred).toHaveBeenCalled();
			expect(scope.song).toEqual([{id:"2548"},{id:"8986"},{id:"2986"}]);
		});
	});
});