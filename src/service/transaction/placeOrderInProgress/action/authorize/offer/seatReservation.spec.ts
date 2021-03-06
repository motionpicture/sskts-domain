// tslint:disable:no-implicit-dependencies
/**
 * 座席予約オファー承認サービステスト
 */
import * as assert from 'power-assert';
import * as sinon from 'sinon';
import * as sskts from '../../../../../../index';
// tslint:disable-next-line:no-require-imports no-var-requires
require('sinon-mongoose');

let sandbox: sinon.SinonSandbox;

before(() => {
    sandbox = sinon.createSandbox();
});

describe('action.authorize.seatReservation.create()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('COAが正常であれば、エラーにならないはず(ムビチケなし)', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {}
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const salesTickets = [{ ticketCode: offers[0].ticketInfo.ticketCode }];
        const reserveSeatsTemporarilyResult = <any>{};
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId'
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').once().resolves(reserveSeatsTemporarilyResult);
        sandbox.mock(actionRepo).expects('complete').once().withArgs(action.typeOf, action.id).resolves(action);

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        });

        assert.deepEqual(result, action);
        sandbox.verify();
    });

    it('COAが正常であれば、エラーにならないはず(無料鑑賞券の場合)', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {}
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode',
                usePoint: 10
            }
        }];
        const salesTickets = [{ ticketCode: offers[0].ticketInfo.ticketCode }];
        const reserveSeatsTemporarilyResult = <any>{};
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId'
        };
        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);
        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(sskts.COA.services.master).expects('ticket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').once().resolves(reserveSeatsTemporarilyResult);
        sandbox.mock(actionRepo).expects('complete').once().withArgs(action.typeOf, action.id).resolves(action);

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        });
        assert.deepEqual(result, action);
        sandbox.verify();
    });

    it('メガネ代込みを指定された場合、メガネ代込みの承認アクションを取得できるはず(ムビチケなし)', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {}
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode',
                addGlasses: 100
            }
        }];
        const salesTickets = [{
            ticketCode: 'ticketCode',
            salePrice: 1000,
            addGlasses: 100
        }];
        const reserveSeatsTemporarilyResult = <any>{};
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId'
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').once().resolves(reserveSeatsTemporarilyResult);
        sandbox.mock(actionRepo).expects('complete').once().withArgs(action.typeOf, action.id).resolves(action);

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        });

        assert.deepEqual(result, action);
        sandbox.verify();
    });

    it('COAが正常であれば、エラーにならないはず(ムビチケの場合)', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode',
                mvtkAppPrice: 123
            }
        }];
        const salesTickets = [{ ticketCode: offers[0].ticketInfo.ticketCode }];
        const reserveSeatsTemporarilyResult = <any>{};
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId'
        };
        const mvtkTicket = {
            ticketCode: 'ticketCode'
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.master).expects('mvtkTicketcode').once().resolves(mvtkTicket);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').once().resolves(reserveSeatsTemporarilyResult);
        sandbox.mock(actionRepo).expects('complete').once().withArgs(action.typeOf, action.id).resolves(action);

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        });

        assert.deepEqual(result, action);
        sandbox.verify();
    });

    it('ムビチケでメガネ代込みを指定された場合、メガネ代込みの承認アクションを取得できるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode',
                addGlasses: 100,
                mvtkAppPrice: 800,
                mvtkSalesPrice: 1000
            }
        }];
        const salesTickets: any[] = [];
        const reserveSeatsTemporarilyResult = <any>{};
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId'
        };
        const mvtkTicket = {
            ticketCode: 'ticketCode',
            addPrice: 0,
            addPriceGlasses: 100
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.master).expects('mvtkTicketcode').once().resolves(mvtkTicket);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').once().resolves(reserveSeatsTemporarilyResult);
        sandbox.mock(actionRepo).expects('complete').once().withArgs(action.typeOf, action.id).resolves(action);

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        });

        assert.deepEqual(result, action);
        sandbox.verify();
    });

    it('COAが正常であれば、エラーにならないはず(会員の場合)', async () => {
        const agent = {
            id: 'agentId',
            memberOf: {} // 会員
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const salesTickets = [{ ticketCode: offers[0].ticketInfo.ticketCode }];
        const reserveSeatsTemporarilyResult = <any>{};
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId'
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        // 会員と非会員で2回呼ばれるはず
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').twice().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').once().resolves(reserveSeatsTemporarilyResult);
        sandbox.mock(actionRepo).expects('complete').once().withArgs(action.typeOf, action.id).resolves(action);

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        });

        assert.deepEqual(result, action);
        sandbox.verify();
    });

    it('ムビチケ情報をCOA券種に変換できなければ、NotFoundErrorになるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'invalidTicketCode',
                mvtkAppPrice: 123
            }
        }];
        const salesTickets = [{ ticketCode: 'ticketCode' }];
        const mvtkTicketResult = {
            name: 'COAServiceError',
            code: 200
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        // ムビチケを券種に変換で失敗する場合
        sandbox.mock(sskts.COA.services.master).expects('mvtkTicketcode').once().rejects(mvtkTicketResult);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').never();
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').never();
        sandbox.mock(actionRepo).expects('complete').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        }).catch((err) => err);
        assert(result instanceof sskts.factory.errors.NotFound);
        sandbox.verify();
    });

    it('ムビチケ情報のCOA券種への変換でサーバーエラーであれば、そのままのエラーになるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'invalidTicketCode',
                mvtkAppPrice: 123
            }
        }];
        const salesTickets = [{ ticketCode: 'ticketCode' }];
        const mvtkTicketResult = new Error('mvtkTicketResult');

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        // ムビチケを券種に変換でサーバーエラーの場合
        sandbox.mock(sskts.COA.services.master).expects('mvtkTicketcode').once().rejects(mvtkTicketResult);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').never();
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').never();
        sandbox.mock(actionRepo).expects('complete').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        }).catch((err) => err);
        assert.deepEqual(result, mvtkTicketResult);
        sandbox.verify();
    });

    it('券種情報の券種コードと券種情報から変換した券種コードが一致しなければ、NotFoundErrorになるはず(ムビチケの場合)', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'invalidTicketCode',
                mvtkAppPrice: 123
            }
        }];
        const salesTickets = [{ ticketCode: 'ticketCode' }];
        const mvtkTicket = {
            ticketCode: 'ticketCode'
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.master).expects('mvtkTicketcode').once().resolves(mvtkTicket);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').never();
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').never();
        sandbox.mock(actionRepo).expects('complete').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        }).catch((err) => err);
        assert(result instanceof sskts.factory.errors.NotFound);
        sandbox.verify();
    });

    it('存在しないチケットコードであれば、エラーになるはず(ムビチケなし)', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'invalidTicketCode'
            }
        }];
        const salesTickets = [{ ticketCode: 'ticketCode' }];

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').never();
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').never();
        sandbox.mock(actionRepo).expects('complete').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        }).catch((err) => err);
        assert(result instanceof sskts.factory.errors.NotFound);
        sandbox.verify();
    });

    it('所有者の取引でなければ、Forbiddenエラーが投げられるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: {
                id: 'anotherAgentId'
            },
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                mvtkSalesPrice: 123
            }
        }];

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').never();
        sandbox.mock(actionRepo).expects('start').never();
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        }).catch((err) => err);

        assert(result instanceof sskts.factory.errors.Forbidden);
        sandbox.verify();
    });

    it('COA仮予約が原因不明のサーバーエラーであれば、承認アクションを諦めて、ServiceUnavailableエラーになるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const salesTickets = [{ ticketCode: 'ticketCode' }];
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId'
        };
        const updTmpReserveSeatResult = new Error('message');

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').once().rejects(updTmpReserveSeatResult);
        // giveUpが呼ばれて、completeは呼ばれないはず
        sandbox.mock(actionRepo).expects('giveUp').once()
            .withArgs(action.typeOf, action.id, sinon.match({ message: updTmpReserveSeatResult.message })).resolves(action);
        sandbox.mock(actionRepo).expects('complete').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        }).catch((err) => err);
        assert(result instanceof sskts.factory.errors.ServiceUnavailable);
        sandbox.verify();
    });

    it('COA仮予約でエラーオブジェクトでない例外が発生すれば、承認アクションを諦めて、ServiceUnavailableエラーになるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const salesTickets = [{ ticketCode: 'ticketCode' }];
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId'
        };
        const updTmpReserveSeatResult = new Error('updTmpReserveSeatResult');

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').once().rejects(updTmpReserveSeatResult);
        sandbox.mock(actionRepo).expects('giveUp').once().withArgs(action.typeOf, action.id).resolves(action);
        sandbox.mock(actionRepo).expects('complete').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        }).catch((err) => err);
        assert(result instanceof sskts.factory.errors.ServiceUnavailable);
        sandbox.verify();
    });

    it('COA仮予約が座席重複エラーであれば、承認アクションを諦めて、AlreadyInUseエラーになるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const salesTickets = [{ ticketCode: 'ticketCode' }];
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId'
        };
        const updTmpReserveSeatResult = new Error('座席取得失敗');

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        // COAが座席取得失敗エラーを返してきた場合
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').once().rejects(updTmpReserveSeatResult);
        // giveUpが呼ばれて、completeは呼ばれないはず
        sandbox.mock(actionRepo).expects('giveUp').once()
            .withArgs(action.typeOf, action.id, sinon.match({ message: updTmpReserveSeatResult.message })).resolves(action);
        sandbox.mock(actionRepo).expects('complete').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        }).catch((err) => err);
        assert(result instanceof sskts.factory.errors.AlreadyInUse);
        sandbox.verify();
    });

    it('COA仮予約が500未満のエラーであれば、承認アクションを諦めて、Argumentエラーになるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const salesTickets = [{ ticketCode: 'ticketCode' }];
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId'
        };
        const updTmpReserveSeatResult = new Error('message');
        // tslint:disable-next-line:no-magic-numbers
        (<any>updTmpReserveSeatResult).code = 200;

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        // COAが座席取得失敗エラーを返してきた場合
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').once().rejects(updTmpReserveSeatResult);
        // giveUpが呼ばれて、completeは呼ばれないはず
        sandbox.mock(actionRepo).expects('giveUp').once()
            .withArgs(action.typeOf, action.id, sinon.match({ message: updTmpReserveSeatResult.message })).resolves(action);
        sandbox.mock(actionRepo).expects('complete').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        }).catch((err) => err);
        assert(result instanceof sskts.factory.errors.Argument);
        sandbox.verify();
    });

    it('COA仮予約が500以上のエラーであれば、承認アクションを諦めて、Argumentエラーになるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const salesTickets = [{ ticketCode: 'ticketCode' }];
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId'
        };
        const updTmpReserveSeatResult = new Error('message');
        // tslint:disable-next-line:no-magic-numbers
        (<any>updTmpReserveSeatResult).code = 500;

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        // COAが座席取得失敗エラーを返してきた場合
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').once().rejects(updTmpReserveSeatResult);
        // giveUpが呼ばれて、completeは呼ばれないはず
        sandbox.mock(actionRepo).expects('giveUp').once()
            .withArgs(action.typeOf, action.id, sinon.match({ message: updTmpReserveSeatResult.message })).resolves(action);
        sandbox.mock(actionRepo).expects('complete').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        }).catch((err) => err);
        assert(result instanceof sskts.factory.errors.ServiceUnavailable);
        sandbox.verify();
    });

    it('制限単位がn人単位の券種が指定された場合、割引条件を満たしていなければ、Argumentエラー配列が投げられるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [
            {
                seatSection: 'seatSection',
                seatNumber: 'seatNumber1',
                ticketInfo: {
                    ticketCode: 'ticketCode'
                }
            },
            {
                seatSection: 'seatSection',
                seatNumber: 'seatNumber2',
                ticketInfo: {
                    ticketCode: 'ticketCode'
                }
            },
            {
                seatSection: 'seatSection',
                seatNumber: 'seatNumber3',
                ticketInfo: {
                    ticketCode: 'ticketCode2'
                }
            },
            {
                seatSection: 'seatSection',
                seatNumber: 'seatNumber4',
                ticketInfo: {
                    ticketCode: 'ticketCode'
                }
            }
        ];
        const salesTickets = [{
            ticketCode: 'ticketCode',
            limitUnit: '001',
            limitCount: 2 // 2枚単位の制限
        }];

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').never();
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').never();
        sandbox.mock(actionRepo).expects('giveUp').never();
        sandbox.mock(actionRepo).expects('complete').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        }).catch((err) => err);
        assert(Array.isArray(result));
        assert(result[0] instanceof sskts.factory.errors.Argument);
        sandbox.verify();
    });

    it('制限単位がn人単位の券種が指定された場合、割引条件を満たしていれば、承認アクションを取得できるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {
                theaterCode: 'theaterCode'
            }
        };
        const offers = [
            {
                seatSection: 'seatSection',
                seatNumber: 'seatNumber1',
                ticketInfo: {
                    ticketCode: 'ticketCode'
                }
            },
            {
                seatSection: 'seatSection',
                seatNumber: 'seatNumber2',
                ticketInfo: {
                    ticketCode: 'ticketCode'
                }
            },
            {
                seatSection: 'seatSection',
                seatNumber: 'seatNumber4',
                ticketInfo: {
                    ticketCode: 'ticketCode2'
                }
            }
        ];
        const salesTickets = [
            {
                ticketCode: 'ticketCode',
                limitUnit: '001',
                limitCount: 2 // 2枚単位の制限
            },
            {
                ticketCode: 'ticketCode2'
            }
        ];
        const updTmpReserveSeatResult = {};
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId'
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        sandbox.mock(sskts.COA.services.reserve).expects('updTmpReserveSeat').once().resolves(updTmpReserveSeatResult);
        sandbox.mock(actionRepo).expects('complete').once().withArgs(action.typeOf, action.id).resolves(action);

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.create({
            agentId: agent.id,
            transactionId: transaction.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            event: eventRepo,
            action: actionRepo,
            transaction: transactionRepo
        });
        assert.deepEqual(result, action);
        sandbox.verify();
    });
});

