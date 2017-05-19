"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const procbot_1 = require("../framework/procbot");
const message_service_1 = require("../services/message-service");
const logger_1 = require("../utils/logger");
class SyncBot extends procbot_1.ProcBot {
    constructor(name = 'SyncBot') {
        super(name);
        this.messengers = new Map();
        const mappings = JSON.parse(process.env.SYNCBOT_MAPPINGS);
        for (const mapping of mappings) {
            let priorFlow = null;
            for (const focusFlow of mapping) {
                if (priorFlow) {
                    this.register(priorFlow, focusFlow);
                    this.register(focusFlow, priorFlow);
                }
                priorFlow = focusFlow;
            }
        }
        const hub = require(`../services/${process.env.SYNCBOT_HUB_SERVICE}`);
        this.hub = hub.createDataHub();
    }
    register(from, to) {
        this.addServiceListener(from.service);
        this.addServiceEmitter(from.service);
        const listener = this.getListener(from.service);
        this.addServiceEmitter(to.service);
        if (listener) {
            listener.registerEvent({
                events: [this.getMessageService(from.service).translateEventName('message')],
                listenerMethod: this.createRouter(from, to),
                name: `${from.service}:${from.flow}=>${to.service}:${to.flow}`,
            });
        }
    }
    createRouter(from, to) {
        return (_registration, data) => {
            return this.getMessageService(from.service).makeGeneric(data).then((generic) => {
                if (generic.sourceIds.flow === from.flow
                    && _.intersection([generic.source, generic.genesis], ['system', to.service]).length === 0) {
                    const event = message_service_1.MessageService.initHandleContext(generic, to.service, { flow: to.flow });
                    return this.useConnected(event, 'thread')
                        .then(() => {
                        this.useProvided(event, 'user')
                            .then(() => this.useHubOrGeneric(event, 'token'))
                            .then(() => this.create(event, 'comment'))
                            .then(() => this.logSuccess(event, 'comment'))
                            .catch((error) => this.handleError(error, event));
                    })
                        .catch(() => {
                        this.useProvided(event, 'user')
                            .then(() => this.useHubOrGeneric(event, 'token'))
                            .then(() => this.create(event, 'comment'))
                            .then(() => this.createConnection(event, 'thread'))
                            .then(() => this.logSuccess(event, 'comment'))
                            .catch((error) => this.handleError(error, event));
                    });
                }
                return Promise.resolve();
            });
        };
    }
    handleError(error, event) {
        this.logger.log(logger_1.LogLevel.WARN, error.message);
        this.logger.log(logger_1.LogLevel.WARN, JSON.stringify(event));
        const fromEvent = {
            action: 'create',
            first: false,
            genesis: 'system',
            hidden: true,
            source: 'system',
            sourceIds: {
                flow: '',
                message: '',
                thread: '',
                user: '',
            },
            text: `${event.to} reports \`${error.message}\``,
            to: event.source,
            toIds: {
                flow: event.sourceIds.flow,
                thread: event.sourceIds.thread,
            },
        };
        this.useSystem(fromEvent, 'user')
            .then(() => this.useSystem(fromEvent, 'token'))
            .then(() => this.create(fromEvent, 'comment'))
            .then(() => this.logSuccess(fromEvent, 'comment'))
            .catch((err) => this.logError(err, event));
    }
    getMessageService(key, data) {
        const retrieved = this.messengers.get(key);
        if (retrieved) {
            return retrieved;
        }
        const service = require(`../services/${key}`);
        const created = service.createMessageService(data);
        this.messengers.set(key, created);
        return created;
    }
    createConnection(event, type) {
        const sourceId = event.sourceIds.thread;
        const toId = event.toIds.thread;
        if (!sourceId || !toId) {
            return Promise.reject(new Error(`Could not form ${type} connection`));
        }
        const genericEvent = {
            action: 'create',
            first: false,
            genesis: 'system',
            hidden: true,
            source: 'system',
            sourceIds: {
                flow: '',
                message: '',
                thread: '',
                user: '',
            },
            text: 'duff',
            to: 'duff',
            toIds: {},
        };
        const toEvent = _.cloneDeep(genericEvent);
        toEvent.text = `[Connects to ${event.source} ${type} ${sourceId}](${event.sourceIds.url})`;
        toEvent.to = event.to;
        toEvent.toIds = event.toIds;
        const fromEvent = _.cloneDeep(genericEvent);
        fromEvent.text = `[Connects to ${event.to} ${type} ${toId}](${event.toIds.url})`;
        fromEvent.to = event.source;
        fromEvent.toIds = event.sourceIds;
        return Promise.all([
            this.useSystem(fromEvent, 'user')
                .then(() => this.useSystem(fromEvent, 'token'))
                .then(() => this.create(fromEvent, 'comment'))
                .then(() => this.logSuccess(fromEvent, 'comment')),
            this.useSystem(toEvent, 'user')
                .then(() => this.useSystem(toEvent, 'token'))
                .then(() => this.create(toEvent, 'comment'))
                .then(() => this.logSuccess(toEvent, 'comment'))
        ]).reduce(() => { });
    }
    create(event, _type) {
        return this.getMessageService(event.to).makeSpecific(event).then((specific) => {
            return this.dispatchToEmitter(event.to, {
                contexts: {
                    [event.to]: specific
                },
                source: event.source
            })
                .then((retVal) => {
                event.toIds.message = retVal.response.message;
                event.toIds.thread = retVal.response.thread;
                event.toIds.url = retVal.response.url;
                return retVal.response.message;
            });
        });
    }
    logSuccess(event, _type) {
        const output = { source: event.source, title: event.title, text: event.text, target: event.to };
        this.logger.log(logger_1.LogLevel.INFO, `Synced: ${JSON.stringify(output)}`);
    }
    logError(error, event) {
        this.logger.log(logger_1.LogLevel.WARN, 'v!!!v');
        this.logger.log(logger_1.LogLevel.WARN, error.message);
        this.logger.log(logger_1.LogLevel.WARN, JSON.stringify(event));
        this.logger.log(logger_1.LogLevel.WARN, '^!!!^');
    }
    useHubOrGeneric(event, type) {
        return this.useHub(event, type)
            .catch(() => this.useGeneric(event, type))
            .catchThrow(new Error(`Could not find hub or generic ${type} for ${event.to}`));
    }
    useProvided(event, type) {
        return new Promise((resolve) => {
            if (!event.sourceIds[type]) {
                throw new Error(`Could not find provided ${type} for ${event.to}`);
            }
            event.toIds[type] = event.sourceIds[type];
            resolve(event.toIds[type]);
        });
    }
    useGeneric(event, type) {
        return new Promise((resolve) => {
            const to = event.to;
            const genericAccounts = JSON.parse(process.env.SYNCBOT_GENERIC_AUTHOR_ACCOUNTS);
            if (!genericAccounts[to] || !genericAccounts[to][type]) {
                throw new Error(`Could not find generic ${type} for ${event.to}`);
            }
            event.toIds[type] = genericAccounts[to][type];
            resolve(genericAccounts[to][type]);
        });
    }
    useSystem(event, type) {
        return new Promise((resolve) => {
            const to = event.to;
            const systemAccounts = JSON.parse(process.env.SYNCBOT_SYSTEM_MESSAGE_ACCOUNTS);
            if (!systemAccounts[to] || !systemAccounts[to][type]) {
                throw new Error(`Could not find system ${type} for ${event.to}`);
            }
            event.toIds[type] = systemAccounts[to][type];
            resolve(systemAccounts[to][type]);
        });
    }
    useConnected(event, type) {
        const findId = new RegExp(`Connects to ${event.to} ${type} ([\\w\\d-+\\/=]+)`, 'i');
        const messageService = this.getMessageService(event.source);
        return messageService.fetchNotes(event.sourceIds.thread, event.sourceIds.flow, findId)
            .then((result) => {
            const ids = result && result.length > 0 && result[0].match(findId);
            if (ids && ids.length > 0) {
                event.toIds.thread = ids[1];
                return ids[1];
            }
            throw new Error(`Could not find connected ${type} for ${event.to}`);
        });
    }
    useHub(event, type) {
        let user = undefined;
        if (event.source === process.env.SYNCBOT_HUB_SERVICE) {
            user = event.sourceIds.user;
        }
        else if (event.to === process.env.SYNCBOT_HUB_SERVICE) {
            user = event.toIds.user;
        }
        if (user) {
            return this.hub.fetchValue(user, `${event.to} ${type}`)
                .then((value) => {
                event.toIds[type] = value;
                return value;
            })
                .catch(() => {
                throw new Error(`Could not find hub ${type} for ${event.to}`);
            });
        }
        else {
            return Promise.reject(new Error(`Could not find hub ${type} for ${event.to}`));
        }
    }
}
exports.SyncBot = SyncBot;
function createBot() {
    return new SyncBot(process.env.SYNCBOT_NAME);
}
exports.createBot = createBot;

//# sourceMappingURL=syncbot.js.map
