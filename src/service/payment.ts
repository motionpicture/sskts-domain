/**
 * 決済サービス
 */
import * as GMO from '@motionpicture/gmo-service';
import * as pecorinoapi from '@motionpicture/pecorino-api-nodejs-client';
import * as factory from '@motionpicture/sskts-factory';
import * as createDebug from 'debug';
import * as moment from 'moment';

import { MongoRepository as ActionRepo } from '../repo/action';
import { MongoRepository as TaskRepo } from '../repo/task';
import { MongoRepository as TransactionRepo } from '../repo/transaction';

const debug = createDebug('sskts-domain:service:payment');

export type IPlaceOrderTransaction = factory.transaction.placeOrder.ITransaction;

/**
 * Pecorino支払実行
 */
export function payPecorino(params: factory.task.payPecorino.IData) {
    return async (repos: {
        action: ActionRepo;
        // transaction: TransactionRepo;
        pecorinoAuthClient: pecorinoapi.auth.ClientCredentials;
    }) => {
        // アクション開始
        const action = await repos.action.start<factory.action.trade.pay.IAction<factory.paymentMethodType.Pecorino>>(params);

        try {
            const pecorinoTransaction = params.object.pecorinoTransaction;
            switch (pecorinoTransaction.typeOf) {
                case pecorinoapi.factory.transactionType.Pay:

                    // 支払取引の場合、確定
                    const payTransactionService = new pecorinoapi.service.transaction.Pay({
                        endpoint: params.object.pecorinoEndpoint,
                        auth: repos.pecorinoAuthClient
                    });
                    await payTransactionService.confirm({
                        transactionId: pecorinoTransaction.id
                    });
                    break;

                case pecorinoapi.factory.transactionType.Transfer:
                    // 転送取引の場合確定
                    const transferTransactionService = new pecorinoapi.service.transaction.Transfer({
                        endpoint: params.object.pecorinoEndpoint,
                        auth: repos.pecorinoAuthClient
                    });
                    await transferTransactionService.confirm({
                        transactionId: pecorinoTransaction.id
                    });
                    break;

                default:
                    throw new factory.errors.NotImplemented(
                        `transaction type '${(<any>pecorinoTransaction).typeOf}' not implemented.`
                    );
            }
        } catch (error) {
            // actionにエラー結果を追加
            try {
                // tslint:disable-next-line:max-line-length no-single-line-block-comment
                const actionError = { ...error, ...{ message: error.message, name: error.name } };
                await repos.action.giveUp(action.typeOf, action.id, actionError);
            } catch (__) {
                // 失敗したら仕方ない
            }

            throw error;
        }

        // アクション完了
        debug('ending action...');
        const actionResult: factory.action.trade.pay.IResult<factory.paymentMethodType.Pecorino> = {};
        await repos.action.complete(action.typeOf, action.id, actionResult);
    };
}

/**
 * クレジットカードオーソリ取消
 * @param transactionId 取引ID
 */
export function cancelCreditCardAuth(transactionId: string) {
    return async (repos: { action: ActionRepo }) => {
        // クレジットカード仮売上アクションを取得
        const authorizeActions: factory.action.authorize.creditCard.IAction[] =
            await repos.action.findAuthorizeByTransactionId(transactionId)
                .then((actions) => actions
                    .filter((a) => a.object.typeOf === factory.action.authorize.creditCard.ObjectType.CreditCard)
                    .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
                );

        await Promise.all(authorizeActions.map(async (action) => {
            const entryTranArgs = (<factory.action.authorize.creditCard.IResult>action.result).entryTranArgs;
            const execTranArgs = (<factory.action.authorize.creditCard.IResult>action.result).execTranArgs;

            debug('calling alterTran...');
            await GMO.services.credit.alterTran({
                shopId: entryTranArgs.shopId,
                shopPass: entryTranArgs.shopPass,
                accessId: execTranArgs.accessId,
                accessPass: execTranArgs.accessPass,
                jobCd: GMO.utils.util.JobCd.Void,
                amount: entryTranArgs.amount
            });
        }));

        // 失敗したら取引状態確認してどうこう、という処理も考えうるが、
        // GMOはapiのコール制限が厳しく、下手にコールするとすぐにクライアントサイドにも影響をあたえてしまう
        // リトライはタスクの仕組みに含まれているので失敗してもここでは何もしない
    };
}

