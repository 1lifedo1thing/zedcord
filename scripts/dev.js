const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const { baseFile, buildCombinedTheme, root, srcDir } = require('./build');

require('dotenv').config({ path: path.join(root, '.env') });

const outputPaths = (process.env.DEV_OUTPUT_PATH || '')
    .split(',')
    .map((outputPath) => outputPath.trim())
    .filter(Boolean);

if (outputPaths.length === 0) {
    console.error('DEV_OUTPUT_PATH is not set in .env file');
    process.exit(1);
}

// flavors (theme/flavors/*.theme.css) are written beside each output, under their own names
const flavorsDir = path.join(path.dirname(baseFile), 'flavors');

function processFiles() {
    try {
        const theme = buildCombinedTheme();
        const flavors = (fs.existsSync(flavorsDir) ? fs.readdirSync(flavorsDir) : [])
            .filter((file) => file.endsWith('.theme.css'))
            .map((file) => [file, buildCombinedTheme(path.join(flavorsDir, file))]);
        for (const outputPath of outputPaths) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, theme);
            console.log(`Updated ${outputPath}`);
            for (const [file, css] of flavors) {
                fs.writeFileSync(path.join(path.dirname(outputPath), file), css);
                console.log(`Updated ${path.join(path.dirname(outputPath), file)}`);
            }
        }
    } catch (error) {
        console.error('Error processing files:', error);
    }
}

processFiles();

const watcher = chokidar.watch([baseFile, flavorsDir, `${srcDir}/**/*.css`], { ignoreInitial: true });
watcher
    .on('all', (event, file) => {
        console.log(`${event}: ${path.relative(root, file)}`);
        processFiles();
    })
    .on('error', (error) => console.error(`Watcher error: ${error}`));
