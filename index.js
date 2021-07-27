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
    const results = await Promise.all(files.map((file) => {
        if (file.endsWith('/properties.yaml')) {
            verifyFile(file, true)
        } else {
            verifyFile(file)
        }
    }));
    results.forEach(result => {
        if (!result.response.valid) {
            core.setFailed(`Configuration invalid: ${result.file}\n${JSON.stringify(result.response, null, 2)}`);
        }
    })
})

function verifyFile(file, isProperties = false) {
    const url = isProperties ? `https://${host}/api/monitoring/templates/validate-properties` : `https://${host}/api/monitoring/templates/validate`;
    return fetch(url, {
        body: fs.readFileSync(file),
        headers: {
            'Content-Type': 'application/yaml'
        },
        method: 'POST'
    })
        .then(response => response.json())
        .then(response => ({ response, file }))
}
