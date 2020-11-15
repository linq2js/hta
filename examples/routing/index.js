import { asyncExtras, delay, lazy } from "../../async";
import { $, render } from "../../core";
import { hookExtras, useStore } from "../../hook";
import { redirect, router, useMatch, link } from "../../router";
import { storeExtras } from "../../store";

const LazyComponent = lazy(
  () => import("./lazyComponent").then((x) => delay(500, x.default)),
  "Loading..."
);
const HomePage = () => "Home Page";
const ProductPage = () => {
  const match = useMatch();
  return `Product Details: ${match.params.productId}`;
};
const NotFoundPage = () => "404 Page";
const ProfilePage = () =>
  $`You are logged in as : <strong>${useStore((state) => state.user)}</strong>`;
const LoginPage = () => {
  const { user, location } = useStore(({ user, location }) => ({
    user,
    location,
  }));
  if (user) return redirect(location.state.from || "/");
  return `You must log in to view the page at ${location.state.from}`;
};
const Protected = ({ route }) => {
  const { user, location } = useStore(({ user, location }) => ({
    user,
    location,
  }));
  if (user) return route;
  return redirect("/login", { from: location.pathname });
};
const Increase = ({ count }) => ({ count: count + 1 });
const App = ({ count, user }) => {
  return $`
  <h1>Router Demo</h1>
  <h2>${count}</h2>
  <button ${{ onclick: [Increase] }}>Increase</button>
  <p>
    <a ${{ href: "/product/" + Date.now() }} ${link}>Product</a> |
    <a href="/profile" ${link}>Profile</a>
    <a href="/lazy" ${link({ state: "World" })}>Lazy component</a>
  </p>
  <p>
    <button ${{ onclick: [Login], visible: !user }}>Login</button>
    <button ${{ onclick: [Logout], visible: user }}>Logout</button>
  </p>
  ${router(routes)}`;
};

const routes = {
  "/$": HomePage,
  "/product/:productId": ProductPage,
  "/login": LoginPage,
  "/lazy": LazyComponent,
  "/profile": [Protected, { route: ProfilePage }],
  _: NotFoundPage,
};

const Login = () => ({ user: "admin", loggedOn: Date.now() });
const Logout = () => ({ user: undefined });

render(App, {
  state: { count: 1 },
  use: [hookExtras, storeExtras, asyncExtras],
});
