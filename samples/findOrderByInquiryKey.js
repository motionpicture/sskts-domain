/**
 * a sample making inquiry of an order
 */

const sskts = require('../lib/index');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    sskts.mongoose.connect(process.env.MONGOLAB_URI);

    console.log('making inquiry...');
    await new Promise((resolve, reject) => {
        rl.question('input theater code: ', (theaterCode) => {
            rl.question('input order number: ', (orderNumber) => {
                rl.question('input telephone: ', async (telephone) => {
                    try {
                        const order = await sskts.service.order.findByOrderInquiryKey(
                            {
                                theaterCode: theaterCode,
                                orderNumber: parseInt(orderNumber, 10),
                                telephone: telephone
                            }
                        )(sskts.adapter.order(sskts.mongoose.connection));
                        console.log('order:', order);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        });
    });

    sskts.mongoose.disconnect();
    rl.close();
}

main().then(() => {
    console.log('success!');
}).catch((error) => {
    console.error(error);
    process.exit(1);
});
