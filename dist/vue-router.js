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
	        var depth = 0

	        while(parent) {
	            if (parent.$vnode && parent.$vnode.data.routerView) {
	                depth = parent.$vnode.data.routerViewDepth + 1
	                break
	            }
	            parent = parent.$parent
	        }
	        data.routerView = true
	        data.routerViewDepth = depth

	        var matched = route.matched[depth]
	        var component =  matched && matched.components[props.name]
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21wb25lbnRzL3ZpZXcuanMiLCIuLi9zcmMvY29tcG9uZW50cy9saW5rLmpzIiwiLi4vc3JjL2luc3RhbGwuanMiLCIuLi9ub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cC9pbmRleC5qcyIsIi4uL3NyYy9tYXRjaC5qcyIsIi4uL3NyYy9oaXN0b3J5L2hhc2guanMiLCIuLi9zcmMvaGlzdG9yeS9odG1sNS5qcyIsIi4uL3NyYy9oaXN0b3J5L2Fic3RyYWN0LmpzIiwiLi4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IHtcbiAgICBuYW1lOiAncm91dGVyLXZpZXcnLFxuICAgIGZ1bmN0aW9uYWw6IHRydWUsXG4gICAgcHJvcHM6IHtcbiAgICAgICAgbmFtZToge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgZGVmYXVsdDogJ2RlZmF1bHQnXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlbmRlcihoLCB7IHByb3BzLCBjaGlsZHJlbiwgcGFyZW50LCBkYXRhIH0pIHtcbiAgICAgICAgY29uc3Qgcm91dGUgPSBwYXJlbnQuJHJvdXRlXG4gICAgICAgICAvLyDmoIforrAgcm91dGVyVmllIOexu+Wei1xuICAgICAgICBsZXQgZGVwdGggPSAwXG5cbiAgICAgICAgd2hpbGUocGFyZW50KSB7XG4gICAgICAgICAgICBpZiAocGFyZW50LiR2bm9kZSAmJiBwYXJlbnQuJHZub2RlLmRhdGEucm91dGVyVmlldykge1xuICAgICAgICAgICAgICAgIGRlcHRoID0gcGFyZW50LiR2bm9kZS5kYXRhLnJvdXRlclZpZXdEZXB0aCArIDFcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50LiRwYXJlbnRcbiAgICAgICAgfVxuICAgICAgICBkYXRhLnJvdXRlclZpZXcgPSB0cnVlXG4gICAgICAgIGRhdGEucm91dGVyVmlld0RlcHRoID0gZGVwdGhcblxuICAgICAgICBjb25zdCBtYXRjaGVkID0gcm91dGUubWF0Y2hlZFtkZXB0aF1cbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gIG1hdGNoZWQgJiYgbWF0Y2hlZC5jb21wb25lbnRzW3Byb3BzLm5hbWVdXG4gICAgICAgIHJldHVybiBoKFxuICAgICAgICAgICAgY29tcG9uZW50LFxuICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgIGNoaWxkcmVuXG4gICAgICAgIClcbiAgICB9XG59IiwiZXhwb3J0IGRlZmF1bHQge1xuICAgIGZ1bmN0aW9uYWw6IHRydWUsXG4gICAgbmFtZTogJ3JvdXRlci1saW5rJyxcbiAgICBwcm9wczoge1xuICAgICAgICB0bzoge1xuICAgICAgICAgICAgdHlwZTogW1N0cmluZywgT2JqZWN0XSxcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICdhJ1xuICAgICAgICB9XG4gICAgfSxcbiAgICByZW5kZXIoaCwgeyBwcm9wcywgcGFyZW50LCBjaGlsZHJlbiB9KSB7XG4gICAgICAgIHJldHVybiBoKFxuICAgICAgICAgICAgcHJvcHMudGFnLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGF0dHJzOiB7XG4gICAgICAgICAgICAgICAgICAgIGhyZWY6IHByb3BzLnRvXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbjoge1xuICAgICAgICAgICAgICAgICAgICBjbGljayhlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC4kcm91dGVyLmdvKHByb3BzLnRvKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoaWxkcmVuXG4gICAgICAgIClcbiAgICB9XG59IiwiaW1wb3J0IFZpZXcgZnJvbSAnLi9jb21wb25lbnRzL3ZpZXcnXG5pbXBvcnQgTGluayBmcm9tICcuL2NvbXBvbmVudHMvbGluaydcblxuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGwoVnVlKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFZ1ZS5wcm90b3R5cGUsICckcm91dGVyJywge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy4kcm9vdC5fcm91dGVyXG4gICAgICAgIH1cbiAgICB9KVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFZ1ZS5wcm90b3R5cGUsICckcm91dGUnLCB7XG4gICAgICAgIGdldCAoKSB7IHJldHVybiB0aGlzLiRyb290Ll9yb3V0ZSB9XG4gICAgfSlcbiAgICAvKipcbiAgICAgKiDpnIDopoHlnKh2dWUgJG9wdGlvbnPkuK3ms6jlhaVyb3V0ZXLnmoTljp/lm6BcbiAgICAgKiAgLSDmoIforrAgcm9vdENvbXBvbmVudFxuICAgICAqICAtIOaMgui9vSBfcm91dGUgIOinpuWPkSByb3V0ZXItdmlld+abtOaWsFxuICAgICAqL1xuICAgIFxuICAgIFZ1ZS5taXhpbih7XG4gICAgICAgIGJlZm9yZUNyZWF0ZSgpIHtcbiAgICAgICAgICAgIGlmKHRoaXMuJG9wdGlvbnMucm91dGVyKSB7IC8vIHJvb3Tnu4Tku7bmnIkgcm9vdGVy6YCJ57q/XG4gICAgICAgICAgICAgICAgdGhpcy5fcm91dGVyID0gdGhpcy4kb3B0aW9ucy5yb3V0ZXJcbiAgICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIucm9vdENvbXBvbmVudCA9IHRoaXNcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBcbiAgICAgICAgICAgICAgICAgKiByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnksXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkOiBmb3JtYXRNYXRjaChtYXBbcm91dGVdKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgVnVlLnV0aWwuZGVmaW5lUmVhY3RpdmUodGhpcywgJ19yb3V0ZScsIHRoaXMuX3JvdXRlci5tYXRjaCgnLycpKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSlcbiAgICBWdWUuY29tcG9uZW50KCdyb3V0ZXItdmlldycsIFZpZXcpXG4gICAgVnVlLmNvbXBvbmVudCgncm91dGVyLWxpbmsnLCBMaW5rKVxufSIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXJyKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsInZhciBpc2FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpXG5cbi8qKlxuICogRXhwb3NlIGBwYXRoVG9SZWdleHBgLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGhUb1JlZ2V4cFxubW9kdWxlLmV4cG9ydHMucGFyc2UgPSBwYXJzZVxubW9kdWxlLmV4cG9ydHMuY29tcGlsZSA9IGNvbXBpbGVcbm1vZHVsZS5leHBvcnRzLnRva2Vuc1RvRnVuY3Rpb24gPSB0b2tlbnNUb0Z1bmN0aW9uXG5tb2R1bGUuZXhwb3J0cy50b2tlbnNUb1JlZ0V4cCA9IHRva2Vuc1RvUmVnRXhwXG5cbi8qKlxuICogVGhlIG1haW4gcGF0aCBtYXRjaGluZyByZWdleHAgdXRpbGl0eS5cbiAqXG4gKiBAdHlwZSB7UmVnRXhwfVxuICovXG52YXIgUEFUSF9SRUdFWFAgPSBuZXcgUmVnRXhwKFtcbiAgLy8gTWF0Y2ggZXNjYXBlZCBjaGFyYWN0ZXJzIHRoYXQgd291bGQgb3RoZXJ3aXNlIGFwcGVhciBpbiBmdXR1cmUgbWF0Y2hlcy5cbiAgLy8gVGhpcyBhbGxvd3MgdGhlIHVzZXIgdG8gZXNjYXBlIHNwZWNpYWwgY2hhcmFjdGVycyB0aGF0IHdvbid0IHRyYW5zZm9ybS5cbiAgJyhcXFxcXFxcXC4pJyxcbiAgLy8gTWF0Y2ggRXhwcmVzcy1zdHlsZSBwYXJhbWV0ZXJzIGFuZCB1bi1uYW1lZCBwYXJhbWV0ZXJzIHdpdGggYSBwcmVmaXhcbiAgLy8gYW5kIG9wdGlvbmFsIHN1ZmZpeGVzLiBNYXRjaGVzIGFwcGVhciBhczpcbiAgLy9cbiAgLy8gXCIvOnRlc3QoXFxcXGQrKT9cIiA9PiBbXCIvXCIsIFwidGVzdFwiLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCBcIj9cIiwgdW5kZWZpbmVkXVxuICAvLyBcIi9yb3V0ZShcXFxcZCspXCIgID0+IFt1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCB1bmRlZmluZWRdXG4gIC8vIFwiLypcIiAgICAgICAgICAgID0+IFtcIi9cIiwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIipcIl1cbiAgJyhbXFxcXC8uXSk/KD86KD86XFxcXDooXFxcXHcrKSg/OlxcXFwoKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcKCldKSspXFxcXCkpP3xcXFxcKCgoPzpcXFxcXFxcXC58W15cXFxcXFxcXCgpXSkrKVxcXFwpKShbKyo/XSk/fChcXFxcKikpJ1xuXS5qb2luKCd8JyksICdnJylcblxuLyoqXG4gKiBQYXJzZSBhIHN0cmluZyBmb3IgdGhlIHJhdyB0b2tlbnMuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSAgc3RyXG4gKiBAcGFyYW0gIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAcmV0dXJuIHshQXJyYXl9XG4gKi9cbmZ1bmN0aW9uIHBhcnNlIChzdHIsIG9wdGlvbnMpIHtcbiAgdmFyIHRva2VucyA9IFtdXG4gIHZhciBrZXkgPSAwXG4gIHZhciBpbmRleCA9IDBcbiAgdmFyIHBhdGggPSAnJ1xuICB2YXIgZGVmYXVsdERlbGltaXRlciA9IG9wdGlvbnMgJiYgb3B0aW9ucy5kZWxpbWl0ZXIgfHwgJy8nXG4gIHZhciByZXNcblxuICB3aGlsZSAoKHJlcyA9IFBBVEhfUkVHRVhQLmV4ZWMoc3RyKSkgIT0gbnVsbCkge1xuICAgIHZhciBtID0gcmVzWzBdXG4gICAgdmFyIGVzY2FwZWQgPSByZXNbMV1cbiAgICB2YXIgb2Zmc2V0ID0gcmVzLmluZGV4XG4gICAgcGF0aCArPSBzdHIuc2xpY2UoaW5kZXgsIG9mZnNldClcbiAgICBpbmRleCA9IG9mZnNldCArIG0ubGVuZ3RoXG5cbiAgICAvLyBJZ25vcmUgYWxyZWFkeSBlc2NhcGVkIHNlcXVlbmNlcy5cbiAgICBpZiAoZXNjYXBlZCkge1xuICAgICAgcGF0aCArPSBlc2NhcGVkWzFdXG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIHZhciBuZXh0ID0gc3RyW2luZGV4XVxuICAgIHZhciBwcmVmaXggPSByZXNbMl1cbiAgICB2YXIgbmFtZSA9IHJlc1szXVxuICAgIHZhciBjYXB0dXJlID0gcmVzWzRdXG4gICAgdmFyIGdyb3VwID0gcmVzWzVdXG4gICAgdmFyIG1vZGlmaWVyID0gcmVzWzZdXG4gICAgdmFyIGFzdGVyaXNrID0gcmVzWzddXG5cbiAgICAvLyBQdXNoIHRoZSBjdXJyZW50IHBhdGggb250byB0aGUgdG9rZW5zLlxuICAgIGlmIChwYXRoKSB7XG4gICAgICB0b2tlbnMucHVzaChwYXRoKVxuICAgICAgcGF0aCA9ICcnXG4gICAgfVxuXG4gICAgdmFyIHBhcnRpYWwgPSBwcmVmaXggIT0gbnVsbCAmJiBuZXh0ICE9IG51bGwgJiYgbmV4dCAhPT0gcHJlZml4XG4gICAgdmFyIHJlcGVhdCA9IG1vZGlmaWVyID09PSAnKycgfHwgbW9kaWZpZXIgPT09ICcqJ1xuICAgIHZhciBvcHRpb25hbCA9IG1vZGlmaWVyID09PSAnPycgfHwgbW9kaWZpZXIgPT09ICcqJ1xuICAgIHZhciBkZWxpbWl0ZXIgPSByZXNbMl0gfHwgZGVmYXVsdERlbGltaXRlclxuICAgIHZhciBwYXR0ZXJuID0gY2FwdHVyZSB8fCBncm91cFxuXG4gICAgdG9rZW5zLnB1c2goe1xuICAgICAgbmFtZTogbmFtZSB8fCBrZXkrKyxcbiAgICAgIHByZWZpeDogcHJlZml4IHx8ICcnLFxuICAgICAgZGVsaW1pdGVyOiBkZWxpbWl0ZXIsXG4gICAgICBvcHRpb25hbDogb3B0aW9uYWwsXG4gICAgICByZXBlYXQ6IHJlcGVhdCxcbiAgICAgIHBhcnRpYWw6IHBhcnRpYWwsXG4gICAgICBhc3RlcmlzazogISFhc3RlcmlzayxcbiAgICAgIHBhdHRlcm46IHBhdHRlcm4gPyBlc2NhcGVHcm91cChwYXR0ZXJuKSA6IChhc3RlcmlzayA/ICcuKicgOiAnW14nICsgZXNjYXBlU3RyaW5nKGRlbGltaXRlcikgKyAnXSs/JylcbiAgICB9KVxuICB9XG5cbiAgLy8gTWF0Y2ggYW55IGNoYXJhY3RlcnMgc3RpbGwgcmVtYWluaW5nLlxuICBpZiAoaW5kZXggPCBzdHIubGVuZ3RoKSB7XG4gICAgcGF0aCArPSBzdHIuc3Vic3RyKGluZGV4KVxuICB9XG5cbiAgLy8gSWYgdGhlIHBhdGggZXhpc3RzLCBwdXNoIGl0IG9udG8gdGhlIGVuZC5cbiAgaWYgKHBhdGgpIHtcbiAgICB0b2tlbnMucHVzaChwYXRoKVxuICB9XG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuXG4vKipcbiAqIENvbXBpbGUgYSBzdHJpbmcgdG8gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBmb3IgdGhlIHBhdGguXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgICAgICBzdHJcbiAqIEBwYXJhbSAge09iamVjdD19ICAgICAgICAgICAgb3B0aW9uc1xuICogQHJldHVybiB7IWZ1bmN0aW9uKE9iamVjdD0sIE9iamVjdD0pfVxuICovXG5mdW5jdGlvbiBjb21waWxlIChzdHIsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHRva2Vuc1RvRnVuY3Rpb24ocGFyc2Uoc3RyLCBvcHRpb25zKSwgb3B0aW9ucylcbn1cblxuLyoqXG4gKiBQcmV0dGllciBlbmNvZGluZyBvZiBVUkkgcGF0aCBzZWdtZW50cy5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVuY29kZVVSSUNvbXBvbmVudFByZXR0eSAoc3RyKSB7XG4gIHJldHVybiBlbmNvZGVVUkkoc3RyKS5yZXBsYWNlKC9bXFwvPyNdL2csIGZ1bmN0aW9uIChjKSB7XG4gICAgcmV0dXJuICclJyArIGMuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKVxuICB9KVxufVxuXG4vKipcbiAqIEVuY29kZSB0aGUgYXN0ZXJpc2sgcGFyYW1ldGVyLiBTaW1pbGFyIHRvIGBwcmV0dHlgLCBidXQgYWxsb3dzIHNsYXNoZXMuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBlbmNvZGVBc3RlcmlzayAoc3RyKSB7XG4gIHJldHVybiBlbmNvZGVVUkkoc3RyKS5yZXBsYWNlKC9bPyNdL2csIGZ1bmN0aW9uIChjKSB7XG4gICAgcmV0dXJuICclJyArIGMuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKVxuICB9KVxufVxuXG4vKipcbiAqIEV4cG9zZSBhIG1ldGhvZCBmb3IgdHJhbnNmb3JtaW5nIHRva2VucyBpbnRvIHRoZSBwYXRoIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiB0b2tlbnNUb0Z1bmN0aW9uICh0b2tlbnMsIG9wdGlvbnMpIHtcbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHRva2VucyBpbnRvIHJlZ2V4cHMuXG4gIHZhciBtYXRjaGVzID0gbmV3IEFycmF5KHRva2Vucy5sZW5ndGgpXG5cbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHBhdHRlcm5zIGJlZm9yZSBjb21waWxhdGlvbi5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG1hdGNoZXNbaV0gPSBuZXcgUmVnRXhwKCdeKD86JyArIHRva2Vuc1tpXS5wYXR0ZXJuICsgJykkJywgZmxhZ3Mob3B0aW9ucykpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIG9wdHMpIHtcbiAgICB2YXIgcGF0aCA9ICcnXG4gICAgdmFyIGRhdGEgPSBvYmogfHwge31cbiAgICB2YXIgb3B0aW9ucyA9IG9wdHMgfHwge31cbiAgICB2YXIgZW5jb2RlID0gb3B0aW9ucy5wcmV0dHkgPyBlbmNvZGVVUklDb21wb25lbnRQcmV0dHkgOiBlbmNvZGVVUklDb21wb25lbnRcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV1cblxuICAgICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcGF0aCArPSB0b2tlblxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHZhciB2YWx1ZSA9IGRhdGFbdG9rZW4ubmFtZV1cbiAgICAgIHZhciBzZWdtZW50XG5cbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICAgIC8vIFByZXBlbmQgcGFydGlhbCBzZWdtZW50IHByZWZpeGVzLlxuICAgICAgICAgIGlmICh0b2tlbi5wYXJ0aWFsKSB7XG4gICAgICAgICAgICBwYXRoICs9IHRva2VuLnByZWZpeFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBiZSBkZWZpbmVkJylcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNhcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgaWYgKCF0b2tlbi5yZXBlYXQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG5vdCByZXBlYXQsIGJ1dCByZWNlaXZlZCBgJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKSArICdgJylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbm90IGJlIGVtcHR5JylcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbHVlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgc2VnbWVudCA9IGVuY29kZSh2YWx1ZVtqXSlcblxuICAgICAgICAgIGlmICghbWF0Y2hlc1tpXS50ZXN0KHNlZ21lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBhbGwgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBtYXRjaCBcIicgKyB0b2tlbi5wYXR0ZXJuICsgJ1wiLCBidXQgcmVjZWl2ZWQgYCcgKyBKU09OLnN0cmluZ2lmeShzZWdtZW50KSArICdgJylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwYXRoICs9IChqID09PSAwID8gdG9rZW4ucHJlZml4IDogdG9rZW4uZGVsaW1pdGVyKSArIHNlZ21lbnRcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHNlZ21lbnQgPSB0b2tlbi5hc3RlcmlzayA/IGVuY29kZUFzdGVyaXNrKHZhbHVlKSA6IGVuY29kZSh2YWx1ZSlcblxuICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBtYXRjaCBcIicgKyB0b2tlbi5wYXR0ZXJuICsgJ1wiLCBidXQgcmVjZWl2ZWQgXCInICsgc2VnbWVudCArICdcIicpXG4gICAgICB9XG5cbiAgICAgIHBhdGggKz0gdG9rZW4ucHJlZml4ICsgc2VnbWVudFxuICAgIH1cblxuICAgIHJldHVybiBwYXRoXG4gIH1cbn1cblxuLyoqXG4gKiBFc2NhcGUgYSByZWd1bGFyIGV4cHJlc3Npb24gc3RyaW5nLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZVN0cmluZyAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvKFsuKyo/PV4hOiR7fSgpW1xcXXxcXC9cXFxcXSkvZywgJ1xcXFwkMScpXG59XG5cbi8qKlxuICogRXNjYXBlIHRoZSBjYXB0dXJpbmcgZ3JvdXAgYnkgZXNjYXBpbmcgc3BlY2lhbCBjaGFyYWN0ZXJzIGFuZCBtZWFuaW5nLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gZ3JvdXBcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlR3JvdXAgKGdyb3VwKSB7XG4gIHJldHVybiBncm91cC5yZXBsYWNlKC8oWz0hOiRcXC8oKV0pL2csICdcXFxcJDEnKVxufVxuXG4vKipcbiAqIEF0dGFjaCB0aGUga2V5cyBhcyBhIHByb3BlcnR5IG9mIHRoZSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7IVJlZ0V4cH0gcmVcbiAqIEBwYXJhbSAge0FycmF5fSAgIGtleXNcbiAqIEByZXR1cm4geyFSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIGF0dGFjaEtleXMgKHJlLCBrZXlzKSB7XG4gIHJlLmtleXMgPSBrZXlzXG4gIHJldHVybiByZVxufVxuXG4vKipcbiAqIEdldCB0aGUgZmxhZ3MgZm9yIGEgcmVnZXhwIGZyb20gdGhlIG9wdGlvbnMuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZsYWdzIChvcHRpb25zKSB7XG4gIHJldHVybiBvcHRpb25zICYmIG9wdGlvbnMuc2Vuc2l0aXZlID8gJycgOiAnaSdcbn1cblxuLyoqXG4gKiBQdWxsIG91dCBrZXlzIGZyb20gYSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7IVJlZ0V4cH0gcGF0aFxuICogQHBhcmFtICB7IUFycmF5fSAga2V5c1xuICogQHJldHVybiB7IVJlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gcmVnZXhwVG9SZWdleHAgKHBhdGgsIGtleXMpIHtcbiAgLy8gVXNlIGEgbmVnYXRpdmUgbG9va2FoZWFkIHRvIG1hdGNoIG9ubHkgY2FwdHVyaW5nIGdyb3Vwcy5cbiAgdmFyIGdyb3VwcyA9IHBhdGguc291cmNlLm1hdGNoKC9cXCgoPyFcXD8pL2cpXG5cbiAgaWYgKGdyb3Vwcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBrZXlzLnB1c2goe1xuICAgICAgICBuYW1lOiBpLFxuICAgICAgICBwcmVmaXg6IG51bGwsXG4gICAgICAgIGRlbGltaXRlcjogbnVsbCxcbiAgICAgICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgICAgICByZXBlYXQ6IGZhbHNlLFxuICAgICAgICBwYXJ0aWFsOiBmYWxzZSxcbiAgICAgICAgYXN0ZXJpc2s6IGZhbHNlLFxuICAgICAgICBwYXR0ZXJuOiBudWxsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKHBhdGgsIGtleXMpXG59XG5cbi8qKlxuICogVHJhbnNmb3JtIGFuIGFycmF5IGludG8gYSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7IUFycmF5fSAgcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICAga2V5c1xuICogQHBhcmFtICB7IU9iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7IVJlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gYXJyYXlUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgcGFydHMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgIHBhcnRzLnB1c2gocGF0aFRvUmVnZXhwKHBhdGhbaV0sIGtleXMsIG9wdGlvbnMpLnNvdXJjZSlcbiAgfVxuXG4gIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCcoPzonICsgcGFydHMuam9pbignfCcpICsgJyknLCBmbGFncyhvcHRpb25zKSlcblxuICByZXR1cm4gYXR0YWNoS2V5cyhyZWdleHAsIGtleXMpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgcGF0aCByZWdleHAgZnJvbSBzdHJpbmcgaW5wdXQuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSAgcGF0aFxuICogQHBhcmFtICB7IUFycmF5fSAga2V5c1xuICogQHBhcmFtICB7IU9iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7IVJlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gc3RyaW5nVG9SZWdleHAgKHBhdGgsIGtleXMsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHRva2Vuc1RvUmVnRXhwKHBhcnNlKHBhdGgsIG9wdGlvbnMpLCBrZXlzLCBvcHRpb25zKVxufVxuXG4vKipcbiAqIEV4cG9zZSBhIGZ1bmN0aW9uIGZvciB0YWtpbmcgdG9rZW5zIGFuZCByZXR1cm5pbmcgYSBSZWdFeHAuXG4gKlxuICogQHBhcmFtICB7IUFycmF5fSAgICAgICAgICB0b2tlbnNcbiAqIEBwYXJhbSAgeyhBcnJheXxPYmplY3QpPX0ga2V5c1xuICogQHBhcmFtICB7T2JqZWN0PX0gICAgICAgICBvcHRpb25zXG4gKiBAcmV0dXJuIHshUmVnRXhwfVxuICovXG5mdW5jdGlvbiB0b2tlbnNUb1JlZ0V4cCAodG9rZW5zLCBrZXlzLCBvcHRpb25zKSB7XG4gIGlmICghaXNhcnJheShrZXlzKSkge1xuICAgIG9wdGlvbnMgPSAvKiogQHR5cGUgeyFPYmplY3R9ICovIChrZXlzIHx8IG9wdGlvbnMpXG4gICAga2V5cyA9IFtdXG4gIH1cblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG4gIHZhciBzdHJpY3QgPSBvcHRpb25zLnN0cmljdFxuICB2YXIgZW5kID0gb3B0aW9ucy5lbmQgIT09IGZhbHNlXG4gIHZhciByb3V0ZSA9ICcnXG5cbiAgLy8gSXRlcmF0ZSBvdmVyIHRoZSB0b2tlbnMgYW5kIGNyZWF0ZSBvdXIgcmVnZXhwIHN0cmluZy5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV1cblxuICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICByb3V0ZSArPSBlc2NhcGVTdHJpbmcodG9rZW4pXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBwcmVmaXggPSBlc2NhcGVTdHJpbmcodG9rZW4ucHJlZml4KVxuICAgICAgdmFyIGNhcHR1cmUgPSAnKD86JyArIHRva2VuLnBhdHRlcm4gKyAnKSdcblxuICAgICAga2V5cy5wdXNoKHRva2VuKVxuXG4gICAgICBpZiAodG9rZW4ucmVwZWF0KSB7XG4gICAgICAgIGNhcHR1cmUgKz0gJyg/OicgKyBwcmVmaXggKyBjYXB0dXJlICsgJykqJ1xuICAgICAgfVxuXG4gICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgaWYgKCF0b2tlbi5wYXJ0aWFsKSB7XG4gICAgICAgICAgY2FwdHVyZSA9ICcoPzonICsgcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpKT8nXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FwdHVyZSA9IHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKT8nXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhcHR1cmUgPSBwcmVmaXggKyAnKCcgKyBjYXB0dXJlICsgJyknXG4gICAgICB9XG5cbiAgICAgIHJvdXRlICs9IGNhcHR1cmVcbiAgICB9XG4gIH1cblxuICB2YXIgZGVsaW1pdGVyID0gZXNjYXBlU3RyaW5nKG9wdGlvbnMuZGVsaW1pdGVyIHx8ICcvJylcbiAgdmFyIGVuZHNXaXRoRGVsaW1pdGVyID0gcm91dGUuc2xpY2UoLWRlbGltaXRlci5sZW5ndGgpID09PSBkZWxpbWl0ZXJcblxuICAvLyBJbiBub24tc3RyaWN0IG1vZGUgd2UgYWxsb3cgYSBzbGFzaCBhdCB0aGUgZW5kIG9mIG1hdGNoLiBJZiB0aGUgcGF0aCB0b1xuICAvLyBtYXRjaCBhbHJlYWR5IGVuZHMgd2l0aCBhIHNsYXNoLCB3ZSByZW1vdmUgaXQgZm9yIGNvbnNpc3RlbmN5LiBUaGUgc2xhc2hcbiAgLy8gaXMgdmFsaWQgYXQgdGhlIGVuZCBvZiBhIHBhdGggbWF0Y2gsIG5vdCBpbiB0aGUgbWlkZGxlLiBUaGlzIGlzIGltcG9ydGFudFxuICAvLyBpbiBub24tZW5kaW5nIG1vZGUsIHdoZXJlIFwiL3Rlc3QvXCIgc2hvdWxkbid0IG1hdGNoIFwiL3Rlc3QvL3JvdXRlXCIuXG4gIGlmICghc3RyaWN0KSB7XG4gICAgcm91dGUgPSAoZW5kc1dpdGhEZWxpbWl0ZXIgPyByb3V0ZS5zbGljZSgwLCAtZGVsaW1pdGVyLmxlbmd0aCkgOiByb3V0ZSkgKyAnKD86JyArIGRlbGltaXRlciArICcoPz0kKSk/J1xuICB9XG5cbiAgaWYgKGVuZCkge1xuICAgIHJvdXRlICs9ICckJ1xuICB9IGVsc2Uge1xuICAgIC8vIEluIG5vbi1lbmRpbmcgbW9kZSwgd2UgbmVlZCB0aGUgY2FwdHVyaW5nIGdyb3VwcyB0byBtYXRjaCBhcyBtdWNoIGFzXG4gICAgLy8gcG9zc2libGUgYnkgdXNpbmcgYSBwb3NpdGl2ZSBsb29rYWhlYWQgdG8gdGhlIGVuZCBvciBuZXh0IHBhdGggc2VnbWVudC5cbiAgICByb3V0ZSArPSBzdHJpY3QgJiYgZW5kc1dpdGhEZWxpbWl0ZXIgPyAnJyA6ICcoPz0nICsgZGVsaW1pdGVyICsgJ3wkKSdcbiAgfVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKG5ldyBSZWdFeHAoJ14nICsgcm91dGUsIGZsYWdzKG9wdGlvbnMpKSwga2V5cylcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgdGhlIGdpdmVuIHBhdGggc3RyaW5nLCByZXR1cm5pbmcgYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gKlxuICogQW4gZW1wdHkgYXJyYXkgY2FuIGJlIHBhc3NlZCBpbiBmb3IgdGhlIGtleXMsIHdoaWNoIHdpbGwgaG9sZCB0aGVcbiAqIHBsYWNlaG9sZGVyIGtleSBkZXNjcmlwdGlvbnMuIEZvciBleGFtcGxlLCB1c2luZyBgL3VzZXIvOmlkYCwgYGtleXNgIHdpbGxcbiAqIGNvbnRhaW4gYFt7IG5hbWU6ICdpZCcsIGRlbGltaXRlcjogJy8nLCBvcHRpb25hbDogZmFsc2UsIHJlcGVhdDogZmFsc2UgfV1gLlxuICpcbiAqIEBwYXJhbSAgeyhzdHJpbmd8UmVnRXhwfEFycmF5KX0gcGF0aFxuICogQHBhcmFtICB7KEFycmF5fE9iamVjdCk9fSAgICAgICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3Q9fSAgICAgICAgICAgICAgIG9wdGlvbnNcbiAqIEByZXR1cm4geyFSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHBhdGhUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICBpZiAoIWlzYXJyYXkoa2V5cykpIHtcbiAgICBvcHRpb25zID0gLyoqIEB0eXBlIHshT2JqZWN0fSAqLyAoa2V5cyB8fCBvcHRpb25zKVxuICAgIGtleXMgPSBbXVxuICB9XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cblxuICBpZiAocGF0aCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgIHJldHVybiByZWdleHBUb1JlZ2V4cChwYXRoLCAvKiogQHR5cGUgeyFBcnJheX0gKi8gKGtleXMpKVxuICB9XG5cbiAgaWYgKGlzYXJyYXkocGF0aCkpIHtcbiAgICByZXR1cm4gYXJyYXlUb1JlZ2V4cCgvKiogQHR5cGUgeyFBcnJheX0gKi8gKHBhdGgpLCAvKiogQHR5cGUgeyFBcnJheX0gKi8gKGtleXMpLCBvcHRpb25zKVxuICB9XG5cbiAgcmV0dXJuIHN0cmluZ1RvUmVnZXhwKC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAocGF0aCksIC8qKiBAdHlwZSB7IUFycmF5fSAqLyAoa2V5cyksIG9wdGlvbnMpXG59XG4iLCJpbXBvcnQgUmVnZXhwIGZyb20gJ3BhdGgtdG8tcmVnZXhwJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWF0Y2hlciAocm91dGVzKSB7XG4gIC8qKlxuICAgKiB7XG4gICAqICBub3JtYWxpemVkUGF0aDogcmVjb3JkXG4gICAqIH1cbiAgICovXG4gIGNvbnN0IG1hcCA9IHt9XG4gIHJvdXRlcy5mb3JFYWNoKHIgPT4gYWRkUm91dGUobWFwLCByKSlcblxuICByZXR1cm4gZnVuY3Rpb24gbWF0Y2ggKGZ1bGxQYXRoKSB7XG4gICAgY29uc3QgeyBwYXRoLCBxdWVyeSB9ID0gZXh0cmFjdFF1ZXJ5KGZ1bGxQYXRoKVxuICAgIGNvbnN0IHBhcmFtcyA9IHt9XG4gICAgZm9yIChjb25zdCByb3V0ZSBpbiBtYXApIHtcbiAgICAgIGlmIChtYXRjaFJvdXRlKHJvdXRlLCBwYXJhbXMsIHBhdGgpKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKHtcbiAgICAgICAgICBwYXJhbXMsXG4gICAgICAgICAgcXVlcnksXG4gICAgICAgICAgbWF0Y2hlZDogZm9ybWF0TWF0Y2gobWFwW3JvdXRlXSlcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkUm91dGUgKG1hcCwgcm91dGUsIHBhcmVudCkge1xuICBjb25zdCB7IHBhdGgsIGNvbXBvbmVudCwgY29tcG9uZW50cywgbWV0YSwgY2hpbGRyZW4gfSA9IHJvdXRlXG4gIGNvbnN0IHJlY29yZCA9IHtcbiAgICBwYXRoOiBub3JtYWxpemVSb3V0ZShwYXRoLCBwYXJlbnQpLFxuICAgIGNvbXBvbmVudHM6IGNvbXBvbmVudHMgfHwgeyBkZWZhdWx0OiBjb21wb25lbnQgfSxcbiAgICBwYXJlbnQsXG4gICAgbWV0YVxuICB9XG4gIGlmIChjaGlsZHJlbikge1xuICAgIGNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4gYWRkUm91dGUobWFwLCBjaGlsZCwgcmVjb3JkKSlcbiAgfVxuICBtYXBbcmVjb3JkLnBhdGhdID0gcmVjb3JkXG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJvdXRlIChwYXRoLCBwYXJlbnQpIHtcbiAgaWYgKHBhdGhbMF0gPT0gJy8nKSByZXR1cm4gcGF0aCAgLy8gXCIvXCIgc2lnbmlmaWVzIGFuIGFic29sdXRlIHJvdXRlXG4gIGlmIChwYXJlbnQgPT0gbnVsbCkgcmV0dXJuIHBhdGggIC8vIG5vIG5lZWQgZm9yIGEgam9pblxuICByZXR1cm4gYCR7cGFyZW50LnBhdGh9LyR7cGF0aH1gLnJlcGxhY2UoL1xcL1xcLy9nLCAnLycpIC8vIGpvaW5cbn1cblxuLyoqXG4gKiB7a2V5IG9mIG1hcH0gcGF0aFxuICoge29iamVjdCA9IHt9fSBwYXJhbXNcbiAqIHtmdWxscGF0aC5wYXRofSBwYXRobmFtZVxuICovXG5mdW5jdGlvbiBtYXRjaFJvdXRlIChwYXRoLCBwYXJhbXMsIHBhdGhuYW1lKSB7XG4gIGNvbnN0IGtleXMgPSBbXVxuICBjb25zdCByZWdleHAgPSBSZWdleHAocGF0aCwga2V5cylcbiAgY29uc3QgbSA9IHJlZ2V4cC5leGVjKHBhdGhuYW1lKVxuICBpZiAoIW0pIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfSBlbHNlIGlmICghcGFyYW1zKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAxLCBsZW4gPSBtLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgdmFyIGtleSA9IGtleXNbaSAtIDFdXG4gICAgdmFyIHZhbCA9ICdzdHJpbmcnID09IHR5cGVvZiBtW2ldID8gZGVjb2RlVVJJQ29tcG9uZW50KG1baV0pIDogbVtpXVxuICAgIGlmIChrZXkpIHBhcmFtc1trZXkubmFtZV0gPSB2YWxcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RRdWVyeSAocGF0aCkge1xuICBjb25zdCBpbmRleCA9IHBhdGguaW5kZXhPZignPycpXG4gIGlmIChpbmRleCA+IDApIHtcbiAgICByZXR1cm4ge1xuICAgICAgcGF0aDogcGF0aC5zbGljZSgwLCBpbmRleCksXG4gICAgICBxdWVyeTogcGFyc2VRdWVyeShwYXRoLnNsaWNlKGluZGV4ICsgMSkpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiB7IHBhdGggfVxuICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlUXVlcnkgKHF1ZXJ5KSB7XG4gIGNvbnN0IHJlcyA9IE9iamVjdC5jcmVhdGUobnVsbClcblxuICBxdWVyeSA9IHF1ZXJ5LnRyaW0oKS5yZXBsYWNlKC9eKFxcP3wjfCYpLywgJycpXG5cbiAgaWYgKCFxdWVyeSkge1xuICAgIHJldHVybiByZXNcbiAgfVxuXG4gIHF1ZXJ5LnNwbGl0KCcmJykuZm9yRWFjaChwYXJhbSA9PiB7XG4gICAgY29uc3QgcGFydHMgPSBwYXJhbS5yZXBsYWNlKC9cXCsvZywgJyAnKS5zcGxpdCgnPScpXG4gICAgY29uc3Qga2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhcnRzLnNoaWZ0KCkpXG4gICAgY29uc3QgdmFsID0gcGFydHMubGVuZ3RoID4gMFxuICAgICAgPyBkZWNvZGVVUklDb21wb25lbnQocGFydHMuam9pbignPScpKVxuICAgICAgOiBudWxsXG5cbiAgICBpZiAocmVzW2tleV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVzW2tleV0gPSB2YWxcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmVzW2tleV0pKSB7XG4gICAgICByZXNba2V5XS5wdXNoKHZhbClcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzW2tleV0gPSBbcmVzW2tleV0sIHZhbF1cbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBmb3JtYXRNYXRjaCAocmVjb3JkKSB7XG4gIGNvbnN0IHJlcyA9IFtdXG4gIHdoaWxlIChyZWNvcmQpIHtcbiAgICByZXMudW5zaGlmdChyZWNvcmQpXG4gICAgcmVjb3JkID0gcmVjb3JkLnBhcmVudFxuICB9XG4gIHJldHVybiByZXNcbn1cbiIsImV4cG9ydCBjbGFzcyBIYXNoSGlzdG9yeSB7XG5cbn1cbiIsImV4cG9ydCBjbGFzcyBIVE1MNUhpc3Rvcnkge1xuXG59XG4iLCJleHBvcnQgY2xhc3MgQWJzdHJhY3RIaXN0b3J5IHtcblxufVxuIiwiaW1wb3J0IHsgaW5zdGFsbCB9IGZyb20gJy4vaW5zdGFsbCdcbmltcG9ydCB7IGNyZWF0ZU1hdGNoZXIgfSBmcm9tICcuL21hdGNoJ1xuaW1wb3J0IHsgSGFzaEhpc3RvcnkgfSBmcm9tICcuL2hpc3RvcnkvaGFzaCdcbmltcG9ydCB7IEhUTUw1SGlzdG9yeSB9IGZyb20gJy4vaGlzdG9yeS9odG1sNSdcbmltcG9ydCB7IEFic3RyYWN0SGlzdG9yeSB9IGZyb20gJy4vaGlzdG9yeS9hYnN0cmFjdCdcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVnVlUm91dGVyIHtcbiAgY29uc3RydWN0b3IgKG9wdGlvbnMgPSB7fSkge1xuXG4gICAgLy8g56ys5LqM5qyh5o+Q5LqkIHR3ZWFr5Y+q5piv5Lqk5o2i5LqGIHRoaXMuX3Jvb3Qg5ZKMIHRoaXMuX21vZGUgPyDmmoLkuI3nn6XkuLrllaVcbiAgICB0aGlzLl9yb290ID0gb3B0aW9ucy5yb290IHx8ICcvJ1xuICAgIHRoaXMuX21vZGUgPSBvcHRpb25zLm1vZGUgfHwgJ2hhc2gnXG4gICAgdGhpcy5yb290Q29tcG9uZW50ID0gbnVsbFxuICAgIHRoaXMubWF0Y2ggPSBjcmVhdGVNYXRjaGVyKG9wdGlvbnMucm91dGVzIHx8IFtdKVxuXG4gICAgc3dpdGNoICh0aGlzLl9tb2RlKSB7XG4gICAgICBjYXNlICdoYXNoJzpcbiAgICAgICAgdGhpcy5oaXN0b3J5ID0gbmV3IEhhc2hIaXN0b3J5KClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2h0bWw1JzpcbiAgICAgICAgdGhpcy5oaXN0b3J5ID0gbmV3IEhUTUw1SGlzdG9yeSgpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdhYnN0cmFjdCc6XG4gICAgICAgIHRoaXMuaGlzdG9yeSA9IG5ldyBBYnN0cmFjdEhpc3RvcnkoKVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbdnVlLXJvdXRlcl0gaW52YWxpZCBtb2RlOiAke3RoaXMuX21vZGV9YClcbiAgICB9XG4gIH1cbiAgZ28ocGF0aCkge1xuICAgIHRoaXMucm9vdENvbXBvbmVudC5fcm91dGUgPSB0aGlzLm1hdGNoKHBhdGgpXG4gIH1cbn1cblxuVnVlUm91dGVyLmluc3RhbGwgPSBpbnN0YWxsXG5WdWVSb3V0ZXIuY3JlYXRlTWF0Y2hlciA9IGNyZWF0ZU1hdGNoZXJcblxuXG5pZiAodHlwZW9mIFZ1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblxuICBWdWUudXNlKFZ1ZVJvdXRlcilcbn1cbiJdLCJuYW1lcyI6WyJjb25zdCIsImxldCIsImNvbW1vbmpzSGVscGVycy5pbnRlcm9wRGVmYXVsdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsWUFBZTtLQUNYLElBQUksRUFBRSxhQUFhO0tBQ25CLFVBQVUsRUFBRSxJQUFJO0tBQ2hCLEtBQUssRUFBRTtTQUNILElBQUksRUFBRTthQUNGLElBQUksRUFBRSxNQUFNO2FBQ1osT0FBTyxFQUFFLFNBQVM7VUFDckI7TUFDSjtLQUNELE1BQU0saUJBQUEsQ0FBQyxDQUFDLEVBQUUsR0FBQSxFQUFtQzthQUFqQyxLQUFLLGFBQUU7YUFBQSxRQUFRLGdCQUFFO2FBQUEsTUFBTSxjQUFFO2FBQUEsSUFBSTs7U0FDckNBLElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNOztTQUUzQkMsSUFBSSxLQUFLLEdBQUcsQ0FBQzs7U0FFYixNQUFNLE1BQU0sRUFBRTthQUNWLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBSSxNQUFN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