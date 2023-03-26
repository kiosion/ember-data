// public
import ArrayProxy from '@ember/array/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ObjectProxy from '@ember/object/proxy';

import { LegacyNetworkHandler } from '@ember-data/legacy-compat';
import { _modelFor, instantiateRecord, SchemaService, teardownRecord } from '@ember-data/model/hooks';
import { RequestManager } from '@ember-data/request';
import { Fetch } from '@ember-data/request/fetch';
import BaseStore from '@ember-data/store';
import type { StableRecordIdentifier } from '@ember-data/types/q/identifier';
import { RecordInstance } from '@ember-data/types/q/record-instance';

export class Store extends BaseStore {
  constructor(args: Record<string, unknown>) {
    super(args);
    this.requestManager = new RequestManager();
    this.requestManager.use([LegacyNetworkHandler, Fetch]);
    this.registerSchemaDefinitionService(new SchemaService(this));
  }

  instantiateRecord(identifier: StableRecordIdentifier, args: Record<string, unknown>) {
    return instantiateRecord(this, identifier, args);
  }

  teardownRecord(record: RecordInstance) {
    teardownRecord(this, record);
  }

  modelFor(type: string) {
    return _modelFor(this, type) || super.modelFor(type);
  }
}

export { default as DS } from './core';
export { Errors } from '@ember-data/model/-private';
export { Snapshot } from '@ember-data/legacy-compat/-private';

// `ember-data-model-fragments' and `ember-data-change-tracker` rely on `normalizeModelName`
export { RecordArrayManager, normalizeModelName, coerceId } from '@ember-data/store/-private';
export { ManyArray, PromiseManyArray } from '@ember-data/model/-private';
export { SnapshotRecordArray } from '@ember-data/legacy-compat/-private';

export const PromiseArray = ArrayProxy.extend(PromiseProxyMixin);
export const PromiseObject = ObjectProxy.extend(PromiseProxyMixin);
