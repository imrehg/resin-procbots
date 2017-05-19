"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const bodyParser = require("body-parser");
const express = require("express");
const worker_1 = require("../framework/worker");
const worker_client_1 = require("../framework/worker-client");
const logger_1 = require("../utils/logger");
class MessageService extends worker_client_1.WorkerClient {
    constructor(listener) {
        super();
        this.listening = false;
        this._eventListeners = {};
        this.handleEvent = (event) => {
            const listeners = this._eventListeners[event.cookedEvent.type] || [];
            return Promise.map(listeners, (listener) => {
                return listener.listenerMethod(listener, event);
            }).return();
        };
        this.getWorker = (event) => {
            const context = event.data.cookedEvent.context;
            const retrieved = this.workers.get(context);
            if (retrieved) {
                return retrieved;
            }
            const created = new worker_1.Worker(context, this.removeWorker);
            this.workers.set(context, created);
            return created;
        };
        if (listener) {
            this.listen();
        }
    }
    static initHandleContext(event, to, toIds = {}) {
        return {
            action: event.action,
            first: event.first,
            genesis: event.genesis,
            hidden: event.hidden,
            source: event.source,
            sourceIds: event.sourceIds,
            text: event.text,
            title: event.title,
            to,
            toIds,
        };
    }
    static stringifyMetadata(data, format = 'markdown') {
        const publicIndicator = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS)[0];
        const privateIndicator = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVATE_INDICATORS)[0];
        switch (format) {
            case 'markdown':
                return `[${data.hidden ? privateIndicator : publicIndicator}](${data.source})`;
            case 'plaintext':
                return `${data.hidden ? privateIndicator : publicIndicator}${data.source}`;
            default:
                throw new Error(`${format} format not recognised`);
        }
    }
    static extractMetadata(message) {
        const visibleArray = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS);
        const visible = visibleArray.join('|\\');
        const hidden = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVATE_INDICATORS).join('|\\');
        const findMetadata = new RegExp(`(?:^|\\r|\\n)(?:\\s*)\\[?(${hidden}|${visible})\\]?\\(?(\\w*)\\)?`, 'i');
        const metadata = message.match(findMetadata);
        if (metadata) {
            return {
                content: message.replace(findMetadata, '').trim(),
                genesis: metadata[2] || null,
                hidden: !visibleArray.includes(metadata[1]),
            };
        }
        return {
            content: message,
            genesis: null,
            hidden: true,
        };
    }
    static get app() {
        if (!MessageService._app) {
            const port = process.env.MESSAGE_SERVICE_PORT || process.env.PORT;
            if (!port) {
                throw new Error('No inbound port specified for express server');
            }
            MessageService._app = express();
            MessageService._app.use(bodyParser.json());
            MessageService._app.listen(port);
            MessageService.logger.log(logger_1.LogLevel.INFO, `---> Started express webserver on port '${port}'`);
        }
        return MessageService._app;
    }
    listen() {
        if (!this.listening) {
            this.listening = true;
            this.activateMessageListener();
            MessageService.logger.log(logger_1.LogLevel.INFO, `---> Started '${this.serviceName}' listener`);
        }
    }
    registerEvent(registration) {
        for (const event of registration.events) {
            if (this._eventListeners[event] == null) {
                this._eventListeners[event] = [];
            }
            this._eventListeners[event].push(registration);
        }
    }
    sendData(data) {
        if (data.contexts[this.serviceName]) {
            return this.sendPayload(data.contexts[this.serviceName]);
        }
        return Promise.resolve({
            err: new Error(`No ${this.serviceName} context`),
            source: this.serviceName,
        });
    }
    queueEvent(data) {
        super.queueEvent(data);
    }
}
MessageService.logger = new logger_1.Logger();
exports.MessageService = MessageService;

//# sourceMappingURL=message-service.js.map
