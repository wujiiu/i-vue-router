export default {
    name: 'router-view',
    props: {
        name: {
            type: String,
            default: 'default'
        }
    },
    created() {
        // 标记 routerVie 类型
        this._routerView = true

        let parent = this.$parent
        let depth = 0
        while(parent) {
            if(parent._routerView) {
                depth ++
            }
            parent = parent.$parent
        }
        this.depth = depth
    },
    render(h) {
        return h(
            'div',
            {

            },
            'haha'
        )
    }
}