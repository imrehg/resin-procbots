import * as Promise from 'bluebird';
import {ReceiptContext} from "./message-handler-types";
// TODO: Rationalise this into fetchThreads, fetchMessages and fetchPMs
// TODO: Rationalise this to return an array of message/thread/PM events
// TODO: Consider the arguments received and whether they should be different
export interface MessageFetcher {
    fetchThread: (event: ReceiptContext, filter: RegExp) => Promise<string[]>;
    fetchPrivateMessages: (event: ReceiptContext, filter: RegExp) => Promise<string[]>;
}
