module.exports = {
    baseFile: 'theme/zed.theme.css',
    buildFile: 'build/zed.css',
    buildImport: "@import url('https://refact0r.github.io/zed-discord/build/zed.css');",
    displayName: 'zed-discord',
    // midnight-discord's build is the base layer (copied from ~/Documents/midnight-discord/build/midnight.css)
    sourceFiles: ['midnight.css', 'variables.css', 'main.css', 'controls.css', 'overlays.css'],
};
