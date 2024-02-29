const { Client, LocalAuth } = require("whatsapp-web.js");

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.initialize();

'use strict';
const Base = require('./src/structures/Base');
const ProductMetadata = require('./src/structures/ProductMetadata');
/**
 * Represents a Product on WhatsAppBusiness
 * @extends {Base}
 */
class Product extends Base {
    constructor(client, data) {
        super(client);
        if (data) this._patch(data);
    }
    _patch(data) {
        /**
         * Product ID
         * @type {string}
         */
        this.id = data.id;
        /**
         * Price
         * @type {string}
         */
        this.price = data.price ? data.price : '';
        /**
         * Product Thumbnail
         * @type {string}
         */
        this.thumbnailUrl = data.thumbnailUrl;
        /**
         * Currency
         * @type {string}
         */
        this.currency = data.currency;
        /**
         * Product Name
         * @type {string}
         */
        this.name = data.name;
        /**
         * Product Quantity
         * @type {number}
         */
        this.quantity = data.quantity;
        /** Product metadata */
        this.data = null;
        return super._patch(data);
    }
    async getData() {
        if (this.data === null) {
            let result = await this.client.pupPage.evaluate((productId) => {
                return window.WWebJS.getProductMetadata(productId);
            }, this.id);
            if (!result) {
                this.data = undefined;
            } else {
                this.data = new ProductMetadata(this.client, result);
            }
        }
        return this.data;
    }
}
module.exports = Product;
