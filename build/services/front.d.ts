import * as Promise from 'bluebird';
import { MessengerEmitResponse, ReceiptContext, TransmitContext } from '../utils/message-types';
import { FrontCommentEmitContext, FrontConversationEmitContext, FrontHandle } from './front-types';
import { MessageService } from './message-service';
import { ServiceEmitter, ServiceEvent, ServiceListener } from './service-types';
export declare class FrontService extends MessageService implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private static session;
    fetchNotes(thread: string, _room: string, filter: RegExp): Promise<string[]>;
    makeGeneric(data: ServiceEvent): Promise<ReceiptContext>;
    makeSpecific(data: TransmitContext): Promise<FrontCommentEmitContext | FrontConversationEmitContext>;
    translateEventName(eventType: string): string;
    protected activateMessageListener(): void;
    protected sendPayload(data: FrontCommentEmitContext | FrontConversationEmitContext): Promise<MessengerEmitResponse>;
    private fetchUserId(username);
    private findConversation(subject, attemptsLeft?);
    readonly serviceName: string;
    readonly apiHandle: FrontHandle;
}
export declare function createServiceListener(): ServiceListener;
export declare function createServiceEmitter(): ServiceEmitter;
export declare function createMessageService(): MessageService;
