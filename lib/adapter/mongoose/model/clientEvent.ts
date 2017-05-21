import * as mongoose from 'mongoose';

import clientModel from './client';
import transactionModel from './transaction';

const safe: any = { j: 1, w: 'majority', wtimeout: 10000 };

/**
 * アプリケーションクライアントイベントスキーマ
 *
 * @ignore
 */
const schema = new mongoose.Schema(
    {
        client: {
            type: String,
            ref: clientModel.modelName
        },
        occurred_at: Date,
        url: String,
        label: String,
        category: String,
        action: String,
        message: String,
        notes: String,
        useragent: String,
        location: [Number, Number],
        transaction: {
            type: String,
            ref: transactionModel.modelName
        }
    },
    {
        collection: 'client_events',
        id: true,
        read: 'primaryPreferred',
        safe: safe,
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        toJSON: { getters: true },
        toObject: { getters: true }
    }
);

export default mongoose.model('ClientEvent', schema);