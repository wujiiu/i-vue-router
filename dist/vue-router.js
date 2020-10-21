(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.VueRouter = factory());
}(this, function () { 'use strict';

	var View = {
	    name: 'router-view',
	    props: {
	        name: {
	            type: String,
	            default: 'default'
	        }
	    },
	    created: function created() {
	        // 标记 routerVie 类型
	        this._routerView = true

	        var parent = this.$parent
	        var depth = 0
	        while(parent) {
	            if(parent._routerView) {
	                depth ++
	            }
	            parent = parent.$parent
	        }
	        this.depth = depth
	    },
	    render: function render(h) {
	        var this$1 = this;

	        var matched = this.$route.matched[this.depth].components[this.name]
	        
	        return h(
	            matched,
	            null,
	            function () { return this$1.$slots.default; }
	        )
	    }
	}

	var Link = {
	    
	}

	function install(Vue) {
	    Object.defineProperty(Vue.prototype, '$router', {
	        get: function get() {
	            return this.$root._router
	        }
	    })

	    Object.defineProperty(Vue.prototype, '$route', {
	        get: function get$1 () { return this.$root._route }
	    })
	    /**
	     * 需要在vue $options中注入router的原因
	     *  - 标记 rootComponent
	     *  - 挂载 _route  触发 router-view更新
	     */
	    
	    Vue.mixin({
	        beforeCreate: function beforeCreate() {
	            if(this.$options.router) { // root组件有 rooter选线
	                this._router = this.$options.router
	                this._router.rootComponent = this
	                /**
	                 * 
	                 * return {
	                        params,
	                        query,
	                        matched: formatMatch(map[route])
	                    }
	                 */
	                Vue.util.defineReactive(this, '_route', this._router.match('/'))
	            }
	        }
	    })
	    Vue.component('router-view', View)
	    Vue.component('router-link', Link)
	}

	function interopDefault(ex) {
		return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var index$1 = createCommonjsModule(function (module) {
	module.exports = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};
	});

	var index$2 = interopDefault(index$1);


	var require$$0 = Object.freeze({
	  default: index$2
	});

	var index = createCommonjsModule(function (module) {
	var isarray = interopDefault(require$$0)

	/**
	 * Expose `pathToRegexp`.
	 */
	module.exports = pathToRegexp
	module.exports.parse = parse
	module.exports.compile = compile
	module.exports.tokensToFunction = tokensToFunction
	module.exports.tokensToRegExp = tokensToRegExp

	/**
	 * The main path matching regexp utility.
	 *
	 * @type {RegExp}
	 */
	var PATH_REGEXP = new RegExp([
	  // Match escaped characters that would otherwise appear in future matches.
	  // This allows the user to escape special characters that won't transform.
	  '(\\\\.)',
	  // Match Express-style parameters and un-named parameters with a prefix
	  // and optional suffixes. Matches appear as:
	  //
	  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
	  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
	  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
	  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'
	].join('|'), 'g')

	/**
	 * Parse a string for the raw tokens.
	 *
	 * @param  {string}  str
	 * @param  {Object=} options
	 * @return {!Array}
	 */
	function parse (str, options) {
	  var tokens = []
	  var key = 0
	  var index = 0
	  var path = ''
	  var defaultDelimiter = options && options.delimiter || '/'
	  var res

	  while ((res = PATH_REGEXP.exec(str)) != null) {
	    var m = res[0]
	    var escaped = res[1]
	    var offset = res.index
	    path += str.slice(index, offset)
	    index = offset + m.length

	    // Ignore already escaped sequences.
	    if (escaped) {
	      path += escaped[1]
	      continue
	    }

	    var next = str[index]
	    var prefix = res[2]
	    var name = res[3]
	    var capture = res[4]
	    var group = res[5]
	    var modifier = res[6]
	    var asterisk = res[7]

	    // Push the current path onto the tokens.
	    if (path) {
	      tokens.push(path)
	      path = ''
	    }

	    var partial = prefix != null && next != null && next !== prefix
	    var repeat = modifier === '+' || modifier === '*'
	    var optional = modifier === '?' || modifier === '*'
	    var delimiter = res[2] || defaultDelimiter
	    var pattern = capture || group

	    tokens.push({
	      name: name || key++,
	      prefix: prefix || '',
	      delimiter: delimiter,
	      optional: optional,
	      repeat: repeat,
	      partial: partial,
	      asterisk: !!asterisk,
	      pattern: pattern ? escapeGroup(pattern) : (asterisk ? '.*' : '[^' + escapeString(delimiter) + ']+?')
	    })
	  }

	  // Match any characters still remaining.
	  if (index < str.length) {
	    path += str.substr(index)
	  }

	  // If the path exists, push it onto the end.
	  if (path) {
	    tokens.push(path)
	  }

	  return tokens
	}

	/**
	 * Compile a string to a template function for the path.
	 *
	 * @param  {string}             str
	 * @param  {Object=}            options
	 * @return {!function(Object=, Object=)}
	 */
	function compile (str, options) {
	  return tokensToFunction(parse(str, options), options)
	}

	/**
	 * Prettier encoding of URI path segments.
	 *
	 * @param  {string}
	 * @return {string}
	 */
	function encodeURIComponentPretty (str) {
	  return encodeURI(str).replace(/[\/?#]/g, function (c) {
	    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
	  })
	}

	/**
	 * Encode the asterisk parameter. Similar to `pretty`, but allows slashes.
	 *
	 * @param  {string}
	 * @return {string}
	 */
	function encodeAsterisk (str) {
	  return encodeURI(str).replace(/[?#]/g, function (c) {
	    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
	  })
	}

	/**
	 * Expose a method for transforming tokens into the path function.
	 */
	function tokensToFunction (tokens, options) {
	  // Compile all the tokens into regexps.
	  var matches = new Array(tokens.length)

	  // Compile all the patterns before compilation.
	  for (var i = 0; i < tokens.length; i++) {
	    if (typeof tokens[i] === 'object') {
	      matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$', flags(options))
	    }
	  }

	  return function (obj, opts) {
	    var path = ''
	    var data = obj || {}
	    var options = opts || {}
	    var encode = options.pretty ? encodeURIComponentPretty : encodeURIComponent

	    for (var i = 0; i < tokens.length; i++) {
	      var token = tokens[i]

	      if (typeof token === 'string') {
	        path += token

	        continue
	      }

	      var value = data[token.name]
	      var segment

	      if (value == null) {
	        if (token.optional) {
	          // Prepend partial segment prefixes.
	          if (token.partial) {
	            path += token.prefix
	          }

	          continue
	        } else {
	          throw new TypeError('Expected "' + token.name + '" to be defined')
	        }
	      }

	      if (isarray(value)) {
	        if (!token.repeat) {
	          throw new TypeError('Expected "' + token.name + '" to not repeat, but received `' + JSON.stringify(value) + '`')
	        }

	        if (value.length === 0) {
	          if (token.optional) {
	            continue
	          } else {
	            throw new TypeError('Expected "' + token.name + '" to not be empty')
	          }
	        }

	        for (var j = 0; j < value.length; j++) {
	          segment = encode(value[j])

	          if (!matches[i].test(segment)) {
	            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received `' + JSON.stringify(segment) + '`')
	          }

	          path += (j === 0 ? token.prefix : token.delimiter) + segment
	        }

	        continue
	      }

	      segment = token.asterisk ? encodeAsterisk(value) : encode(value)

	      if (!matches[i].test(segment)) {
	        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
	      }

	      path += token.prefix + segment
	    }

	    return path
	  }
	}

	/**
	 * Escape a regular expression string.
	 *
	 * @param  {string} str
	 * @return {string}
	 */
	function escapeString (str) {
	  return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1')
	}

	/**
	 * Escape the capturing group by escaping special characters and meaning.
	 *
	 * @param  {string} group
	 * @return {string}
	 */
	function escapeGroup (group) {
	  return group.replace(/([=!:$\/()])/g, '\\$1')
	}

	/**
	 * Attach the keys as a property of the regexp.
	 *
	 * @param  {!RegExp} re
	 * @param  {Array}   keys
	 * @return {!RegExp}
	 */
	function attachKeys (re, keys) {
	  re.keys = keys
	  return re
	}

	/**
	 * Get the flags for a regexp from the options.
	 *
	 * @param  {Object} options
	 * @return {string}
	 */
	function flags (options) {
	  return options && options.sensitive ? '' : 'i'
	}

	/**
	 * Pull out keys from a regexp.
	 *
	 * @param  {!RegExp} path
	 * @param  {!Array}  keys
	 * @return {!RegExp}
	 */
	function regexpToRegexp (path, keys) {
	  // Use a negative lookahead to match only capturing groups.
	  var groups = path.source.match(/\((?!\?)/g)

	  if (groups) {
	    for (var i = 0; i < groups.length; i++) {
	      keys.push({
	        name: i,
	        prefix: null,
	        delimiter: null,
	        optional: false,
	        repeat: false,
	        partial: false,
	        asterisk: false,
	        pattern: null
	      })
	    }
	  }

	  return attachKeys(path, keys)
	}

	/**
	 * Transform an array into a regexp.
	 *
	 * @param  {!Array}  path
	 * @param  {Array}   keys
	 * @param  {!Object} options
	 * @return {!RegExp}
	 */
	function arrayToRegexp (path, keys, options) {
	  var parts = []

	  for (var i = 0; i < path.length; i++) {
	    parts.push(pathToRegexp(path[i], keys, options).source)
	  }

	  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options))

	  return attachKeys(regexp, keys)
	}

	/**
	 * Create a path regexp from string input.
	 *
	 * @param  {string}  path
	 * @param  {!Array}  keys
	 * @param  {!Object} options
	 * @return {!RegExp}
	 */
	function stringToRegexp (path, keys, options) {
	  return tokensToRegExp(parse(path, options), keys, options)
	}

	/**
	 * Expose a function for taking tokens and returning a RegExp.
	 *
	 * @param  {!Array}          tokens
	 * @param  {(Array|Object)=} keys
	 * @param  {Object=}         options
	 * @return {!RegExp}
	 */
	function tokensToRegExp (tokens, keys, options) {
	  if (!isarray(keys)) {
	    options = /** @type {!Object} */ (keys || options)
	    keys = []
	  }

	  options = options || {}

	  var strict = options.strict
	  var end = options.end !== false
	  var route = ''

	  // Iterate over the tokens and create our regexp string.
	  for (var i = 0; i < tokens.length; i++) {
	    var token = tokens[i]

	    if (typeof token === 'string') {
	      route += escapeString(token)
	    } else {
	      var prefix = escapeString(token.prefix)
	      var capture = '(?:' + token.pattern + ')'

	      keys.push(token)

	      if (token.repeat) {
	        capture += '(?:' + prefix + capture + ')*'
	      }

	      if (token.optional) {
	        if (!token.partial) {
	          capture = '(?:' + prefix + '(' + capture + '))?'
	        } else {
	          capture = prefix + '(' + capture + ')?'
	        }
	      } else {
	        capture = prefix + '(' + capture + ')'
	      }

	      route += capture
	    }
	  }

	  var delimiter = escapeString(options.delimiter || '/')
	  var endsWithDelimiter = route.slice(-delimiter.length) === delimiter

	  // In non-strict mode we allow a slash at the end of match. If the path to
	  // match already ends with a slash, we remove it for consistency. The slash
	  // is valid at the end of a path match, not in the middle. This is important
	  // in non-ending mode, where "/test/" shouldn't match "/test//route".
	  if (!strict) {
	    route = (endsWithDelimiter ? route.slice(0, -delimiter.length) : route) + '(?:' + delimiter + '(?=$))?'
	  }

	  if (end) {
	    route += '$'
	  } else {
	    // In non-ending mode, we need the capturing groups to match as much as
	    // possible by using a positive lookahead to the end or next path segment.
	    route += strict && endsWithDelimiter ? '' : '(?=' + delimiter + '|$)'
	  }

	  return attachKeys(new RegExp('^' + route, flags(options)), keys)
	}

	/**
	 * Normalize the given path string, returning a regular expression.
	 *
	 * An empty array can be passed in for the keys, which will hold the
	 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
	 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
	 *
	 * @param  {(string|RegExp|Array)} path
	 * @param  {(Array|Object)=}       keys
	 * @param  {Object=}               options
	 * @return {!RegExp}
	 */
	function pathToRegexp (path, keys, options) {
	  if (!isarray(keys)) {
	    options = /** @type {!Object} */ (keys || options)
	    keys = []
	  }

	  options = options || {}

	  if (path instanceof RegExp) {
	    return regexpToRegexp(path, /** @type {!Array} */ (keys))
	  }

	  if (isarray(path)) {
	    return arrayToRegexp(/** @type {!Array} */ (path), /** @type {!Array} */ (keys), options)
	  }

	  return stringToRegexp(/** @type {string} */ (path), /** @type {!Array} */ (keys), options)
	}
	});

	var Regexp = interopDefault(index);

	function createMatcher (routes) {
	  /**
	   * {
	   *  normalizedPath: record
	   * }
	   */
	  var map = {}
	  routes.forEach(function (r) { return addRoute(map, r); })

	  return function match (fullPath) {
	    var ref = extractQuery(fullPath);
	    var path = ref.path;
	    var query = ref.query;
	    var params = {}
	    for (var route in map) {
	      if (matchRoute(route, params, path)) {
	        return Object.freeze({
	          params: params,
	          query: query,
	          matched: formatMatch(map[route])
	        })
	      }
	    }
	  }
	}

	function addRoute (map, route, parent) {
	  var path = route.path;
	  var component = route.component;
	  var components = route.components;
	  var meta = route.meta;
	  var children = route.children;
	  var record = {
	    path: normalizeRoute(path, parent),
	    components: components || { default: component },
	    parent: parent,
	    meta: meta
	  }
	  if (children) {
	    children.forEach(function (child) { return addRoute(map, child, record); })
	  }
	  map[record.path] = record
	}

	function normalizeRoute (path, parent) {
	  if (path[0] == '/') return path  // "/" signifies an absolute route
	  if (parent == null) return path  // no need for a join
	  return ((parent.path) + "/" + path).replace(/\/\//g, '/') // join
	}

	/**
	 * {key of map} path
	 * {object = {}} params
	 * {fullpath.path} pathname
	 */
	function matchRoute (path, params, pathname) {
	  var keys = []
	  var regexp = Regexp(path, keys)
	  var m = regexp.exec(pathname)
	  if (!m) {
	    return false
	  } else if (!params) {
	    return true
	  }

	  for (var i = 1, len = m.length; i < len; ++i) {
	    var key = keys[i - 1]
	    var val = 'string' == typeof m[i] ? decodeURIComponent(m[i]) : m[i]
	    if (key) params[key.name] = val
	  }

	  return true
	}

	function extractQuery (path) {
	  var index = path.indexOf('?')
	  if (index > 0) {
	    return {
	      path: path.slice(0, index),
	      query: parseQuery(path.slice(index + 1))
	    }
	  } else {
	    return { path: path }
	  }
	}

	function parseQuery (query) {
	  var res = Object.create(null)

	  query = query.trim().replace(/^(\?|#|&)/, '')

	  if (!query) {
	    return res
	  }

	  query.split('&').forEach(function (param) {
	    var parts = param.replace(/\+/g, ' ').split('=')
	    var key = decodeURIComponent(parts.shift())
	    var val = parts.length > 0
	      ? decodeURIComponent(parts.join('='))
	      : null

	    if (res[key] === undefined) {
	      res[key] = val
	    } else if (Array.isArray(res[key])) {
	      res[key].push(val)
	    } else {
	      res[key] = [res[key], val]
	    }
	  })

	  return res
	}

	function formatMatch (record) {
	  var res = []
	  while (record) {
	    res.unshift(record)
	    record = record.parent
	  }
	  return res
	}

	var HashHistory = function HashHistory () {};

	var HTML5History = function HTML5History () {};

	var AbstractHistory = function AbstractHistory () {};

	var VueRouter = function VueRouter (options) {
	  if ( options === void 0 ) options = {};


	  // 第二次提交 tweak只是交换了 this._root 和 this._mode ? 暂不知为啥
	  this._root = options.root || '/'
	  this._mode = options.mode || 'hash'
	  this.rootComponent = null
	  this.match = createMatcher(options.routes || [])

	  switch (this._mode) {
	    case 'hash':
	      this.history = new HashHistory()
	      break
	    case 'html5':
	      this.history = new HTML5History()
	      break
	    case 'abstract':
	      this.history = new AbstractHistory()
	      break
	    default:
	      throw new Error(("[vue-router] invalid mode: " + (this._mode)))
	  }
	};
	VueRouter.prototype.go = function go (path) {
	  this.rootComponent._route = this.match(path)
	};

	VueRouter.install = install
	VueRouter.createMatcher = createMatcher


	if (typeof Vue !== 'undefined') {

	  Vue.use(VueRouter)
	}

	return VueRouter;

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21wb25lbnRzL3ZpZXcuanMiLCIuLi9zcmMvY29tcG9uZW50cy9saW5rLmpzIiwiLi4vc3JjL2luc3RhbGwuanMiLCIuLi9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cC9pbmRleC5qcyIsIi4uL3NyYy9tYXRjaC5qcyIsIi4uL3NyYy9oaXN0b3J5L2hhc2guanMiLCIuLi9zcmMvaGlzdG9yeS9odG1sNS5qcyIsIi4uL3NyYy9oaXN0b3J5L2Fic3RyYWN0LmpzIiwiLi4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IHtcbiAgICBuYW1lOiAncm91dGVyLXZpZXcnLFxuICAgIHByb3BzOiB7XG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICdkZWZhdWx0J1xuICAgICAgICB9XG4gICAgfSxcbiAgICBjcmVhdGVkKCkge1xuICAgICAgICAvLyDmoIforrAgcm91dGVyVmllIOexu+Wei1xuICAgICAgICB0aGlzLl9yb3V0ZXJWaWV3ID0gdHJ1ZVxuXG4gICAgICAgIGxldCBwYXJlbnQgPSB0aGlzLiRwYXJlbnRcbiAgICAgICAgbGV0IGRlcHRoID0gMFxuICAgICAgICB3aGlsZShwYXJlbnQpIHtcbiAgICAgICAgICAgIGlmKHBhcmVudC5fcm91dGVyVmlldykge1xuICAgICAgICAgICAgICAgIGRlcHRoICsrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQuJHBhcmVudFxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVwdGggPSBkZXB0aFxuICAgIH0sXG4gICAgcmVuZGVyKGgpIHtcbiAgICAgICAgY29uc3QgbWF0Y2hlZCA9IHRoaXMuJHJvdXRlLm1hdGNoZWRbdGhpcy5kZXB0aF0uY29tcG9uZW50c1t0aGlzLm5hbWVdXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaChcbiAgICAgICAgICAgIG1hdGNoZWQsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgKCkgPT4gdGhpcy4kc2xvdHMuZGVmYXVsdFxuICAgICAgICApXG4gICAgfVxufSIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICBcbn0iLCJpbXBvcnQgVmlldyBmcm9tICcuL2NvbXBvbmVudHMvdmlldydcbmltcG9ydCBMaW5rIGZyb20gJy4vY29tcG9uZW50cy9saW5rJ1xuXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFsbChWdWUpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoVnVlLnByb3RvdHlwZSwgJyRyb3V0ZXInLCB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLiRyb290Ll9yb3V0ZXJcbiAgICAgICAgfVxuICAgIH0pXG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoVnVlLnByb3RvdHlwZSwgJyRyb3V0ZScsIHtcbiAgICAgICAgZ2V0ICgpIHsgcmV0dXJuIHRoaXMuJHJvb3QuX3JvdXRlIH1cbiAgICB9KVxuICAgIC8qKlxuICAgICAqIOmcgOimgeWcqHZ1ZSAkb3B0aW9uc+S4reazqOWFpXJvdXRlcueahOWOn+WboFxuICAgICAqICAtIOagh+iusCByb290Q29tcG9uZW50XG4gICAgICogIC0g5oyC6L29IF9yb3V0ZSAg6Kem5Y+RIHJvdXRlci12aWV35pu05pawXG4gICAgICovXG4gICAgXG4gICAgVnVlLm1peGluKHtcbiAgICAgICAgYmVmb3JlQ3JlYXRlKCkge1xuICAgICAgICAgICAgaWYodGhpcy4kb3B0aW9ucy5yb3V0ZXIpIHsgLy8gcm9vdOe7hOS7tuaciSByb290ZXLpgInnur9cbiAgICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIgPSB0aGlzLiRvcHRpb25zLnJvdXRlclxuICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5yb290Q29tcG9uZW50ID0gdGhpc1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFxuICAgICAgICAgICAgICAgICAqIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQ6IGZvcm1hdE1hdGNoKG1hcFtyb3V0ZV0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBWdWUudXRpbC5kZWZpbmVSZWFjdGl2ZSh0aGlzLCAnX3JvdXRlJywgdGhpcy5fcm91dGVyLm1hdGNoKCcvJykpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KVxuICAgIFZ1ZS5jb21wb25lbnQoJ3JvdXRlci12aWV3JywgVmlldylcbiAgICBWdWUuY29tcG9uZW50KCdyb3V0ZXItbGluaycsIExpbmspXG59IiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwidmFyIGlzYXJyYXkgPSByZXF1aXJlKCdpc2FycmF5JylcblxuLyoqXG4gKiBFeHBvc2UgYHBhdGhUb1JlZ2V4cGAuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gcGF0aFRvUmVnZXhwXG5tb2R1bGUuZXhwb3J0cy5wYXJzZSA9IHBhcnNlXG5tb2R1bGUuZXhwb3J0cy5jb21waWxlID0gY29tcGlsZVxubW9kdWxlLmV4cG9ydHMudG9rZW5zVG9GdW5jdGlvbiA9IHRva2Vuc1RvRnVuY3Rpb25cbm1vZHVsZS5leHBvcnRzLnRva2Vuc1RvUmVnRXhwID0gdG9rZW5zVG9SZWdFeHBcblxuLyoqXG4gKiBUaGUgbWFpbiBwYXRoIG1hdGNoaW5nIHJlZ2V4cCB1dGlsaXR5LlxuICpcbiAqIEB0eXBlIHtSZWdFeHB9XG4gKi9cbnZhciBQQVRIX1JFR0VYUCA9IG5ldyBSZWdFeHAoW1xuICAvLyBNYXRjaCBlc2NhcGVkIGNoYXJhY3RlcnMgdGhhdCB3b3VsZCBvdGhlcndpc2UgYXBwZWFyIGluIGZ1dHVyZSBtYXRjaGVzLlxuICAvLyBUaGlzIGFsbG93cyB0aGUgdXNlciB0byBlc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzIHRoYXQgd29uJ3QgdHJhbnNmb3JtLlxuICAnKFxcXFxcXFxcLiknLFxuICAvLyBNYXRjaCBFeHByZXNzLXN0eWxlIHBhcmFtZXRlcnMgYW5kIHVuLW5hbWVkIHBhcmFtZXRlcnMgd2l0aCBhIHByZWZpeFxuICAvLyBhbmQgb3B0aW9uYWwgc3VmZml4ZXMuIE1hdGNoZXMgYXBwZWFyIGFzOlxuICAvL1xuICAvLyBcIi86dGVzdChcXFxcZCspP1wiID0+IFtcIi9cIiwgXCJ0ZXN0XCIsIFwiXFxkK1wiLCB1bmRlZmluZWQsIFwiP1wiLCB1bmRlZmluZWRdXG4gIC8vIFwiL3JvdXRlKFxcXFxkKylcIiAgPT4gW3VuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIFwiXFxkK1wiLCB1bmRlZmluZWQsIHVuZGVmaW5lZF1cbiAgLy8gXCIvKlwiICAgICAgICAgICAgPT4gW1wiL1wiLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIFwiKlwiXVxuICAnKFtcXFxcLy5dKT8oPzooPzpcXFxcOihcXFxcdyspKD86XFxcXCgoKD86XFxcXFxcXFwufFteXFxcXFxcXFwoKV0pKylcXFxcKSk/fFxcXFwoKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcKCldKSspXFxcXCkpKFsrKj9dKT98KFxcXFwqKSknXG5dLmpvaW4oJ3wnKSwgJ2cnKVxuXG4vKipcbiAqIFBhcnNlIGEgc3RyaW5nIGZvciB0aGUgcmF3IHRva2Vucy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICBzdHJcbiAqIEBwYXJhbSAge09iamVjdD19IG9wdGlvbnNcbiAqIEByZXR1cm4geyFBcnJheX1cbiAqL1xuZnVuY3Rpb24gcGFyc2UgKHN0ciwgb3B0aW9ucykge1xuICB2YXIgdG9rZW5zID0gW11cbiAgdmFyIGtleSA9IDBcbiAgdmFyIGluZGV4ID0gMFxuICB2YXIgcGF0aCA9ICcnXG4gIHZhciBkZWZhdWx0RGVsaW1pdGVyID0gb3B0aW9ucyAmJiBvcHRpb25zLmRlbGltaXRlciB8fCAnLydcbiAgdmFyIHJlc1xuXG4gIHdoaWxlICgocmVzID0gUEFUSF9SRUdFWFAuZXhlYyhzdHIpKSAhPSBudWxsKSB7XG4gICAgdmFyIG0gPSByZXNbMF1cbiAgICB2YXIgZXNjYXBlZCA9IHJlc1sxXVxuICAgIHZhciBvZmZzZXQgPSByZXMuaW5kZXhcbiAgICBwYXRoICs9IHN0ci5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgIGluZGV4ID0gb2Zmc2V0ICsgbS5sZW5ndGhcblxuICAgIC8vIElnbm9yZSBhbHJlYWR5IGVzY2FwZWQgc2VxdWVuY2VzLlxuICAgIGlmIChlc2NhcGVkKSB7XG4gICAgICBwYXRoICs9IGVzY2FwZWRbMV1cbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgdmFyIG5leHQgPSBzdHJbaW5kZXhdXG4gICAgdmFyIHByZWZpeCA9IHJlc1syXVxuICAgIHZhciBuYW1lID0gcmVzWzNdXG4gICAgdmFyIGNhcHR1cmUgPSByZXNbNF1cbiAgICB2YXIgZ3JvdXAgPSByZXNbNV1cbiAgICB2YXIgbW9kaWZpZXIgPSByZXNbNl1cbiAgICB2YXIgYXN0ZXJpc2sgPSByZXNbN11cblxuICAgIC8vIFB1c2ggdGhlIGN1cnJlbnQgcGF0aCBvbnRvIHRoZSB0b2tlbnMuXG4gICAgaWYgKHBhdGgpIHtcbiAgICAgIHRva2Vucy5wdXNoKHBhdGgpXG4gICAgICBwYXRoID0gJydcbiAgICB9XG5cbiAgICB2YXIgcGFydGlhbCA9IHByZWZpeCAhPSBudWxsICYmIG5leHQgIT0gbnVsbCAmJiBuZXh0ICE9PSBwcmVmaXhcbiAgICB2YXIgcmVwZWF0ID0gbW9kaWZpZXIgPT09ICcrJyB8fCBtb2RpZmllciA9PT0gJyonXG4gICAgdmFyIG9wdGlvbmFsID0gbW9kaWZpZXIgPT09ICc/JyB8fCBtb2RpZmllciA9PT0gJyonXG4gICAgdmFyIGRlbGltaXRlciA9IHJlc1syXSB8fCBkZWZhdWx0RGVsaW1pdGVyXG4gICAgdmFyIHBhdHRlcm4gPSBjYXB0dXJlIHx8IGdyb3VwXG5cbiAgICB0b2tlbnMucHVzaCh7XG4gICAgICBuYW1lOiBuYW1lIHx8IGtleSsrLFxuICAgICAgcHJlZml4OiBwcmVmaXggfHwgJycsXG4gICAgICBkZWxpbWl0ZXI6IGRlbGltaXRlcixcbiAgICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICAgIHJlcGVhdDogcmVwZWF0LFxuICAgICAgcGFydGlhbDogcGFydGlhbCxcbiAgICAgIGFzdGVyaXNrOiAhIWFzdGVyaXNrLFxuICAgICAgcGF0dGVybjogcGF0dGVybiA/IGVzY2FwZUdyb3VwKHBhdHRlcm4pIDogKGFzdGVyaXNrID8gJy4qJyA6ICdbXicgKyBlc2NhcGVTdHJpbmcoZGVsaW1pdGVyKSArICddKz8nKVxuICAgIH0pXG4gIH1cblxuICAvLyBNYXRjaCBhbnkgY2hhcmFjdGVycyBzdGlsbCByZW1haW5pbmcuXG4gIGlmIChpbmRleCA8IHN0ci5sZW5ndGgpIHtcbiAgICBwYXRoICs9IHN0ci5zdWJzdHIoaW5kZXgpXG4gIH1cblxuICAvLyBJZiB0aGUgcGF0aCBleGlzdHMsIHB1c2ggaXQgb250byB0aGUgZW5kLlxuICBpZiAocGF0aCkge1xuICAgIHRva2Vucy5wdXNoKHBhdGgpXG4gIH1cblxuICByZXR1cm4gdG9rZW5zXG59XG5cbi8qKlxuICogQ29tcGlsZSBhIHN0cmluZyB0byBhIHRlbXBsYXRlIGZ1bmN0aW9uIGZvciB0aGUgcGF0aC5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgIHN0clxuICogQHBhcmFtICB7T2JqZWN0PX0gICAgICAgICAgICBvcHRpb25zXG4gKiBAcmV0dXJuIHshZnVuY3Rpb24oT2JqZWN0PSwgT2JqZWN0PSl9XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGUgKHN0ciwgb3B0aW9ucykge1xuICByZXR1cm4gdG9rZW5zVG9GdW5jdGlvbihwYXJzZShzdHIsIG9wdGlvbnMpLCBvcHRpb25zKVxufVxuXG4vKipcbiAqIFByZXR0aWVyIGVuY29kaW5nIG9mIFVSSSBwYXRoIHNlZ21lbnRzLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ31cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZW5jb2RlVVJJQ29tcG9uZW50UHJldHR5IChzdHIpIHtcbiAgcmV0dXJuIGVuY29kZVVSSShzdHIpLnJlcGxhY2UoL1tcXC8/I10vZywgZnVuY3Rpb24gKGMpIHtcbiAgICByZXR1cm4gJyUnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gIH0pXG59XG5cbi8qKlxuICogRW5jb2RlIHRoZSBhc3RlcmlzayBwYXJhbWV0ZXIuIFNpbWlsYXIgdG8gYHByZXR0eWAsIGJ1dCBhbGxvd3Mgc2xhc2hlcy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVuY29kZUFzdGVyaXNrIChzdHIpIHtcbiAgcmV0dXJuIGVuY29kZVVSSShzdHIpLnJlcGxhY2UoL1s/I10vZywgZnVuY3Rpb24gKGMpIHtcbiAgICByZXR1cm4gJyUnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gIH0pXG59XG5cbi8qKlxuICogRXhwb3NlIGEgbWV0aG9kIGZvciB0cmFuc2Zvcm1pbmcgdG9rZW5zIGludG8gdGhlIHBhdGggZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvRnVuY3Rpb24gKHRva2Vucywgb3B0aW9ucykge1xuICAvLyBDb21waWxlIGFsbCB0aGUgdG9rZW5zIGludG8gcmVnZXhwcy5cbiAgdmFyIG1hdGNoZXMgPSBuZXcgQXJyYXkodG9rZW5zLmxlbmd0aClcblxuICAvLyBDb21waWxlIGFsbCB0aGUgcGF0dGVybnMgYmVmb3JlIGNvbXBpbGF0aW9uLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0eXBlb2YgdG9rZW5zW2ldID09PSAnb2JqZWN0Jykge1xuICAgICAgbWF0Y2hlc1tpXSA9IG5ldyBSZWdFeHAoJ14oPzonICsgdG9rZW5zW2ldLnBhdHRlcm4gKyAnKSQnLCBmbGFncyhvcHRpb25zKSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgb3B0cykge1xuICAgIHZhciBwYXRoID0gJydcbiAgICB2YXIgZGF0YSA9IG9iaiB8fCB7fVxuICAgIHZhciBvcHRpb25zID0gb3B0cyB8fCB7fVxuICAgIHZhciBlbmNvZGUgPSBvcHRpb25zLnByZXR0eSA/IGVuY29kZVVSSUNvbXBvbmVudFByZXR0eSA6IGVuY29kZVVSSUNvbXBvbmVudFxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuXG4gICAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgICBwYXRoICs9IHRva2VuXG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgdmFyIHZhbHVlID0gZGF0YVt0b2tlbi5uYW1lXVxuICAgICAgdmFyIHNlZ21lbnRcblxuICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgaWYgKHRva2VuLm9wdGlvbmFsKSB7XG4gICAgICAgICAgLy8gUHJlcGVuZCBwYXJ0aWFsIHNlZ21lbnQgcHJlZml4ZXMuXG4gICAgICAgICAgaWYgKHRva2VuLnBhcnRpYWwpIHtcbiAgICAgICAgICAgIHBhdGggKz0gdG9rZW4ucHJlZml4XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIGJlIGRlZmluZWQnKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpc2FycmF5KHZhbHVlKSkge1xuICAgICAgICBpZiAoIXRva2VuLnJlcGVhdCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbm90IHJlcGVhdCwgYnV0IHJlY2VpdmVkIGAnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpICsgJ2AnKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgYmUgZW1wdHknKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBzZWdtZW50ID0gZW5jb2RlKHZhbHVlW2pdKVxuXG4gICAgICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGFsbCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBgJyArIEpTT04uc3RyaW5naWZ5KHNlZ21lbnQpICsgJ2AnKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhdGggKz0gKGogPT09IDAgPyB0b2tlbi5wcmVmaXggOiB0b2tlbi5kZWxpbWl0ZXIpICsgc2VnbWVudFxuICAgICAgICB9XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgc2VnbWVudCA9IHRva2VuLmFzdGVyaXNrID8gZW5jb2RlQXN0ZXJpc2sodmFsdWUpIDogZW5jb2RlKHZhbHVlKVxuXG4gICAgICBpZiAoIW1hdGNoZXNbaV0udGVzdChzZWdtZW50KSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBcIicgKyBzZWdtZW50ICsgJ1wiJylcbiAgICAgIH1cblxuICAgICAgcGF0aCArPSB0b2tlbi5wcmVmaXggKyBzZWdtZW50XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGhcbiAgfVxufVxuXG4vKipcbiAqIEVzY2FwZSBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBzdHJpbmcuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlU3RyaW5nIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWy4rKj89XiE6JHt9KClbXFxdfFxcL1xcXFxdKS9nLCAnXFxcXCQxJylcbn1cblxuLyoqXG4gKiBFc2NhcGUgdGhlIGNhcHR1cmluZyBncm91cCBieSBlc2NhcGluZyBzcGVjaWFsIGNoYXJhY3RlcnMgYW5kIG1lYW5pbmcuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBncm91cFxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVHcm91cCAoZ3JvdXApIHtcbiAgcmV0dXJuIGdyb3VwLnJlcGxhY2UoLyhbPSE6JFxcLygpXSkvZywgJ1xcXFwkMScpXG59XG5cbi8qKlxuICogQXR0YWNoIHRoZSBrZXlzIGFzIGEgcHJvcGVydHkgb2YgdGhlIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshUmVnRXhwfSByZVxuICogQHBhcmFtICB7QXJyYXl9ICAga2V5c1xuICogQHJldHVybiB7IVJlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gYXR0YWNoS2V5cyAocmUsIGtleXMpIHtcbiAgcmUua2V5cyA9IGtleXNcbiAgcmV0dXJuIHJlXG59XG5cbi8qKlxuICogR2V0IHRoZSBmbGFncyBmb3IgYSByZWdleHAgZnJvbSB0aGUgb3B0aW9ucy5cbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZmxhZ3MgKG9wdGlvbnMpIHtcbiAgcmV0dXJuIG9wdGlvbnMgJiYgb3B0aW9ucy5zZW5zaXRpdmUgPyAnJyA6ICdpJ1xufVxuXG4vKipcbiAqIFB1bGwgb3V0IGtleXMgZnJvbSBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshUmVnRXhwfSBwYXRoXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiByZWdleHBUb1JlZ2V4cCAocGF0aCwga2V5cykge1xuICAvLyBVc2UgYSBuZWdhdGl2ZSBsb29rYWhlYWQgdG8gbWF0Y2ggb25seSBjYXB0dXJpbmcgZ3JvdXBzLlxuICB2YXIgZ3JvdXBzID0gcGF0aC5zb3VyY2UubWF0Y2goL1xcKCg/IVxcPykvZylcblxuICBpZiAoZ3JvdXBzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleXMucHVzaCh7XG4gICAgICAgIG5hbWU6IGksXG4gICAgICAgIHByZWZpeDogbnVsbCxcbiAgICAgICAgZGVsaW1pdGVyOiBudWxsLFxuICAgICAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgICAgIHJlcGVhdDogZmFsc2UsXG4gICAgICAgIHBhcnRpYWw6IGZhbHNlLFxuICAgICAgICBhc3RlcmlzazogZmFsc2UsXG4gICAgICAgIHBhdHRlcm46IG51bGxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocGF0aCwga2V5cylcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm0gYW4gYXJyYXkgaW50byBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gICBrZXlzXG4gKiBAcGFyYW0gIHshT2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBhcnJheVRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIHZhciBwYXJ0cyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgcGFydHMucHVzaChwYXRoVG9SZWdleHAocGF0aFtpXSwga2V5cywgb3B0aW9ucykuc291cmNlKVxuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJyg/OicgKyBwYXJ0cy5qb2luKCd8JykgKyAnKScsIGZsYWdzKG9wdGlvbnMpKVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKHJlZ2V4cCwga2V5cylcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBwYXRoIHJlZ2V4cCBmcm9tIHN0cmluZyBpbnB1dC5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICBwYXRoXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHshT2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBzdHJpbmdUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICByZXR1cm4gdG9rZW5zVG9SZWdFeHAocGFyc2UocGF0aCwgb3B0aW9ucyksIGtleXMsIG9wdGlvbnMpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgZnVuY3Rpb24gZm9yIHRha2luZyB0b2tlbnMgYW5kIHJldHVybmluZyBhIFJlZ0V4cC5cbiAqXG4gKiBAcGFyYW0gIHshQXJyYXl9ICAgICAgICAgIHRva2Vuc1xuICogQHBhcmFtICB7KEFycmF5fE9iamVjdCk9fSBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3Q9fSAgICAgICAgIG9wdGlvbnNcbiAqIEByZXR1cm4geyFSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvUmVnRXhwICh0b2tlbnMsIGtleXMsIG9wdGlvbnMpIHtcbiAgaWYgKCFpc2FycmF5KGtleXMpKSB7XG4gICAgb3B0aW9ucyA9IC8qKiBAdHlwZSB7IU9iamVjdH0gKi8gKGtleXMgfHwgb3B0aW9ucylcbiAgICBrZXlzID0gW11cbiAgfVxuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG5cbiAgdmFyIHN0cmljdCA9IG9wdGlvbnMuc3RyaWN0XG4gIHZhciBlbmQgPSBvcHRpb25zLmVuZCAhPT0gZmFsc2VcbiAgdmFyIHJvdXRlID0gJydcblxuICAvLyBJdGVyYXRlIG92ZXIgdGhlIHRva2VucyBhbmQgY3JlYXRlIG91ciByZWdleHAgc3RyaW5nLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuXG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJvdXRlICs9IGVzY2FwZVN0cmluZyh0b2tlbilcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHByZWZpeCA9IGVzY2FwZVN0cmluZyh0b2tlbi5wcmVmaXgpXG4gICAgICB2YXIgY2FwdHVyZSA9ICcoPzonICsgdG9rZW4ucGF0dGVybiArICcpJ1xuXG4gICAgICBrZXlzLnB1c2godG9rZW4pXG5cbiAgICAgIGlmICh0b2tlbi5yZXBlYXQpIHtcbiAgICAgICAgY2FwdHVyZSArPSAnKD86JyArIHByZWZpeCArIGNhcHR1cmUgKyAnKSonXG4gICAgICB9XG5cbiAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICBpZiAoIXRva2VuLnBhcnRpYWwpIHtcbiAgICAgICAgICBjYXB0dXJlID0gJyg/OicgKyBwcmVmaXggKyAnKCcgKyBjYXB0dXJlICsgJykpPydcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYXB0dXJlID0gcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpPydcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FwdHVyZSA9IHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKSdcbiAgICAgIH1cblxuICAgICAgcm91dGUgKz0gY2FwdHVyZVxuICAgIH1cbiAgfVxuXG4gIHZhciBkZWxpbWl0ZXIgPSBlc2NhcGVTdHJpbmcob3B0aW9ucy5kZWxpbWl0ZXIgfHwgJy8nKVxuICB2YXIgZW5kc1dpdGhEZWxpbWl0ZXIgPSByb3V0ZS5zbGljZSgtZGVsaW1pdGVyLmxlbmd0aCkgPT09IGRlbGltaXRlclxuXG4gIC8vIEluIG5vbi1zdHJpY3QgbW9kZSB3ZSBhbGxvdyBhIHNsYXNoIGF0IHRoZSBlbmQgb2YgbWF0Y2guIElmIHRoZSBwYXRoIHRvXG4gIC8vIG1hdGNoIGFscmVhZHkgZW5kcyB3aXRoIGEgc2xhc2gsIHdlIHJlbW92ZSBpdCBmb3IgY29uc2lzdGVuY3kuIFRoZSBzbGFzaFxuICAvLyBpcyB2YWxpZCBhdCB0aGUgZW5kIG9mIGEgcGF0aCBtYXRjaCwgbm90IGluIHRoZSBtaWRkbGUuIFRoaXMgaXMgaW1wb3J0YW50XG4gIC8vIGluIG5vbi1lbmRpbmcgbW9kZSwgd2hlcmUgXCIvdGVzdC9cIiBzaG91bGRuJ3QgbWF0Y2ggXCIvdGVzdC8vcm91dGVcIi5cbiAgaWYgKCFzdHJpY3QpIHtcbiAgICByb3V0ZSA9IChlbmRzV2l0aERlbGltaXRlciA/IHJvdXRlLnNsaWNlKDAsIC1kZWxpbWl0ZXIubGVuZ3RoKSA6IHJvdXRlKSArICcoPzonICsgZGVsaW1pdGVyICsgJyg/PSQpKT8nXG4gIH1cblxuICBpZiAoZW5kKSB7XG4gICAgcm91dGUgKz0gJyQnXG4gIH0gZWxzZSB7XG4gICAgLy8gSW4gbm9uLWVuZGluZyBtb2RlLCB3ZSBuZWVkIHRoZSBjYXB0dXJpbmcgZ3JvdXBzIHRvIG1hdGNoIGFzIG11Y2ggYXNcbiAgICAvLyBwb3NzaWJsZSBieSB1c2luZyBhIHBvc2l0aXZlIGxvb2thaGVhZCB0byB0aGUgZW5kIG9yIG5leHQgcGF0aCBzZWdtZW50LlxuICAgIHJvdXRlICs9IHN0cmljdCAmJiBlbmRzV2l0aERlbGltaXRlciA/ICcnIDogJyg/PScgKyBkZWxpbWl0ZXIgKyAnfCQpJ1xuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMobmV3IFJlZ0V4cCgnXicgKyByb3V0ZSwgZmxhZ3Mob3B0aW9ucykpLCBrZXlzKVxufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgZ2l2ZW4gcGF0aCBzdHJpbmcsIHJldHVybmluZyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBBbiBlbXB0eSBhcnJheSBjYW4gYmUgcGFzc2VkIGluIGZvciB0aGUga2V5cywgd2hpY2ggd2lsbCBob2xkIHRoZVxuICogcGxhY2Vob2xkZXIga2V5IGRlc2NyaXB0aW9ucy4gRm9yIGV4YW1wbGUsIHVzaW5nIGAvdXNlci86aWRgLCBga2V5c2Agd2lsbFxuICogY29udGFpbiBgW3sgbmFtZTogJ2lkJywgZGVsaW1pdGVyOiAnLycsIG9wdGlvbmFsOiBmYWxzZSwgcmVwZWF0OiBmYWxzZSB9XWAuXG4gKlxuICogQHBhcmFtICB7KHN0cmluZ3xSZWdFeHB8QXJyYXkpfSBwYXRoXG4gKiBAcGFyYW0gIHsoQXJyYXl8T2JqZWN0KT19ICAgICAgIGtleXNcbiAqIEBwYXJhbSAge09iamVjdD19ICAgICAgICAgICAgICAgb3B0aW9uc1xuICogQHJldHVybiB7IVJlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gcGF0aFRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIGlmICghaXNhcnJheShrZXlzKSkge1xuICAgIG9wdGlvbnMgPSAvKiogQHR5cGUgeyFPYmplY3R9ICovIChrZXlzIHx8IG9wdGlvbnMpXG4gICAga2V5cyA9IFtdXG4gIH1cblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG4gIGlmIChwYXRoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgcmV0dXJuIHJlZ2V4cFRvUmVnZXhwKHBhdGgsIC8qKiBAdHlwZSB7IUFycmF5fSAqLyAoa2V5cykpXG4gIH1cblxuICBpZiAoaXNhcnJheShwYXRoKSkge1xuICAgIHJldHVybiBhcnJheVRvUmVnZXhwKC8qKiBAdHlwZSB7IUFycmF5fSAqLyAocGF0aCksIC8qKiBAdHlwZSB7IUFycmF5fSAqLyAoa2V5cyksIG9wdGlvbnMpXG4gIH1cblxuICByZXR1cm4gc3RyaW5nVG9SZWdleHAoLyoqIEB0eXBlIHtzdHJpbmd9ICovIChwYXRoKSwgLyoqIEB0eXBlIHshQXJyYXl9ICovIChrZXlzKSwgb3B0aW9ucylcbn1cbiIsImltcG9ydCBSZWdleHAgZnJvbSAncGF0aC10by1yZWdleHAnXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNYXRjaGVyIChyb3V0ZXMpIHtcbiAgLyoqXG4gICAqIHtcbiAgICogIG5vcm1hbGl6ZWRQYXRoOiByZWNvcmRcbiAgICogfVxuICAgKi9cbiAgY29uc3QgbWFwID0ge31cbiAgcm91dGVzLmZvckVhY2gociA9PiBhZGRSb3V0ZShtYXAsIHIpKVxuXG4gIHJldHVybiBmdW5jdGlvbiBtYXRjaCAoZnVsbFBhdGgpIHtcbiAgICBjb25zdCB7IHBhdGgsIHF1ZXJ5IH0gPSBleHRyYWN0UXVlcnkoZnVsbFBhdGgpXG4gICAgY29uc3QgcGFyYW1zID0ge31cbiAgICBmb3IgKGNvbnN0IHJvdXRlIGluIG1hcCkge1xuICAgICAgaWYgKG1hdGNoUm91dGUocm91dGUsIHBhcmFtcywgcGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoe1xuICAgICAgICAgIHBhcmFtcyxcbiAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICBtYXRjaGVkOiBmb3JtYXRNYXRjaChtYXBbcm91dGVdKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRSb3V0ZSAobWFwLCByb3V0ZSwgcGFyZW50KSB7XG4gIGNvbnN0IHsgcGF0aCwgY29tcG9uZW50LCBjb21wb25lbnRzLCBtZXRhLCBjaGlsZHJlbiB9ID0gcm91dGVcbiAgY29uc3QgcmVjb3JkID0ge1xuICAgIHBhdGg6IG5vcm1hbGl6ZVJvdXRlKHBhdGgsIHBhcmVudCksXG4gICAgY29tcG9uZW50czogY29tcG9uZW50cyB8fCB7IGRlZmF1bHQ6IGNvbXBvbmVudCB9LFxuICAgIHBhcmVudCxcbiAgICBtZXRhXG4gIH1cbiAgaWYgKGNoaWxkcmVuKSB7XG4gICAgY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiBhZGRSb3V0ZShtYXAsIGNoaWxkLCByZWNvcmQpKVxuICB9XG4gIG1hcFtyZWNvcmQucGF0aF0gPSByZWNvcmRcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplUm91dGUgKHBhdGgsIHBhcmVudCkge1xuICBpZiAocGF0aFswXSA9PSAnLycpIHJldHVybiBwYXRoICAvLyBcIi9cIiBzaWduaWZpZXMgYW4gYWJzb2x1dGUgcm91dGVcbiAgaWYgKHBhcmVudCA9PSBudWxsKSByZXR1cm4gcGF0aCAgLy8gbm8gbmVlZCBmb3IgYSBqb2luXG4gIHJldHVybiBgJHtwYXJlbnQucGF0aH0vJHtwYXRofWAucmVwbGFjZSgvXFwvXFwvL2csICcvJykgLy8gam9pblxufVxuXG4vKipcbiAqIHtrZXkgb2YgbWFwfSBwYXRoXG4gKiB7b2JqZWN0ID0ge319IHBhcmFtc1xuICoge2Z1bGxwYXRoLnBhdGh9IHBhdGhuYW1lXG4gKi9cbmZ1bmN0aW9uIG1hdGNoUm91dGUgKHBhdGgsIHBhcmFtcywgcGF0aG5hbWUpIHtcbiAgY29uc3Qga2V5cyA9IFtdXG4gIGNvbnN0IHJlZ2V4cCA9IFJlZ2V4cChwYXRoLCBrZXlzKVxuICBjb25zdCBtID0gcmVnZXhwLmV4ZWMocGF0aG5hbWUpXG4gIGlmICghbSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9IGVsc2UgaWYgKCFwYXJhbXMpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IG0ubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpIC0gMV1cbiAgICB2YXIgdmFsID0gJ3N0cmluZycgPT0gdHlwZW9mIG1baV0gPyBkZWNvZGVVUklDb21wb25lbnQobVtpXSkgOiBtW2ldXG4gICAgaWYgKGtleSkgcGFyYW1zW2tleS5uYW1lXSA9IHZhbFxuICB9XG5cbiAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gZXh0cmFjdFF1ZXJ5IChwYXRoKSB7XG4gIGNvbnN0IGluZGV4ID0gcGF0aC5pbmRleE9mKCc/JylcbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIHJldHVybiB7XG4gICAgICBwYXRoOiBwYXRoLnNsaWNlKDAsIGluZGV4KSxcbiAgICAgIHF1ZXJ5OiBwYXJzZVF1ZXJ5KHBhdGguc2xpY2UoaW5kZXggKyAxKSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHsgcGF0aCB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyc2VRdWVyeSAocXVlcnkpIHtcbiAgY29uc3QgcmVzID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuXG4gIHF1ZXJ5ID0gcXVlcnkudHJpbSgpLnJlcGxhY2UoL14oXFw/fCN8JikvLCAnJylcblxuICBpZiAoIXF1ZXJ5KSB7XG4gICAgcmV0dXJuIHJlc1xuICB9XG5cbiAgcXVlcnkuc3BsaXQoJyYnKS5mb3JFYWNoKHBhcmFtID0+IHtcbiAgICBjb25zdCBwYXJ0cyA9IHBhcmFtLnJlcGxhY2UoL1xcKy9nLCAnICcpLnNwbGl0KCc9JylcbiAgICBjb25zdCBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQocGFydHMuc2hpZnQoKSlcbiAgICBjb25zdCB2YWwgPSBwYXJ0cy5sZW5ndGggPiAwXG4gICAgICA/IGRlY29kZVVSSUNvbXBvbmVudChwYXJ0cy5qb2luKCc9JykpXG4gICAgICA6IG51bGxcblxuICAgIGlmIChyZXNba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXNba2V5XSA9IHZhbFxuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXNba2V5XSkpIHtcbiAgICAgIHJlc1trZXldLnB1c2godmFsKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXNba2V5XSA9IFtyZXNba2V5XSwgdmFsXVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGZvcm1hdE1hdGNoIChyZWNvcmQpIHtcbiAgY29uc3QgcmVzID0gW11cbiAgd2hpbGUgKHJlY29yZCkge1xuICAgIHJlcy51bnNoaWZ0KHJlY29yZClcbiAgICByZWNvcmQgPSByZWNvcmQucGFyZW50XG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuIiwiZXhwb3J0IGNsYXNzIEhhc2hIaXN0b3J5IHtcblxufVxuIiwiZXhwb3J0IGNsYXNzIEhUTUw1SGlzdG9yeSB7XG5cbn1cbiIsImV4cG9ydCBjbGFzcyBBYnN0cmFjdEhpc3Rvcnkge1xuXG59XG4iLCJpbXBvcnQgeyBpbnN0YWxsIH0gZnJvbSAnLi9pbnN0YWxsJ1xuaW1wb3J0IHsgY3JlYXRlTWF0Y2hlciB9IGZyb20gJy4vbWF0Y2gnXG5pbXBvcnQgeyBIYXNoSGlzdG9yeSB9IGZyb20gJy4vaGlzdG9yeS9oYXNoJ1xuaW1wb3J0IHsgSFRNTDVIaXN0b3J5IH0gZnJvbSAnLi9oaXN0b3J5L2h0bWw1J1xuaW1wb3J0IHsgQWJzdHJhY3RIaXN0b3J5IH0gZnJvbSAnLi9oaXN0b3J5L2Fic3RyYWN0J1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWdWVSb3V0ZXIge1xuICBjb25zdHJ1Y3RvciAob3B0aW9ucyA9IHt9KSB7XG5cbiAgICAvLyDnrKzkuozmrKHmj5DkuqQgdHdlYWvlj6rmmK/kuqTmjaLkuoYgdGhpcy5fcm9vdCDlkowgdGhpcy5fbW9kZSA/IOaaguS4jeefpeS4uuWVpVxuICAgIHRoaXMuX3Jvb3QgPSBvcHRpb25zLnJvb3QgfHwgJy8nXG4gICAgdGhpcy5fbW9kZSA9IG9wdGlvbnMubW9kZSB8fCAnaGFzaCdcbiAgICB0aGlzLnJvb3RDb21wb25lbnQgPSBudWxsXG4gICAgdGhpcy5tYXRjaCA9IGNyZWF0ZU1hdGNoZXIob3B0aW9ucy5yb3V0ZXMgfHwgW10pXG5cbiAgICBzd2l0Y2ggKHRoaXMuX21vZGUpIHtcbiAgICAgIGNhc2UgJ2hhc2gnOlxuICAgICAgICB0aGlzLmhpc3RvcnkgPSBuZXcgSGFzaEhpc3RvcnkoKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnaHRtbDUnOlxuICAgICAgICB0aGlzLmhpc3RvcnkgPSBuZXcgSFRNTDVIaXN0b3J5KClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Fic3RyYWN0JzpcbiAgICAgICAgdGhpcy5oaXN0b3J5ID0gbmV3IEFic3RyYWN0SGlzdG9yeSgpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFt2dWUtcm91dGVyXSBpbnZhbGlkIG1vZGU6ICR7dGhpcy5fbW9kZX1gKVxuICAgIH1cbiAgfVxuICBnbyhwYXRoKSB7XG4gICAgdGhpcy5yb290Q29tcG9uZW50Ll9yb3V0ZSA9IHRoaXMubWF0Y2gocGF0aClcbiAgfVxufVxuXG5WdWVSb3V0ZXIuaW5zdGFsbCA9IGluc3RhbGxcblZ1ZVJvdXRlci5jcmVhdGVNYXRjaGVyID0gY3JlYXRlTWF0Y2hlclxuXG5cbmlmICh0eXBlb2YgVnVlICE9PSAndW5kZWZpbmVkJykge1xuXG4gIFZ1ZS51c2UoVnVlUm91dGVyKVxufVxuIl0sIm5hbWVzIjpbImxldCIsImNvbnN0IiwidGhpcyIsImNvbW1vbmpzSGVscGVycy5pbnRlcm9wRGVmYXVsdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsWUFBZTtLQUNYLElBQUksRUFBRSxhQUFhO0tBQ25CLEtBQUssRUFBRTtTQUNILElBQUksRUFBRTthQUNGLElBQUksRUFBRSxNQUFNO2FBQ1osT0FBTyxFQUFFLFNBQVM7VUFDckI7TUFDSjtLQUNELE9BQU8sa0JBQUEsR0FBRzs7U0FFTixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUk7O1NBRXZCQSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTztTQUN6QkEsSUFBSSxLQUFLLEdBQUcsQ0FBQztTQUNiLE1BQU0sTUFBTSxFQUFFO2FBQ1YsR0FBRyxNQUFNLENBQUMs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