export interface Template {}

export interface PlainObject {
  [key: string]: any;
}

export type Middleware<TState> = (api: Store<TState>) => Store<TState>;

export interface State {
  <T>(selector: (globalState: any) => T): T;
  <T>(localStateInitial: T): [T, (value: T | ((prev: T) => T)) => void];
}

export interface ComponentProps extends PlainObject {}

export type Component<TProps = ComponentProps> = (
  props?: TProps,
  state?: State
) => any;

export type Action<TState, TPayload> = (
  state?: TState,
  payload?: TPayload
) => any;

export interface Store<TState> {
  getState(): TState;
  dispatch<TPayload>(action: Action<TState, TPayload>, payload: TPayload): any;
  subscribe(listener: Function): Function;
}

export interface ApplicationOptions<TState> {
  state?: TState;
  container?: Node | string;
  onChange?: Function;
  onUpdate?: Function;
  middleware?: Middleware<TState>;
}

export interface Application<TState> extends Store<TState> {
  readonly state: TState;
  // update(): void;
}

export interface EventHandlers {
  [key: string]: Function | [Function, Function | any];
}

export type RenderItem<T> = (item?: T, index?: number) => any;

export interface ElementBinding {
  id?: any;
  on?: EventHandlers;
  attr?: PlainObject;
  prop?: PlainObject;
  checked?: any;
  tabindex?: any;
  text?: any;
  name?: any;
  selected?: any;
  multiple?: any;
  size?: any;
  value?: any;
  html?: any;
  for?: any;
  href?: any;
  title?: any;
  lang?: any;
  dir?: any;
  scrollLeft?: any;
  scrollTop?: any;
  disabled?: any;
  style?: string | PlainObject;
  class?: string | PlainObject;
  [key: string]: any;
}

export interface ItemOptions<T> {
  key?: (item?: T, index?: number) => any;
  render?: RenderItem<T>;
  tag?: string;
}

export interface ListBinding<T> {
  each?: T[];
  item?: RenderItem<T> | ItemOptions<T>;
}

export type Binding = ElementBinding & ListBinding<any>;

export interface DefaultExports {
  (
    strings: ReadonlyArray<string>,
    ...args: (
      | Binding
      | string
      | boolean
      | number
      | Date
      | null
      | undefined
      | RegExp
      | Component
    )[]
  ): Template;
  <TState>(
    component: Component<TState>,
    options?: ApplicationOptions<TState>
  ): Application<TState>;
}

declare const hta: DefaultExports;

export default hta;
