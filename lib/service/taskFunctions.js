"use strict";
/**
 * タスクファンクションサービス
 * タスク名ごとに、実行するファンクションをひとつずつ定義しています
 *
 * @namespace service/taskFunctions
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const createDebug = require("debug");
const asset_1 = require("../adapter/asset");
const owner_1 = require("../adapter/owner");
const performance_1 = require("../adapter/performance");
const NotificationService = require("../service/notification");
const SalesService = require("../service/sales");
const StockService = require("../service/stock");
const debug = createDebug('sskts-domain:service:taskFunctions');
function sendEmailNotification(data) {
    debug('executing...', data);
    return (connection) => __awaiter(this, void 0, void 0, function* () {
        debug('creating adapters on connection...', connection);
        yield NotificationService.sendEmail(data.notification)();
    });
}
exports.sendEmailNotification = sendEmailNotification;
function cancelSeatReservationAuthorization(data) {
    debug('executing...', data);
    return (__) => __awaiter(this, void 0, void 0, function* () {
        yield StockService.unauthorizeCOASeatReservation(data.authorization)();
    });
}
exports.cancelSeatReservationAuthorization = cancelSeatReservationAuthorization;
function cancelGMOAuthorization(data) {
    debug('executing...', data);
    return (__) => __awaiter(this, void 0, void 0, function* () {
        yield SalesService.cancelGMOAuth(data.authorization)();
    });
}
exports.cancelGMOAuthorization = cancelGMOAuthorization;
function cancelMvtkAuthorization(data) {
    debug('executing...', data);
    return (__) => __awaiter(this, void 0, void 0, function* () {
        yield SalesService.cancelMvtkAuthorization(data.authorization)();
    });
}
exports.cancelMvtkAuthorization = cancelMvtkAuthorization;
function disableTransactionInquiry(data) {
    debug('executing...', data);
    return (__) => __awaiter(this, void 0, void 0, function* () {
        // 照会キーを登録する前にCOA本予約を実行する必要がなくなったので、この処理は不要
    });
}
exports.disableTransactionInquiry = disableTransactionInquiry;
function settleSeatReservationAuthorization(data) {
    debug('executing...', data);
    return (connection) => __awaiter(this, void 0, void 0, function* () {
        const assetAdapter = new asset_1.default(connection);
        const ownerAdapter = new owner_1.default(connection);
        const performanceAdapter = new performance_1.default(connection);
        yield StockService.transferCOASeatReservation(data.authorization)(assetAdapter, ownerAdapter, performanceAdapter);
    });
}
exports.settleSeatReservationAuthorization = settleSeatReservationAuthorization;
function settleGMOAuthorization(data) {
    debug('executing...', data);
    return (__) => __awaiter(this, void 0, void 0, function* () {
        yield SalesService.settleGMOAuth(data.authorization)();
    });
}
exports.settleGMOAuthorization = settleGMOAuthorization;
function settleMvtkAuthorization(data) {
    debug('executing...', data);
    return (__) => __awaiter(this, void 0, void 0, function* () {
        yield SalesService.settleMvtkAuthorization(data.authorization)();
    });
}
exports.settleMvtkAuthorization = settleMvtkAuthorization;