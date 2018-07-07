module.exports = function(router){
    require('fs').readdirSync(__dirname).forEach(function(file) {
        if (file == "index.js") return;
        var name = file.substr(0, file.indexOf('.'));
	  	// console.log('attaching route: %s',name);
        require('./' + name)(router);
    });
};