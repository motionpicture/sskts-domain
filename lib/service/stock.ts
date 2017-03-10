/**
 * 在庫サービス
 *
 * @namespace StockService
 */

import * as COA from '@motionpicture/coa-service';
import * as createDebug from 'debug';

import * as Authorization from '../factory/authorization';
import * as Transaction from '../factory/transaction';

import AssetAdapter from '../adapter/asset';
import TransactionAdapter from '../adapter/transaction';

const debug = createDebug('sskts-domain:service:stock');

/**
 * 資産承認解除(COA座席予約)
 *
 * @param {COASeatReservationAuthorization} authorization
 * @returns {COAOperation<void>}
 *
 * @memberOf StockServiceInterpreter
 */
export function unauthorizeCOASeatReservation(authorization: Authorization.ICOASeatReservationAuthorization) {
    return async () => {
        debug('calling deleteTmpReserve...');
        await COA.ReserveService.delTmpReserve({
            theater_code: authorization.coa_theater_code,
            date_jouei: authorization.coa_date_jouei,
            title_code: authorization.coa_title_code,
            title_branch_num: authorization.coa_title_branch_num,
            time_begin: authorization.coa_time_begin,
            tmp_reserve_num: authorization.coa_tmp_reserve_num
        });
    };
}

/**
 * 資産移動(COA座席予約)
 *
 * @param {COASeatReservationAuthorization} authorization
 * @returns {AssetOperation<void>}
 *
 * @memberOf StockServiceInterpreter
 */
export function transferCOASeatReservation(authorization: Authorization.ICOASeatReservationAuthorization) {
    return async (assetAdapter: AssetAdapter) => {

        // ウェブフロントで事前に本予約済みなので不要
        // await COA.updateReserveInterface.call({
        // });

        const promises = authorization.assets.map(async (asset) => {
            // 資産永続化
            debug('storing asset...', asset);
            await assetAdapter.store(asset);
            debug('asset stored.');
        });

        await Promise.all(promises);
    };
}

/**
 * 取引照会を無効にする
 * COAのゴミ購入データを削除する
 *
 * @memberOf StockServiceInterpreter
 */
export function disableTransactionInquiry(transaction: Transaction.ITransaction) {
    return async (transactionAdapter: TransactionAdapter) => {
        if (!transaction.inquiry_key) {
            throw new RangeError('inquiry_key not created.');
        }

        // COAから内容抽出
        const reservation = await COA.ReserveService.stateReserve({
            theater_code: transaction.inquiry_key.theater_code,
            reserve_num: transaction.inquiry_key.reserve_num,
            tel_num: transaction.inquiry_key.tel
        });

        // COA購入チケット取消
        debug('calling deleteReserve...');
        await COA.ReserveService.delReserve({
            theater_code: transaction.inquiry_key.theater_code,
            reserve_num: transaction.inquiry_key.reserve_num,
            tel_num: transaction.inquiry_key.tel,
            date_jouei: reservation.date_jouei,
            title_code: reservation.title_code,
            title_branch_num: reservation.title_branch_num,
            time_begin: reservation.time_begin,
            list_seat: reservation.list_ticket
        });

        // 永続化
        const update = {
            $set: {
                inquiry_key: null
            }
        };
        debug('updating transaction...', update);
        await transactionAdapter.findOneAndUpdate(
            {
                _id: transaction.id
            },
            update
        );
    };
}
