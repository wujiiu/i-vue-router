import View from './components/view'
import Link from './components/link'

export default function install(Vue) {
    Object.defineProperty(Vue.prototype, '$router', {
        get() {
            return this.$root._router
        }
    })

    Object.defineProperty(Vue.prototype, '$route', {
        get () { return this.$root._route }
    })
    /**
     * 需要在vue $options中注入router的原因
     *  - 标记 rootComponent
     *  - 挂载 _route  触发 router-view更新
     */
    Vue.mixins({
        beforeCreate() {
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