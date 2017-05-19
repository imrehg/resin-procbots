/*
 Copyright 2016-2017 Resin.io

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import * as Promise from 'bluebird';

import {
    WorkerEvent,
} from '../framework/worker';
import {
    ServiceEmitResponse,
    ServiceEvent,
} from '../services/service-types';

interface MessengerEvent extends ServiceEvent {
    cookedEvent: {
        context: string;
        type: string;
        [key: string]: any;
    };
    rawEvent: any;
    source: string;
}
interface MessengerWorkerEvent extends WorkerEvent {
    data: MessengerEvent;
}

// Generic forms of message objects
interface MessengerIds {
    user?: string;
    message?: string;
    thread?: string;
    token?: string;
    flow?: string;
    url?: string;
}
interface MessengerContext {
    action: 'create';
    first: boolean;
    genesis: string;
    hidden: boolean;
    source: string;
    sourceIds?: MessengerIds;
    text: string;
    title?: string;
    to?: string;
    toIds?: MessengerIds;
}

// Message objects suitable for the receipt of messages
interface ReceiptIds extends MessengerIds {
    user: string;
    message: string;
    thread: string;
    flow: string;
    url?: string;
}
interface ReceiptContext extends MessengerContext {
    action: 'create';
    first: boolean;
    genesis: string;
    hidden: boolean;
    source: string;
    sourceIds: ReceiptIds;
    text: string;
    title?: string;
}

// Message objects suitable for the handling of messages
interface HandleIds extends MessengerIds {
    user?: string;
    thread?: string;
    token?: string;
    flow?: string;
    url?: string;
}
interface HandleContext extends MessengerContext {
    action: 'create';
    first: boolean;
    genesis: string;
    hidden: boolean;
    source: string;
    sourceIds: ReceiptIds;
    text: string;
    title?: string;
    to: string;
    toIds: HandleIds;
}

// Message objects suitable for the transmission of messages
interface TransmitIds extends MessengerIds {
    user: string;
    thread?: string;
    token: string;
    flow: string;
    url?: string;
}
interface TransmitContext extends MessengerContext {
    action: 'create';
    first: boolean;
    genesis: string;
    hidden: boolean;
    source: string;
    sourceIds: ReceiptIds;
    text: string;
    title?: string;
    to: string;
    toIds: TransmitIds;
}

interface MessengerEmitResponse extends ServiceEmitResponse {
    response?: {
        message: string;
        thread: string;
        url?: string;
    };
    err?: any;
}

interface Metadata {
    genesis: string | null;
    hidden: boolean;
    content: string;
}

interface FlowDefinition {
    service: string;
    flow: string;
}

interface DataHub {
    fetchValue(user: string, value: string): Promise<string>;
}
