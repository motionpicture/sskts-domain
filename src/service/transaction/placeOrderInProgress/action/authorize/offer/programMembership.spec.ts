// tslint:disable:no-implicit-dependencies
/**
 * 会員プログラムオファー承認サービステスト
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

describe('会員プログラムオファーを承認する', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('MongoDBが正常であればアクションを完了できるはず', async () => {
        const acceptedOffer = {
            identifier: 'identifier',
            itemOffered: { id: 'programMembershipId' }
        };
        const transaction = { id: 'transactionId', agent: { id: 'agentId' } };
        const programMembership = {
            offers: [{ identifier: 'identifier' }]
        };
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const programMembershipRepo = new sskts.repository.ProgramMembership(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);
        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(programMembershipRepo).expects('search').once().resolves([programMembership]);
        sandbox.mock(actionRepo).expects('start').once().resolves({});
        sandbox.mock(actionRepo).expects('complete').once().resolves({});

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.programMembership.create(<any>{
            agentId: transaction.agent.id,
            transactionId: transaction.id,
            acceptedOffer: acceptedOffer
        })({
            action: actionRepo,
            organization: organizationRepo,
            programMembership: programMembershipRepo,
            transaction: transactionRepo
        });
        assert.equal(typeof result, 'object');
        sandbox.verify();
    });
});

describe('会員プログラムオファー承認を取り消す', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('MongoDBが正常であればアクションを取り消せるはず', async () => {
        const transaction = { id: 'transactionId', agent: { id: 'agentId' } };
        const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);
        sandbox.mock(transactionRepo).expects('findInProgressById').once().resolves(transaction);
        sandbox.mock(actionRepo).expects('cancel').once().resolves({});

        const result = await sskts.service.transaction.placeOrderInProgress.action.authorize.offer.programMembership.cancel(<any>{
            agentId: transaction.agent.id,
            transactionId: transaction.id,
            actionId: 'actionId'
        })({
            action: actionRepo,
            transaction: transactionRepo
        });
        assert.equal(result, undefined);
        sandbox.verify();
    });
});
