Portfolio = {};
Portfolio.selector = function (_document) {
    var NOSCRIPT_DOMAIN = '/no_script';
    var INDEX_PAGE = 'index';
    var mode = 'desktop';
    return {
        scripts: {
            js_loaded: [],
            common: {
                js_location: '',
                js: [
                    '/javascripts/jquery.min.js',
                    '/javascripts/jquery.lightbox_me.min.js',
                    '/javascripts/prettify.min.js',
                    '/javascripts/Utility.min.js',
                    '/constants.min.js',
                    '/javascripts/Blog.min.js'
                ]
            },
            desktop: {
                js_location: '/javascripts/desktop/',
                js: ['min.js'],
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
                js: ['min.js'],
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
        loaded: {
            pages: 0,
            js: 0,
            css: 0
        },
        PAGES_TO_LOAD: 2,
        init: function (dont_run, width, user_string) {
            var MOBILE_WIDTH = 720;
            var MOBILE_STRING = 'mobile';
            if (typeof mocha !== 'undefined' && dont_run)
                return this;
            if (user_string.search(MOBILE_STRING) > 0 || width <= MOBILE_WIDTH)
                this.render_desktop();
            return this;
        },
        render_desktop: function () {
            {
                mode = 'mobile';
                var meta = _document.createElement('meta');
                meta.name = 'viewport';
                meta.id = 'viewport';
                meta.content = 'width=device-width, initial-scale=1.0';
                _document.head.appendChild(meta);
                this.load_pages(window.location);
            }
            mode = 'desktop';
            _document.body.style.display = 'none';
            this.load_css();
            this.load_js();
            this.load_pages(window.location);
        },
        start_system: function () {
            {
                if (this.loaded.css == this.scripts[mode].css.length && this.loaded.js == this.scripts[mode].js.length + this.scripts.common.js.length && this.loaded.pages == this.PAGES_TO_LOAD) {
                    return true;
                }
            }
            _document.body.style.display = 'block';
            for (var i = 0; i < this.scripts.js_loaded.length; i += 1) {
                var script = _document.createElement('script');
                script.text = this.scripts.js_loaded[i];
                script.id = 'script_injection_' + i;
                _document.head.appendChild(script);
            }
            Portfolio.start_system();
            return false;
        },
        add_cache: function (page_name, page_data) {
            var id_to_find = page_name.replace('/', '').replace('#', '') + '_cache';
            if (_document.getElementById(id_to_find) === null) {
                var div = _document.createElement('div');
                div.id = id_to_find;
                div.style.display = 'none';
                div.innerHTML = page_data;
                _document.body.appendChild(div);
                return true;
            }
            return false;
        },
        load_pages: function (address) {
            {
                for (var c = 0; c < this.scripts[mode].css.length; c += 1) {
                    var stylesheet = _document.createElement('link');
                    stylesheet.rel = 'stylesheet';
                    stylesheet.type = 'text/css';
                    stylesheet.href = this.scripts[mode].css_location + this.scripts[mode].css[c];
                    _document.head.appendChild(stylesheet);
                    this.loaded.css += 1;
                }
            }
            {
                var parent = this;
                this.scripts.js_loaded = new Array(this.scripts.common.js.length + this.scripts[mode].js.length);
                var load_script = function (from, order) {
                    this.ajax_load('GET', from, function (response) {
                        parent.scripts.js_loaded[order] = response;
                        parent.loaded.js += 1;
                    });
                };
                var mode_length = this.scripts.common.js.length;
                for (var s = 0; s < mode_length; s += 1)
                    load_script.call(this, this.scripts.common.js_location + this.scripts.common.js[s], s);
                for (; s < this.scripts[mode].js.length + mode_length; s += 1)
                    load_script.call(this, this.scripts[mode].js_location + this.scripts[mode].js[s - mode_length], s);
            }
            var parent = this;
            if (!parent.ajax_load(INDEX_PAGE + this.mode_to_get())) {
                window.location(NOSCRIPT_DOMAIN);
            }
            var page = (address + '').split('#')[0];
            var path = address.pathname;
            if (typeof address.pathname === 'undefined') {
                path = page = '/home';
            } else if (address.pathname === '/') {
                page += 'home';
                path = 'home';
            }
            if (!this.ajax_load('GET', page + this.mode_to_get(), function (response) {
                    parent.add_cache(path, response);
                    parent.loaded.pages += 1;
                })) {
                window.location(NOSCRIPT_DOMAIN);
            }
        },
        add_to_body: function (in_mode, page, callback, to_send, text) {
            {
                function get_XMLHttpRequest() {
                    if (window.XMLHttpRequest)
                        return new window.XMLHttpRequest();
                    else {
                        try {
                            return new ActiveXObject('MSXML2.XMLHTTP');
                        } catch (ex) {
                            return null;
                        }
                    }
                }
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
                else {
                    requester.open(in_mode, page, true);
                    requester.setRequestHeader('Content-Type', 'application/json');
                    requester.onreadystatechange = handler;
                    requester.send(to_send);
                }
            }
            if (typeof _document.body.innerHTML === 'undefined')
                _document.body.innerHTML = '';
            _document.body.innerHTML += text;
            return [
                true,
                '?mode=' + mode
            ];
        },
        set_mode: function (new_mode) {
            mode = new_mode;
        },
        get_mode: function () {
            return mode;
        }
    };
}(window.document).init(true, screen.width, navigator.userAgent.toLowerCase());
(function loaded() {
    if (Portfolio.selector.is_system_loaded() && typeof mocha === 'undefined')
        Portfolio.selector.start_system();
    else
        setTimeout(loaded, 50);
}());