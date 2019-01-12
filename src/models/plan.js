var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore');

// Plan Schema
var planSchema = new Schema({
  // PayPal API
  id: { type: String },
  name: { type: String },
  description: { type: String },
  type: { type: String },
  state: { type: String },
  create_time: { type: String },
  update_time: { type: String },
  payment_definitions: { type: Array },
  terms: { type: Array },
  merchant_preferences: { type: Schema.Types.Mixed, default: {} },
  links: { type: Array },
  snapchat: { type: String },
  price: { type: String }
}, {'usePushEach': true});

planSchema.pre('save', function (next) {
  next();
});

planSchema.statics.findOrCreate = function (newPlan, callback) {
	logger.debug('findingOrCreating plan: %s', JSON.stringify(null, 4, newPlan));
	Plan.findOne({'id':newPlan.id}, function (err, plan) {
		if (err) return callback(err);
		if (plan) {
			logger.log('Plan Found: %s|%s', plan._id, plan.id);
			return callback(null, plan);
		}
		plan = new Plan(newPlan);
		plan.save(function (err) {
			if (err) return callback(err);
			logger.log('Plan Created: %s|%s', plan._id, plan.id);
			callback(null, plan);
		});
	});
}

planSchema.set('redisCache', false);
var Plan = mongoose.model('plan', planSchema,'plan');
module.exports = Plan;