import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
    index('routes/index.tsx'),
    route('/identity', 'routes/identity.tsx'),
    route('/contacts', 'routes/confirmations.tsx'),
    route('/contacts/:id', 'routes/confirmations.$id.tsx'),
    route('/telepastoring', 'routes/telepastoring.tsx'),
    route('/live', 'routes/live.tsx'),
    route('/data', 'routes/data.tsx'),
    route('/members', 'routes/members.tsx'),
] satisfies RouteConfig
