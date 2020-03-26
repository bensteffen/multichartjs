const path = require('path');

module.exports = {
    output: {
        library: 'MultiChart',
        libraryTarget: 'umd',
        filename: 'multichart.js',
        // path: path.resolve(__dirname, 'res/js')
        // auxiliaryComment: 'Test Comment'
    },
    optimization: {
        minimize: false
    },
};
