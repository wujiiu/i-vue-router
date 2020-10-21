export default {
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
    render(h, { props, parent, children }) {
        return h(
            props.tag,
            {
                attrs: {
                    href: props.to
                },
                on: {
                    click(e) {
                        e.preventDefault()
                        parent.$router.go(props.to)
                    }
                }
            },
            children
        )
    }
}