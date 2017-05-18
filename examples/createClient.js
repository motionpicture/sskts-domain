"use strict";
/* tslint:disable */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const client_1 = require("../lib/adapter/client");
const clientService = require("../lib/service/client");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            mongoose.Promise = global.Promise;
            const connection = mongoose.createConnection(process.env.MONGOLAB_URI);
            const clientAdapter = new client_1.default(connection);
            const args = {
                id: 'motionpicture',
                secret: 'motionpicture',
                name: {
                    en: 'motionpicture',
                    ja: 'モーションピクチャー'
                },
                description: {
                    en: 'motionpicture',
                    ja: 'モーションピクチャー'
                },
                notes: {
                    en: 'motionpicture',
                    ja: 'モーションピクチャー'
                },
                email: 'hello@motionpicture,jp'
            };
            yield clientService.create(args)(clientAdapter);
        }
        catch (error) {
            console.error(error);
        }
        mongoose.disconnect();
    });
}
main();
