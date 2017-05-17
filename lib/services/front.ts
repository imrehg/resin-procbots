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
import * as path from 'path';
import { MessageEmitResponse } from '../utils/message-types';
import { MessageService } from './message-service';
import { ServiceEmitContext, ServiceEmitter, ServiceListener } from './service-types';

/**
 * Class for interacting with the Front SDK
 * Is a MessageService, ServiceListener and ServiceEmitter
 */
export class FrontService extends MessageService implements ServiceEmitter, ServiceListener {
    private static _serviceName = path.basename(__filename.split('.')[0]);

    protected activateMessageListener(): void {
        throw new Error('Method not implemented.');
    }
    protected createMessage(_data: ServiceEmitContext): Promise<MessageEmitResponse> {
        throw new Error('Method not implemented.');
    }

    get serviceName(): string {
        return FrontService._serviceName;
    }
}
