import {ServiceEmitContext, ServiceEmitRequest, ServiceEmitResponse, ServiceEvent} from "../services/service-types";
import { WorkerEvent } from "../framework/worker";
import { MessageEventType } from "./message-types";

interface MessageServiceEvent extends ServiceEvent {
    cookedEvent: {
        context: string;
        type: MessageEventType;
        [key: string]: any;
    };
    rawEvent: any;
    source: string;
}

interface MessageWorkerEvent extends WorkerEvent {
    data: MessageServiceEvent;
}

interface MessageServiceEmitRequest extends ServiceEmitRequest {
}

interface MessageServiceEmitResponse extends ServiceEmitResponse {
}

interface MessageServiceEmitContext extends ServiceEmitContext {
}