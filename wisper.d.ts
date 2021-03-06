/**
 * Typings for wisper-js
 */

// Messages
export interface Message { }

// A `PlainError` is an error message without an id.
export interface PlainError extends Message {
    error: Error;
}

// An `IdMessage` is a message in a Request/Response-pair.
export interface IdMessage extends Message {
    id: string;
}

// A `Notification` is a message that invokes a method
// with the given parameters. It doesn't require a response.
export interface Notification extends Message {
    method: string;
    params: any[];
}

// A `Request` is like a `Notification`, but requires a response,
// and therefore has an id.
export interface Request extends Notification, IdMessage { }

export interface ResultResponse extends IdMessage {
    result: any;
}

export interface ErrorResponse extends IdMessage {
    error: Error;
}

export interface Error {
    domain: number;
    code: number;
    name: string;
    message: string;
    underlying?: Error;
    data?: any;
}

// Returns true if msg is Message.
export function isMessage(msg: any): msg is PlainError | Notification | Request;
export function isInvoke(msg: Message): msg is Request | Notification;
export function isRequest(msg: Message): msg is Request;
export function isPlainError(msg: Message): msg is PlainError;

// Bridges
export class BaseBridge {
    constructor();
    expose(path: string, router: Router);
    invoke<T>(method: string, params?: any[]): Promise<T>;
    invokeAsync<T>(method: string, params?: any[]): Promise<T>;
    notify(method: string, params?: any[]): void;
    notifyAsync(method: string, params?: any[]): void;
}

export class PropertyBridge extends BaseBridge {
    constructor(object: Object, property: string, sendFunction: (json: string) => void);
}

// Objects
export class Base {
    id: Promise<string>;
    interfaceName: string;
    bridge: BaseBridge;
    ready: Promise<this>;

    constructor(params?: any[]);

    /**
     * Destroys the Base instance. Take extra care to destroy any created Remote instances.
     */
    destroy(): void;

    /**
     * Emits an event locally on the Base instance.
     */
    emit<T>(type: string, value: T): this;

    /**
     * Add a function that listens for events of `type` on the Base instance.
     */
    on<T>(type: string, fn: (t: T) => void): this;

    /**
     * Remove a function that listens for events of `type` on the Base instance.
     */
    off<T>(type: string, fn: (t: T) => void): this;

    /**
     * Dispatches an event across the Base's bridge.
     */
    dispatch<T>(type: string, value: T): void;
}

export class Remote extends Base { }
export class Local extends Base { }

export function createClassRouter(bridge: BaseBridge, name: string, cls: Base): Router;

// Decorators
export function interfaceName(bridge: BaseBridge, name: string): ClassDecorator;

export function properties(properties: WisperTypeMap): ClassDecorator;

// TODO: a property decorator
// export const property: PropertyDecorator & ((defaultValue: any) => PropertyDecorator);

// Routers
interface RouteFunction extends Function {
    (path: string, msg: Message): Promise<any>;
}

interface Router {
    route(path: string, msg: Message): Promise<any>;
}

type PathHandler = Router | RouteFunction;

declare function split(path: string): [string, string];

export class Namespace implements Router {
    constructor();
    route(path: string, msg: Message): Promise<any>;
    expose(path: string, handler: PathHandler): boolean;
}

interface WisperType {
    valid(value: any): boolean;
    default(value: any): WisperType;
}

interface WisperTypeMap {
    [key: string]: WisperType;
}

export namespace types {
    export const any: WisperType;
    export const boolean: WisperType;
    export const number: WisperType;
    export const string: WisperType;

    export function array(type: WisperType): WisperType;
    export function instance(object: typeof Base): WisperType;
    export function object(properties: WisperTypeMap): WisperType;
    export function nullable(type: WisperType): WisperType;
    export function readonly(type: WisperType): WisperType;
}
