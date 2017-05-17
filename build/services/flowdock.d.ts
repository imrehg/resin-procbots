import * as Promise from 'bluebird';
import { MessageEmitResponse, ReceiptContext } from '../utils/message-types';
import { Messenger } from './messenger';
import { ServiceEmitter, ServiceListener, ServiceEmitContext } from './service-types';
export declare class FlowdockService extends Messenger implements ServiceEmitter, ServiceListener {
    private static session;
    private static _serviceName;
    private flowIdToFlowName;
    fetchThread(event: ReceiptContext, filter: RegExp): Promise<string[]>;
    fetchPrivateMessages(event: ReceiptContext, filter: RegExp): Promise<string[]>;
    protected activateMessageListener(): void;
    protected createMessage(data: ServiceEmitContext): Promise<MessageEmitResponse>;
    readonly serviceName: string;
}
export declare function createServiceListener(): ServiceListener;
export declare function createServiceEmitter(): ServiceEmitter;
export declare function createMessageService(): Messenger;