/**
 * クレジットカード売上確定
 * @param transactionId 取引ID
 */
export function payCreditCard(transactionId: string) {
    return async (repos: {
        action: ActionRepo;
        transaction: TransactionRepo;
    }) => {
        const transaction = await repos.transaction.findPlaceOrderById(transactionId);
        const transactionResult = transaction.result;
        if (transactionResult === undefined) {
            throw new factory.errors.NotFound('transaction.result');
        }
        const potentialActions = transaction.potentialActions;
        if (potentialActions === undefined) {
            throw new factory.errors.NotFound('transaction.potentialActions');
        }
        const orderPotentialActions = potentialActions.order.potentialActions;
        if (orderPotentialActions === undefined) {
            throw new factory.errors.NotFound('order.potentialActions');
        }

        const payActionAttributes = orderPotentialActions.payCreditCard;
        if (payActionAttributes !== undefined) {
            // クレジットカード承認アクションがあるはず
            const authorizeAction = <factory.action.authorize.creditCard.IAction>transaction.object.authorizeActions
                .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
                .find((a) => a.object.typeOf === factory.action.authorize.creditCard.ObjectType.CreditCard);

            // アクション開始
            const action = await repos.action.start<factory.action.trade.pay.IAction<factory.paymentMethodType.CreditCard>>(
                payActionAttributes
            );

            let alterTranResult: GMO.services.credit.IAlterTranResult;
            try {
                const entryTranArgs = (<factory.action.authorize.creditCard.IResult>authorizeAction.result).entryTranArgs;
                const execTranArgs = (<factory.action.authorize.creditCard.IResult>authorizeAction.result).execTranArgs;

                // 取引状態参照
                const searchTradeResult = await GMO.services.credit.searchTrade({
                    shopId: entryTranArgs.shopId,
                    shopPass: entryTranArgs.shopPass,
                    orderId: entryTranArgs.orderId
                });

                if (searchTradeResult.jobCd === GMO.utils.util.JobCd.Sales) {
                    debug('already in SALES');
                    // すでに実売上済み
                    alterTranResult = {
                        accessId: searchTradeResult.accessId,
                        accessPass: searchTradeResult.accessPass,
                        forward: searchTradeResult.forward,
                        approve: searchTradeResult.approve,
                        tranId: searchTradeResult.tranId,
                        tranDate: ''
                    };
                } else {
                    debug('calling alterTran...');
                    alterTranResult = await GMO.services.credit.alterTran({
                        shopId: entryTranArgs.shopId,
                        shopPass: entryTranArgs.shopPass,
                        accessId: execTranArgs.accessId,
                        accessPass: execTranArgs.accessPass,
                        jobCd: GMO.utils.util.JobCd.Sales,
                        amount: entryTranArgs.amount
                    });

                    // 失敗したら取引状態確認してどうこう、という処理も考えうるが、
                    // GMOはapiのコール制限が厳しく、下手にコールするとすぐにクライアントサイドにも影響をあたえてしまう
                    // リトライはタスクの仕組みに含まれているので失敗してもここでは何もしない
                }
            } catch (error) {
                // actionにエラー結果を追加
                try {
                    // tslint:disable-next-line:max-line-length no-single-line-block-comment
                    const actionError = (error instanceof Error) ? { ...error, ...{ message: error.message } } : /* istanbul ignore next */ error;
                    await repos.action.giveUp(payActionAttributes.typeOf, action.id, actionError);
                } catch (__) {
                    // 失敗したら仕方ない
                }

                throw error;
            }

            // アクション完了
            debug('ending action...');
            const actionResult: factory.action.trade.pay.IResult<factory.paymentMethodType.CreditCard> = {
                creditCardSales: alterTranResult
            };
            await repos.action.complete(payActionAttributes.typeOf, action.id, actionResult);
        }
    };
}

