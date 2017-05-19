"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const front_sdk_1 = require("front-sdk");
const _ = require("lodash");
const path = require("path");
const request = require("request-promise");
const message_service_1 = require("./message-service");
class FrontService extends message_service_1.MessageService {
    fetchNotes(thread, _room, filter) {
        return FrontService.session.conversation.listComments({ conversation_id: thread })
            .then((comments) => {
            return _.filter(comments._results, (value) => {
                return filter.test(value.body);
            }).map((value) => {
                return value.body;
            });
        });
    }
    makeGeneric(data) {
        const getGeneric = {
            headers: {
                authorization: `Bearer ${process.env.FRONT_LISTENER_ACCOUNT_API_TOKEN}`
            },
            json: true,
            method: 'GET',
            uri: '',
        };
        const getEvent = _.cloneDeep(getGeneric);
        getEvent.uri = `https://api2.frontapp.com/events/${data.rawEvent.id}`;
        const getInboxes = _.cloneDeep(getGeneric);
        getInboxes.uri = `https://api2.frontapp.com/conversations/${data.rawEvent.conversation.id}/inboxes`;
        const getMessages = _.cloneDeep(getGeneric);
        getMessages.uri = `https://api2.frontapp.com/conversations/${data.rawEvent.conversation.id}/messages`;
        const getComments = _.cloneDeep(getGeneric);
        getComments.uri = `https://api2.frontapp.com/conversations/${data.rawEvent.conversation.id}/comments`;
        return Promise.props({
            comments: request(getComments),
            event: request(getEvent),
            inboxes: request(getInboxes),
            messages: request(getMessages),
        })
            .then((details) => {
            const message = details.event.target.data;
            const first = details.comments._results.length + details.messages._results.length === 1;
            const metadata = message_service_1.MessageService.extractMetadata(message.text || message.body);
            let author = 'Unknown';
            if (message.author) {
                author = message.author.username;
            }
            else {
                for (const recipient of message.recipients) {
                    if (recipient.role === 'from') {
                        author = recipient.handle;
                    }
                }
            }
            return {
                action: 'create',
                first,
                genesis: metadata.genesis || data.source || this.serviceName,
                hidden: first ? metadata.hidden : details.event.type === 'comment',
                source: this.serviceName,
                sourceIds: {
                    flow: details.inboxes._results[0].id,
                    message: message.id,
                    thread: details.event.conversation.id,
                    url: `https://app.frontapp.com/open/${details.event.conversation.id}`,
                    user: author,
                },
                text: metadata.content,
                title: details.event.conversation.subject,
            };
        });
    }
    makeSpecific(data) {
        const conversationId = data.toIds.thread;
        if (!conversationId) {
            const subject = data.title;
            if (!subject) {
                throw new Error('Cannot create Front Conversation without a title');
            }
            return this.fetchUserId(data.toIds.user).then((userId) => {
                return {
                    author_id: userId,
                    body: data.text + '\n\n---\n' + message_service_1.MessageService.stringifyMetadata(data, 'plaintext'),
                    channel_id: JSON.parse(process.env.FRONT_INBOX_CHANNELS)[data.toIds.flow],
                    metadata: {
                        thread_ref: data.sourceIds.thread,
                    },
                    options: {
                        archive: false,
                    },
                    sender: {
                        handle: data.toIds.user,
                    },
                    subject,
                    to: [data.sourceIds.user],
                    type: 'conversation',
                };
            });
        }
        return Promise.props({
            conversation: FrontService.session.conversation.get({ conversation_id: conversationId }),
            userId: this.fetchUserId(data.toIds.user)
        }).then((details) => {
            return {
                author_id: details.userId,
                body: data.text + '\n\n---\n' + message_service_1.MessageService.stringifyMetadata(data, 'plaintext'),
                conversation_id: conversationId,
                options: {
                    archive: false,
                },
                sender: {
                    handle: data.toIds.user,
                },
                subject: details.conversation.subject,
                type: data.hidden ? 'comment' : 'message',
            };
        });
    }
    translateEventName(eventType) {
        const equivalents = {
            message: 'event',
        };
        return equivalents[eventType];
    }
    activateMessageListener() {
        message_service_1.MessageService.app.post('/front-dev-null', (_formData, response) => {
            response.send();
        });
        message_service_1.MessageService.app.post(`/${this.serviceName}/`, (formData, response) => {
            this.queueEvent({
                data: {
                    cookedEvent: {
                        context: formData.body.conversation.id,
                        type: 'event',
                    },
                    rawEvent: formData.body,
                    source: this.serviceName,
                },
                workerMethod: this.handleEvent,
            });
            response.send();
        });
    }
    sendPayload(data) {
        if (data.type === 'comment') {
            return FrontService.session.comment.create(data).then((comment) => {
                return {
                    response: {
                        message: comment.id,
                        thread: data.conversation_id,
                    },
                    source: this.serviceName,
                };
            });
        }
        else if (data.type === 'message') {
            return FrontService.session.message.reply(data).then(() => {
                return {
                    response: {
                        message: `${data.author_id}:${new Date().getTime()}`,
                        thread: data.conversation_id,
                    },
                    source: this.serviceName,
                };
            });
        }
        else if (data.type === 'conversation') {
            return FrontService.session.message.send(data).then(() => {
                return this.findConversation(data.subject)
                    .then((conversationId) => {
                    return {
                        response: {
                            message: `${data.author_id}:${new Date().getTime()}`,
                            thread: conversationId,
                            url: `https://app.frontapp.com/open/${conversationId}`,
                        },
                        source: this.serviceName,
                    };
                });
            });
        }
        throw new Error(`Front payload type ${data.type} not supported`);
    }
    fetchUserId(username) {
        const getTeammates = {
            headers: {
                authorization: `Bearer ${process.env.FRONT_LISTENER_ACCOUNT_API_TOKEN}`
            },
            json: true,
            method: 'GET',
            uri: 'https://api2.frontapp.com/teammates',
        };
        return request(getTeammates).then((teammates) => {
            return _.filter(teammates._results, (teammate) => {
                return teammate.username === username;
            }).map((teammate) => {
                return teammate.id;
            })[0];
        });
    }
    findConversation(subject, attemptsLeft = 10) {
        return FrontService.session.conversation.list().then((response) => {
            const conversationsMatched = _.filter(response._results, (conversation) => {
                return conversation.subject === subject;
            });
            if (conversationsMatched.length > 0) {
                return conversationsMatched[0].id;
            }
            if (attemptsLeft > 1) {
                return this.findConversation(subject, attemptsLeft - 1);
            }
            else {
                throw new Error('Could not find relevant conversation.');
            }
        });
    }
    get serviceName() {
        return FrontService._serviceName;
    }
    get apiHandle() {
        return {
            front: FrontService.session
        };
    }
}
FrontService._serviceName = path.basename(__filename.split('.')[0]);
FrontService.session = new front_sdk_1.Front(process.env.FRONT_LISTENER_ACCOUNT_API_TOKEN);
exports.FrontService = FrontService;
function createServiceListener() {
    return new FrontService(true);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter() {
    return new FrontService(false);
}
exports.createServiceEmitter = createServiceEmitter;
function createMessageService() {
    return new FrontService(false);
}
exports.createMessageService = createMessageService;

//# sourceMappingURL=front.js.map
