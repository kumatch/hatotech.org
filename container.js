var Paranoic = require('paranoic');
var container = new Paranoic();

var web_root       = __dirname + "/web";
var web_diary_root = web_root + "/diary";

var template_root = __dirname + "/templates";
var diary_root = __dirname + "/_diary";


container.register('diary.finder', {
    module: __dirname + "/lib/diary/finder",
    instance: {
        arguments: [ diary_root ]
    }
});

container.register('diary.navigator', {
    module: __dirname + "/lib/diary/navigator",
    instance: {
        arguments: [ "@diary.finder" ]
    }
});

container.register('diary.printer', {
    module: __dirname + "/lib/diary/printer",
    instance: {
        arguments: [ "@diary.navigator", "@diary.finder", template_root, web_diary_root ]
    }
});


module.exports = container;