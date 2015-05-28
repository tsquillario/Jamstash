/**
* jamstash.loading Module
*
* Keeps the loading state across the app in order to display the spinner gif
*/
angular.module('jamstash.loading', [])

.value('Loading', {
    isLoading: false
});
