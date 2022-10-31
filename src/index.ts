import { client, run, seed, seedsDontExists } from './util'

module.exports.handler = async () => {
    try {
        const noSeeds = await seedsDontExists()
        console.log('noSeeds', noSeeds)
        if (noSeeds) {
            await seed()
        }
        return await run()
    } catch (e) {
        throw e
    } finally {
        client.destroy()
    }
}
