import { install } from './install'
import { createMatcher } from './match'
import { HashHistory } from './history/hash'
import { HTML5History } from './history/html5'
import { AbstractHistory } from './history/abstract'

export default class VueRouter {
  constructor (options = {}) {
    this._mode = options.mode || 'hash'
    this._root = options.root || '/'
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
        throw new Error(`[vue-router] invalid mode: ${this._mode}`)
    }
  }
  go(path) {
    this.rootComponent._route = this.match(path)
  }
}

VueRouter.install =install
VueRouter.createMatcher = createMatcher

if (typeof Vue !== 'undefined') {
  Vue.use(VueRouter)
}