/**
 * 注文返品取引からクレジットカード返金処理を実行する
 * @param transactionId 注文返品取引ID
 */
export function refundCreditCard(transactionId: string) {
    return async (repos: {
        action: ActionRepo;
        transaction: TransactionRepo;
        task: TaskRepo;
    }) => {
        const transaction = await repos.transaction.findReturnOrderById(transactionId);
        const potentialActions = transaction.potentialActions;
        const placeOrderTransaction = transaction.object.transaction;
        const placeOrderTransactionResult = placeOrderTransaction.result;
        const authorizeActions = placeOrderTransaction.object.authorizeActions
            .filter((action) => action.actionStatus === factory.actionStatusType.CompletedActionStatus)
            .filter((action) => action.object.typeOf === factory.action.authorize.creditCard.ObjectType.CreditCard);

        if (potentialActions === undefined) {
            throw new factory.errors.NotFound('transaction.potentialActions');
        }

        if (placeOrderTransactionResult === undefined) {
            throw new factory.errors.NotFound('placeOrderTransaction.result');
        }
        const returnOrderPotentialActions = potentialActions.returnOrder.potentialActions;
        if (returnOrderPotentialActions === undefined) {
            throw new factory.errors.NotFound('returnOrder.potentialActions');
        }

        await Promise.all(authorizeActions.map(async (authorizeAction) => {
            // アクション開始
            const refundActionAttributes = returnOrderPotentialActions.refundCreditCard;
            if (refundActionAttributes === undefined) {
                throw new factory.errors.NotFound('returnOrder.potentialActions.refundCreditCard');
            }
            const action = await repos.action.start<factory.action.trade.refund.IAction<factory.paymentMethodType.CreditCard>>(
                refundActionAttributes
            );

            let alterTranResult: GMO.services.credit.IAlterTranResult;
            try {
                // 取引状態参照
                const gmoTrade = await GMO.services.credit.searchTrade({
                    shopId: authorizeAction.result.entryTranArgs.shopId,
                    shopPass: authorizeAction.result.entryTranArgs.shopPass,
                    orderId: authorizeAction.result.entryTranArgs.orderId
                });
                debug('gmoTrade is', gmoTrade);

                // 実売上状態であれば取消
                // 手数料がかかるのであれば、ChangeTran、かからないのであれば、AlterTran
                if (gmoTrade.status === GMO.utils.util.Status.Sales) {
                    debug('canceling credit card sales...', authorizeAction);
                    alterTranResult = await GMO.services.credit.alterTran({
                        shopId: authorizeAction.result.entryTranArgs.shopId,
                        shopPass: authorizeAction.result.entryTranArgs.shopPass,
                        accessId: gmoTrade.accessId,
                        accessPass: gmoTrade.accessPass,
                        jobCd: GMO.utils.util.JobCd.Void
                    });
                    debug('GMO alterTranResult is', alterTranResult);
                } else {
                    alterTranResult = {
                        accessId: gmoTrade.accessId,
                        accessPass: gmoTrade.accessPass,
                        forward: gmoTrade.forward,
                        approve: gmoTrade.approve,
                        tranId: gmoTrade.tranId,
                        tranDate: ''
                    };
                }
            } catch (error) {
                // actionにエラー結果を追加
                try {
                    const actionError = { ...error, ...{ message: error.message, name: error.name } };
                    await repos.action.giveUp(action.typeOf, action.id, actionError);
                } catch (__) {
                    // 失敗したら仕方ない
                }

                throw error;
            }

            // アクション完了
            debug('ending action...');
            await repos.action.complete(action.typeOf, action.id, { alterTranResult });

            // 潜在アクション
            await onRefund(refundActionAttributes)({ task: repos.task });
        }));
    };
}

/**
 * Pecorino口座返金処理を実行する
 */
