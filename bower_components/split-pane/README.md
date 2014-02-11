split-pane
==========

jQuery Split Pane plugin

The plugin should work in IE8 and above as well as in Chrome, Safari and Firefox.

Below is a basic example on how to use the plugin. Check out my [blog post](http://www.dreamchain.com/split-pane/) for some prettier examples.

As you can see, I'm setting up component widths and divider position using css, not as options to the JS splitPane function. The reason for this is that I like things to look good even **before** the JavaScript kicks in. 

    <!DOCTYPE html>
    <html>
      <head>
    		<title>Basic Example</title>
    		<link rel="stylesheet" href="split-pane.css" />
    		<script src="http://code.jquery.com/jquery-1.9.1.js"></script>
    		<script src="split-pane.js"></script>
    		<style type="text/css">
    			html, body {
    				height: 100%;
    				min-height: 100%;
    				margin: 0;
    				padding: 0;
    			}
    			.split-pane-divider {
    				background: #aaa;
    			}
    			#left-component {
    				width: 20em;
    			}
    			#my-divider {
    				left: 20em; /* Same as left component width */
    				width: 5px;
    			}
    			#right-component {
    				left: 20em;  /* Same as left component width */
    				margin-left: 5px;  /* Same as divider width */
    			}
    		</style>
    		<script>
    			$(function() {
    				$('div.split-pane').splitPane();
    			});
    		</script>
    	</head>
    	<body>
    		<div class="split-pane fixed-left">
    			<div class="split-pane-component" id="left-component">
    				This is the left component
    			</div>
    			<div class="split-pane-divider" id="my-divider"></div>
    			<div class="split-pane-component" id="right-component">
    				This is the right component
    			</div>
    		</div>
    	</body>
    </html>
    
