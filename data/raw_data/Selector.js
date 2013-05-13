Portfolio = {};

// Pre jQuery load (for speed reasons), object is accessible so it can be used later to change interfaces
// NOTE: no dependencies 
Portfolio.selector = (function(_document) {
    var NOSCRIPT_DOMAIN = "/no_script";
    var INDEX_PAGE = "index";
    var mode = 'desktop';
    
    return {
        scripts: {
            js_loaded: [],
            
            // Common scripts could be put on layout page but then it would be hard to check once there loaded in
            // a general way. Also, this negates a lot of browser imcompatabilities like ignoring defers (Opera) in
            // scripts in the head.
            common: {
                js_location: '',
                js: [
                    '/javascripts/jquery.min.js',
                    '/javascripts/jquery.lightbox_me.min.js',
                    '/javascripts/prettify.min.js',
                    '/javascripts/Utility.min.js',
                    '/constants.min.js',
                    
                    // identical page view logic
                    '/javascripts/Blog.min.js'
                ]
            },
            
            desktop: {
                js_location: '/javascripts/desktop/',
                js: [
                    'min.js'
                    //'menu_to_actions.js',
                    //
                    //'Skills.js',
                    //'Experience.js',
                    //'Demos.js',
                    //'System.js',
                    //'Window_Details.js'
                ],
                
                css_location: '',
                css: [
                    '/stylesheets/desktop/style_c.css',
                    '/stylesheets/desktop/experience_c.css',
                    '/stylesheets/desktop/skills_c.css',
                    '/stylesheets/desktop/demos_c.css',
                    '/stylesheets/desktop/blog_c.css',
                    '/stylesheets/desktop/window_tiles_c.css',
                    '/stylesheets/desktop/icbm_c.css',
                    'http://google-code-prettify.googlecode.com/svn/trunk/src/prettify.css'
                ]
            },
            
            mobile: {
                js_location: '/javascripts/mobile/',
                js: [
                    'min.js'
                    //'Skills.js',
                    //'Experience.js',
                    //'Demos.js',
                    //'Menu.js',
                    //'System.js'
                ],
                
                css_location: '',
                css: [
                    '/stylesheets/mobile/style.css',
                    '/stylesheets/mobile/experience.css',
                    '/stylesheets/mobile/skills.css',
                    '/stylesheets/mobile/demos.css',
                    '/stylesheets/mobile/blog.css',
                    'http://google-code-prettify.googlecode.com/svn/trunk/src/prettify.css'
                ]
            }
        },
        
        // tracks what has been loaded so far
        loaded: {
            pages: 0,
            js: 0,
            css: 0
        },
        PAGES_TO_LOAD: 2,
        
        // Takes the user agent with the screen width to render the appropriate interface
        init: function(dont_run, width, user_string){
            var MOBILE_WIDTH = 720;
            var MOBILE_STRING = "mobile";
            
            if (typeof mocha !== "undefined" && dont_run)
                return this;
            
            if (user_string.search(MOBILE_STRING) > 0 || width <= MOBILE_WIDTH)
                this.render_mobile();
            else
                this.render_desktop();
                
            return this;
        },
        
        // Same as desktop just different pages are loaded
        render_mobile: function(){
            mode = 'mobile';
            
            // Add meta for mobile devices
            var meta = _document.createElement("meta");
                meta.name = "viewport";
                meta.id = "viewport";
                meta.content = "width=device-width, initial-scale=1.0";
            _document.head.appendChild(meta);
            
            this.load_css();
            this.load_js();
            this.load_pages(window.location);
        },
        
        // Loads specified page or if it can't goes to no script page.
        render_desktop: function(){
            mode = 'desktop';
            
            _document.body.style.display = 'none';// ensures page load looks smooth
            
            this.load_css();
            this.load_js();
            this.load_pages(window.location);
        },
        
        // starts up the system loading the required scripts
        start_system: function(){
            _document.body.style.display = 'block';
            
            // Run each AJAX loaded script
            for (var i = 0; i < this.scripts.js_loaded.length; i += 1){
                var script = _document.createElement('script');
                    script.text = this.scripts.js_loaded[i];
                    script.id = 'script_injection_' + i;
                _document.head.appendChild(script);
            }
            
            Portfolio.start_system();
        },
        
        is_system_loaded: function(){
            if (this.loaded.css == this.scripts[mode].css.length &&
                this.loaded.js == this.scripts[mode].js.length + this.scripts.common.js.length &&
                this.loaded.pages == this.PAGES_TO_LOAD){
                    return true;
                }
            return false;
        },
        
        // Adds a invisible div named page_name with innerHTML of page data directly to the body if the div does
        // not already exist. Returns if a cache was created or not.
        add_cache: function(page_name, page_data){
            var id_to_find = page_name.replace('/','').replace('#','') + "_cache";
            
            if (_document.getElementById(id_to_find) === null){
                var div = _document.createElement('div');
                    div.id = id_to_find;
                    div.style.display = 'none';
                    div.innerHTML = page_data;
                _document.body.appendChild(div);
                return true;
            }
            return false;
        },
        
        mode_to_get: function(){
            return '?mode=' + mode;
        },
        
        // Uses AJAX to load interface common and current interface scripts into an object for later execution
        load_js: function(){
            var parent = this;
            
            // Preinitialize loaded array so scripts can be inserted into the array in the order this.scripts describes
            this.scripts.js_loaded = new Array(this.scripts.common.js.length + this.scripts[mode].js.length);
            
            // Get script at from and place it in order position to be executed
            var load_script = function(from, order) {
                this.ajax_load('GET', from, function(response){
                    parent.scripts.js_loaded[order] = response;
                    parent.loaded.js += 1;
                });
            }
            
            var mode_length = this.scripts.common.js.length;
            for (var s = 0; s < mode_length; s += 1)
                load_script.call(this, this.scripts.common.js_location + this.scripts.common.js[s], s);
                
            // notice var was not reset
            for (;s < this.scripts[mode].js.length + mode_length; s += 1)
                load_script.call(this, this.scripts[mode].js_location + this.scripts[mode].js[s - mode_length], s);
        },
        
        load_css: function (){
            for (var c = 0; c < this.scripts[mode].css.length; c += 1){
                var stylesheet = _document.createElement("link");
                    stylesheet.rel = "stylesheet";
                    stylesheet.type = "text/css";
                    stylesheet.href = this.scripts[mode].css_location + this.scripts[mode].css[c];
                _document.head.appendChild(stylesheet);
                
                this.loaded.css += 1;
            }
        },
        
        // Loads the index and specified address, no callbacks this just starts the calls
        load_pages: function(address){
            var parent = this;
            
            if (!parent.ajax_load('GET', INDEX_PAGE + this.mode_to_get(), function(response){
                parent.add_to_body(response);
                parent.loaded.pages += 1;
            })){
                window.location(NOSCRIPT_DOMAIN);
            }
            
            // OPTIMIZATION: Preload needed page into cache
            var page = (address + "").split('#')[0];// Dealing with extra # stuff on the end of links (like #top)
            var path = address.pathname;
            if (typeof address.pathname === 'undefined'){
                path = page = '/home';
            }
            else if (address.pathname === '/'){
                page += 'home';
                path = 'home';
            }
                
            if (!this.ajax_load('GET', page + this.mode_to_get(), function(response){
                parent.add_cache(path, response);
                parent.loaded.pages += 1;
            })){
                window.location(NOSCRIPT_DOMAIN);
            }
        },
        
        add_to_body: function(text){
            if (typeof _document.body.innerHTML === 'undefined')
                _document.body.innerHTML = '';
            _document.body.innerHTML += text;
        },
        
        // Loads the given contents of the page  and then calls the callback, with the retrieved data. mode is
        // either POST or GET (the routes accept no other verbs), to_send sends specified data if in post mode
        // (must be a string).
        // NOTE: all to_send content is assumed to be JSON
        ajax_load: function (in_mode, page, callback, to_send){
            // Gets an asynchronous requester if it can be found
            function get_XMLHttpRequest(){
                if (window.XMLHttpRequest)
                    return new window.XMLHttpRequest;
                else {
                    try {
                        return new ActiveXObject("MSXML2.XMLHTTP");
                    } catch (ex) {
                        return null;
                    }
                }
            }
            
            // On complete call the callback with the retreived data
            function handler() {
                if (requester.readyState == 4) {
                    if (requester.status == 200) {
                        if (callback != null)
                            callback(requester.responseText);
                    }
                }
            }
            
            var requester = get_XMLHttpRequest();
            if (requester == null)
                return false;
            else{
                requester.open(in_mode, page, true);
                requester.setRequestHeader("Content-Type", "application/json");
                requester.onreadystatechange = handler;
                requester.send(to_send);
            }
            
            return true;
        },
        
        // NOTE: set will do more once I add a mobile version to desktop mode
        set_mode: function (new_mode){
            mode = new_mode;
        },
        get_mode: function (){ return mode; }
    }
})(window.document).init(true, screen.width, navigator.userAgent.toLowerCase());

// Event loop to check when everything is loaded, once loaded evaluate the js and start the system
(function loaded(){
    if (Portfolio.selector.is_system_loaded() && typeof mocha === "undefined")
        Portfolio.selector.start_system();
    else
        setTimeout(loaded, 50);
})();
