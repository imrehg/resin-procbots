import * as Promise from 'bluebird';
import { MessengerEmitResponse, MessengerEvent, ReceiptContext, TransmitContext } from '../utils/message-types';
import { DiscourseHandle, DiscoursePostEmitContext, DiscourseTopicEmitContext } from './discourse-types';
import { MessageService } from './message-service';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class DiscourseService extends MessageService implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private postsSynced;
    makeGeneric(data: MessengerEvent): Promise<ReceiptContext>;
    makeSpecific(data: TransmitContext): Promise<DiscourseTopicEmitContext | DiscoursePostEmitContext>;
    translateEventName(eventType: string): string;
    fetchNotes(thread: string, _room: string, filter: RegExp): Promise<string[]>;
    protected activateMessageListener(): void;
    protected sendPayload(data: DiscoursePostEmitContext | DiscourseTopicEmitContext): Promise<MessengerEmitResponse>;
    readonly serviceName: string;
    readonly apiHandle: DiscourseHandle;
}
export declare function createServiceListener(): ServiceListener;
export declare function createServiceEmitter(): ServiceEmitter;
export declare function createMessageService(): MessageService;
