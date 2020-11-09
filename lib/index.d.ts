export type Content = any;

export type ComponentWithProps<TComponent = (props: any) => Content> = [
  TComponent,
  TComponent extends (props?: infer TProps) => any ? TProps : never
];

export type Component<TProps extends {} = {}> = (props?: TProps) => Content;

export interface Template {}

export interface KeyedTemplate extends Template {}

export type State<TState> = TState & { [key: string]: <T = any>() => T };

export interface RenderOptions<TState extends {}> {
  state?: TState;
  container?: string | Node;
  onLoad?: Function;
  onUpdate?: Function;
  onChange?: Function;
  middleware?: Function;
}

export type ActionResult<TResult> = void;

export type Action<TState extends {} = {}, TPayload = any, TResult = never> = (
  state?: TState,
  payload?: TPayload
) => TResult;

export interface Application<TState> extends Store<TState> {
  readonly state: TState;
}

export interface Store<TState> {
  subscribe(listener: Function): Unsubscribe;
  dispatch<TResolvedPayload, TPayload, TResult>(
    action: [
      Action<TState, TResolvedPayload, TResult>,
      TResolvedPayload | ((payload?: TPayload) => TResolvedPayload)
    ],
    payload: TPayload
  ): ActionResult<TResult>;
  dispatch<TPayload, TResult>(
    action: Action<TState, TPayload, TResult>,
    payload?: TPayload
  ): ActionResult<TResult>;
}

export type Unsubscribe = () => void;

export interface Binding<TValue> {
  value: TValue;
}

export interface ValueOf extends Function {
  <TValue>(loadable: Loadable<TValue>): TValue;
  (loadableList: Loadable[]): any[];
}

export interface Loadable<TValue = any> {
  readonly value: TValue;
  readonly status: "loading" | "loaded" | "failed";
  readonly error: any;
  tryGetValue(defaultValue?: TValue): TValue;
  map<TNext>(mapper: (value: TValue) => TNext): Loadable<TNext>;
}

export type SelectorResult<TState, TSelector> = TSelector extends (
  state: TState,
  valueOf?: ValueOf
) => any
  ? any
  : never;

export interface DefaultExports extends Function {
  (strings: TemplateStringsArray, ...substitutions: any[]): Template;
  key(key: any): KeyedTemplate;
  render<TState>(
    content: Content,
    options?: RenderOptions<TState>
  ): Application<State<TState>>;
  state<TState = any>(
    initial?: TState
  ): [TState, (value: ((prev: TState) => TState) | TState) => void];
  bind<TValue = any>(initial?: TValue, updateNode?: boolean): Binding<TValue>;

  store<TState = any>(): Store<TState>;
  store<TState>(prop: string): TState;
  store<TState extends Array<any> = any[]>(props: string[]): TState;
  store<TState = any, TSelector = any>(
    selector: TSelector
  ): SelectorResult<TState, TSelector>;

  consume<TValue = any>(): TValue;
  consume<TValue = any>(provider: string | Symbol): TValue;
  provide<TValue>(provider: string, value: TValue, content: Content);
  provide<TValue>(value: TValue, content: Content);

  suspense(fallback: Content, content: Content): Content;

  ref<TValue = any>(initial: TValue | (() => TValue)): { current: TValue };

  effect(effect: Function, deps?: any[]): void;

  memo<TValue = any>(fn: () => TValue, deps?: any[]): TValue;

  callback<TCallback extends Function>(fn: TCallback, deps?: any[]): TCallback;

  debounce<TFunction>(ms: number, fn: TFunction): TFunction;

  lazy<T>(fn: () => Promise<Component<T>>, fallback?: Content): Component<T>;
}

export function arrayEqual<T>(a: T[], b: T[]): boolean;

export function objectEqual(a: {}, b: {}): boolean;

export function isPlainObject(value: any): boolean;

export let emptyArray: any[];

export let emptyObject: {};

declare const hta: DefaultExports;

export default hta;
