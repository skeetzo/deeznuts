
module.exports = function() {
  var self = this;

  // Emails
  if (!this.gmail_user||!this.gmail_password) 
    return console.log('Missing Gmail Config- Skipping Email Setup');

  // Please Ignore if not Requested
  // var footer_ignore = "<p><small>If you did not request this change, please ignore this email.</small></p>"
  // Footer
  // var footer = "<p><small><a href=\"//"+this.domain+"\">"+this.title+"</a> &copy; 2018</small></p>";
  // var support = 'Support - '+self.title+' <support@'+this.email_domain+'>';

  // Account Created
  this.email_account_created = function() {
    return {
      to: self.email_self,
      from: 'Support - '+self.botName+' <support@'+self.siteTitle+'>',
      subject: 'Account Created!',
      text: '<p>' + 'A new account has been created!' + '</p>'
          + '<br>'
          + self.email_footer
    }
  }

  // Video Purchased
  this.email_video_purchased = function(video) {
    var amount = Math.round(((parseInt(video.price, 10) / 60) / self.conversionRate) * 100) / 100;
    return {
      to: self.email_self,
      from: 'Support - '+self.botName+' <support@'+self.siteTitle+'>',
      subject: 'Video Purchased!',
      text: '<p>' + 'The video <strong>'+video.title+'</strong> has been purchased for: $<strong>'+amount+'</strong></p>'
          + '<br>'
          + self.email_footer
    }
  }

  // Transaction Confirmed
  // unused
  this.email_transaction_confirmed = function(transaction) {
    return {
      to: self.email_self,
      from: 'Support - '+self.botName+' <support@'+self.siteTitle+'>',
      subject: 'Transaction Confirmed!',
      text: '<p>' + 'A transaction has been confirmed for: <strong>'+transaction.value+'</strong> BTC / $<strong>'+transaction.value_in_dollars+'</strong> or <strong>'+(transaction.value_in_dollars*self.conversionRate)+'</strong> seconds </p>'
          + '<br>'
          + self.email_footer
    }
  }

  // Please Ignore if not Requested
  this.email_footer_ignore = "<p><small>If you did not request this change, please ignore this email.</small></p>"
  // Footer
  this.email_footer = "<p><small><a href=\"//"+this.siteTitle+"\">"+this.title+"</a> &copy; 2018</small></p>";

  // Testing
  this.email_test_address = this.gmail_user;
  this.email_tests = [
    {
      function: "email_account_created",
      data: null
    },
    {
      function: "email_video_purchased",
      data: {'title':'your mom','price':Math.round(900)}
    },
    {
      function: "email_transaction_confirmed",
      data: {'value':'.0045','value_in_dollars':15}
    }
  ];
}