export function refundPecorino(params: factory.task.refundPecorino.IData) {
    return async (repos: {
        action: ActionRepo;
        task: TaskRepo;
        pecorinoAuthClient: pecorinoapi.auth.ClientCredentials;
    }) => {
        const action = await repos.action.start<factory.action.trade.refund.IAction<factory.paymentMethodType.Pecorino>>(params);

        try {
            // 返金アクション属性から、Pecorino取引属性を取り出す
            const payActionAttributes = params.object;
            const pecorinoTransaction = payActionAttributes.object.pecorinoTransaction;
            const pecorinoEndpoint = payActionAttributes.object.pecorinoEndpoint;
            const notes = 'シネマサンシャイン 返金';

            switch (pecorinoTransaction.typeOf) {
                case factory.pecorino.transactionType.Pay:
                    // Pecorino入金取引で返金実行
                    const depositService = new pecorinoapi.service.transaction.Deposit({
                        endpoint: pecorinoEndpoint,
                        auth: repos.pecorinoAuthClient
                    });
                    const depositTransaction = await depositService.start({
                        toAccountNumber: pecorinoTransaction.object.fromAccountNumber,
                        // tslint:disable-next-line:no-magic-numbers
                        expires: moment().add(5, 'minutes').toDate(),
                        agent: pecorinoTransaction.recipient,
                        recipient: pecorinoTransaction.agent,
                        amount: pecorinoTransaction.object.amount,
                        notes: notes
                    });
                    await depositService.confirm({ transactionId: depositTransaction.id });

                    break;

                case factory.pecorino.transactionType.Transfer:
                    // 口座振込の場合、逆の振込取引実行
                    const transferService = new pecorinoapi.service.transaction.Transfer({
                        endpoint: pecorinoEndpoint,
                        auth: repos.pecorinoAuthClient
                    });
                    const transferTransaction = await transferService.start({
                        toAccountNumber: pecorinoTransaction.object.fromAccountNumber,
                        fromAccountNumber: pecorinoTransaction.object.toAccountNumber,
                        // tslint:disable-next-line:no-magic-numbers
                        expires: moment().add(5, 'minutes').toDate(),
                        agent: pecorinoTransaction.recipient,
                        recipient: pecorinoTransaction.agent,
                        amount: pecorinoTransaction.object.amount,
                        notes: notes
                    });
                    await transferService.confirm({ transactionId: transferTransaction.id });

                    break;

                default:
            }
        } catch (error) {
            // actionにエラー結果を追加
            try {
                const actionError = { ...error, ...{ message: error.message, name: error.name } };
                await repos.action.giveUp(action.typeOf, action.id, actionError);
            } catch (__) {
                // 失敗したら仕方ない
            }

            throw error;
        }

        // アクション完了
        debug('ending action...');
        await repos.action.complete(action.typeOf, action.id, {});

        // 潜在アクション
        await onRefund(params)({ task: repos.task });
    };
}

/**
 * 返金後のアクション
 * @param refundActionAttributes 返金アクション属性
 */
function onRefund(refundActionAttributes: factory.action.trade.refund.IAttributes<factory.paymentMethodType>) {
    return async (repos: { task: TaskRepo }) => {
        const potentialActions = refundActionAttributes.potentialActions;
        const now = new Date();
        const taskAttributes: factory.task.IAttributes[] = [];
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (potentialActions !== undefined) {
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (potentialActions.sendEmailMessage !== undefined) {
                taskAttributes.push(factory.task.sendEmailMessage.createAttributes({
                    status: factory.taskStatus.Ready,
                    runsAt: now, // なるはやで実行
                    remainingNumberOfTries: 3,
                    lastTriedAt: null,
                    numberOfTried: 0,
                    executionResults: [],
                    data: {
                        actionAttributes: potentialActions.sendEmailMessage
                    }
                }));
            }
        }

        // タスク保管
        await Promise.all(taskAttributes.map(async (taskAttribute) => {
            return repos.task.save(taskAttribute);
        }));
    };
}

/**
 * ムビチケ着券取消し
 * @export
 * @param transactionId 取引ID
 */
export function cancelMvtk(transactionId: string) {
    return async () => {
        debug('canceling mvtk...transactionId:', transactionId);
        // ムビチケは実は仮押さえの仕組みがないので何もしない
    };
}

/**
 * ムビチケ資産移動
 * @export
 * @param transactionId 取引ID
 */
