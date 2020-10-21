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
	    render: function render(h, context) {
	        var props = context.props;
	        var children = context.children;
	        var parent = context.parent;
	        var data = context.data;
	        data.routerView = true
	        var route = parent.$route

	        // 等效于
	        // if(!parent._routerViewCache) {
	        //     parent._routerViewCache = {}
	        // }
	        // const cache = parent._routerViewCache

	        var cache = parent._routerViewCache || (parent._routerViewCache = {})
	        

	         // 标记 routerVie 类型
	        var depth = 0
	        var inactive = false;
	        while(parent) {
	            if (parent.$vnode && parent.$vnode.data.routerView) {
	                depth ++
	            }
	            // 祖辈存在 keep-alive组件
	            if (parent._inactive) {
	                inactive = true
	            }
	            parent = parent.$parent
	        }

	        var matched = route.matched[depth]
	        // keep-alive组件处理，优先拿缓存里面的组件
	        // 可以先不考虑keep-alive情况 也不会造成什么理解的问题
	        // const component = matched && matched.components[props.name]
	        var component =  inactive
	        ? cache[props.name]
	        : (cache[props.name] = matched && matched.components[props.name])
	        
	        return h(
	            component,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21wb25lbnRzL3ZpZXcuanMiLCIuLi9zcmMvY29tcG9uZW50cy9saW5rLmpzIiwiLi4vc3JjL2luc3RhbGwuanMiLCIuLi9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cC9pbmRleC5qcyIsIi4uL3NyYy9tYXRjaC5qcyIsIi4uL3NyYy9oaXN0b3J5L2hhc2guanMiLCIuLi9zcmMvaGlzdG9yeS9odG1sNS5qcyIsIi4uL3NyYy9oaXN0b3J5L2Fic3RyYWN0LmpzIiwiLi4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IHtcbiAgICBuYW1lOiAncm91dGVyLXZpZXcnLFxuICAgIGZ1bmN0aW9uYWw6IHRydWUsXG4gICAgcHJvcHM6IHtcbiAgICAgICAgbmFtZToge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgZGVmYXVsdDogJ2RlZmF1bHQnXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlbmRlcihoLCBjb250ZXh0KSB7XG4gICAgICAgIGxldCB7IHByb3BzLCBjaGlsZHJlbiwgcGFyZW50LCBkYXRhIH0gPSBjb250ZXh0XG4gICAgICAgIGRhdGEucm91dGVyVmlldyA9IHRydWVcbiAgICAgICAgY29uc3Qgcm91dGUgPSBwYXJlbnQuJHJvdXRlXG5cbiAgICAgICAgLy8g562J5pWI5LqOXG4gICAgICAgIC8vIGlmKCFwYXJlbnQuX3JvdXRlclZpZXdDYWNoZSkge1xuICAgICAgICAvLyAgICAgcGFyZW50Ll9yb3V0ZXJWaWV3Q2FjaGUgPSB7fVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGNvbnN0IGNhY2hlID0gcGFyZW50Ll9yb3V0ZXJWaWV3Q2FjaGVcblxuICAgICAgICBjb25zdCBjYWNoZSA9IHBhcmVudC5fcm91dGVyVmlld0NhY2hlIHx8IChwYXJlbnQuX3JvdXRlclZpZXdDYWNoZSA9IHt9KVxuICAgICAgICBcblxuICAgICAgICAgLy8g5qCH6K6wIHJvdXRlclZpZSDnsbvlnotcbiAgICAgICAgbGV0IGRlcHRoID0gMFxuICAgICAgICBsZXQgaW5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgd2hpbGUocGFyZW50KSB7XG4gICAgICAgICAgICBpZiAocGFyZW50LiR2bm9kZSAmJiBwYXJlbnQuJHZub2RlLmRhdGEucm91dGVyVmlldykge1xuICAgICAgICAgICAgICAgIGRlcHRoICsrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDnpZbovojlrZjlnKgga2VlcC1hbGl2Zee7hOS7tlxuICAgICAgICAgICAgaWYgKHBhcmVudC5faW5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICBpbmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC4kcGFyZW50XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtYXRjaGVkID0gcm91dGUubWF0Y2hlZFtkZXB0aF1cbiAgICAgICAgLy8ga2VlcC1hbGl2Zee7hOS7tuWkhOeQhu+8jOS8mOWFiOaLv+e8k+WtmOmHjOmdoueahOe7hOS7tlxuICAgICAgICAvLyDlj6/ku6XlhYjkuI3ogIPomZFrZWVwLWFsaXZl5oOF5Ya1IOS5n+S4jeS8mumAoOaIkOS7gOS5iOeQhuino+eahOmXrumimFxuICAgICAgICAvLyBjb25zdCBjb21wb25lbnQgPSBtYXRjaGVkICYmIG1hdGNoZWQuY29tcG9uZW50c1twcm9wcy5uYW1lXVxuICAgICAgICBjb25zdCBjb21wb25lbnQgPSAgaW5hY3RpdmVcbiAgICAgICAgPyBjYWNoZVtwcm9wcy5uYW1lXVxuICAgICAgICA6IChjYWNoZVtwcm9wcy5uYW1lXSA9IG1hdGNoZWQgJiYgbWF0Y2hlZC5jb21wb25lbnRzW3Byb3BzLm5hbWVdKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGgoXG4gICAgICAgICAgICBjb21wb25lbnQsXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgY2hpbGRyZW5cbiAgICAgICAgKVxuICAgIH1cbn0iLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgZnVuY3Rpb25hbDogdHJ1ZSxcbiAgICBuYW1lOiAncm91dGVyLWxpbmsnLFxuICAgIHByb3BzOiB7XG4gICAgICAgIHRvOiB7XG4gICAgICAgICAgICB0eXBlOiBbU3RyaW5nLCBPYmplY3RdLFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHRhZzoge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgZGVmYXVsdDogJ2EnXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlbmRlcihoLCB7IHByb3BzLCBwYXJlbnQsIGNoaWxkcmVuIH0pIHtcbiAgICAgICAgcmV0dXJuIGgoXG4gICAgICAgICAgICBwcm9wcy50YWcsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYXR0cnM6IHtcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogcHJvcHMudG9cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uOiB7XG4gICAgICAgICAgICAgICAgICAgIGNsaWNrKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LiRyb3V0ZXIuZ28ocHJvcHMudG8pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2hpbGRyZW5cbiAgICAgICAgKVxuICAgIH1cbn0iLCJpbXBvcnQgVmlldyBmcm9tICcuL2NvbXBvbmVudHMvdmlldydcbmltcG9ydCBMaW5rIGZyb20gJy4vY29tcG9uZW50cy9saW5rJ1xuXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFsbChWdWUpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoVnVlLnByb3RvdHlwZSwgJyRyb3V0ZXInLCB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLiRyb290Ll9yb3V0ZXJcbiAgICAgICAgfVxuICAgIH0pXG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoVnVlLnByb3RvdHlwZSwgJyRyb3V0ZScsIHtcbiAgICAgICAgZ2V0ICgpIHsgcmV0dXJuIHRoaXMuJHJvb3QuX3JvdXRlIH1cbiAgICB9KVxuICAgIC8qKlxuICAgICAqIOmcgOimgeWcqHZ1ZSAkb3B0aW9uc+S4reazqOWFpXJvdXRlcueahOWOn+WboFxuICAgICAqICAtIOagh+iusCByb290Q29tcG9uZW50XG4gICAgICogIC0g5oyC6L29IF9yb3V0ZSAg6Kem5Y+RIHJvdXRlci12aWV35pu05pawXG4gICAgICovXG4gICAgXG4gICAgVnVlLm1peGluKHtcbiAgICAgICAgYmVmb3JlQ3JlYXRlKCkge1xuICAgICAgICAgICAgaWYodGhpcy4kb3B0aW9ucy5yb3V0ZXIpIHsgLy8gcm9vdOe7hOS7tuaciSByb290ZXLpgInnur9cbiAgICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIgPSB0aGlzLiRvcHRpb25zLnJvdXRlclxuICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5yb290Q29tcG9uZW50ID0gdGhpc1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFxuICAgICAgICAgICAgICAgICAqIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQ6IGZvcm1hdE1hdGNoKG1hcFtyb3V0ZV0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBWdWUudXRpbC5kZWZpbmVSZWFjdGl2ZSh0aGlzLCAnX3JvdXRlJywgdGhpcy5fcm91dGVyLm1hdGNoKCcvJykpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KVxuICAgIFZ1ZS5jb21wb25lbnQoJ3JvdXRlci12aWV3JywgVmlldylcbiAgICBWdWUuY29tcG9uZW50KCdyb3V0ZXItbGluaycsIExpbmspXG59IiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwidmFyIGlzYXJyYXkgPSByZXF1aXJlKCdpc2FycmF5JylcblxuLyoqXG4gKiBFeHBvc2UgYHBhdGhUb1JlZ2V4cGAuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gcGF0aFRvUmVnZXhwXG5tb2R1bGUuZXhwb3J0cy5wYXJzZSA9IHBhcnNlXG5tb2R1bGUuZXhwb3J0cy5jb21waWxlID0gY29tcGlsZVxubW9kdWxlLmV4cG9ydHMudG9rZW5zVG9GdW5jdGlvbiA9IHRva2Vuc1RvRnVuY3Rpb25cbm1vZHVsZS5leHBvcnRzLnRva2Vuc1RvUmVnRXhwID0gdG9rZW5zVG9SZWdFeHBcblxuLyoqXG4gKiBUaGUgbWFpbiBwYXRoIG1hdGNoaW5nIHJlZ2V4cCB1dGlsaXR5LlxuICpcbiAqIEB0eXBlIHtSZWdFeHB9XG4gKi9cbnZhciBQQVRIX1JFR0VYUCA9IG5ldyBSZWdFeHAoW1xuICAvLyBNYXRjaCBlc2NhcGVkIGNoYXJhY3RlcnMgdGhhdCB3b3VsZCBvdGhlcndpc2UgYXBwZWFyIGluIGZ1dHVyZSBtYXRjaGVzLlxuICAvLyBUaGlzIGFsbG93cyB0aGUgdXNlciB0byBlc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzIHRoYXQgd29uJ3QgdHJhbnNmb3JtLlxuICAnKFxcXFxcXFxcLiknLFxuICAvLyBNYXRjaCBFeHByZXNzLXN0eWxlIHBhcmFtZXRlcnMgYW5kIHVuLW5hbWVkIHBhcmFtZXRlcnMgd2l0aCBhIHByZWZpeFxuICAvLyBhbmQgb3B0aW9uYWwgc3VmZml4ZXMuIE1hdGNoZXMgYXBwZWFyIGFzOlxuICAvL1xuICAvLyBcIi86dGVzdChcXFxcZCspP1wiID0+IFtcIi9cIiwgXCJ0ZXN0XCIsIFwiXFxkK1wiLCB1bmRlZmluZWQsIFwiP1wiLCB1bmRlZmluZWRdXG4gIC8vIFwiL3JvdXRlKFxcXFxkKylcIiAgPT4gW3VuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIFwiXFxkK1wiLCB1bmRlZmluZWQsIHVuZGVmaW5lZF1cbiAgLy8gXCIvKlwiICAgICAgICAgICAgPT4gW1wiL1wiLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIFwiKlwiXVxuICAnKFtcXFxcLy5dKT8oPzooPzpcXFxcOihcXFxcdyspKD86XFxcXCgoKD86XFxcXFxcXFwufFteXFxcXFxcXFwoKV0pKylcXFxcKSk/fFxcXFwoKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcKCldKSspXFxcXCkpKFsrKj9dKT98KFxcXFwqKSknXG5dLmpvaW4oJ3wnKSwgJ2cnKVxuXG4vKipcbiAqIFBhcnNlIGEgc3RyaW5nIGZvciB0aGUgcmF3IHRva2Vucy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICBzdHJcbiAqIEBwYXJhbSAge09iamVjdD19IG9wdGlvbnNcbiAqIEByZXR1cm4geyFBcnJheX1cbiAqL1xuZnVuY3Rpb24gcGFyc2UgKHN0ciwgb3B0aW9ucykge1xuICB2YXIgdG9rZW5zID0gW11cbiAgdmFyIGtleSA9IDBcbiAgdmFyIGluZGV4ID0gMFxuICB2YXIgcGF0aCA9ICcnXG4gIHZhciBkZWZhdWx0RGVsaW1pdGVyID0gb3B0aW9ucyAmJiBvcHRpb25zLmRlbGltaXRlciB8fCAnLydcbiAgdmFyIHJlc1xuXG4gIHdoaWxlICgocmVzID0gUEFUSF9SRUdFWFAuZXhlYyhzdHIpKSAhPSBudWxsKSB7XG4gICAgdmFyIG0gPSByZXNbMF1cbiAgICB2YXIgZXNjYXBlZCA9IHJlc1sxXVxuICAgIHZhciBvZmZzZXQgPSByZXMuaW5kZXhcbiAgICBwYXRoICs9IHN0ci5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgIGluZGV4ID0gb2Zmc2V0ICsgbS5sZW5ndGhcblxuICAgIC8vIElnbm9yZSBhbHJlYWR5IGVzY2FwZWQgc2VxdWVuY2VzLlxuICAgIGlmIChlc2NhcGVkKSB7XG4gICAgICBwYXRoICs9IGVzY2FwZWRbMV1cbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgdmFyIG5leHQgPSBzdHJbaW5kZXhdXG4gICAgdmFyIHByZWZpeCA9IHJlc1syXVxuICAgIHZhciBuYW1lID0gcmVzWzNdXG4gICAgdmFyIGNhcHR1cmUgPSByZXNbNF1cbiAgICB2YXIgZ3JvdXAgPSByZXNbNV1cbiAgICB2YXIgbW9kaWZpZXIgPSByZXNbNl1cbiAgICB2YXIgYXN0ZXJpc2sgPSByZXNbN11cblxuICAgIC8vIFB1c2ggdGhlIGN1cnJlbnQgcGF0aCBvbnRvIHRoZSB0b2tlbnMuXG4gICAgaWYgKHBhdGgpIHtcbiAgICAgIHRva2Vucy5wdXNoKHBhdGgpXG4gICAgICBwYXRoID0gJydcbiAgICB9XG5cbiAgICB2YXIgcGFydGlhbCA9IHByZWZpeCAhPSBudWxsICYmIG5leHQgIT0gbnVsbCAmJiBuZXh0ICE9PSBwcmVmaXhcbiAgICB2YXIgcmVwZWF0ID0gbW9kaWZpZXIgPT09ICcrJyB8fCBtb2RpZmllciA9PT0gJyonXG4gICAgdmFyIG9wdGlvbmFsID0gbW9kaWZpZXIgPT09ICc/JyB8fCBtb2RpZmllciA9PT0gJyonXG4gICAgdmFyIGRlbGltaXRlciA9IHJlc1syXSB8fCBkZWZhdWx0RGVsaW1pdGVyXG4gICAgdmFyIHBhdHRlcm4gPSBjYXB0dXJlIHx8IGdyb3VwXG5cbiAgICB0b2tlbnMucHVzaCh7XG4gICAgICBuYW1lOiBuYW1lIHx8IGtleSsrLFxuICAgICAgcHJlZml4OiBwcmVmaXggfHwgJycsXG4gICAgICBkZWxpbWl0ZXI6IGRlbGltaXRlcixcbiAgICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICAgIHJlcGVhdDogcmVwZWF0LFxuICAgICAgcGFydGlhbDogcGFydGlhbCxcbiAgICAgIGFzdGVyaXNrOiAhIWFzdGVyaXNrLFxuICAgICAgcGF0dGVybjogcGF0dGVybiA/IGVzY2FwZUdyb3VwKHBhdHRlcm4pIDogKGFzdGVyaXNrID8gJy4qJyA6ICdbXicgKyBlc2NhcGVTdHJpbmcoZGVsaW1pdGVyKSArICddKz8nKVxuICAgIH0pXG4gIH1cblxuICAvLyBNYXRjaCBhbnkgY2hhcmFjdGVycyBzdGlsbCByZW1haW5pbmcuXG4gIGlmIChpbmRleCA8IHN0ci5sZW5ndGgpIHtcbiAgICBwYXRoICs9IHN0ci5zdWJzdHIoaW5kZXgpXG4gIH1cblxuICAvLyBJZiB0aGUgcGF0aCBleGlzdHMsIHB1c2ggaXQgb250byB0aGUgZW5kLlxuICBpZiAocGF0aCkge1xuICAgIHRva2Vucy5wdXNoKHBhdGgpXG4gIH1cblxuICByZXR1cm4gdG9rZW5zXG59XG5cbi8qKlxuICogQ29tcGlsZSBhIHN0cmluZyB0byBhIHRlbXBsYXRlIGZ1bmN0aW9uIGZvciB0aGUgcGF0aC5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgIHN0clxuICogQHBhcmFtICB7T2JqZWN0PX0gICAgICAgICAgICBvcHRpb25zXG4gKiBAcmV0dXJuIHshZnVuY3Rpb24oT2JqZWN0PSwgT2JqZWN0PSl9XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGUgKHN0ciwgb3B0aW9ucykge1xuICByZXR1cm4gdG9rZW5zVG9GdW5jdGlvbihwYXJzZShzdHIsIG9wdGlvbnMpLCBvcHRpb25zKVxufVxuXG4vKipcbiAqIFByZXR0aWVyIGVuY29kaW5nIG9mIFVSSSBwYXRoIHNlZ21lbnRzLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ31cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZW5jb2RlVVJJQ29tcG9uZW50UHJldHR5IChzdHIpIHtcbiAgcmV0dXJuIGVuY29kZVVSSShzdHIpLnJlcGxhY2UoL1tcXC8/I10vZywgZnVuY3Rpb24gKGMpIHtcbiAgICByZXR1cm4gJyUnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gIH0pXG59XG5cbi8qKlxuICogRW5jb2RlIHRoZSBhc3RlcmlzayBwYXJhbWV0ZXIuIFNpbWlsYXIgdG8gYHByZXR0eWAsIGJ1dCBhbGxvd3Mgc2xhc2hlcy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVuY29kZUFzdGVyaXNrIChzdHIpIHtcbiAgcmV0dXJuIGVuY29kZVVSSShzdHIpLnJlcGxhY2UoL1s/I10vZywgZnVuY3Rpb24gKGMpIHtcbiAgICByZXR1cm4gJyUnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpXG4gIH0pXG59XG5cbi8qKlxuICogRXhwb3NlIGEgbWV0aG9kIGZvciB0cmFuc2Zvcm1pbmcgdG9rZW5zIGludG8gdGhlIHBhdGggZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvRnVuY3Rpb24gKHRva2Vucywgb3B0aW9ucykge1xuICAvLyBDb21waWxlIGFsbCB0aGUgdG9rZW5zIGludG8gcmVnZXhwcy5cbiAgdmFyIG1hdGNoZXMgPSBuZXcgQXJyYXkodG9rZW5zLmxlbmd0aClcblxuICAvLyBDb21waWxlIGFsbCB0aGUgcGF0dGVybnMgYmVmb3JlIGNvbXBpbGF0aW9uLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0eXBlb2YgdG9rZW5zW2ldID09PSAnb2JqZWN0Jykge1xuICAgICAgbWF0Y2hlc1tpXSA9IG5ldyBSZWdFeHAoJ14oPzonICsgdG9rZW5zW2ldLnBhdHRlcm4gKyAnKSQnLCBmbGFncyhvcHRpb25zKSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgb3B0cykge1xuICAgIHZhciBwYXRoID0gJydcbiAgICB2YXIgZGF0YSA9IG9iaiB8fCB7fVxuICAgIHZhciBvcHRpb25zID0gb3B0cyB8fCB7fVxuICAgIHZhciBlbmNvZGUgPSBvcHRpb25zLnByZXR0eSA/IGVuY29kZVVSSUNvbXBvbmVudFByZXR0eSA6IGVuY29kZVVSSUNvbXBvbmVudFxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuXG4gICAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgICBwYXRoICs9IHRva2VuXG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgdmFyIHZhbHVlID0gZGF0YVt0b2tlbi5uYW1lXVxuICAgICAgdmFyIHNlZ21lbnRcblxuICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgaWYgKHRva2VuLm9wdGlvbmFsKSB7XG4gICAgICAgICAgLy8gUHJlcGVuZCBwYXJ0aWFsIHNlZ21lbnQgcHJlZml4ZXMuXG4gICAgICAgICAgaWYgKHRva2VuLnBhcnRpYWwpIHtcbiAgICAgICAgICAgIHBhdGggKz0gdG9rZW4ucHJlZml4XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIGJlIGRlZmluZWQnKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpc2FycmF5KHZhbHVlKSkge1xuICAgICAgICBpZiAoIXRva2VuLnJlcGVhdCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbm90IHJlcGVhdCwgYnV0IHJlY2VpdmVkIGAnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpICsgJ2AnKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgYmUgZW1wdHknKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBzZWdtZW50ID0gZW5jb2RlKHZhbHVlW2pdKVxuXG4gICAgICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGFsbCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBgJyArIEpTT04uc3RyaW5naWZ5KHNlZ21lbnQpICsgJ2AnKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhdGggKz0gKGogPT09IDAgPyB0b2tlbi5wcmVmaXggOiB0b2tlbi5kZWxpbWl0ZXIpICsgc2VnbWVudFxuICAgICAgICB9XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgc2VnbWVudCA9IHRva2VuLmFzdGVyaXNrID8gZW5jb2RlQXN0ZXJpc2sodmFsdWUpIDogZW5jb2RlKHZhbHVlKVxuXG4gICAgICBpZiAoIW1hdGNoZXNbaV0udGVzdChzZWdtZW50KSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBcIicgKyBzZWdtZW50ICsgJ1wiJylcbiAgICAgIH1cblxuICAgICAgcGF0aCArPSB0b2tlbi5wcmVmaXggKyBzZWdtZW50XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGhcbiAgfVxufVxuXG4vKipcbiAqIEVzY2FwZSBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBzdHJpbmcuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlU3RyaW5nIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWy4rKj89XiE6JHt9KClbXFxdfFxcL1xcXFxdKS9nLCAnXFxcXCQxJylcbn1cblxuLyoqXG4gKiBFc2NhcGUgdGhlIGNhcHR1cmluZyBncm91cCBieSBlc2NhcGluZyBzcGVjaWFsIGNoYXJhY3RlcnMgYW5kIG1lYW5pbmcuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBncm91cFxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVHcm91cCAoZ3JvdXApIHtcbiAgcmV0dXJuIGdyb3VwLnJlcGxhY2UoLyhbPSE6JFxcLygpXSkvZywgJ1xcXFwkMScpXG59XG5cbi8qKlxuICogQXR0YWNoIHRoZSBrZXlzIGFzIGEgcHJvcGVydHkgb2YgdGhlIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshUmVnRXhwfSByZVxuICogQHBhcmFtICB7QXJyYXl9ICAga2V5c1xuICogQHJldHVybiB7IVJlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gYXR0YWNoS2V5cyAocmUsIGtleXMpIHtcbiAgcmUua2V5cyA9IGtleXNcbiAgcmV0dXJuIHJlXG59XG5cbi8qKlxuICogR2V0IHRoZSBmbGFncyBmb3IgYSByZWdleHAgZnJvbSB0aGUgb3B0aW9ucy5cbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZmxhZ3MgKG9wdGlvbnMpIHtcbiAgcmV0dXJuIG9wdGlvbnMgJiYgb3B0aW9ucy5zZW5zaXRpdmUgPyAnJyA6ICdpJ1xufVxuXG4vKipcbiAqIFB1bGwgb3V0IGtleXMgZnJvbSBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshUmVnRXhwfSBwYXRoXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiByZWdleHBUb1JlZ2V4cCAocGF0aCwga2V5cykge1xuICAvLyBVc2UgYSBuZWdhdGl2ZSBsb29rYWhlYWQgdG8gbWF0Y2ggb25seSBjYXB0dXJpbmcgZ3JvdXBzLlxuICB2YXIgZ3JvdXBzID0gcGF0aC5zb3VyY2UubWF0Y2goL1xcKCg/IVxcPykvZylcblxuICBpZiAoZ3JvdXBzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleXMucHVzaCh7XG4gICAgICAgIG5hbWU6IGksXG4gICAgICAgIHByZWZpeDogbnVsbCxcbiAgICAgICAgZGVsaW1pdGVyOiBudWxsLFxuICAgICAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgICAgIHJlcGVhdDogZmFsc2UsXG4gICAgICAgIHBhcnRpYWw6IGZhbHNlLFxuICAgICAgICBhc3RlcmlzazogZmFsc2UsXG4gICAgICAgIHBhdHRlcm46IG51bGxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocGF0aCwga2V5cylcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm0gYW4gYXJyYXkgaW50byBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gICBrZXlzXG4gKiBAcGFyYW0gIHshT2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBhcnJheVRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIHZhciBwYXJ0cyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgcGFydHMucHVzaChwYXRoVG9SZWdleHAocGF0aFtpXSwga2V5cywgb3B0aW9ucykuc291cmNlKVxuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJyg/OicgKyBwYXJ0cy5qb2luKCd8JykgKyAnKScsIGZsYWdzKG9wdGlvbnMpKVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKHJlZ2V4cCwga2V5cylcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBwYXRoIHJlZ2V4cCBmcm9tIHN0cmluZyBpbnB1dC5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICBwYXRoXG4gKiBAcGFyYW0gIHshQXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHshT2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiBzdHJpbmdUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICByZXR1cm4gdG9rZW5zVG9SZWdFeHAocGFyc2UocGF0aCwgb3B0aW9ucyksIGtleXMsIG9wdGlvbnMpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgZnVuY3Rpb24gZm9yIHRha2luZyB0b2tlbnMgYW5kIHJldHVybmluZyBhIFJlZ0V4cC5cbiAqXG4gKiBAcGFyYW0gIHshQXJyYXl9ICAgICAgICAgIHRva2Vuc1xuICogQHBhcmFtICB7KEFycmF5fE9iamVjdCk9fSBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3Q9fSAgICAgICAgIG9wdGlvbnNcbiAqIEByZXR1cm4geyFSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvUmVnRXhwICh0b2tlbnMsIGtleXMsIG9wdGlvbnMpIHtcbiAgaWYgKCFpc2FycmF5KGtleXMpKSB7XG4gICAgb3B0aW9ucyA9IC8qKiBAdHlwZSB7IU9iamVjdH0gKi8gKGtleXMgfHwgb3B0aW9ucylcbiAgICBrZXlzID0gW11cbiAgfVxuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG5cbiAgdmFyIHN0cmljdCA9IG9wdGlvbnMuc3RyaWN0XG4gIHZhciBlbmQgPSBvcHRpb25zLmVuZCAhPT0gZmFsc2VcbiAgdmFyIHJvdXRlID0gJydcblxuICAvLyBJdGVyYXRlIG92ZXIgdGhlIHRva2VucyBhbmQgY3JlYXRlIG91ciByZWdleHAgc3RyaW5nLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuXG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJvdXRlICs9IGVzY2FwZVN0cmluZyh0b2tlbilcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHByZWZpeCA9IGVzY2FwZVN0cmluZyh0b2tlbi5wcmVmaXgpXG4gICAgICB2YXIgY2FwdHVyZSA9ICcoPzonICsgdG9rZW4ucGF0dGVybiArICcpJ1xuXG4gICAgICBrZXlzLnB1c2godG9rZW4pXG5cbiAgICAgIGlmICh0b2tlbi5yZXBlYXQpIHtcbiAgICAgICAgY2FwdHVyZSArPSAnKD86JyArIHByZWZpeCArIGNhcHR1cmUgKyAnKSonXG4gICAgICB9XG5cbiAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICBpZiAoIXRva2VuLnBhcnRpYWwpIHtcbiAgICAgICAgICBjYXB0dXJlID0gJyg/OicgKyBwcmVmaXggKyAnKCcgKyBjYXB0dXJlICsgJykpPydcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYXB0dXJlID0gcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpPydcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FwdHVyZSA9IHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKSdcbiAgICAgIH1cblxuICAgICAgcm91dGUgKz0gY2FwdHVyZVxuICAgIH1cbiAgfVxuXG4gIHZhciBkZWxpbWl0ZXIgPSBlc2NhcGVTdHJpbmcob3B0aW9ucy5kZWxpbWl0ZXIgfHwgJy8nKVxuICB2YXIgZW5kc1dpdGhEZWxpbWl0ZXIgPSByb3V0ZS5zbGljZSgtZGVsaW1pdGVyLmxlbmd0aCkgPT09IGRlbGltaXRlclxuXG4gIC8vIEluIG5vbi1zdHJpY3QgbW9kZSB3ZSBhbGxvdyBhIHNsYXNoIGF0IHRoZSBlbmQgb2YgbWF0Y2guIElmIHRoZSBwYXRoIHRvXG4gIC8vIG1hdGNoIGFscmVhZHkgZW5kcyB3aXRoIGEgc2xhc2gsIHdlIHJlbW92ZSBpdCBmb3IgY29uc2lzdGVuY3kuIFRoZSBzbGFzaFxuICAvLyBpcyB2YWxpZCBhdCB0aGUgZW5kIG9mIGEgcGF0aCBtYXRjaCwgbm90IGluIHRoZSBtaWRkbGUuIFRoaXMgaXMgaW1wb3J0YW50XG4gIC8vIGluIG5vbi1lbmRpbmcgbW9kZSwgd2hlcmUgXCIvdGVzdC9cIiBzaG91bGRuJ3QgbWF0Y2ggXCIvdGVzdC8vcm91dGVcIi5cbiAgaWYgKCFzdHJpY3QpIHtcbiAgICByb3V0ZSA9IChlbmRzV2l0aERlbGltaXRlciA/IHJvdXRlLnNsaWNlKDAsIC1kZWxpbWl0ZXIubGVuZ3RoKSA6IHJvdXRlKSArICcoPzonICsgZGVsaW1pdGVyICsgJyg/PSQpKT8nXG4gIH1cblxuICBpZiAoZW5kKSB7XG4gICAgcm91dGUgKz0gJyQnXG4gIH0gZWxzZSB7XG4gICAgLy8gSW4gbm9uLWVuZGluZyBtb2RlLCB3ZSBuZWVkIHRoZSBjYXB0dXJpbmcgZ3JvdXBzIHRvIG1hdGNoIGFzIG11Y2ggYXNcbiAgICAvLyBwb3NzaWJsZSBieSB1c2luZyBhIHBvc2l0aXZlIGxvb2thaGVhZCB0byB0aGUgZW5kIG9yIG5leHQgcGF0aCBzZWdtZW50LlxuICAgIHJvdXRlICs9IHN0cmljdCAmJiBlbmRzV2l0aERlbGltaXRlciA/ICcnIDogJyg/PScgKyBkZWxpbWl0ZXIgKyAnfCQpJ1xuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMobmV3IFJlZ0V4cCgnXicgKyByb3V0ZSwgZmxhZ3Mob3B0aW9ucykpLCBrZXlzKVxufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgZ2l2ZW4gcGF0aCBzdHJpbmcsIHJldHVybmluZyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBBbiBlbXB0eSBhcnJheSBjYW4gYmUgcGFzc2VkIGluIGZvciB0aGUga2V5cywgd2hpY2ggd2lsbCBob2xkIHRoZVxuICogcGxhY2Vob2xkZXIga2V5IGRlc2NyaXB0aW9ucy4gRm9yIGV4YW1wbGUsIHVzaW5nIGAvdXNlci86aWRgLCBga2V5c2Agd2lsbFxuICogY29udGFpbiBgW3sgbmFtZTogJ2lkJywgZGVsaW1pdGVyOiAnLycsIG9wdGlvbmFsOiBmYWxzZSwgcmVwZWF0OiBmYWxzZSB9XWAuXG4gKlxuICogQHBhcmFtICB7KHN0cmluZ3xSZWdFeHB8QXJyYXkpfSBwYXRoXG4gKiBAcGFyYW0gIHsoQXJyYXl8T2JqZWN0KT19ICAgICAgIGtleXNcbiAqIEBwYXJhbSAge09iamVjdD19ICAgICAgICAgICAgICAgb3B0aW9uc1xuICogQHJldHVybiB7IVJlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gcGF0aFRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIGlmICghaXNhcnJheShrZXlzKSkge1xuICAgIG9wdGlvbnMgPSAvKiogQHR5cGUgeyFPYmplY3R9ICovIChrZXlzIHx8IG9wdGlvbnMpXG4gICAga2V5cyA9IFtdXG4gIH1cblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG4gIGlmIChwYXRoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgcmV0dXJuIHJlZ2V4cFRvUmVnZXhwKHBhdGgsIC8qKiBAdHlwZSB7IUFycmF5fSAqLyAoa2V5cykpXG4gIH1cblxuICBpZiAoaXNhcnJheShwYXRoKSkge1xuICAgIHJldHVybiBhcnJheVRvUmVnZXhwKC8qKiBAdHlwZSB7IUFycmF5fSAqLyAocGF0aCksIC8qKiBAdHlwZSB7IUFycmF5fSAqLyAoa2V5cyksIG9wdGlvbnMpXG4gIH1cblxuICByZXR1cm4gc3RyaW5nVG9SZWdleHAoLyoqIEB0eXBlIHtzdHJpbmd9ICovIChwYXRoKSwgLyoqIEB0eXBlIHshQXJyYXl9ICovIChrZXlzKSwgb3B0aW9ucylcbn1cbiIsImltcG9ydCBSZWdleHAgZnJvbSAncGF0aC10by1yZWdleHAnXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNYXRjaGVyIChyb3V0ZXMpIHtcbiAgLyoqXG4gICAqIHtcbiAgICogIG5vcm1hbGl6ZWRQYXRoOiByZWNvcmRcbiAgICogfVxuICAgKi9cbiAgY29uc3QgbWFwID0ge31cbiAgcm91dGVzLmZvckVhY2gociA9PiBhZGRSb3V0ZShtYXAsIHIpKVxuXG4gIHJldHVybiBmdW5jdGlvbiBtYXRjaCAoZnVsbFBhdGgpIHtcbiAgICBjb25zdCB7IHBhdGgsIHF1ZXJ5IH0gPSBleHRyYWN0UXVlcnkoZnVsbFBhdGgpXG4gICAgY29uc3QgcGFyYW1zID0ge31cbiAgICBmb3IgKGNvbnN0IHJvdXRlIGluIG1hcCkge1xuICAgICAgaWYgKG1hdGNoUm91dGUocm91dGUsIHBhcmFtcywgcGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUoe1xuICAgICAgICAgIHBhcmFtcyxcbiAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICBtYXRjaGVkOiBmb3JtYXRNYXRjaChtYXBbcm91dGVdKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRSb3V0ZSAobWFwLCByb3V0ZSwgcGFyZW50KSB7XG4gIGNvbnN0IHsgcGF0aCwgY29tcG9uZW50LCBjb21wb25lbnRzLCBtZXRhLCBjaGlsZHJlbiB9ID0gcm91dGVcbiAgY29uc3QgcmVjb3JkID0ge1xuICAgIHBhdGg6IG5vcm1hbGl6ZVJvdXRlKHBhdGgsIHBhcmVudCksXG4gICAgY29tcG9uZW50czogY29tcG9uZW50cyB8fCB7IGRlZmF1bHQ6IGNvbXBvbmVudCB9LFxuICAgIHBhcmVudCxcbiAgICBtZXRhXG4gIH1cbiAgaWYgKGNoaWxkcmVuKSB7XG4gICAgY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiBhZGRSb3V0ZShtYXAsIGNoaWxkLCByZWNvcmQpKVxuICB9XG4gIG1hcFtyZWNvcmQucGF0aF0gPSByZWNvcmRcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplUm91dGUgKHBhdGgsIHBhcmVudCkge1xuICBpZiAocGF0aFswXSA9PSAnLycpIHJldHVybiBwYXRoICAvLyBcIi9cIiBzaWduaWZpZXMgYW4gYWJzb2x1dGUgcm91dGVcbiAgaWYgKHBhcmVudCA9PSBudWxsKSByZXR1cm4gcGF0aCAgLy8gbm8gbmVlZCBmb3IgYSBqb2luXG4gIHJldHVybiBgJHtwYXJlbnQucGF0aH0vJHtwYXRofWAucmVwbGFjZSgvXFwvXFwvL2csICcvJykgLy8gam9pblxufVxuXG4vKipcbiAqIHtrZXkgb2YgbWFwfSBwYXRoXG4gKiB7b2JqZWN0ID0ge319IHBhcmFtc1xuICoge2Z1bGxwYXRoLnBhdGh9IHBhdGhuYW1lXG4gKi9cbmZ1bmN0aW9uIG1hdGNoUm91dGUgKHBhdGgsIHBhcmFtcywgcGF0aG5hbWUpIHtcbiAgY29uc3Qga2V5cyA9IFtdXG4gIGNvbnN0IHJlZ2V4cCA9IFJlZ2V4cChwYXRoLCBrZXlzKVxuICBjb25zdCBtID0gcmVnZXhwLmV4ZWMocGF0aG5hbWUpXG4gIGlmICghbSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9IGVsc2UgaWYgKCFwYXJhbXMpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IG0ubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpIC0gMV1cbiAgICB2YXIgdmFsID0gJ3N0cmluZycgPT0gdHlwZW9mIG1baV0gPyBkZWNvZGVVUklDb21wb25lbnQobVtpXSkgOiBtW2ldXG4gICAgaWYgKGtleSkgcGFyYW1zW2tleS5uYW1lXSA9IHZhbFxuICB9XG5cbiAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gZXh0cmFjdFF1ZXJ5IChwYXRoKSB7XG4gIGNvbnN0IGluZGV4ID0gcGF0aC5pbmRleE9mKCc/JylcbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIHJldHVybiB7XG4gICAgICBwYXRoOiBwYXRoLnNsaWNlKDAsIGluZGV4KSxcbiAgICAgIHF1ZXJ5OiBwYXJzZVF1ZXJ5KHBhdGguc2xpY2UoaW5kZXggKyAxKSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHsgcGF0aCB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyc2VRdWVyeSAocXVlcnkpIHtcbiAgY29uc3QgcmVzID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuXG4gIHF1ZXJ5ID0gcXVlcnkudHJpbSgpLnJlcGxhY2UoL14oXFw/fCN8JikvLCAnJylcblxuICBpZiAoIXF1ZXJ5KSB7XG4gICAgcmV0dXJuIHJlc1xuICB9XG5cbiAgcXVlcnkuc3BsaXQoJyYnKS5mb3JFYWNoKHBhcmFtID0+IHtcbiAgICBjb25zdCBwYXJ0cyA9IHBhcmFtLnJlcGxhY2UoL1xcKy9nLCAnICcpLnNwbGl0KCc9JylcbiAgICBjb25zdCBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQocGFydHMuc2hpZnQoKSlcbiAgICBjb25zdCB2YWwgPSBwYXJ0cy5sZW5ndGggPiAwXG4gICAgICA/IGRlY29kZVVSSUNvbXBvbmVudChwYXJ0cy5qb2luKCc9JykpXG4gICAgICA6IG51bGxcblxuICAgIGlmIChyZXNba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXNba2V5XSA9IHZhbFxuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXNba2V5XSkpIHtcbiAgICAgIHJlc1trZXldLnB1c2godmFsKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXNba2V5XSA9IFtyZXNba2V5XSwgdmFsXVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGZvcm1hdE1hdGNoIChyZWNvcmQpIHtcbiAgY29uc3QgcmVzID0gW11cbiAgd2hpbGUgKHJlY29yZCkge1xuICAgIHJlcy51bnNoaWZ0KHJlY29yZClcbiAgICByZWNvcmQgPSByZWNvcmQucGFyZW50XG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuIiwiZXhwb3J0IGNsYXNzIEhhc2hIaXN0b3J5IHtcblxufVxuIiwiZXhwb3J0IGNsYXNzIEhUTUw1SGlzdG9yeSB7XG5cbn1cbiIsImV4cG9ydCBjbGFzcyBBYnN0cmFjdEhpc3Rvcnkge1xuXG59XG4iLCJpbXBvcnQgeyBpbnN0YWxsIH0gZnJvbSAnLi9pbnN0YWxsJ1xuaW1wb3J0IHsgY3JlYXRlTWF0Y2hlciB9IGZyb20gJy4vbWF0Y2gnXG5pbXBvcnQgeyBIYXNoSGlzdG9yeSB9IGZyb20gJy4vaGlzdG9yeS9oYXNoJ1xuaW1wb3J0IHsgSFRNTDVIaXN0b3J5IH0gZnJvbSAnLi9oaXN0b3J5L2h0bWw1J1xuaW1wb3J0IHsgQWJzdHJhY3RIaXN0b3J5IH0gZnJvbSAnLi9oaXN0b3J5L2Fic3RyYWN0J1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWdWVSb3V0ZXIge1xuICBjb25zdHJ1Y3RvciAob3B0aW9ucyA9IHt9KSB7XG5cbiAgICAvLyDnrKzkuozmrKHmj5DkuqQgdHdlYWvlj6rmmK/kuqTmjaLkuoYgdGhpcy5fcm9vdCDlkowgdGhpcy5fbW9kZSA/IOaaguS4jeefpeS4uuWVpVxuICAgIHRoaXMuX3Jvb3QgPSBvcHRpb25zLnJvb3QgfHwgJy8nXG4gICAgdGhpcy5fbW9kZSA9IG9wdGlvbnMubW9kZSB8fCAnaGFzaCdcbiAgICB0aGlzLnJvb3RDb21wb25lbnQgPSBudWxsXG4gICAgdGhpcy5tYXRjaCA9IGNyZWF0ZU1hdGNoZXIob3B0aW9ucy5yb3V0ZXMgfHwgW10pXG5cbiAgICBzd2l0Y2ggKHRoaXMuX21vZGUpIHtcbiAgICAgIGNhc2UgJ2hhc2gnOlxuICAgICAgICB0aGlzLmhpc3RvcnkgPSBuZXcgSGFzaEhpc3RvcnkoKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnaHRtbDUnOlxuICAgICAgICB0aGlzLmhpc3RvcnkgPSBuZXcgSFRNTDVIaXN0b3J5KClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Fic3RyYWN0JzpcbiAgICAgICAgdGhpcy5oaXN0b3J5ID0gbmV3IEFic3RyYWN0SGlzdG9yeSgpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFt2dWUtcm91dGVyXSBpbnZhbGlkIG1vZGU6ICR7dGhpcy5fbW9kZX1gKVxuICAgIH1cbiAgfVxuICBnbyhwYXRoKSB7XG4gICAgdGhpcy5yb290Q29tcG9uZW50Ll9yb3V0ZSA9IHRoaXMubWF0Y2gocGF0aClcbiAgfVxufVxuXG5WdWVSb3V0ZXIuaW5zdGFsbCA9IGluc3RhbGxcblZ1ZVJvdXRlci5jcmVhdGVNYXRjaGVyID0gY3JlYXRlTWF0Y2hlclxuXG5cbmlmICh0eXBlb2YgVnVlICE9PSAndW5kZWZpbmVkJykge1xuXG4gIFZ1ZS51c2UoVnVlUm91dGVyKVxufVxuIl0sIm5hbWVzIjpbImNvbnN0IiwibGV0IiwiY29tbW9uanNIZWxwZXJzLmludGVyb3BEZWZhdWx0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxZQUFlO0tBQ1gsSUFBSSxFQUFFLGFBQWE7S0FDbkIsVUFBVSxFQUFFLElBQUk7S0FDaEIsS0FBSyxFQUFFO1NBQ0gsSUFBSSxFQUFFO2FBQ0YsSUFBSSxFQUFFLE1BQU07YUFDWixPQUFPLEVBQUUsU0FBUztVQUNyQjtNQUNKO0tBQ0QsTUFBTSxpQkFBQSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUU7U0FDZixJQUFNLEtBQUs7U0FBRSxJQUFBLFFBQVE7U0FBRSxJQUFBLE1BQU07U0FBRSxJQUFBLElBQUksZ0JBQS9CO1NBQ0osSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJO1NBQ3RCQSxJQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTTs7Ozs7Ozs7U0FRM0JBLElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7Ozs7U0FJdkVDLElBQUksS0FBSyxHQUFHLENBQUM7U0FDYkEsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO1NBQ3JCLE1BQU0sTUFBTSxFQUFFO2FBQ1YsSUFBSSxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtpQkFDaEQsS0FBSyxHQUFHO2NBQ1g7O2FBRUQsSUFBSSxNQUFN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