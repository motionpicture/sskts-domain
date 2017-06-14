/**
 * 取引スコープファクトリー
 *
 * @namespace factory/transactionScope
 */

import * as moment from 'moment';

import OwnerGroup from './ownerGroup';

/**
 * 取引スコープインターフェース
 * todo 仮実装なので、調整あるいは拡張していくこと
 *
 * @interface ITransactionScope
 * @memberof factory/transactionScope
 */
export interface ITransactionScope {
    /**
     * いつから開始準備状態か
     *
     * @type {Date}
     * @memberof ITransactionScope
     */
    ready_from: Date;
    /**
     * いつまで開始準備状態か
     *
     * @type {Date}
     * @memberof ITransactionScope
     */
    ready_until: Date;
    /**
     * どのクライアントでやりとりされる取引なのか
     *
     * @type {string}
     * @memberof ITransactionScope
     */
    client?: string;
    /**
     * どの劇場における取引なのか
     *
     * @type {string}
     * @memberof ITransactionScope
     */
    theater?: string;
    /**
     * どのグループの所有者の取引なのか
     *
     * @type {OwnerGroup}
     * @memberof ITransactionScope
     */
    owner_group?: OwnerGroup;
}

/**
 * 取引スコープを作成する
 *
 * @returns {ITransactionScope}
 * @memberof factory/transactionScope
 */
export function create(args: {
    ready_from: Date;
    ready_until: Date;
    client?: string;
    theater?: string;
    owner_group?: OwnerGroup;
}): ITransactionScope {
    // todo validation nullチェック、型チェック、fromとuntilの比較など

    return {
        ready_from: args.ready_from,
        ready_until: args.ready_until,
        client: args.client,
        theater: args.theater,
        owner_group: args.owner_group
    };
}

/**
 * スコープを文字列に変換する
 *
 * @param {ITransactionScope} scope 取引スコープ
 */
export function scope2String(scope: ITransactionScope) {
    let scopeStr = 'transactionScope';
    scopeStr += `:ready_from:${moment(scope.ready_from).unix()}`;
    scopeStr += `:ready_until:${moment(scope.ready_until).unix()}`;

    if (scope.client !== undefined) {
        scopeStr += `:client:${scope.client}`;
    }
    if (scope.theater !== undefined) {
        scopeStr += `:theater:${scope.theater}`;
    }
    if (scope.owner_group !== undefined) {
        scopeStr += `:owner_group:${scope.owner_group}`;
    }

    return scopeStr;
}
