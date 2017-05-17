import * as Promise from 'bluebird';
import {
    WorkerEvent,
} from '../framework/worker';
import {
    ServiceEmitContext,
    ServiceEmitResponse,
    ServiceEmitter,
    ServiceEvent,
    ServiceListener,
} from '../services/service-types';

type MessageReceiver = (data: MessageEvent) => ReceiptContext;

type MessageTransmitter = (data: TransmitContext) => ServiceEmitContext;

interface MessageEvent extends ServiceEvent {
    cookedEvent: {
        context: string;
        type: string;
        [key: string]: any;
    };
    rawEvent: any;
    source: string;
}
interface MessageWorkerEvent extends WorkerEvent {
    data: MessageEvent;
}

interface MessageIds {
    user?: string;
    message?: string;
    room?: string;
    thread?: string;
    token?: string;
}
interface MessageContext {
    action: 'create'|'update'|'delete';
    origin: string;
    type: 'thread'|'message'; // TODO: Add 1-1 messages (aka PMs)
    hidden: boolean;
    source: string;
    sourceIds?: MessageIds;
    text: string;
    to?: string;
    toIds?: MessageIds;
}

interface ReceiptIds extends MessageIds {
    user: string;
    message?: string;
    room: string;
    thread: string;
}
interface ReceiptContext extends MessageContext {
    action: 'create';
    origin: string;
    type: 'message' | 'thread';
    hidden: boolean;
    source: string;
    sourceIds: ReceiptIds;
    text: string;
}

interface MessageReceiptIds extends ReceiptIds {
    user: string;
    message: string;
    room: string;
    thread: string;
}
interface MessageReceiptContext extends ReceiptContext {
    action: 'create';
    origin: string;
    type: 'message';
    hidden: boolean;
    source: string;
    sourceIds: MessageReceiptIds;
    text: string;
}

interface ThreadReceiptIds extends ReceiptIds {
    user: string;
    room: string;
    thread: string;
}
interface ThreadReceiptContext extends ReceiptContext {
    action: 'create';
    origin: string;
    type: 'thread';
    hidden: false;
    source: string;
    sourceIds: ThreadReceiptIds;
    text: string;
}

interface HandleIds extends MessageIds {
    user?: string;
    room?: string;
    thread?: string;
    token?: string;
}
interface HandleContext extends MessageContext {
    action: 'create';
    origin: string;
    type: 'message' | 'thread';
    hidden: boolean;
    source: string;
    sourceIds: ReceiptIds;
    text: string;
    to: string;
    toIds: HandleIds;
}

interface MessageHandleIds extends HandleIds {
    user?: string;
    room?: string;
    thread?: string;
    token?: string;
}
interface MessageHandleContext extends HandleContext {
    action: 'create';
    origin: string;
    type: 'message';
    hidden: boolean;
    source: string;
    sourceIds: MessageReceiptIds;
    text: string;
    to: string;
    toIds: MessageHandleIds;
}

interface ThreadHandleIds extends HandleIds {
    user?: string;
    room?: string;
    token?: string;
}
interface ThreadHandleContext extends HandleContext {
    action: 'create';
    origin: string;
    type: 'thread';
    hidden: false;
    source: string;
    sourceIds: ThreadReceiptIds;
    text: string;
    to: string;
    toIds: ThreadHandleIds;
}

interface TransmitIds extends MessageIds {
    user: string;
    room: string;
    thread?: string;
    token: string;
}
interface TransmitContext extends MessageContext {
    action: 'create';
    origin: string;
    type: 'message' | 'thread';
    hidden: boolean;
    source: string;
    text: string;
    to: string;
    toIds: TransmitIds;
}

interface MessageTransmitIds extends TransmitIds {
    user: string;
    room: string;
    thread: string;
    token: string;
}
interface MessageTransmitContext extends TransmitContext {
    action: 'create';
    origin: string;
    type: 'message';
    hidden: boolean;
    source: string;
    text: string;
    to: string;
    toIds: MessageTransmitIds;
}

interface ThreadTransmitIds extends TransmitIds {
    user: string;
    room: string;
    token: string;
}
interface ThreadTransmitContext extends TransmitContext {
    action: 'create';
    origin: string;
    type: 'thread';
    hidden: boolean;
    source: string;
    text: string;
    to: string;
    toIds: ThreadTransmitIds;
}

interface EmitResponse extends ServiceEmitResponse {
    response?: {
        ids: {
            message: string,
            thread: string,
        }
        [key: string]: any;
    };
    err?: any;
}

interface MessageEmitter extends ServiceEmitter {
}

interface MessageListener extends ServiceListener {
    // TODO: params and return should be in a message format
    /**
     * Retrieve the comments in a thread that match an optional filter
     * @param event details to identify the event
     * @param filter regex of comments to match
     */
    fetchThread: (event: ReceiptContext, filter: RegExp) => Promise<string[]>;

    // TODO: params and return should be in a message format
    /**
     * Retrieve the hidden message history with a user
     * @param event details of the event to consider
     * @param filter optional criteria that must be met
     */
    fetchPrivateMessages: (event: ReceiptContext, filter: RegExp) => Promise<string[]>;

    // TODO: Specify fetchMessage, and more broadly increase symmetry with MessageEmitter
    // For example fetchThread actually fetches messages and it might be fetchThreads that
    // needs specifying
}
