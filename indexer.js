// Modules and stuff required
var gsheets = require('gsheets')
var fs = require('fs-extra')
var ifttnorch = require('iftt-norch-tools')
var options = {
    indexPath: 'resume-si',
    logLevel: 'info',
    logSilent: false
}
var si = require('search-index')(options)
var jf = require('jsonfile')
var util = require('util')
var configfile = '/Users/eklem/node_modules/resume-indexer/config/config-resume.json'


// Read config file
var config = jf.readFileSync(configfile);
//console.dir(config.categories);

// Loop over types in configfile
for (var i = 0; i < config.categories.length; i++) {
    //console.log(config.categories[i]);
    
    // Get csv-file as 'data' (object)
    gsheets.getWorksheet(config.gsheetsKey, config.categories[i], function (err, result) {
        if (err) {
            console.dir(err);
        }
        //console.dir(result.data);
        // Check if ANY changes since last indexing process
        if (result.updated != config.gsheetLastUpdated) {

            //console.log('Index is not up to date.\nGsheet updated: ' + config.gsheetLastUpdated + '\nConfig updated: ' + result.updated)
            var newItems = []
            var datesUpdated = []

            // Iterating through rows of data from spreadsheet
            for (var j = 0; j < result.data.length; j++) {
                var obj = result.data[j]
                // Document processing the rest
                obj.id = ifttnorch.id(obj.categories + obj.title);
                obj.categories = [obj.categories];
                obj.types = ifttnorch.tagslist(obj.types);
                obj.tags = ifttnorch.tagslist(obj.tags);
                obj.teasertext = ifttnorch.sanitizehtml(obj.text, [], {});
                // Push to the array that will be indexed + array for latest update
                newItems.push(obj)
                datesUpdated.push(obj.date)
            }

            //Index newItems and update config-file with new dates
            si.add(newItems, {
                'batchName': config.categories[i],
                fieldOptions: [
                   {fieldName: 'categories', filter: true},
                   {fieldName: 'types', filter: true},
                   {fieldName: 'tags', filter: true}
                ]

            }, function (err) {
                if (!err) {
                    console.log('Indexed!')
                    //config.gsheetLastUpdated = result.updated
                    //console.dir(config)

                    // Write config file
                    //jf.writeFileSync(configfile, config)
                }
            });
        };
    });
}
