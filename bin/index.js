const axios = require('axios').default;
const FlipkartParser = require('./parsers/flipkartparser');
const dataService = require('E:\\Personal\\fastify\\reviewdb-data\\index');

const affiliateId = 'ajaybhasy';
const affiliateToken = '07ebe46dbe3d4baaa2abcd192651fd42';
const url = "https://affiliate-api.flipkart.net/affiliate/api/ajaybhasy.json";
const mongoString = 'mongodb://fastifyuser:docker123@ds060649.mlab.com:60649/reviewdb';
const headers = { 'Fk-Affiliate-Id': affiliateId, 'Fk-Affiliate-Token': affiliateToken };

dataService.createConnection(mongoString);
var options = process.argv.slice(2);
debugger;
if (options[0] == 'cat') {
    console.log("Parsing categories in cat option");
    axios.get(url, { headers })
        .then((response) => {
            flipkartParser = new FlipkartParser();
            flipkartParser.parseCats(response.data.apiGroups);

        }).catch((error) => {
            console.log("Error while parsing cagtegories " + error);
        });
} else {
    let catProm = dataService.CategoryService.getAllCategories();
    catProm.then((cats) => {
        let flipkartParser = new FlipkartParser();
        flipkartParser.parseProducts(cats);
    }).catch((error) => {
        console.log("Error while parsing products " + error);
    });
}

// axios.get(url, { headers })
//     .then((response) => {
//         console.log("Parsing cats completed");
//         flipkartParser = new FlipkartParser();
//         flipkartParser.parseCats(response.data.apiGroups);
//         let catProm = dataService.CategoryService.getAllCategories();
//         catProm.then((cats) => {
//             let flipkartParser = new FlipkartParser();
//             flipkartParser.parseProducts(cats);
//         });

//     }).catch((error) => {
//         console.log("error Occured " + error);
//     });



// let flipkartParser = new FlipkartParser();
// flipkartParser.parseProducts(catProm);
// catProm.then((categories) => {
//     console.log("Called cats");
//     let flipkartParser = new FlipkartParser();
//     flipkartParser.parseProducts(categories);
// });

