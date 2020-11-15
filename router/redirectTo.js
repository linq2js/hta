import history from "./history";

export default function redirectTo(to, state, replace) {
  if (history.location.pathname === to) return;
  // console.log("redirect", to);
  replace ? history.replace(to, state) : history.push(to, state);
}
