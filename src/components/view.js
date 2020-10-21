export default {
    name: 'router-view',
    functional: true,
    props: {
        name: {
            type: String,
            default: 'default'
        }
    },
    render(h, context) {
        let { props, children, parent, data } = context
        data.routerView = true
        const route = parent.$route

        // 等效于
        // if(!parent._routerViewCache) {
        //     parent._routerViewCache = {}
        // }
        // const cache = parent._routerViewCache

        const cache = parent._routerViewCache || (parent._routerViewCache = {})
        

         // 标记 routerVie 类型
        let depth = 0
        let inactive = false;
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

        const matched = route.matched[depth]
        // keep-alive组件处理，优先拿缓存里面的组件
        // 可以先不考虑keep-alive情况 也不会造成什么理解的问题
        // const component = matched && matched.components[props.name]
        const component =  inactive
        ? cache[props.name]
        : (cache[props.name] = matched && matched.components[props.name])
        
        return h(
            component,
            data,
            children
        )
    }
}