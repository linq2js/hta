export interface Template {}

export interface PlainObject {
  [key: string]: any;
}

export type Middleware<TState> = (
  api: ApplicationApi<TState>
) => ApplicationApi<TState>;

export interface ComponentProps extends PlainObject {}

export type Component<TProps = ComponentProps> = (props?: TProps) => any;

export type Action<TState, TPayload> = (
  state?: TState,
  payload?: TPayload
) => any;

export interface ApplicationApi<TState> {
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

export interface Application<TState> extends ApplicationApi<TState> {
  readonly state: TState;
  // update(): void;
}

export interface DefaultExports {
  (strings: TemplateStringsArray, ...args: any[]): Template;
  <TState>(
    component: Component<TState>,
    options?: ApplicationOptions<TState>
  ): Application<TState>;
  <TState>(
    template: Template,
    options?: ApplicationOptions<TState>
  ): Application<TState>;
}

declare const hta: DefaultExports;

export default hta;
