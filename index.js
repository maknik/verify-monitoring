const fs = require('fs');
const core = require('@actions/core');
const glob = require('glob');
const fetch = require('node-fetch');

const host = core.getInput('host');

process.on('unhandledRejection', up => {
    core.setFailed(`Action failed ${up}`);
});

glob('monitoring_templates/*.y*ml', async (er, files) => {
    if (er) throw new er;
    const results = await Promise.all(files.map((file) => verifyFile(file)));
    results.forEach(result => {
        if (!result.valid) core.setFailed(`configuration invalid ${JSON.stringify(result)}`);
    })
})

function verifyFile(file) {
    return fetch(`https://${host}/api/monitoring-templates/validate`, {
        body: fs.readFileSync(file),
        headers: {
            'Content-Type': 'application/yaml'
        },
        method: 'POST'
    }).then(response => response.json())
}