describe('action.authorize.seatReservation.cancel()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('アクションが存在すれば、キャンセルできるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId',
            result: {
                updTmpReserveSeatArgs: {},
                updTmpReserveSeatResult: {}
            }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };

        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(actionRepo).expects('cancel').once().withExactArgs(action.typeOf, action.id).resolves(action);
        sandbox.mock(sskts.COA.services.reserve).expects('delTmpReserve').once().resolves();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.cancel({
            agentId: agent.id,
            transactionId: transaction.id,
            actionId: action.id
        })({
            action: actionRepo,
            transaction: transactionRepo
        });

        assert.equal(result, undefined);
        sandbox.verify();
    });

    it('所有者の取引でなければ、Forbiddenエラーが投げられるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const actionId = 'actionId';
        const transaction = {
            id: 'transactionId',
            agent: {
                id: 'anotherAgentId'
            },
            seller: seller
        };

        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(actionRepo).expects('cancel').never();
        sandbox.mock(sskts.COA.services.reserve).expects('delTmpReserve').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.cancel({
            agentId: agent.id,
            transactionId: transaction.id,
            actionId: actionId
        })({
            action: actionRepo,
            transaction: transactionRepo
        }).catch((err) => err);

        assert(result instanceof sskts.factory.errors.Forbidden);
        sandbox.verify();
    });
});

