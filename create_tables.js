const properties = require('./properties.json')
const host = properties.host
const user = properties.user
const password = properties.password

const Importer = require('mysql-import');
const importer = new Importer({
    host,
    user,
    password
});

// New onProgress method, added in version 5.0!
importer.onProgress(progress => {
    let percent = Math.floor(progress.bytes_processed / progress.total_bytes * 10000) / 100;
    console.log(`${percent}% Completed`);
});

importer.import('./sql/create_tables.sql').then(() => {
    const files_imported = importer.getImported();
    console.log(`${files_imported.length} SQL file(s) imported.`);
}).catch(err => {
    console.error(err);
});

