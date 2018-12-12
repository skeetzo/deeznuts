
module.exports = function() {
  var self = this;

  // Emails
  if (!this.gmail_user||!this.gmail_password) 
    return console.log('Missing Gmail Config- Skipping Email Setup');

  // Account Created
  this.email_account_created = function() {
    return {
      to: self.email_self,
      from: 'Support - '+self.siteName+' <support@'+self.domainEmail+'>',
      subject: 'Account Created!',
      text: '<p>' + 'A new account has been created!' + '</p>'
          + '<br>'
          + self.email_footer
    }
  }

  // Video Purchased
  this.email_video_purchased = function(video) {
    var amount = ((parseInt(video.price, 10) / 60) / self.conversionRate);
    return {
      to: self.email_self,
      from: 'Support - '+self.siteName+' <support@'+self.domainEmail+'>',
      subject: 'Video Purchased!',
      text: '<p>' + 'The video <strong>'+video.title+'</strong> has been purchased for: $<strong>'+video.price+'</strong></p>'
          + '<br>'
          + self.email_footer
    }
  }

  // Transaction Confirmed
  this.email_transaction_confirmed = function(transaction) {
    return {
      to: self.email_self,
      from: 'Support - '+self.siteName+' <support@'+self.domainEmail+'>',conversionRate
      subject: 'Transaction Confirmed!',
      text: '<p>' + 'A transaction has been confirmed for: <strong>'+transaction.value+'</strong> BTC / $<strong>'+transaction.value_in_dollars+'</strong> or <strong>'+(transaction.value_in_dollars*(self.conversionRate*60))+'</strong> seconds </p>'
          + '<br>'
          + self.email_footer
    }
  }

  // Please Ignore if not Requested
  this.email_footer_ignore = "<p><small>If you did not request this change, please ignore this email.</small></p>"
  // Footer
  this.email_footer = "<p><small><a href=\"//"+this.domain+"\">"+this.title+"</a> &copy; 2018</small></p>";

  // Testing
  this.email_test_address = this.gmail_user;
  this.email_tests = [
    {
      function: "email_account_created",
      data: null
    },
    {
      function: "email_video_purchased",
      data: {'title':'your mom','price':15}
    },
    {
      function: "email_transaction_confirmed",
      data: {'value':'1000000','value_in_dollars':15}
    }
  ];
}