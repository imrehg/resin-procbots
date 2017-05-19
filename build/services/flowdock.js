"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const _ = require("lodash");
const path = require("path");
const request = require("request-promise");
const message_service_1 = require("./message-service");
class FlowdockService extends message_service_1.MessageService {
    makeGeneric(data) {
        const metadata = message_service_1.MessageService.extractMetadata(data.rawEvent.content);
        const titleAndText = metadata.content.match(/^(.*)\n--\n((?:\r|\n|.)*)$/);
        const flow = data.cookedEvent.flow;
        const thread = data.rawEvent.thread_id;
        const userId = data.rawEvent.user;
        const org = process.env.FLOWDOCK_ORGANIZATION_NAME;
        const returnValue = {
            action: 'create',
            first: data.rawEvent.id === data.rawEvent.thread.initial_message,
            genesis: metadata.genesis || data.source,
            hidden: metadata.hidden,
            source: data.source,
            sourceIds: {
                message: data.rawEvent.id,
                flow,
                thread,
                url: `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`,
                user: 'duff',
            },
            text: titleAndText ? titleAndText[2] : metadata.content,
            title: titleAndText ? titleAndText[1] : undefined,
        };
        if (data.rawEvent.external_user_name) {
            returnValue.sourceIds.user = data.rawEvent.external_user_name;
            return Promise.resolve(returnValue);
        }
        return this.fetchFromSession(`/organizations/${org}/users/${userId}`)
            .then((user) => {
            returnValue.sourceIds.user = user.nick;
            return returnValue;
        });
    }
    makeSpecific(data) {
        const titleText = data.first && data.title ? data.title + '\n--\n' : '';
        return Promise.resolve({
            content: message_service_1.MessageService.stringifyMetadata(data) + titleText + data.text,
            event: 'message',
            external_user_name: data.toIds.token === process.env.FLOWDOCK_LISTENER_ACCOUNT_API_TOKEN
                ? data.toIds.user.substring(0, 16) : undefined,
            flow: data.toIds.flow,
            thread_id: data.toIds.thread,
            token: data.toIds.token,
        });
    }
    translateEventName(eventType) {
        const equivalents = {
            message: 'message',
        };
        return equivalents[eventType];
    }
    fetchNotes(thread, room, filter) {
        const org = process.env.FLOWDOCK_ORGANIZATION_NAME;
        return this.fetchFromSession(`/flows/${org}/${room}/threads/${thread}/messages`)
            .then((messages) => {
            return _.map(messages, (value) => {
                return value.content;
            }).filter((value) => {
                const match = value.match(filter);
                return match !== null && match.length > 0;
            });
        });
    }
    fetchValue(user, key) {
        const findKey = new RegExp(`My ${key} is (\\S+)`, 'i');
        return this.fetchPrivateMessages(user, findKey).then((valueArray) => {
            const value = valueArray[valueArray.length - 1].match(findKey);
            if (value) {
                return value[1];
            }
            throw new Error(`Could not find value $key for $user`);
        });
    }
    activateMessageListener() {
        FlowdockService.session.flows((error, flows) => {
            if (error) {
                throw error;
            }
            const flowIdToFlowName = {};
            for (const flow of flows) {
                flowIdToFlowName[flow.id] = flow.parameterized_name;
            }
            const stream = FlowdockService.session.stream(Object.keys(flowIdToFlowName));
            stream.on('message', (message) => {
                if (message.event === 'message') {
                    this.queueEvent({
                        data: {
                            cookedEvent: {
                                context: message.thread_id,
                                flow: flowIdToFlowName[message.flow],
                                type: message.event,
                            },
                            rawEvent: message,
                            source: this.serviceName,
                        },
                        workerMethod: this.handleEvent,
                    });
                }
            });
        });
        message_service_1.MessageService.app.get(`/${this.serviceName}/`, (_formData, response) => {
            response.send('ok');
        });
    }
    sendPayload(data) {
        const body = _.cloneDeep(data);
        const org = process.env.FLOWDOCK_ORGANIZATION_NAME;
        const token = new Buffer(data.token).toString('base64');
        delete body.token;
        const requestOpts = {
            body,
            headers: {
                'Authorization': `Basic ${token}`,
                'X-flowdock-wait-for-message': true,
            },
            json: true,
            url: `https://api.flowdock.com/flows/${org}/${body.flow}/messages/`,
        };
        return request.post(requestOpts).then((resData) => {
            return {
                response: {
                    message: resData.id,
                    thread: resData.thread_id,
                    url: `https://www.flowdock.com/app/${org}/${body.flow}/threads/${resData.thread_id}`,
                },
                source: this.serviceName,
            };
        });
    }
    fetchPrivateMessages(username, filter) {
        return this.fetchUserId(username)
            .then((userId) => {
            return this.fetchFromSession(`/private/${userId}/messages`)
                .then((fetchedMessages) => {
                return (_.filter(fetchedMessages, (message) => {
                    return filter.test(message.content);
                }).map((message) => {
                    return message.content;
                }));
            });
        });
    }
    fetchUserId(username) {
        return this.fetchFromSession(`/organizations/${process.env.FLOWDOCK_ORGANIZATION_NAME}/users`)
            .then((foundUsers) => {
            const matchingUsers = _.filter(foundUsers, (eachUser) => {
                return eachUser.nick === username;
            });
            if (matchingUsers.length === 1) {
                return (matchingUsers[0].id);
            }
            else {
                throw new Error('Wrong number of users found in flowdock');
            }
        });
    }
    fetchFromSession(path) {
        return new Promise((resolve, reject) => {
            FlowdockService.session.on('error', reject);
            FlowdockService.session.get(path, {}, (_error, result) => {
                FlowdockService.session.removeListener('error', reject);
                if (result) {
                    resolve(result);
                }
            });
        });
    }
    get serviceName() {
        return FlowdockService._serviceName;
    }
    get apiHandle() {
        return {
            flowdock: FlowdockService.session
        };
    }
}
FlowdockService._serviceName = path.basename(__filename.split('.')[0]);
FlowdockService.session = new flowdock_1.Session(process.env.FLOWDOCK_LISTENER_ACCOUNT_API_TOKEN);
exports.FlowdockService = FlowdockService;
function createServiceListener() {
    return new FlowdockService(true);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter() {
    return new FlowdockService(false);
}
exports.createServiceEmitter = createServiceEmitter;
function createMessageService() {
    return new FlowdockService(false);
}
exports.createMessageService = createMessageService;
function createDataHub() {
    return new FlowdockService(false);
}
exports.createDataHub = createDataHub;

//# sourceMappingURL=flowdock.js.map
