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

type MessageReceiver = (data: MessageEvent) => ListenContext;

type MessageTransmitter = (data: EmitContext) => ServiceEmitContext;

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
    private: boolean;
    source: string;
    sourceIds?: MessageIds;
    text: string;
    to?: string;
    toIds?: MessageIds;
}

interface ListenIds extends MessageIds {
    user: string;
    message?: string;
    room: string;
    thread: string;
}
interface ListenContext extends MessageContext {
    action: 'create';
    origin: string;
    type: 'message' | 'thread';
    private: boolean;
    source: string;
    sourceIds: ListenIds;
    text: string;
}

interface MessageListenIds extends ListenIds {
    user: string;
    message: string;
    room: string;
    thread: string;
}
interface MessageListenContext extends ListenContext {
    action: 'create';
    origin: string;
    type: 'message';
    private: boolean;
    source: string;
    sourceIds: MessageListenIds;
    text: string;
}

interface ThreadListenIds extends ListenIds {
    user: string;
    room: string;
    thread: string;
}
interface ThreadListenContext extends ListenContext {
    action: 'create';
    origin: string;
    type: 'thread';
    private: false;
    source: string;
    sourceIds: ThreadListenIds;
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
    private: boolean;
    source: string;
    sourceIds: ListenIds;
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
    private: boolean;
    source: string;
    sourceIds: MessageListenIds;
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
    private: false;
    source: string;
    sourceIds: ThreadListenIds;
    text: string;
    to: string;
    toIds: ThreadHandleIds;
}

interface EmitIds extends MessageIds {
    user: string;
    room: string;
    thread?: string;
    token: string;
}
interface EmitContext extends MessageContext {
    action: 'create';
    origin: string;
    type: 'message' | 'thread';
    private: boolean;
    source: string;
    text: string;
    to: string;
    toIds: EmitIds;
}

interface MessageEmitIds extends EmitIds {
    user: string;
    room: string;
    thread: string;
    token: string;
}
interface MessageEmitContext extends EmitContext {
    action: 'create';
    origin: string;
    type: 'message';
    private: boolean;
    source: string;
    text: string;
    to: string;
    toIds: MessageEmitIds;
}

interface ThreadEmitIds extends EmitIds {
    user: string;
    room: string;
    token: string;
}
interface ThreadEmitContext extends EmitContext {
    action: 'create';
    origin: string;
    type: 'thread';
    private: boolean;
    source: string;
    text: string;
    to: string;
    toIds: ThreadEmitIds;
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

interface MessageEmitResponse extends EmitResponse {
}

interface ThreadEmitResponse extends EmitResponse {
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
    fetchThread: (event: ListenContext, filter: RegExp) => Promise<string[]>;

    // TODO: params and return should be in a message format
    /**
     * Retrieve the private message history with a user
     * @param event details of the event to consider
     * @param filter optional criteria that must be met
     */
    fetchPrivateMessages: (event: ListenContext, filter: RegExp) => Promise<string[]>;

    // TODO: Specify fetchMessage, and more broadly increase symettry with MessageEmitter
    // For example fetchThread actually fetches messages and it might be fetchThreads that
    // needs specifying
}
