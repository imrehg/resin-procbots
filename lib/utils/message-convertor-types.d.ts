import {
    MessageReceiptContext, MessageTransmitContext, ThreadReceiptContext,
    ThreadTransmitContext
} from "./message-handler-types";
import { MessageServiceEmitRequest, MessageWorkerEvent } from "./message-service-types";
import { MessageEventType } from "./message-types";

export interface MessageConverter {
    convertMessageForEmit(data: MessageTransmitContext): MessageServiceEmitRequest;
    convertThreadForEmit(data: ThreadTransmitContext): MessageServiceEmitRequest;
    // TODO: public abstract convertPMForEmit()
    convertReceivedThread(data: MessageWorkerEvent): MessageReceiptContext;
    convertReceivedMessage(data: MessageWorkerEvent): ThreadReceiptContext;
    // TODO: public abstract convertReceivedPM()
    convertTypeForRegistration(data: MessageEventType): string;
    convertReceivedType(data: string): MessageEventType;
}
