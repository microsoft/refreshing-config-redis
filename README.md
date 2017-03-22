![Version](https://img.shields.io/npm/v/refreshing-config-redis.svg)
![License](https://img.shields.io/github/license/Microsoft/refreshing-config-redis.svg)
![Downloads](https://img.shields.io/npm/dt/refreshing-config-redis.svg)

# refreshing-config-redis
Redis support for the [refreshing-config](https://github.com/Microsoft/refreshing-config) configuration library.

Values are stored in Redis hashmaps and change notification is done via a Redis pub/sub channel.  Great for maintaining
a single configuration across multiple machines.

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
    const configurationName = 'my-config-key';
    const channelName = `${configurationName}-channel`;
    const configStore = new RefreshingConfigRedis.RedisConfigStore(redisClient, configurationName);
    const config = new RefreshingConfig.RefreshingConfig(configStore)
      .withExtension(new RefreshingConfigRedis.RedisPubSubRefreshPolicyAndChangePublisher(redisClient, channelName));

    // Use the config
    config.set('foo', 'bar')
      .then(() => config.get('foo'))
      .then(console.log);
  ```

# Contributing
Pull requests will gladly be considered!

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see
the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com)
with any additional questions or comments.