import { getOwner, setOwner } from '@ember/application';
import { assert } from '@ember/debug';

import { DEPRECATE_V1_RECORD_DATA } from '@ember-data/private-build-infra/deprecations';
import type Store from '@ember-data/store';
import { setCacheFor, setRecordIdentifier, StoreMap } from '@ember-data/store/-private';
import type { CreateRecordProperties } from '@ember-data/store/-private/store-service';
import type { Cache } from '@ember-data/types/cache/cache';
import type { DSModel } from '@ember-data/types/q/ds-model';
import type { StableRecordIdentifier } from '@ember-data/types/q/identifier';
import type { RecordInstance } from '@ember-data/types/q/record-instance';

import { getModelFactory } from './schema-definition-service';

export function instantiateRecord(
  store: Store,
  identifier: StableRecordIdentifier,
  createRecordArgs: { [key: string]: unknown }
): RecordInstance {
  let modelName = identifier.type;

  const cache = DEPRECATE_V1_RECORD_DATA ? store._instanceCache.getResourceCache(identifier) : store.cache;
  // TODO deprecate allowing unknown args setting
  let createOptions: CreateRecordProperties = {
    _createProps: createRecordArgs,
    // TODO @deprecate consider deprecating accessing record properties during init which the below is necessary for
    _secretInit: {
      identifier,
      cache,
      store,
      cb: secretInit,
    },
  };

  // ensure that `getOwner(this)` works inside a model instance
  setOwner(createOptions, getOwner(store)!);
  return getModelFactory(this, this._modelFactoryCache, modelName).class.create(createOptions);
}

function secretInit(record: RecordInstance, cache: Cache, identifier: StableRecordIdentifier, store: Store): void {
  setRecordIdentifier(record, identifier);
  StoreMap.set(record, store);
  setCacheFor(record, cache);
}

export function teardownRecord(store: Store, record: RecordInstance) {
  assert(
    `expected to receive an instance of DSModel. If using a custom model make sure you implement teardownRecord`,
    'destroy' in record
  );
  (record as DSModel).destroy();
}

export function _modelFor(store: Store, modelName: string) {
  assert(`Attempted to call store.modelFor(), but the store instance has already been destroyed.`, !store.isDestroyed);
  assert(`You need to pass a model name to the store's modelFor method`, modelName);
  assert(
    `Passing classes to store methods has been removed. Please pass a dasherized string instead of ${modelName}`,
    typeof modelName === 'string'
  );
  let normalizedModelName = normalizeModelName(modelName);
  let maybeFactory = getModelFactory(store, store._modelFactoryCache, normalizedModelName);

  // for factorFor factory/class split
  let klass = maybeFactory && maybeFactory.class ? maybeFactory.class : maybeFactory;
  if (!klass || !klass.isModel || store._forceShim) {
    assert(
      `No model was found for '${modelName}' and no schema handles the type`,
      store.getSchemaDefinitionService().doesTypeExist(modelName)
    );

    return null;
  } else {
    // TODO @deprecate ever returning the klass, always return the shim
    return klass;
  }
}
