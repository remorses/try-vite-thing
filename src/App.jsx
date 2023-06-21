import { Link, Route, Routes } from 'react-router-dom'
import WorkingExample from 'xxx'
import MegaMenu from 'https://framer.com/m/Mega-Menu-2wT3.js'

// Auto generates routes from files under ./pages
// https://vitejs.dev/guide/features.html#glob-import
const pages = import.meta.glob('./pages/*.jsx', { eager: true })

const routes = Object.keys(pages).map((path) => {
    const name = path.match(/\.\/pages\/(.*)\.jsx$/)[1]
    return {
        name,
        path: name === 'Home' ? '/' : `/${name.toLowerCase()}`,
        component: pages[path].default,
    }
})

export function App() {
    return (
        <>
            <MegaMenu />
            <WorkingExample />
            <nav>
                <ul>
                    {routes.map(({ name, path }) => {
                        return (
                            <li key={path}>
                                <Link to={path}>{name}</Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>
            <Routes>
                {routes.map(({ path, component: RouteComp }) => {
                    return (
                        <Route
                            key={path}
                            path={path}
                            element={<RouteComp />}
                        ></Route>
                    )
                })}
            </Routes>
        </>
    )
}
