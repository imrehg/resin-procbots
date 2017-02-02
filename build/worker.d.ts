import * as Promise from 'bluebird';
export declare type WorkerMethod = <T>(event: string, data: T) => Promise<void>;
export declare type WorkerRemove = <T>(context: T) => void;
export interface WorkerEvent {
    event: string;
    data: any;
    workerMethod: WorkerMethod;
}
export declare type WorkerMap<T> = Map<T, Worker<T>>;
export declare class Worker<T> {
    private _context;
    private queue;
    private onDone;
    constructor(context: T, onDone: WorkerRemove);
    readonly context: T;
    addEvent(event: WorkerEvent): void;
    private runWorker();
}
