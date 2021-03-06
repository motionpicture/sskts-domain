/**
 * 上映会イベント検索サンプル
 * @ignore
 */

const moment = require('moment');
const sskts = require('../');

async function main() {
    let redisClient;
    try {
        await sskts.mongoose.connect(process.env.MONGOLAB_URI);
        redisClient = sskts.redis.createClient({
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT, 10),
            password: process.env.REDIS_KEY,
            tls: { servername: process.env.REDIS_HOST }
        });

        const events = await sskts.service.offer.searchIndividualScreeningEvents({
            limit: 10,
            page: 1,
            sort: {
                startDate: sskts.factory.sortType.Ascending
            },
            eventStatuses: [
                sskts.factory.eventStatusType.EventCancelled,
                sskts.factory.eventStatusType.EventScheduled,
                sskts.factory.eventStatusType.EventRescheduled
            ],
            superEventLocationIdentifiers: [
                'MovieTheater-112', 'MovieTheater-118', 'MovieTheater-119', 'MovieTheater-115',
                'MovieTheater-101', 'MovieTheater-116', 'MovieTheater-117', 'MovieTheater-114',
                'MovieTheater-102', 'MovieTheater-106', 'MovieTheater-113', 'MovieTheater-109',
                'MovieTheater-108', 'MovieTheater-110', 'MovieTheater-107'
            ],
            startFrom: moment().toDate(),
            startThrough: moment().add(7, 'days').toDate()
        })({
            event: new sskts.repository.Event(sskts.mongoose.connection),
            itemAvailability: new sskts.repository.itemAvailability.IndividualScreeningEvent(redisClient)
        });
        console.log(events.length, 'events found');
        // console.log(events[0]);
    } catch (error) {
        console.error(error);
    }

    await new Promise((resolve) => {
        setTimeout(
            async () => {
                redisClient.quit();
                await sskts.mongoose.disconnect();
                resolve();
            },
            5000
        );
    });
}

main().then(() => {
    console.log('success!');
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