export function useMvtk(transactionId: string) {
    return async (repos: {
        action: ActionRepo;
        transaction: TransactionRepo;
    }) => {
        const transaction = await repos.transaction.findPlaceOrderById(transactionId);
        const transactionResult = transaction.result;
        if (transactionResult === undefined) {
            throw new factory.errors.NotFound('transaction.result');
        }
        const potentialActions = transaction.potentialActions;
        if (potentialActions === undefined) {
            throw new factory.errors.NotFound('transaction.potentialActions');
        }
        const orderPotentialActions = potentialActions.order.potentialActions;
        if (orderPotentialActions === undefined) {
            throw new factory.errors.NotFound('order.potentialActions');
        }

        const useActionAttributes = orderPotentialActions.useMvtk;
        if (useActionAttributes !== undefined) {
            // ムビチケ承認アクションがあるはず
            // const authorizeAction = <factory.action.authorize.mvtk.IAction>transaction.object.authorizeActions
            //     .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
            //     .find((a) => a.object.typeOf === factory.action.authorize.authorizeActionPurpose.Mvtk);

            // アクション開始
            const action = await repos.action.start<factory.action.consume.use.mvtk.IAction>(useActionAttributes);

            try {
                // 実は取引成立の前に着券済みなので何もしない
            } catch (error) {
                // tslint:disable-next-line:no-single-line-block-comment
                /* istanbul ignore next */

                // actionにエラー結果を追加
                try {
                    // tslint:disable-next-line:max-line-length no-single-line-block-comment
                    const actionError = (error instanceof Error) ? { ...error, ...{ message: error.message } } : /* istanbul ignore next */ error;
                    await repos.action.giveUp(useActionAttributes.typeOf, action.id, actionError);
                } catch (__) {
                    // 失敗したら仕方ない
                }

                // tslint:disable-next-line:no-single-line-block-comment
                /* istanbul ignore next */
                throw error;
            }

            // アクション完了
            debug('ending action...');
            const actionResult: factory.action.consume.use.mvtk.IResult = {};
            await repos.action.complete(useActionAttributes.typeOf, action.id, actionResult);
        }
    };
}

/**
 * Pecorino入金実行
 */
export function givePecorino(params: factory.task.givePecorino.IData) {
    // tslint:disable-next-line:max-func-body-length
    return async (repos: {
        action: ActionRepo;
        transaction: TransactionRepo;
        pecorinoAuthClient: pecorinoapi.auth.ClientCredentials;
    }) => {
        // アクション開始
        const action = await repos.action.start<factory.action.transfer.give.pecorino.IAction>(params);

        try {
            // 入金取引
            const depositService = new pecorinoapi.service.transaction.Deposit({
                endpoint: params.toLocation.pecorinoEndpoint,
                auth: repos.pecorinoAuthClient
            });
            const transaction = await depositService.start({
                toAccountNumber: params.toLocation.accountNumber,
                // tslint:disable-next-line:no-magic-numbers
                expires: moment().add(5, 'minutes').toDate(),
                agent: {
                    ...params.agent,
                    name: params.purpose.seller.name,
                    url: params.purpose.seller.url
                },
                recipient: {
                    ...params.recipient,
                    name: `${params.purpose.customer.familyName} ${params.purpose.customer.givenName}`,
                    url: params.purpose.customer.url
                },
                amount: params.object.amount,
                notes: 'シネマサンシャインインセンティブ'
            });
            await depositService.confirm({ transactionId: transaction.id });
        } catch (error) {
            // actionにエラー結果を追加
            try {
                // tslint:disable-next-line:max-line-length no-single-line-block-comment
                const actionError = { ...error, ...{ message: error.message, name: error.name } };
                await repos.action.giveUp(params.typeOf, action.id, actionError);
            } catch (__) {
                // 失敗したら仕方ない
            }

            throw error;
        }

        // アクション完了
        debug('ending action...');
        const actionResult: factory.action.transfer.give.pecorino.IResult = {};
        await repos.action.complete(params.typeOf, action.id, actionResult);
    };
}
