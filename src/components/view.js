export default {
    name: 'router-view',
    functional: true,
    props: {
        name: {
            type: String,
            default: 'default'
        }
    },
    render(h, { props, children, parent, data }) {
        const route = parent.$route
         // 标记 routerVie 类型
        let _parent = parent
        let depth = 0

        while(_parent) {
            if (_parent.$vnode && _parent.$vnode.data._routerView) {
                depth ++
            }
            _parent = _parent.$parent
        }
        data._routerView = true

        const matched = route.matched[depth] && route.matched[depth].components[props.name] || null
        return h(
            matched,
            data,
            children
        )
    }
}