(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.VueRouter = factory());
}(this, function () { 'use strict';

	var View = {
	    name: 'router-view',
	    functional: true,
	    props: {
	        name: {
	            type: String,
	            default: 'default'
	        }
	    },
	    render: function render(h, ref) {
	        var props = ref.props;
	        var children = ref.children;
	        var parent = ref.parent;
	        var data = ref.data;

	        var route = parent.$route
	         // 标记 routerVie 类型
	        var _parent = parent
	        var depth = 0

	        while(_parent) {
	            if (_parent.$vnode && _parent.$vnode.data._routerView) {
	                depth ++
	            }
	            _parent = _parent.$parent
	        }
	        data._routerView = true

	        var matched = route.matched[depth] && route.matched[depth].components[props.name] || null
	        return h(
	            matched,
	            data,
	            children
	        )
	    }
	}

	var Link = {
	    functional: true,
	    name: 'router-link',
	    props: {
	        to: {
	            type: [String, Object],
	            required: true,
	        },
	        tag: {
	            type: String,
	            default: 'a'
	        }
	    },
	    render: function render(h, ref) {
	        var props = ref.props;
	        var parent = ref.parent;
	        var children = ref.children;

	        return h(
	            props.tag,
	            {
	                attrs: {
	                    href: props.to
	                },
	                on: {
	                    click: function click(e) {
	                        e.preventDefault()
	                        parent.$router.go(props.to)
	                    }
	                }
	            },
	            children
	        )
	    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21wb25lbnRzL3ZpZXcuanMiLCIuLi9zcmMvY29tcG9uZW50cy9saW5rLmpzIiwiLi4vc3JjL2luc3RhbGwuanMiLCIuLi9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cC9pbmRleC5qcyIsIi4uL3NyYy9tYXRjaC5qcyIsIi4uL3NyYy9oaXN0b3J5L2hhc2guanMiLCIuLi9zcmMvaGlzdG9yeS9odG1sNS5qcyIsIi4uL3NyYy9oaXN0b3J5L2Fic3RyYWN0LmpzIiwiLi4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IHtcbiAgICBuYW1lOiAncm91dGVyLXZpZXcnLFxuICAgIGZ1bmN0aW9uYWw6IHRydWUsXG4gICAgcHJvcHM6IHtcbiAgICAgICAgbmFtZToge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgZGVmYXVsdDogJ2RlZmF1bHQnXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlbmRlcihoLCB7IHByb3BzLCBjaGlsZHJlbiwgcGFyZW50LCBkYXRhIH0pIHtcbiAgICAgICAgY29uc3Qgcm91dGUgPSBwYXJlbnQuJHJvdXRlXG4gICAgICAgICAvLyDmoIforrAgcm91dGVyVmllIOexu+Wei1xuICAgICAgICBsZXQgX3BhcmVudCA9IHBhcmVudFxuICAgICAgICBsZXQgZGVwdGggPSAwXG5cbiAgICAgICAgd2hpbGUoX3BhcmVudCkge1xuICAgICAgICAgICAgaWYgKF9wYXJlbnQuJHZub2RlICYmIF9wYXJlbnQuJHZub2RlLmRhdGEuX3JvdXRlclZpZXcpIHtcbiAgICAgICAgICAgICAgICBkZXB0aCArK1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3BhcmVudCA9IF9wYXJlbnQuJHBhcmVudFxuICAgICAgICB9XG4gICAgICAgIGRhdGEuX3JvdXRlclZpZXcgPSB0cnVlXG5cbiAgICAgICAgY29uc3QgbWF0Y2hlZCA9IHJvdXRlLm1hdGNoZWRbZGVwdGhdICYmIHJvdXRlLm1hdGNoZWRbZGVwdGhdLmNvbXBvbmVudHNbcHJvcHMubmFtZV0gfHwgbnVsbFxuICAgICAgICByZXR1cm4gaChcbiAgICAgICAgICAgIG1hdGNoZWQsXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgY2hpbGRyZW5cbiAgICAgICAgKVxuICAgIH1cbn0iLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgZnVuY3Rpb25hbDogdHJ1ZSxcbiAgICBuYW1lOiAncm91dGVyLWxpbmsnLFxuICAgIHByb3BzOiB7XG4gICAgICAgIHRvOiB7XG4gICAgICAgICAgICB0eXBlOiBbU3RyaW5nLCBPYmplY3RdLFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHRhZzoge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgZGVmYXVsdDogJ2EnXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlbmRlcihoLCB7IHByb3BzLCBwYXJlbnQsIGNoaWxkcmVuIH0pIHtcbiAgICAgICAgcmV0dXJuIGgoXG4gICAgICAgICAgICBwcm9wcy50YWcsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYXR0cnM6IHtcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogcHJvcHMudG9cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uOiB7XG4gICAgICAgICAgICAgICAgICAgIGNsaWNrKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LiRyb3V0ZXIuZ28ocHJvcHMudG8pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2hpbGRyZW5cbiAgICAgICAgKVxuICAgIH1cbn0iLCJpbXBvcnQgVmlldyBmcm9tICcuL2NvbXBvbmVudHMvdmlldydcbmltcG9ydCBMaW5rIGZyb20gJy4vY29tcG9uZW50cy9saW5rJ1xuXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFsbChWdWUpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoVnVlLnByb3RvdHlwZSwgJyRyb3V0ZXInLCB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLiRyb290Ll9yb3V0ZXJcbiAgICAgICAgfVxuICAgIH0pXG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoVnVlLnByb3RvdHlwZSwgJyRyb3V0ZScsIHtcbiAgICAgICAgZ2V0ICgpIHsgcmV0dXJuIHRoaXMuJHJvb3QuX3JvdXRlIH1cbiAgICB9KVxuICAgIC8qKlxuICAgICAqIOmcgOimgeWcqHZ1ZSAkb3B0aW9uc+S4reazqOWFpXJvdXRlcueahOWOn+WboFxuICAgICAqICAtIOagh+iusCByb290Q29tcG9uZW50XG4gICAgICogIC0g5oyC6L29IF9yb3V0ZSAg6Kem5Y+RIHJvdXRlci12aWV35pu05pawXG4gICAgICovXG4gICAgXG4gICAgVnVlLm1peGluKHtcbiAgICAgICAgYmVmb3JlQ3JlYXRlKCkge1xuICAgICAgICAgICAgaWYodGhpcy4kb3B0aW9ucy5yb3V0ZXIpIHsgLy8gcm9vdOe7hOS7tuaciSByb290ZXLpgInnur9cbiAgICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIgPSB0aGlzLiRvcHRpb25zLnJvdXRlclxuICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5yb290Q29tcG9uZW50ID0gdGhpc1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFxuICAgICAgICAgICAgICAgICAqIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQ6IGZvcm1hdE1hdGNoKG1hcFtyb3V0ZV0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBWdWUudXRpbC5kZWZpbmVSZWFjdGl2ZSh0aGlzLCAnX3JvdXRlJywgdGhpcy5fcm91dGVyLm1hdGNoKCcvJykpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KVxuICAgIFZ1ZS5jb21wb25lbnQoJ3JvdXRlci12aWV3JywgVmlldylcbiAgICBWdWUuY29tcG9uZW50KCdyb3V0ZXItbGluaycsIExpbmspXG59IiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwidmFyIGlzYXJyYXkgPSByZXF1aXJlKCdpc2FycmF5JylcblxuLyoqXG4gKiBFeHBvc2UgYHBhdGhUb1JlZ2V4cGAuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gcGF0aFRvUmVnZXhwXG5tb2R1bGUuZXhwb3J0cy5wYXJzZSA9IHBhcnNlXG5tb2R1bGUuZXhwb3J0cy5jb21waWxlID0gY29tcGlsZVxubW9kdWxlLmV4cG9ydHMudG9rZW5zVG9GdW5jdGlvbiA9IHRva2Vuc1RvRnVuY3Rpb25cbm1vZHVsZS5leHBvcnRzLnRva2Vuc1RvUmVnRXhwID0gdG9rZW5zVG9SZWdFeHBcblxuLyoqXG4gKiBUaGUgbWFpbiBwYXRoIG1hdGNoaW5nIHJlZ2V4cCB1dGlsaXR5LlxuICpcbiAqIEB0eXBlIHtSZWdFeHB9XG4gKi9cbnZhciBQQVRIX1JFR0VYUCA9IG5ldyBSZWdFeHAoW1xuICAvLyBNYXRjaCBlc2NhcGVkIGNoYXJhY3RlcnMgdGhhdCB3b3VsZCBvdGhlcndpc2UgYXBwZWFyIGluIGZ1dHVyZSBtYXRjaGVzLlxuICAvLyBUaGlzIGFsbG93cyB0aGUgdXNlciB0byBlc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzIHRoYXQgd29uJ3QgdHJhbnNmb3JtLlxuICAnKFxcXFxcXFxcLiknLFxuICAvLyBNYXRjaCBFeHByZXNzLXN0eWxlIHBhcmFtZXRlcnMgYW5kIHVuLW5hbWVkIHBhcmFtZXRlcnMgd2l0aCBhIHByZWZpeFxuICAvLyBhbmQgb3B0aW9uYWwgc3VmZml4ZXMuIE1hdGNoZXMgYXBwZWFyIGFzOlxuICAvL1xuICAvLyBcIi86dGVzdChcXFxcZCspP1wiID0+IFtcIi9cIiwgXCJ0ZXN0XCIsIFwiXFxkK1wiLCB1bmRlZmluZWQsIFwiP1wiLCB1bmRlZmluZWRdXG4gIC8vIFwiL3JvdXRlKFxcXFxkKylcIiAgPT4gW3VuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIFwiXFxkK1wiLCB1bmRlZmluZWQsIHVuZGVmaW5lZF1cbiAgLy8gXCIvKlwiICAgICAgICAgICAgPT4gW1wiL1wiLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIFwiKlwiXVxuICAnKFtcXFxcLy5dKT8oPzooPzpcXFxcOihcXFxcdyspKD86XFxcXCgoKD86XFxcXFxcXFwufFteXFxcXFxcXFwoKV0pKylcXFxcKSk/fFxcXFwoKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcKCldKSspXFxcXCkpKFsrKj9dKT98KFxcXFwqKSknXG5dLmpvaW4oJ3wnKSwgJ2cnKVxuXG4vKipcbiAqIFBhcnNlIGEgc3RyaW5nIGZvciB0aGUgcmF3IHRva2Vucy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICBzdHJcbiAqIEBwYXJhbSAge09iamVjdD19IG9wdGlvbnNcbiAqIEByZXR1cm4geyFBcnJheX1cbiAqL1xuZnVuY3Rpb24gcGFyc2UgKHN0ciwgb3B0aW9ucykge1xuICB2YXIgdG9rZW5zID0gW11cbiAgdmFyIGtleSA9IDBcbiAgdmFyIGluZGV4ID0gMFxuICB2YXIgcGF0aCA9ICcnXG4gIHZhciBkZWZhdWx0RGVsaW1pdGVyID0gb3B0aW9ucyAmJiBvcHRpb25zLmRlbGltaXRlciB8fCAnLydcbiAgdmFyIHJlc1xuXG4gIHdoaWxlICgocmVzID0gUEFUSF9SRUdFWFAuZXhlYyhzdHIpKSAhPSBudWxsKSB7XG4gICAgdmFyIG0gPSByZXNbMF1cbiAgICB2YXIgZXNjYXBlZCA9IHJlc1sxXVxuICAgIHZhciBvZmZzZXQgPSByZXMuaW5kZXhcbiAgICBwYXRoICs9IHN0ci5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgIGluZGV4ID0gb2Zmc2V0ICsgbS5sZW5ndGhcblxuICAgIC8vIElnbm9yZSBhbHJlYWR5IGVzY2FwZWQgc2VxdWVuY2VzLlxuICAgIGlmIChlc2NhcGVkKSB7XG4gICAgICBwYXRoICs9IGVzY2FwZWRbMV1cbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgdmFyIG5leHQgPSBzdHJbaW5kZXhdXG4gICAgdmFyIHByZWZpeCA9IHJlc1syXVxuICAgIHZhciBuYW1lID0gcmVzWzNdXG4gICAgdmFyIGNhcHR1cmUgPSByZXNbNF1cbiAgICB2YXIgZ3JvdXAgPSByZXNbNV1cbiAgICB2YXIgbW9kaWZpZXIgPSByZXNbNl1cbiAgICB2YXIgYXN0ZXJpc2sgPSByZXNbN11cblxuICAgIC8vIFB1c2ggdGhlIGN1cnJlbnQgcGF0aCBvbnRvIHRoZSB0b2tlbnMuXG4gICAgaWYgKHBhdGgpIHtcbiAgICAgIHRva2Vucy5wdXNoKHBhdGgpXG4gICAgICBwYXRoID0gJydcbiAgICB9XG5cbiAgICB2YXIgcGFydGlhbCA9IHByZWZpeCAhPSBudWxsICYmIG5leHQgIT0gbnVsbCAmJiBuZXh0ICE9PSBwcmVmaXhcbiAgICB2YXIgcmVwZWF0ID0gbW9kaWZpZXIgPT09ICcrJyB8fCBtb2RpZmllciA9PT0gJyonXG4gICAgdmFyIG9wdGlvbmFsID0gbW9kaWZpZXIgPT09ICc/JyB8fCBtb2RpZmllciA9PT0gJyonXG4gICAgdmFyIGRlbGltaXRlciA9IHJlc1syXSB8fCBkZWZhdWx0RGVsaW1pdGVyXG4gICAgdmFyIHBhdHRlcm4gPSBjYXB0dXJlIHx8IGdyb3VwXG5cbiAgICB0b2tlbnMucHVzaCh7XG4gICAgICBuYW1lOiBuYW1lIHx8IGtleSsrLFxuICAgICAgcHJlZml4OiBwcmVmaXggfHwgJycsXG4gICAgICBkZWxpbWl0ZXI6IGRlbGltaXRlcixcbiAgICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICAgIHJlcGVhdDogcmVwZWF0LFxuICAgICAgcGFydGlhbDogcGFydGlhbCxcbiAgICAgIGFzdGVyaXNrOiAhIWFzdGVyaXNrLFxuICAgICAgcGF0dGVybjogcGF0dGVybiA/IGVzY2FwZUdyb3VwKHBhdHRlcm4pIDogKGFzdGVyaXNrID8gJy4qJyA6ICdbXicgKyBlc2NhcGVTdHJpbmcoZGVsaW1pdGVyKSArICddKz8nKVxuICAgIH0pXG4gIH1cblxuICAvLyBNYXRjaCBhbnkgY2hhcmFjdGVycyBzdGlsbCByZW1haW5pbmcuXG4gIGlmIChpbmRleCA8IHN0ci5sZW5ndGgpIHtcbiAgICBwYXRoICs9IHN0ci5zdWJzdHIoaW5kZXgpXG4gIH1cblxuICAvLyBJZiB0aGUgcGF0aCBleGlzdHMsIHB1c2ggaXQgb250byB0aGUgZW5kLlxuICBpZiAocGF0aCkge1xuICAgIHRva2Vucy5wdXNoKHBhdGgpXG4gIH1cblxuICByZXR1cm4gdG9rZW5zXG59XG5cbi8qKlxuICogQ29tcGlsZSBhIHN0cmluZyB0byBhIHRlbXBsYXRlIGZ1bmN0aW9uIGZvciB0aGUgcGF0aC5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgIHN0clxuICogQHBhcmFtICB7T2JqZWN0PX0gICAgICAgICAgICBvcHRpb25zXG4gKiBAcmV0dXJuIHshZnVuY3Rpb24oT2JqZWN0PSwgT2JqZWN0PSl9XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGUgKHN0ciwgb3B0aW9ucykge1xuICByZXR1cm4gdG9rZW5zVG9GdW5jdGlvbihwYXJzZShzdHIsIG9wdGlvbnMpLCBvcHRpb25zKVxufVxuXG4vKipcbiAqIFByZXR0aWVyIGVuY29kaW5nIG9mIFVSSSBwYXRoIHNlZ21lbnRzLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ31cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZW5jb2RlVVJJQ29tcG9uZW50UHJldHR5IChzdHIpIHtcbiAgcmV0dXJuIGVuY29kZVVSSShzdHIpLnJlcGxhY2UoL1tcXC8/I10vZywgZnVuY3Rpb24gKGMpIHtcbiAgICByZXR1cm4gJyUnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gIH0pXG59XG5cbi8qKlxuICogRW5jb2RlIHRoZSBhc3RlcmlzayBwYXJhbWV0ZXIuIFNpbWlsYXIgdG8gYHByZXR0eWAsIGJ1dCBhbGxvd3Mgc2xhc2hlcy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVuY29kZUFzdGVyaXNrIChzdHIpIHtcbiAgcmV0dXJuIGVuY29kZVVSSShzdHIpLnJlcGxhY2UoL1s/I10vZywgZnVuY3Rpb24gKGMpIHtcbiAgICByZXR1cm4gJyUnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gIH0pXG59XG5cbi8qKlxuICogRXhwb3NlIGEgbWV0aG9kIGZvciB0cmFuc2Zvcm1pbmcgdG9rZW5zIGludG8gdGhlIHBhdGggZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvRnVuY3Rpb24gKHRva2Vucywgb3B0aW9ucykge1xuICAvLyBDb21waWxlIGFsbCB0aGUgdG9rZW5zIGludG8gcmVnZXhwcy5cbiAgdmFyIG1hdGNoZXMgPSBuZXcgQXJyYXkodG9rZW5zLmxlbmd0aClcblxuICAvLyBDb21waWxlIGFsbCB0aGUgcGF0dGVybnMgYmVmb3JlIGNvbXBpbGF0aW9uLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0eXBlb2YgdG9rZW5zW2ldID09PSAnb2JqZWN0Jykge1xuICAgICAgbWF0Y2hlc1tpXSA9IG5ldyBSZWdFeHAoJ14oPzonICsgdG9rZW5zW2ldLnBhdHRlcm4gKyAnKSQnLCBmbGFncyhvcHRpb25zKSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgb3B0cykge1xuICAgIHZhciBwYXRoID0gJydcbiAgICB2YXIgZGF0YSA9IG9iaiB8fCB7fVxuICAgIHZhciBvcHRpb25zID0gb3B0cyB8fCB7fVxuICAgIHZhciBlbmNvZGUgPSBvcHRpb25zLnByZXR0eSA/IGVuY29kZVVSSUNvbXBvbmVudFByZXR0eSA6IGVuY29kZVVSSUNvbXBvbmVudFxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuXG4gICAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgICBwYXRoICs9IHRva2VuXG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgdmFyIHZhbHVlID0gZGF0YVt0b2tlbi5uYW1lXVxuICAgICAgdmFyIHNlZ21lbnRcblxuICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgaWYgKHRva2VuLm9wdGlvbmFsKSB7XG4gICAgICAgICAgLy8gUHJlcGVuZCBwYXJ0aWFsIHNlZ21lbnQgcHJlZml4ZXMuXG4gICAgICAgICAgaWYgKHRva2VuLnBhcnRpYWwpIHtcbiAgICAgICAgICAgIHBhdGggKz0gdG9rZW4ucHJlZml4XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIGJlIGRlZmluZWQnKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpc2FycmF5KHZhbHVlKSkge1xuICAgICAgICBpZiAoIXRva2VuLnJlcGVhdCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbm90IHJlcGVhdCwgYnV0IHJlY2VpdmVkIGAnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpICsgJ2AnKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgYmUgZW1wdHknKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBzZWdtZW50ID0gZW5jb2RlKHZhbHVlW2pdKVxuXG4gICAgICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGFsbCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBgJyArIEpTT04uc3RyaW5naWZ5KHNlZ21lbnQpICsgJ2AnKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhdGggKz0gKGogPT09IDAgPyB0b2tlbi5wcmVmaXggOiB0b2tlbi5kZWxpbWl0ZXIpICsgc2VnbWVudFxuICAgICAgICB9XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgc2VnbWVudCA9IHRva2VuLmFzdGVyaXNrID8gZW5jb2RlQXN0ZXJpc2sodmFsdWUpIDogZW5jb2RlKHZhbHVlKVxuXG4gICAgICBpZiAoIW1hdGNoZXNbaV0udGVzdChzZWdtZW50KSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBcIicgKyBzZWdtZW50ICsgJ1wiJylcbiAgICAgIH1cblxuICAgICAgcGF0aCArPSB0b2tlbi5wcmVmaXggKyBzZWdtZW50XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGhcbiAgfVxufVxuXG4vKipcbiAqIEVzY2FwZSBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBzdHJpbmcuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlU3RyaW5nIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWy4rKj89XiE6JHt9KClbXFxdfFxcL1xcXFxdKS9nLCAnXFxcXCQxJylcbn1cblxuLyoqXG4gKiBFc2NhcGUgdGhlIGNhcHR1cmluZyBncm91cCBieSBlc2NhcGluZyBzcGVjaWFsIGNoYXJhY3RlcnMgYW5kIG1lYW5pbmcuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBncm91cFxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVHcm91cCAoZ3JvdXApIHtcbiAgcmV0dXJuIGdyb3VwLnJlcGxhY2UoLyhbPSE6JFxcLygpXSkvZywgJ1xcXFwkMScpXG59XG5cbi8qKlxuICogQXR0YWNoIHRoZSBrZXlzIGFzIGEgcHJvcGVydHkgb2YgdGhlIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshUmVnRXhwfSByZVxuICogQHBhcmFtICB7QXJyYXl9ICAga2V5c1xuICogQHJldHVybiB7IVJlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gYXR0YWNoS2V5cyAocmUsIGtleXMpIHtcbiAgcmUua2V5cyA9IGtleXNcbiAgcmV0dXJuIHJlXG59XG5cbi8qKlxuICogR2V0IHRoZSBmbGFncyBmb3IgYSByZWdleHAgZnJvbSB0aGUgb3B0aW9ucy5cbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZmxhZ3MgKG9wdGlvbnMpIHtcbiAgcmV0dXJuIG9wdGlvbnMgJiYgb3B0aW9ucy5zZW5zaXRpdmUgPyAnJyA6ICdpJ1xufVxuXG4vKipcbiAqIFB1bGwgb3V0IGtleXMgZnJvbSBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshUmVnRXhwfSBwYXRoXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiByZWdleHBUb1JlZ2V4cCAocGF0aCwga2V5cykge1xuICAvLyBVc2UgYSBuZWdhdGl2ZSBsb29rYWhlYWQgdG8gbWF0Y2ggb25seSBjYXB0dXJpbmcgZ3JvdXBzLlxuICB2YXIgZ3JvdXBzID0gcGF0aC5zb3VyY2UubWF0Y2goL1xcKCg/IVxcPykvZylcblxuICBpZiAoZ3JvdXBzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleXMucHVzaCh7XG4gICAgICAgIG5hbWU6IGksXG4gICAgICAgIHByZWZpeDogbnVsbCxcbiAgICAgICAgZGVsaW1pdGVyOiBudWxsLFxuICAgICAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgICAgIHJlcGVhdDogZmFsc2UsXG4gICAgICAgIHBhcnRpYWw6IGZhbHNlLFxuICAgICAgICBhc3RlcmlzazogZmFsc2UsXG4gICAgICAgIHBhdHRlcm46IG51bGxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocGF0aCwga2V5cylcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm0gYW4gYXJyYXkgaW50byBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gICBrZXlzXG4gKiBAcGFyYW0gIHshT2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBhcnJheVRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIHZhciBwYXJ0cyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgcGFydHMucHVzaChwYXRoVG9SZWdleHAocGF0aFtpXSwga2V5cywgb3B0aW9ucykuc291cmNlKVxuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJyg/OicgKyBwYXJ0cy5qb2luKCd8JykgKyAnKScsIGZsYWdzKG9wdGlvbnMpKVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKHJlZ2V4cCwga2V5cylcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBwYXRoIHJlZ2V4cCBmcm9tIHN0cmluZyBpbnB1dC5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICBwYXRoXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHshT2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBzdHJpbmdUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICByZXR1cm4gdG9rZW5zVG9SZWdFeHAocGFyc2UocGF0aCwgb3B0aW9ucyksIGtleXMsIG9wdGlvbnMpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgZnVuY3Rpb24gZm9yIHRha2luZyB0b2tlbnMgYW5kIHJldHVybmluZyBhIFJlZ0V4cC5cbiAqXG4gKiBAcGFyYW0gIHshQXJyYXl9ICAgICAgICAgIHRva2Vuc1xuICogQHBhcmFtICB7KEFycmF5fE9iamVjdCk9fSBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3Q9fSAgICAgICAgIG9wdGlvbnNcbiAqIEByZXR1cm4geyFSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvUmVnRXhwICh0b2tlbnMsIGtleXMsIG9wdGlvbnMpIHtcbiAgaWYgKCFpc2FycmF5KGtleXMpKSB7XG4gICAgb3B0aW9ucyA9IC8qKiBAdHlwZSB7IU9iamVjdH0gKi8gKGtleXMgfHwgb3B0aW9ucylcbiAgICBrZXlzID0gW11cbiAgfVxuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG5cbiAgdmFyIHN0cmljdCA9IG9wdGlvbnMuc3RyaWN0XG4gIHZhciBlbmQgPSBvcHRpb25zLmVuZCAhPT0gZmFsc2VcbiAgdmFyIHJvdXRlID0gJydcblxuICAvLyBJdGVyYXRlIG92ZXIgdGhlIHRva2VucyBhbmQgY3JlYXRlIG91ciByZWdleHAgc3RyaW5nLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuXG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJvdXRlICs9IGVzY2FwZVN0cmluZyh0b2tlbilcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHByZWZpeCA9IGVzY2FwZVN0cmluZyh0b2tlbi5wcmVmaXgpXG4gICAgICB2YXIgY2FwdHVyZSA9ICcoPzonICsgdG9rZW4ucGF0dGVybiArICcpJ1xuXG4gICAgICBrZXlzLnB1c2godG9rZW4pXG5cbiAgICAgIGlmICh0b2tlbi5yZXBlYXQpIHtcbiAgICAgICAgY2FwdHVyZSArPSAnKD86JyArIHByZWZpeCArIGNhcHR1cmUgKyAnKSonXG4gICAgICB9XG5cbiAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICBpZiAoIXRva2VuLnBhcnRpYWwpIHtcbiAgICAgICAgICBjYXB0dXJlID0gJyg/OicgKyBwcmVmaXggKyAnKCcgKyBjYXB0dXJlICsgJykpPydcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYXB0dXJlID0gcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpPydcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FwdHVyZSA9IHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKSdcbiAgICAgIH1cblxuICAgICAgcm91dGUgKz0gY2FwdHVyZVxuICAgIH1cbiAgfVxuXG4gIHZhciBkZWxpbWl0ZXIgPSBlc2NhcGVTdHJpbmcob3B0aW9ucy5kZWxpbWl0ZXIgfHwgJy8nKVxuICB2YXIgZW5kc1dpdGhEZWxpbWl0ZXIgPSByb3V0ZS5zbGljZSgtZGVsaW1pdGVyLmxlbmd0aCkgPT09IGRlbGltaXRlclxuXG4gIC8vIEluIG5vbi1zdHJpY3QgbW9kZSB3ZSBhbGxvdyBhIHNsYXNoIGF0IHRoZSBlbmQgb2YgbWF0Y2guIElmIHRoZSBwYXRoIHRvXG4gIC8vIG1hdGNoIGFscmVhZHkgZW5kcyB3aXRoIGEgc2xhc2gsIHdlIHJlbW92ZSBpdCBmb3IgY29uc2lzdGVuY3kuIFRoZSBzbGFzaFxuICAvLyBpcyB2YWxpZCBhdCB0aGUgZW5kIG9mIGEgcGF0aCBtYXRjaCwgbm90IGluIHRoZSBtaWRkbGUuIFRoaXMgaXMgaW1wb3J0YW50XG4gIC8vIGluIG5vbi1lbmRpbmcgbW9kZSwgd2hlcmUgXCIvdGVzdC9cIiBzaG91bGRuJ3QgbWF0Y2ggXCIvdGVzdC8vcm91dGVcIi5cbiAgaWYgKCFzdHJpY3QpIHtcbiAgICByb3V0ZSA9IChlbmRzV2l0aERlbGltaXRlciA/IHJvdXRlLnNsaWNlKDAsIC1kZWxpbWl0ZXIubGVuZ3RoKSA6IHJvdXRlKSArICcoPzonICsgZGVsaW1pdGVyICsgJyg/PSQpKT8nXG4gIH1cblxuICBpZiAoZW5kKSB7XG4gICAgcm91dGUgKz0gJyQnXG4gIH0gZWxzZSB7XG4gICAgLy8gSW4gbm9uLWVuZGluZyBtb2RlLCB3ZSBuZWVkIHRoZSBjYXB0dXJpbmcgZ3JvdXBzIHRvIG1hdGNoIGFzIG11Y2ggYXNcbiAgICAvLyBwb3NzaWJsZSBieSB1c2luZyBhIHBvc2l0aXZlIGxvb2thaGVhZCB0byB0aGUgZW5kIG9yIG5leHQgcGF0aCBzZWdtZW50LlxuICAgIHJvdXRlICs9IHN0cmljdCAmJiBlbmRzV2l0aERlbGltaXRlciA/ICcnIDogJyg/PScgKyBkZWxpbWl0ZXIgKyAnfCQpJ1xuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMobmV3IFJlZ0V4cCgnXicgKyByb3V0ZSwgZmxhZ3Mob3B0aW9ucykpLCBrZXlzKVxufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgZ2l2ZW4gcGF0aCBzdHJpbmcsIHJldHVybmluZyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBBbiBlbXB0eSBhcnJheSBjYW4gYmUgcGFzc2VkIGluIGZvciB0aGUga2V5cywgd2hpY2ggd2lsbCBob2xkIHRoZVxuICogcGxhY2Vob2xkZXIga2V5IGRlc2NyaXB0aW9ucy4gRm9yIGV4YW1wbGUsIHVzaW5nIGAvdXNlci86aWRgLCBga2V5c2Agd2lsbFxuICogY29udGFpbiBgW3sgbmFtZTogJ2lkJywgZGVsaW1pdGVyOiAnLycsIG9wdGlvbmFsOiBmYWxzZSwgcmVwZWF0OiBmYWxzZSB9XWAuXG4gKlxuICogQHBhcmFtICB7KHN0cmluZ3xSZWdFeHB8QXJyYXkpfSBwYXRoXG4gKiBAcGFyYW0gIHsoQXJyYXl8T2JqZWN0KT19ICAgICAgIGtleXNcbiAqIEBwYXJhbSAge09iamVjdD19ICAgICAgICAgICAgICAgb3B0aW9uc1xuICogQHJldHVybiB7IVJlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gcGF0aFRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIGlmICghaXNhcnJheShrZXlzKSkge1xuICAgIG9wdGlvbnMgPSAvKiogQHR5cGUgeyFPYmplY3R9ICovIChrZXlzIHx8IG9wdGlvbnMpXG4gICAga2V5cyA9IFtdXG4gIH1cblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG4gIGlmIChwYXRoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgcmV0dXJuIHJlZ2V4cFRvUmVnZXhwKHBhdGgsIC8qKiBAdHlwZSB7IUFycmF5fSAqLyAoa2V5cykpXG4gIH1cblxuICBpZiAoaXNhcnJheShwYXRoKSkge1xuICAgIHJldHVybiBhcnJheVRvUmVnZXhwKC8qKiBAdHlwZSB7IUFycmF5fSAqLyAocGF0aCksIC8qKiBAdHlwZSB7IUFycmF5fSAqLyAoa2V5cyksIG9wdGlvbnMpXG4gIH1cblxuICByZXR1cm4gc3RyaW5nVG9SZWdleHAoLyoqIEB0eXBlIHtzdHJpbmd9ICovIChwYXRoKSwgLyoqIEB0eXBlIHshQXJyYXl9ICovIChrZXlzKSwgb3B0aW9ucylcbn1cbiIsImltcG9ydCBSZWdleHAgZnJvbSAncGF0aC10by1yZWdleHAnXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNYXRjaGVyIChyb3V0ZXMpIHtcbiAgLyoqXG4gICAqIHtcbiAgICogIG5vcm1hbGl6ZWRQYXRoOiByZWNvcmRcbiAgICogfVxuICAgKi9cbiAgY29uc3QgbWFwID0ge31cbiAgcm91dGVzLmZvckVhY2gociA9PiBhZGRSb3V0ZShtYXAsIHIpKVxuXG4gIHJldHVybiBmdW5jdGlvbiBtYXRjaCAoZnVsbFBhdGgpIHtcbiAgICBjb25zdCB7IHBhdGgsIHF1ZXJ5IH0gPSBleHRyYWN0UXVlcnkoZnVsbFBhdGgpXG4gICAgY29uc3QgcGFyYW1zID0ge31cbiAgICBmb3IgKGNvbnN0IHJvdXRlIGluIG1hcCkge1xuICAgICAgaWYgKG1hdGNoUm91dGUocm91dGUsIHBhcmFtcywgcGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoe1xuICAgICAgICAgIHBhcmFtcyxcbiAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICBtYXRjaGVkOiBmb3JtYXRNYXRjaChtYXBbcm91dGVdKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRSb3V0ZSAobWFwLCByb3V0ZSwgcGFyZW50KSB7XG4gIGNvbnN0IHsgcGF0aCwgY29tcG9uZW50LCBjb21wb25lbnRzLCBtZXRhLCBjaGlsZHJlbiB9ID0gcm91dGVcbiAgY29uc3QgcmVjb3JkID0ge1xuICAgIHBhdGg6IG5vcm1hbGl6ZVJvdXRlKHBhdGgsIHBhcmVudCksXG4gICAgY29tcG9uZW50czogY29tcG9uZW50cyB8fCB7IGRlZmF1bHQ6IGNvbXBvbmVudCB9LFxuICAgIHBhcmVudCxcbiAgICBtZXRhXG4gIH1cbiAgaWYgKGNoaWxkcmVuKSB7XG4gICAgY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiBhZGRSb3V0ZShtYXAsIGNoaWxkLCByZWNvcmQpKVxuICB9XG4gIG1hcFtyZWNvcmQucGF0aF0gPSByZWNvcmRcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplUm91dGUgKHBhdGgsIHBhcmVudCkge1xuICBpZiAocGF0aFswXSA9PSAnLycpIHJldHVybiBwYXRoICAvLyBcIi9cIiBzaWduaWZpZXMgYW4gYWJzb2x1dGUgcm91dGVcbiAgaWYgKHBhcmVudCA9PSBudWxsKSByZXR1cm4gcGF0aCAgLy8gbm8gbmVlZCBmb3IgYSBqb2luXG4gIHJldHVybiBgJHtwYXJlbnQucGF0aH0vJHtwYXRofWAucmVwbGFjZSgvXFwvXFwvL2csICcvJykgLy8gam9pblxufVxuXG4vKipcbiAqIHtrZXkgb2YgbWFwfSBwYXRoXG4gKiB7b2JqZWN0ID0ge319IHBhcmFtc1xuICoge2Z1bGxwYXRoLnBhdGh9IHBhdGhuYW1lXG4gKi9cbmZ1bmN0aW9uIG1hdGNoUm91dGUgKHBhdGgsIHBhcmFtcywgcGF0aG5hbWUpIHtcbiAgY29uc3Qga2V5cyA9IFtdXG4gIGNvbnN0IHJlZ2V4cCA9IFJlZ2V4cChwYXRoLCBrZXlzKVxuICBjb25zdCBtID0gcmVnZXhwLmV4ZWMocGF0aG5hbWUpXG4gIGlmICghbSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9IGVsc2UgaWYgKCFwYXJhbXMpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IG0ubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpIC0gMV1cbiAgICB2YXIgdmFsID0gJ3N0cmluZycgPT0gdHlwZW9mIG1baV0gPyBkZWNvZGVVUklDb21wb25lbnQobVtpXSkgOiBtW2ldXG4gICAgaWYgKGtleSkgcGFyYW1zW2tleS5uYW1lXSA9IHZhbFxuICB9XG5cbiAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gZXh0cmFjdFF1ZXJ5IChwYXRoKSB7XG4gIGNvbnN0IGluZGV4ID0gcGF0aC5pbmRleE9mKCc/JylcbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIHJldHVybiB7XG4gICAgICBwYXRoOiBwYXRoLnNsaWNlKDAsIGluZGV4KSxcbiAgICAgIHF1ZXJ5OiBwYXJzZVF1ZXJ5KHBhdGguc2xpY2UoaW5kZXggKyAxKSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHsgcGF0aCB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyc2VRdWVyeSAocXVlcnkpIHtcbiAgY29uc3QgcmVzID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuXG4gIHF1ZXJ5ID0gcXVlcnkudHJpbSgpLnJlcGxhY2UoL14oXFw/fCN8JikvLCAnJylcblxuICBpZiAoIXF1ZXJ5KSB7XG4gICAgcmV0dXJuIHJlc1xuICB9XG5cbiAgcXVlcnkuc3BsaXQoJyYnKS5mb3JFYWNoKHBhcmFtID0+IHtcbiAgICBjb25zdCBwYXJ0cyA9IHBhcmFtLnJlcGxhY2UoL1xcKy9nLCAnICcpLnNwbGl0KCc9JylcbiAgICBjb25zdCBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQocGFydHMuc2hpZnQoKSlcbiAgICBjb25zdCB2YWwgPSBwYXJ0cy5sZW5ndGggPiAwXG4gICAgICA/IGRlY29kZVVSSUNvbXBvbmVudChwYXJ0cy5qb2luKCc9JykpXG4gICAgICA6IG51bGxcblxuICAgIGlmIChyZXNba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXNba2V5XSA9IHZhbFxuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXNba2V5XSkpIHtcbiAgICAgIHJlc1trZXldLnB1c2godmFsKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXNba2V5XSA9IFtyZXNba2V5XSwgdmFsXVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGZvcm1hdE1hdGNoIChyZWNvcmQpIHtcbiAgY29uc3QgcmVzID0gW11cbiAgd2hpbGUgKHJlY29yZCkge1xuICAgIHJlcy51bnNoaWZ0KHJlY29yZClcbiAgICByZWNvcmQgPSByZWNvcmQucGFyZW50XG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuIiwiZXhwb3J0IGNsYXNzIEhhc2hIaXN0b3J5IHtcblxufVxuIiwiZXhwb3J0IGNsYXNzIEhUTUw1SGlzdG9yeSB7XG5cbn1cbiIsImV4cG9ydCBjbGFzcyBBYnN0cmFjdEhpc3Rvcnkge1xuXG59XG4iLCJpbXBvcnQgeyBpbnN0YWxsIH0gZnJvbSAnLi9pbnN0YWxsJ1xuaW1wb3J0IHsgY3JlYXRlTWF0Y2hlciB9IGZyb20gJy4vbWF0Y2gnXG5pbXBvcnQgeyBIYXNoSGlzdG9yeSB9IGZyb20gJy4vaGlzdG9yeS9oYXNoJ1xuaW1wb3J0IHsgSFRNTDVIaXN0b3J5IH0gZnJvbSAnLi9oaXN0b3J5L2h0bWw1J1xuaW1wb3J0IHsgQWJzdHJhY3RIaXN0b3J5IH0gZnJvbSAnLi9oaXN0b3J5L2Fic3RyYWN0J1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWdWVSb3V0ZXIge1xuICBjb25zdHJ1Y3RvciAob3B0aW9ucyA9IHt9KSB7XG5cbiAgICAvLyDnrKzkuozmrKHmj5DkuqQgdHdlYWvlj6rmmK/kuqTmjaLkuoYgdGhpcy5fcm9vdCDlkowgdGhpcy5fbW9kZSA/IOaaguS4jeefpeS4uuWVpVxuICAgIHRoaXMuX3Jvb3QgPSBvcHRpb25zLnJvb3QgfHwgJy8nXG4gICAgdGhpcy5fbW9kZSA9IG9wdGlvbnMubW9kZSB8fCAnaGFzaCdcbiAgICB0aGlzLnJvb3RDb21wb25lbnQgPSBudWxsXG4gICAgdGhpcy5tYXRjaCA9IGNyZWF0ZU1hdGNoZXIob3B0aW9ucy5yb3V0ZXMgfHwgW10pXG5cbiAgICBzd2l0Y2ggKHRoaXMuX21vZGUpIHtcbiAgICAgIGNhc2UgJ2hhc2gnOlxuICAgICAgICB0aGlzLmhpc3RvcnkgPSBuZXcgSGFzaEhpc3RvcnkoKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnaHRtbDUnOlxuICAgICAgICB0aGlzLmhpc3RvcnkgPSBuZXcgSFRNTDVIaXN0b3J5KClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Fic3RyYWN0JzpcbiAgICAgICAgdGhpcy5oaXN0b3J5ID0gbmV3IEFic3RyYWN0SGlzdG9yeSgpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFt2dWUtcm91dGVyXSBpbnZhbGlkIG1vZGU6ICR7dGhpcy5fbW9kZX1gKVxuICAgIH1cbiAgfVxuICBnbyhwYXRoKSB7XG4gICAgdGhpcy5yb290Q29tcG9uZW50Ll9yb3V0ZSA9IHRoaXMubWF0Y2gocGF0aClcbiAgfVxufVxuXG5WdWVSb3V0ZXIuaW5zdGFsbCA9IGluc3RhbGxcblZ1ZVJvdXRlci5jcmVhdGVNYXRjaGVyID0gY3JlYXRlTWF0Y2hlclxuXG5cbmlmICh0eXBlb2YgVnVlICE9PSAndW5kZWZpbmVkJykge1xuXG4gIFZ1ZS51c2UoVnVlUm91dGVyKVxufVxuIl0sIm5hbWVzIjpbImNvbnN0IiwibGV0IiwiY29tbW9uanNIZWxwZXJzLmludGVyb3BEZWZhdWx0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxZQUFlO0tBQ1gsSUFBSSxFQUFFLGFBQWE7S0FDbkIsVUFBVSxFQUFFLElBQUk7S0FDaEIsS0FBSyxFQUFFO1NBQ0gsSUFBSSxFQUFFO2FBQ0YsSUFBSSxFQUFFLE1BQU07YUFDWixPQUFPLEVBQUUsU0FBUztVQUNyQjtNQUNKO0tBQ0QsTUFBTSxpQkFBQSxDQUFDLENBQUMsRUFBRSxHQUFBLEVBQW1DO2FBQWpDLEtBQUssYUFBRTthQUFBLFFBQVEsZ0JBQUU7YUFBQSxNQUFNLGNBQUU7YUFBQSxJQUFJOztTQUNyQ0EsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU07O1NBRTNCQyxJQUFJLE9BQU8sR0FBRyxNQUFNO1NBQ3BCQSxJQUFJLEtBQUssR0FBRyxDQUFDOztTQUViLE1BQU0sT0FBTyxFQUFFO2FBQ1gsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtpQkFDbkQsS0FBSyxHQUFH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