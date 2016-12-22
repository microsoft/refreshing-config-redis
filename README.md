![Version](https://img.shields.io/npm/v/refreshing-config-redis.svg)
![License](https://img.shields.io/github/license/Microsoft/refreshing-config-redis.svg)
![Downloads](https://img.shields.io/npm/dt/refreshing-config-redis.svg)

# refreshing-config-redis
Redis support for the [refreshing-config](https://github.com/Microsoft/refreshing-config) configuration library.

# Usage
1. Install refreshing-config, refreshing-config-redis, and redis:
  ```bash
    npm install --save refreshing-config refreshing-config-redis redis
  ```

2. Use the library:
  ```javascript
    // Import the dependencies
    const redis = require('redis');
    const RefreshingConfig = require('refreshing-config');
    const RefreshingConfigRedis = require('refreshing-config-redis');

    // Configure the client and store
    const redisClient = redis.createClient();
    const redisConfigStore = new RefreshingConfigRedis.RedisConfigStore(redisClient, 'my-config-key');
    const config = new RefreshingConfig(redisConfigStore)
      .withExtension(new RefreshingConfigRedis.RedisPubSubRefreshPolicyAndChangePublisher());

    // Use the config
    config.set('foo', 'bar')
      .then(() => config.get('foo'))
      .then(console.log);
  ```