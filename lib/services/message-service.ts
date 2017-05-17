import * as Promise from 'bluebird';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import {
    Logger,
    LogLevel,
} from '../utils/logger';
import {
    ServiceEmitter, ServiceListener,
    ServiceRegistration,
} from './service-types';
import {
    MessageServiceEmitContext,
    MessageServiceEmitRequest, MessageServiceEmitResponse, MessageServiceEvent,
    MessageWorkerEvent
} from "../utils/message-service-types";

/**
 * Abstract class to define a common set of utilities and standards for all messenger classes
 */
export abstract class MessageService extends WorkerClient<string|null> implements ServiceListener, ServiceEmitter {
    private static _logger = new Logger();
    private static _app: express.Express;
    private _listening: boolean = false;
    private _eventListeners: { [event: string]: ServiceRegistration[] } = {};

    /**
     * All messenger classes share a single express instance
     */
    protected static get app(): express.Express {
        // Heroku uses process.env.PORT to indicate which local area port the edge NAT maps down to
        const port = process.env.MESSAGE_SERVICE_PORT || process.env.PORT;
        if (!port) {
            throw new Error('No inbound port specified for express server');
        }
        if (!MessageService._app) {
            MessageService._app = express();
            MessageService._app.use(bodyParser.json());
            MessageService._app.listen(port);
            MessageService.logger.log(LogLevel.INFO, `---> Started express server on port ${port}`);
        }
        return MessageService._app;
    }

    protected static get logger(): Logger {
        return MessageService._logger;
    }

    /**
     * @param listener selector for whether this instance should listen
     */
    constructor(listener: boolean) {
        super();
        if (listener) {
            this.listen();
        }
    }

    /**
     * Express an interest in a particular type of event
     * @param registration Object detailing event type, callback, etc
     */
    public registerEvent(registration: ServiceRegistration): void {
        // For each event type being registered
        for (const event of registration.events) {
            // Ensure we have a listener array for it
            if (this._eventListeners[event] == null) {
                this._eventListeners[event] = [];
            }
            // Store the expression of interest
            this._eventListeners[event].push(registration);
        }
    }

    /**
     * Emit data to the external service
     * @param data ServiceEmitRequest to parse
     */
    public sendData(data: MessageServiceEmitRequest): Promise<MessageServiceEmitResponse> {
        // Check the contexts for relevance before passing down the inheritance
        if (data.contexts[this.serviceName]) {
            return this.sendPayload(data.contexts[this.serviceName])
        } else {
            // If we have a context to emit to this service, then no-op is correct resolution
            return Promise.resolve({
                err: new Error(`No ${this.serviceName} context`),
                source: this.serviceName,
            });
        }
    }

    /**
     * Enqueue a MessageWorkerEvent
     * @param data event to enqueue
     */
    public queueEvent(data: MessageWorkerEvent) {
        // This simply passes it up the chain...
        // but ensures that MessageServices only enqueue the correct type
        super.queueEvent(data);
    }

    /**
     * Actually deliver the data to the API
     * @param data
     */
    protected abstract sendPayload(data: MessageServiceEmitContext): Promise<MessageServiceEmitResponse>

    /**
     * Activate this object as a listener
     */
    protected abstract activateMessageListener(): void;

    //noinspection JSMethodCanBeStatic
    /**
     * Retrieve the scope for event order preservation
     * @param event details to examine
     */
    protected getWorkerContextFromMessage(event: MessageServiceEvent): string {
        return event.cookedEvent.context;
    }

    //noinspection JSMethodCanBeStatic
    /**
     * Retrieve the event type for event firing
     * @param event details to examine
     */
    protected getEventTypeFromMessage(event: MessageServiceEvent): string {
        return event.cookedEvent.type;
    }

    /**
     * Handle an event once it's turn in the queue comes round
     * Bound to the object instance using =>
     */
    protected handleEvent = (event: MessageServiceEvent): Promise<void> => {
        // Retrieve and execute all the listener methods, squashing their responses
        const listeners = this._eventListeners[this.getEventTypeFromMessage(event)] || [];
        return Promise.map(listeners, (listener) => {
            return listener.listenerMethod(listener, event);
        }).return();
    };

    /**
     * Retrieve or create a worker for an event
     * Bound to the object instance using =>
     */
    protected getWorker = (event: MessageWorkerEvent): Worker<string|null> => {
        // Attempt to retrieve an active worker for the context
        const context = this.getWorkerContextFromMessage(event.data);
        const retrieved = this.workers.get(context);
        if (retrieved) {
            return retrieved;
        // Create and store a worker for the context
        } else {
            const created = new Worker<string>(context, this.removeWorker);
            this.workers.set(context, created);
            return created;
        }
    };

    /**
     * Instruct the child to start listening if we haven't already
     */
    private listen() {
        if (!this._listening) {
            this._listening = true;
            this.activateMessageListener();
            MessageService.logger.log(LogLevel.INFO, `---> Started '${this.serviceName}' listener`);
        }
    }

    /**
     * get the service name, as required by the framework
     */
    abstract get serviceName(): string
}
