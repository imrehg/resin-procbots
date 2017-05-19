"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const path = require("path");
const request = require("request-promise");
const message_service_1 = require("./message-service");
class DiscourseService extends message_service_1.MessageService {
    constructor() {
        super(...arguments);
        this.postsSynced = new Set();
    }
    makeGeneric(data) {
        const getGeneric = {
            json: true,
            method: 'GET',
            qs: {
                api_key: process.env.DISCOURSE_LISTENER_ACCOUNT_API_TOKEN,
                api_username: process.env.DISCOURSE_LISTENER_ACCOUNT_USERNAME,
            },
            uri: `https://${process.env.DISCOURSE_INSTANCE_URL}`,
        };
        const getPost = _.cloneDeep(getGeneric);
        getPost.uri += `/posts/${data.rawEvent.id}`;
        const getTopic = _.cloneDeep(getGeneric);
        getTopic.uri += `/t/${data.rawEvent.topic_id}`;
        return Promise.props({
            post: request(getPost),
            topic: request(getTopic),
        })
            .then((details) => {
            const metadata = message_service_1.MessageService.extractMetadata(details.post.raw);
            const first = details.post.post_number === 1;
            return {
                action: 'create',
                first,
                genesis: metadata.genesis || data.source,
                hidden: first ? !details.topic.visible : details.post.post_type === 4,
                source: 'discourse',
                sourceIds: {
                    flow: details.topic.category_id.toString(),
                    message: details.post.id.toString(),
                    thread: details.post.topic_id.toString(),
                    url: getTopic.uri,
                    user: details.post.username,
                },
                text: metadata.content,
                title: details.topic.title,
            };
        });
    }
    makeSpecific(data) {
        const topicId = data.toIds.thread;
        if (!topicId) {
            const title = data.title;
            if (!title) {
                throw new Error('Cannot create Discourse Thread without a title');
            }
            return Promise.resolve({
                api_token: data.toIds.token,
                api_username: data.toIds.user,
                category: data.toIds.flow,
                raw: data.text + '\n\n---\n' + message_service_1.MessageService.stringifyMetadata(data),
                title,
                type: 'topic',
                unlist_topic: data.hidden ? 'true' : 'false',
            });
        }
        return Promise.resolve({
            api_token: data.toIds.token,
            api_username: data.toIds.user,
            raw: data.text + '\n\n---\n' + message_service_1.MessageService.stringifyMetadata(data),
            topic_id: topicId,
            type: 'post',
            whisper: data.hidden ? 'true' : 'false',
        });
    }
    translateEventName(eventType) {
        const equivalents = {
            message: 'post',
        };
        return equivalents[eventType];
    }
    fetchNotes(thread, _room, filter) {
        const getThread = {
            json: true,
            method: 'GET',
            qs: {
                api_key: process.env.DISCOURSE_LISTENER_ACCOUNT_API_TOKEN,
                api_username: process.env.DISCOURSE_LISTENER_ACCOUNT_USERNAME,
            },
            uri: `https://${process.env.DISCOURSE_INSTANCE_URL}/t/${thread}`,
        };
        return request(getThread).then((threadObject) => {
            return _.map(threadObject.post_stream.posts, (item) => {
                return item.cooked;
            }).filter((value) => {
                const match = value.match(filter);
                return match !== null && match.length > 0;
            });
        });
    }
    activateMessageListener() {
        message_service_1.MessageService.app.post(`/${this.serviceName}/`, (formData, response) => {
            if (!this.postsSynced.has(formData.body.post.id)) {
                this.postsSynced.add(formData.body.post.id);
                this.queueEvent({
                    data: {
                        cookedEvent: {
                            context: formData.body.post.topic_id,
                            type: 'post',
                        },
                        rawEvent: formData.body.post,
                        source: this.serviceName,
                    },
                    workerMethod: this.handleEvent,
                });
            }
            response.send();
        });
    }
    sendPayload(data) {
        const body = _.clone(data);
        delete body.api_token;
        delete body.api_username;
        const requestOptions = {
            body,
            json: true,
            qs: { api_key: data.api_token, api_username: data.api_username },
            url: `https://${process.env.DISCOURSE_INSTANCE_URL}/posts`
        };
        return request.post(requestOptions).then((resData) => {
            return {
                response: {
                    message: resData.id,
                    thread: resData.topic_id,
                    url: `https://${process.env.DISCOURSE_INSTANCE_URL}/t/${resData.topic_id}`
                },
                source: this.serviceName,
            };
        });
    }
    get serviceName() {
        return DiscourseService._serviceName;
    }
    get apiHandle() {
        return { discourse: this };
    }
}
DiscourseService._serviceName = path.basename(__filename.split('.')[0]);
exports.DiscourseService = DiscourseService;
function createServiceListener() {
    return new DiscourseService(true);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter() {
    return new DiscourseService(false);
}
exports.createServiceEmitter = createServiceEmitter;
function createMessageService() {
    return new DiscourseService(false);
}
exports.createMessageService = createMessageService;

//# sourceMappingURL=discourse.js.map
