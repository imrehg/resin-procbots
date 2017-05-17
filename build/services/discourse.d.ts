import * as Promise from 'bluebird';
import { MessageEmitResponse, ReceiptContext, ThreadTransmitContext, ThreadEmitResponse, MessageTransmitContext } from '../utils/message-types';
import { Messenger } from './messenger';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class DiscourseService extends Messenger implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private topicCache;
    private postsSynced;
    fetchPrivateMessages(_event: ReceiptContext, _filter: RegExp): Promise<string[]>;
    fetchThread(event: ReceiptContext, filter: RegExp): Promise<string[]>;
    protected createThread(_data: ThreadTransmitContext): Promise<ThreadEmitResponse>;
    protected activateMessageListener(): void;
    protected createMessage(data: MessageTransmitContext): Promise<MessageEmitResponse>;
    private fetchTopic(topicId);
    readonly serviceName: string;
}
export declare function createServiceListener(): ServiceListener;
export declare function createServiceEmitter(): ServiceEmitter;
export declare function createMessageService(): Messenger;
