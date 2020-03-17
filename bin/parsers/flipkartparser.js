'use strict'
const dataService = require('E:\\Personal\\fastify\\reviewdb-data\\index');
const source = 'Flipkart';
const fs = require('fs');
const axios = require('axios').default;
const affiliateId = 'ajaybhasy';
const affiliateToken = '07ebe46dbe3d4baaa2abcd192651fd42';
const headers = { 'Fk-Affiliate-Id': affiliateId, 'Fk-Affiliate-Token': affiliateToken };

class FlipkartParser {

    parseCategoryUrl(categoryUrl) {
        var splitArray = categoryUrl.split('.json');
        var catSplit = splitArray[0].split('/');
        var catId = catSplit[catSplit.length - 1];
        return catId;
    }

    accessCategories(categoryName, object) {
        let categoryObject = object[categoryName];
        let category = this.createCategory(categoryObject);
        console.log(`Saving category ${categoryName}`);
        dataService.CategoryService.checkAndSaveCategory(category);
    }

    createCategory(categoryObject) {
        var category = {};
        category.desc = categoryObject.apiName;
        category.name = this.snakeCaseConvertor(categoryObject.apiName);
        category.sourceUrl = categoryObject.availableVariants['v1.1.0']['get'];
        category.sourceId = this.parseCategoryUrl(category.sourceUrl);
        category.source = source;
        category.ecommerceLinks = { 'key': 'Flipkart', 'value': this.getCatLink(category.name, category.sourceId) };
        return category;
    }

    snakeCaseConvertor(name) {
        var splitArray = name.split('_');
        var catName = '';
        splitArray.forEach(element => {
            catName += ' ' + element.charAt(0).toUpperCase() + element.slice(1);
        });
        return catName.trim();
    }

    getCatLink(categoryname, catId) {
        var baseLink = 'https://www.flipkart.com/{0}/pr?sid={1}';
        var catNameForLink = categoryname.replace('_', '-');
        var catIdForLink = catId.replace('-', ',');
        baseLink = baseLink.replace('{0}', catNameForLink).replace('{1}', catIdForLink);
        return baseLink;
    }

    parseCats(data) {
        var categories = data.affiliate.apiListings;
        var cats = Object.keys(categories);
        cats.forEach((elementName) => {
            this.accessCategories(elementName, categories);
        });
    }

    saveProduct(flipProduct, category) {
        try {
            let flipProdInfo = flipProduct.productBaseInfoV1;
            let product = {};
            let ecomDetails = [];
            if (flipProdInfo.productId) {
                product.name = flipProdInfo.title;
                product.sourceId = flipProdInfo.productId;
                product.description = (flipProdInfo.productDescription ? flipProdInfo.productDescription : flipProdInfo.title);
                product.imageUrl = flipProdInfo.imageUrls['200x200'];
                product.image_400 = flipProdInfo.imageUrls['400x400'];
                product.image_800 = flipProdInfo.imageUrls['800x800']
                product.category = { categoryName: category.name, categoryId: category.id };
                product.maximumRetailPrice = flipProdInfo.maximumRetailPrice.amount;
                ecomDetails.push(this.getEcomDetail(flipProdInfo));
                product.ecommerceDetails = ecomDetails;
                product.updated = new Date();
                dataService.ProductService.saveProduct(product);
            } else {
                console.log(`Product without id ${flipProduct}`);
            }
        } catch (error) {
            const log = {};
            log.vendorId = source;
            log.dataUrl = cat.sourceUrl;
            log.errorDesc = "Error in catch of saveProduct";
            logh.error = error;
            dataService.ProdParseLogService.saveProdParseLog(log);
        }
    }

    getEcomDetail(flipProdInfo) {
        let detail = {};
        detail.providerId = source;
        detail.providerName = source;
        detail.providerprice = this.getFlipPrice(flipProdInfo);
        detail.url = flipProdInfo.productUrl;
        detail.inStock = flipProdInfo.inStock;
        return detail;
    }

    getFlipPrice(flipProdInfo) {
        if (flipProdInfo.flipkartSpecialPrice) {
            return flipProdInfo.flipkartSpecialPrice.amount;
        }
        else if (flipProdInfo.flipkartSellingPrice) {
            return flipProdInfo.flipkartSellingPrice.amount;
        }
        else {
            return 0;
        }
    }

    getCircularReplacer() {
        const seen = new WeakSet();
        return (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return;
                }
                seen.add(value);
            }
            return value;
        };
    };

    parseProducts(data) {
        if (data) {
            data.forEach((cat) => {
                this.saveProductsByUrl(cat.sourceUrl, cat);
            });
        }
    }

    saveProductsByUrl(url, cat) {
        return axios.get(url, { headers }, { timeout: 2 })
            .then((response) => {
                try {
                    let products = response.data.products;
                    if (products) {
                        products.forEach((prod) => {
                            this.saveProduct(prod, cat);
                        });
                        if (response.data.nextUrl) {
                            this.saveProductsByUrl(response.data.nextUrl, cat);
                        }
                    }
                    else {
                        if (response.data) {
                            const log = {};
                            log.vendorId = source;
                            log.dataUrl = cat.sourceUrl;
                            log.data = response.data;
                            log.errorDesc = "No products in JSON";
                            fs.writeFileSync(`op/${cat.name}.json`, response.data);
                            dataService.ProdParseLogService.saveProdParseLog(log);
                        }
                    }
                }
                catch (error) {
                    const log = {};
                    log.vendorId = source;
                    log.dataUrl = cat.sourceUrl;
                    log.data = response.data;
                    log.errorDesc = "Error in catch of saveProductsByUrl";
                    logh.error = error;
                    dataService.ProdParseLogService.saveProdParseLog(log);
                }

            }).catch((error) => {
                const log = {};
                log.vendorId = source;
                log.dataUrl = cat.sourceUrl;
                log.errorDesc = "Axios Error";
                log.error = error;
                dataService.ProdParseLogService.saveProdParseLog(log);
            });
    }
}
module.exports = FlipkartParser;