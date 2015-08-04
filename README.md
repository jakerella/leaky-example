# Leaky Example App

This is an example of a simple leaky Express application for use 
during conference talks on debugging, monitoring, and profiling 
Node applications.

Feel free to clone/fork/expand/demo/use/whatever this application 
as much as you like.

### To Run it

```
~$ git clone https://github.com/jakerella/leaky-example.git
~$ cd leaky-example
~/leaky-example$ npm install
~/leaky-example$ node leaky.js
```

You'll get a message about startup, then a "chart" will appear 
showing memory usage over time. By default, this app leaks memory 
like crazy! Can you spot the two primary issues?

### LICENSE

This app is under an MIT license. Please see the LICENSE file for info.
