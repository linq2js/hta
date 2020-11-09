import { Location } from "history";
import { ComponentWithProps, Content } from "../lib";

export interface Match {
  params: { [key: string]: string };
  path: string;
  url: string;
  valid: boolean;
  nested: {
    url(subUrl: string): string;
    path(subPath: string): string;
  };
}

export interface RouteRenderArgs {
  match: Match;
  location: Location;
}

export type RenderFn = (args?: RouteRenderArgs) => any;

export interface RouteDef {
  exact?: boolean;
  paths?: string[];
  sensitive?: boolean;
  strict?: boolean;
  render: RenderFn;
}

export interface RedirectOptions {
  to: string;
  state?: any;
  replace?: boolean;
}

export type Route = RenderFn | RouteDef | RedirectOptions | ComponentWithProps;

export interface RouteMap {
  // fallback route
  _?: Route;
  [path: string]: Route;
}

export interface RouterExports extends Function {
  (path: string, options?: Route): Content;
  (routes: RouteMap): Content;
  link: LinkExports;
  match(): Match;
  history: History;
  redirect(to: string, state?: any, replace?: boolean): Content;
  redirect(options: RedirectOptions): Content;
}

export interface LinkExports extends Function {
  (options?: LinkOptions): Content;
}

export function Redirect(props: RedirectOptions): Content;

export interface LinkOptions extends Partial<RedirectOptions> {}

export declare let router: RouterExports;

export declare let link: LinkExports;

export default router;
