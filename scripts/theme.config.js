module.exports = {
    baseFile: 'theme/zedcord.theme.css',
    buildFile: 'build/zedcord.css',
    buildImport: "@import url('https://refact0r.github.io/zedcord/build/zedcord.css');",
    displayName: 'zedcord',
    // midnight-discord's build is the base layer (copied from ~/Documents/midnight-discord/build/midnight.css)
    sourceFiles: ['midnight.css', 'variables.css', 'main.css', 'controls.css', 'overlays.css'],
};
