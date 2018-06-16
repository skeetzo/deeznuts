module.exports = function() {
    // CronJobs
    this.crons = {

        ping : {
            start : true,
            cronTime : '00 00 * * * *', // every hour
            timeZone: 'America/Los_Angeles' 
        },

        // subscription ticker
        midnight : {
            start : true,
            cronTime : '00 00 00 * * *', // midnight
            timeZone: 'America/Los_Angeles' 
        },

    }
}