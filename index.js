// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const Q = require('q');
const uuid = require('uuid');

// Refresh when a change is detected
class RedisPubSubRefreshPolicyAndChangePublisher {
  constructor(redisClient, channel) {
    if (!redisClient) {
      throw new Error('Missing redisClient');
    }
    if (!channel) {
      throw new Error('Missing channel');
    }
    this.redisClient = redisClient;
    this.channel = channel;
    this.publisherId = uuid();

    const subscriberClient = redisClient.duplicate();
    subscriberClient.on('message', this.refreshSubscriber.bind(this));
    subscriberClient.subscribe(channel);
  }

  subscribe(subscriber) {
    if (this.subscriber) {
      throw new Error('Already subscribed');
    }
    this.subscriber = subscriber;
  }

  publish() {
    this.redisClient.publish(this.channel, this.publisherId);
  }

  refreshSubscriber(publisherId) {
    if (this.subscriber && this.publisherId !== publisherId) {
      try {
        this.subscriber.refresh();
      }
      catch (e) {
        // Empty block
      }
    }
  }
}

class RedisConfigStore {
  constructor(redisClient, key) {
    if (!redisClient) {
      throw new Error('Missing redisClient');
    }
    if (!key) {
      throw new Error('Missing key');
    }
    this.redisClient = redisClient;
    this.key = key;
  }

  getAll() {
    const deferred = Q.defer();
    this.redisClient.hgetall(this.key, (error, reply) => {
      if (error) {
        return deferred.reject(error);
      }
      if (!reply) {
        return deferred.resolve({});
      }
      Object.getOwnPropertyNames(reply).forEach(property => {
        reply[property] = JSON.parse(reply[property]);
      });
      return deferred.resolve(reply);
    });
    return deferred.promise;
  }

  delete(name) {
    const deferred = Q.defer();
    this.redisClient.hdel(this.key, name, (error, reply) => {
      if (error) {
        return deferred.reject(error);
      }
      return deferred.resolve(reply);
    });
    return deferred.promise;
  }

  set(name, value) {
    const deferred = Q.defer();
    const valueToStore = JSON.stringify(value);
    this.redisClient.hset(this.key, name, valueToStore, error => {
      if (error) {
        return deferred.reject(error);
      }
      return deferred.resolve(value);
    });
    return deferred.promise;
  }

  toExtension(channel) {
    if (!channel) {
      throw new Error('Missing channel');
    }
    return new RedisPubSubRefreshPolicyAndChangePublisher(this.redisClient.duplicate(), channel);
  }
}

module.exports = {
  RedisConfigStore: RedisConfigStore,
  RedisPubSubRefreshPolicyAndChangePublisher: RedisPubSubRefreshPolicyAndChangePublisher
};