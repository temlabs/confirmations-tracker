import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
    index('routes/index.tsx'),
    route('/identity', 'routes/identity.tsx'),
    route('/confirmations', 'routes/confirmations.tsx'),
    route('/confirmations/:id', 'routes/confirmations.$id.tsx'),
    route('/live', 'routes/live.tsx'),
    route('/data', 'routes/data.tsx'),
    route('/members', 'routes/members.tsx'),
] satisfies RouteConfig
