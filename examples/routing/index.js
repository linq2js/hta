import $ from "../../lib";
import router from "../../router";

const LazyComponent = $.lazy(() => import("./lazyComponent"), "Loading...");
const HomePage = () => "Home Page";
const ProductPage = () => {
  const match = router.match();
  return `Product Details: ${match.params.productId}`;
};
const NotFoundPage = () => "404 Page";
const ProfilePage = () =>
  $`You are logged in as : <strong>${$.store((state) => state.user)}</strong>`;
const LoginPage = () => {
  const [user, location] = $.store(["user", "location"]);
  if (user) return router.redirect(location.state.from || "/");
  return `You must log in to view the page at ${location.state.from}`;
};
const Protected = ({ route }) => {
  const [user, location] = $.store(["user", "location"]);
  if (user) return route;
  return router.redirect("/login", { from: location.pathname });
};
const Increase = ({ count }) => ({ count: count + 1 });
const App = ({ count, user }) => {
  return $`
  <h1>Router Demo</h1>
  <h2>${count}</h2>
  <button ${{ onclick: Increase }}>Increase</button>
  <p>
    <a ${{ href: "/product/" + Date.now() }} ${router.link}>Product</a> |
    <a href="/profile" ${router.link}>Profile</a>
    <a href="/lazy" ${router.link({ state: "World" })}>Lazy component</a>
  </p>
  <p>
    <button ${{ onclick: Login, visible: !user }}>Login</button>
    <button ${{ onclick: Logout, visible: user }}>Logout</button>
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

$.render(App, { state: { count: 1 } });
