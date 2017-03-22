// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { RefreshingConfig } = require('refreshing-config');
const redis = require('redis');
const sinon = require('sinon');
const chai = require('chai');
chai.should();

const { RedisConfigStore, RedisPubSubRefreshPolicyAndChangePublisher } = require('../index');
const configurationName = 'my-config-key';
const redisClient = redis.createClient();

describe('RedisConfigStore', () => {
  beforeEach(() => {
    return redisClient.hdel(configurationName, 'foo', 'test', 'phone', 'name');
  });
  it('requires a redis client', () => {
    (() => {
      new RedisConfigStore();
    }).should.throw(Error, /Missing redisClient/);
  });
  it('requires a key', () => {
    (() => {
      new RedisConfigStore(redisClient);
    }).should.throw(Error, /Missing key/);
  });
  it('don\'t throw error if initialize with correct parameters', () => {
    (() => {
      const store = new RedisConfigStore(redisClient, configurationName);
      store.key.should.equal(configurationName);
    }).should.not.throw(Error);
  });
  it('can set a value in the store', () => {
    const store = new RedisConfigStore(redisClient, configurationName);
    return store.set('foo', 'bar')
      .then((value) => {
        value.should.equal('bar');
      });
  });
  it('can get all values', () => {
    const objToCompare = { foo: 'bar', name: 'cristian' };
    const store = new RedisConfigStore(redisClient, configurationName);
    return store.set('foo', 'bar')
      .then(() => store.set('name', 'cristian'))
      .then(() => store.getAll())
      .then((values) => values.should.deep.equal(objToCompare));
  });
  it('returns empty object when no values exists', () => {
    const objToCompare = {};
    const store = new RedisConfigStore(redisClient, configurationName);
    return store.getAll()
      .then((values) => values.should.deep.equal(objToCompare));
  });
  it('can delete a value', () => {
    const objToCompare = { foo: 'bar', name: 'cristian' };
    const store = new RedisConfigStore(redisClient, configurationName);
    return store.set('foo', 'bar')
      .then(() => store.set('test', 23))
      .then(() => store.set('name', 'cristian'))
      .then(() => store.delete('test'))
      .then(() => store.getAll())
      .then((values) => values.should.deep.equal(objToCompare));
  });
  it('don\'t delete a value if key does not exists', () => {
    const objToCompare = { foo: 'bar', name: 'cristian', test: 23 };
    const store = new RedisConfigStore(redisClient, configurationName);
    return store.set('foo', 'bar')
      .then(() => store.set('test', 23))
      .then(() => store.set('name', 'cristian'))
      .then(() => store.delete('unknown'))
      .then(() => store.getAll())
      .then((values) => values.should.deep.equal(objToCompare));
  });
  it('requires a channel when calling toExtension()', () => {
    const store = new RedisConfigStore(redisClient, configurationName);
    (() => {
      store.toExtension();
    }).should.throw(Error, /Missing channel/);
  });
  it('returns publisher when calling toExtension()', () => {
    const store = new RedisConfigStore(redisClient, configurationName);
    const publisher = store.toExtension('my-channel');
    (publisher instanceof RedisPubSubRefreshPolicyAndChangePublisher).should.be.true;
  });
});

describe('RedisPubSubRefreshPolicyAndChangePublisher', () => {
  beforeEach(() => {
    return redisClient.hdel(configurationName, 'foo', 'test', 'phone', 'name');
  });
  it('requires a redis client', () => {
    (() => {
      new RedisPubSubRefreshPolicyAndChangePublisher();
    }).should.throw(Error, /Missing redisClient/);
  });
  it('requires a channel', () => {
    (() => {
      new RedisPubSubRefreshPolicyAndChangePublisher(redisClient);
    }).should.throw(Error, /Missing channel/);
  });
  it('don\'t throw error if initialize with correct parameters', () => {
    const channelName = 'my-channel';
    (() => {
      const publisher = new RedisPubSubRefreshPolicyAndChangePublisher(redisClient, channelName);
      publisher.channel.should.equal(channelName);
      publisher.publisherId.should.not.be.null;
    }).should.not.throw(Error);
  });
  it('should not refresh when calling refreshSubscriber with same publisherId', () => {
    const channelName = `${configurationName}-channel`;
    const publisher = new RedisPubSubRefreshPolicyAndChangePublisher(redisClient, channelName);
    const configStore = new RedisConfigStore(redisClient, configurationName);
    const config = new RefreshingConfig(configStore).withExtension(publisher);
    const refreshSpy = sinon.spy(config, 'refresh');
    publisher.refreshSubscriber(publisher.publisherId);
    refreshSpy.called.should.not.be.true;
  });
  it('should refresh when calling refreshSubscriber', () => {
    const channelName = `${configurationName}-channel`;
    const publisher = new RedisPubSubRefreshPolicyAndChangePublisher(redisClient, channelName);
    const configStore = new RedisConfigStore(redisClient, configurationName);
    const config = new RefreshingConfig(configStore).withExtension(publisher);
    const refreshSpy = sinon.spy(config, 'refresh');
    publisher.refreshSubscriber();
    refreshSpy.calledOnce.should.be.true;
  });
  it('should set subscriber', () => {
    const channelName = 'my-channel';
    const publisher = new RedisPubSubRefreshPolicyAndChangePublisher(redisClient, channelName);
    const config = new RefreshingConfig({});
    publisher.subscribe(config);
  });
  it('should call subscribe when using withExtension()', () => {
    const channelName = `${configurationName}-channel`;
    const configStore = new RedisConfigStore(redisClient, configurationName);
    const publisher = new RedisPubSubRefreshPolicyAndChangePublisher(redisClient, channelName);
    const subscribeSpy = sinon.spy(publisher, 'subscribe');
    new RefreshingConfig(configStore).withExtension(publisher);
    subscribeSpy.calledOnce.should.be.true;
  });
  it('should throw error if trying to subscribe again', () => {
    const channelName = `${configurationName}-channel`;
    const configStore = new RedisConfigStore(redisClient, configurationName);
    const publisher = new RedisPubSubRefreshPolicyAndChangePublisher(redisClient, channelName);
    new RefreshingConfig(configStore).withExtension(publisher);
    (() => {
      publisher.subscribe();
    }).should.throw(Error, /Already subscribed/);
  });
  it('should publish to the channel on set', () => {
    const channelName = `${configurationName}-channel`;
    const publisher = new RedisPubSubRefreshPolicyAndChangePublisher(redisClient, channelName);
    const configStore = new RedisConfigStore(redisClient, configurationName);
    const config = new RefreshingConfig(configStore).withExtension(publisher);
    const publishSpy = sinon.spy(redisClient, 'publish');
    const refreshSpy = sinon.spy(config, 'refresh');
    return config.set('foo', 'bar')
      .then(() => {
        publishSpy.calledOnce.should.be.true;
        refreshSpy.calledOnce.should.be.true;
      });
  });
});
