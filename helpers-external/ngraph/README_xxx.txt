These are exactly the original js files + dependencies from github converted to work on standard ECMAScript 2019 js:
require(...) -> include(...)
module.exports -> REMOVED
eventify -> REMOVED

Look at 'ngraph_helpers_xxx.js' for my own additions. The graph definition is at 'search_by_distance.js'.

'jquery.min.jsm.js' and 'vivagraph.min.js' are meant to be used within html files, not foobar.