describe('action.authorize.seatReservation.changeOffers()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('COAが正常であれば、エラーにならないはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {}
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const salesTickets = [{ ticketCode: offers[0].ticketInfo.ticketCode }];
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId',
            actionStatus: sskts.factory.actionStatusType.CompletedActionStatus,
            object: {
                individualScreeningEvent: event,
                offers: offers
            },
            result: {}
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(actionRepo).expects('findById').once().resolves(action);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo.actionModel).expects('findOneAndUpdate').once().chain('exec').resolves(new actionRepo.actionModel(action));

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.changeOffers({
            agentId: agent.id,
            transactionId: transaction.id,
            actionId: action.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            action: actionRepo,
            transaction: transactionRepo,
            event: eventRepo
        });

        assert.equal(typeof result, 'object');
        sandbox.verify();
    });

    it('取引主体が一致しなければ、Forbiddenエラーになるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: { id: 'invalidAgentId' },
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {}
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const action = {
            id: 'actionId',
            actionStatus: sskts.factory.actionStatusType.CompletedActionStatus,
            object: {
                individualScreeningEvent: event,
                offers: offers
            },
            result: {}
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').never();
        sandbox.mock(actionRepo).expects('findById').never();
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.changeOffers({
            agentId: agent.id,
            transactionId: transaction.id,
            actionId: action.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            action: actionRepo,
            transaction: transactionRepo,
            event: eventRepo
        }).catch((err) => err);
        assert(result instanceof sskts.factory.errors.Forbidden);
        sandbox.verify();
    });

    it('アクションが完了ステータスでなければ、NotFoundエラーになるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {}
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId',
            actionStatus: sskts.factory.actionStatusType.ActiveActionStatus,
            object: {
                individualScreeningEvent: event,
                offers: offers
            },
            result: {}
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(actionRepo).expects('findById').once().resolves(action);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').never();
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.changeOffers({
            agentId: agent.id,
            transactionId: transaction.id,
            actionId: action.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            action: actionRepo,
            transaction: transactionRepo,
            event: eventRepo
        }).catch((err) => err);
        assert(result instanceof sskts.factory.errors.NotFound);
        assert.equal((<sskts.factory.errors.NotFound>result).entityName, 'authorizeAction');
        sandbox.verify();
    });

    it('イベント識別子が一致しなければ、Argumentエラーになるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId',
            actionStatus: sskts.factory.actionStatusType.CompletedActionStatus,
            object: {
                individualScreeningEvent: {
                    identifier: 'invalidEventIdentifier'
                },
                offers: offers
            },
            result: {}
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(actionRepo).expects('findById').once().resolves(action);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').never();
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.changeOffers({
            agentId: agent.id,
            transactionId: transaction.id,
            actionId: action.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            action: actionRepo,
            transaction: transactionRepo,
            event: eventRepo
        }).catch((err) => err);
        assert(result instanceof sskts.factory.errors.Argument);
        assert.equal((<sskts.factory.errors.Argument>result).argumentName, 'eventIdentifier');
        sandbox.verify();
    });

    it('座席が一致していなければ、Argumentエラーになるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {}
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId',
            actionStatus: sskts.factory.actionStatusType.CompletedActionStatus,
            object: {
                individualScreeningEvent: event,
                offers: [{
                    seatSection: 'seatSection',
                    seatNumber: 'invalidSeatNumber'
                }]
            },
            result: {}
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(actionRepo).expects('findById').once().resolves(action);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').never();
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').never();

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.changeOffers({
            agentId: agent.id,
            transactionId: transaction.id,
            actionId: action.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            action: actionRepo,
            transaction: transactionRepo,
            event: eventRepo
        }).catch((err) => err);
        assert(result instanceof sskts.factory.errors.Argument);
        assert.equal((<sskts.factory.errors.Argument>result).argumentName, 'offers');
        sandbox.verify();
    });

    it('アクション変更のタイミングでCompletedActionStatusのアクションが存在しなければNotFoundエラーとなるはず', async () => {
        const agent = {
            id: 'agentId'
        };
        const seller = {
            id: 'sellerId',
            name: { ja: 'ja', en: 'ne' }
        };
        const transaction = {
            id: 'transactionId',
            agent: agent,
            seller: seller
        };
        const eventIdentifier = 'eventIdentifier';
        const event = {
            identifier: eventIdentifier,
            coaInfo: {}
        };
        const offers = [{
            seatSection: 'seatSection',
            seatNumber: 'seatNumber',
            ticketInfo: {
                ticketCode: 'ticketCode'
            }
        }];
        const salesTickets = [{ ticketCode: offers[0].ticketInfo.ticketCode }];
        const action = {
            typeOf: sskts.factory.actionType.AuthorizeAction,
            id: 'actionId',
            actionStatus: sskts.factory.actionStatusType.CompletedActionStatus,
            object: {
                individualScreeningEvent: event,
                offers: offers
            },
            result: {}
        };

        const eventRepo = new sskts.repository.Event(sskts.mongoose.connection);
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);

        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(eventRepo).expects('findIndividualScreeningEventByIdentifier').once().withExactArgs(eventIdentifier).resolves(event);
        sandbox.mock(actionRepo).expects('findById').once().resolves(action);
        sandbox.mock(sskts.COA.services.reserve).expects('salesTicket').once().resolves(salesTickets);
        sandbox.mock(actionRepo.actionModel).expects('findOneAndUpdate').once().chain('exec').resolves(null);

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.seatReservation.changeOffers({
            agentId: agent.id,
            transactionId: transaction.id,
            actionId: action.id,
            eventIdentifier: eventIdentifier,
            offers: <any>offers
        })({
            action: actionRepo,
            transaction: transactionRepo,
            event: eventRepo
        }).catch((err) => err);

        assert(result instanceof sskts.factory.errors.NotFound);
        sandbox.verify();
    });
});
