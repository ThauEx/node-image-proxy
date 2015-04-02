node-image-proxy
===============

Simple script which will fetch the given image, caches and returns it. When it's already in the cache, it is delivered from there.
Default cache time is one day for now. Broken or ivalid images won't be cached and an empty image is returned.

####Setup
```
npm install
```

####How to start
You can use *nohub* to start it in the background:
```
nohup node index.js &
```
Or *forever*:
```
forever start index.js
```
It listens to port 9091, but can be changed via the *PORT* ENV
```
PORT=9091 node index.js
```

####TODO
* ~~configurable port~~
* optimize images
