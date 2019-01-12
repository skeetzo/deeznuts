module.exports = function() {
    // CronJobs
    this.crons = {

        backup : {
            start : true,
            cronTime : '23 55 00 * * *', // end of night every day
            timeZone: 'America/Los_Angeles' 
        },

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