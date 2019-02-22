module.exports = function() {
    // CronJobs
    this.crons = {

        backup : {
            start : true,
            cronTime : '23 56 00 * * *', // end of night every day
            timeZone: 'America/Los_Angeles' 
        },

        // deactivates accounts older than 30 days
        deactivateOldUsers : {
            start : true,
            // cronTime : '23 30 00 * * *', // end of night every day
            cronTime : '09 45 30 * * *', // end of night every day
            timeZone: 'America/Los_Angeles' 
        },

        // deletes deactivated accounts older than 30 days
        deleteOldUsers : {
            start : true,
            cronTime : '23 35 00 * * *', // end of night every day
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