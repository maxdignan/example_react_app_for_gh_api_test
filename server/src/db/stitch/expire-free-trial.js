/**
 * Stitch function.
 * Find all active users who registered more than 2 weeks ago,
 * write their trial has expired to atlas.
 * CRON: 0 0 * * *
 */
exports = function() {

  const userCollection = context.services.get('mongodb-atlas').db('??').collection('users');
  
  const twoWeeksAgo = new Date(Date.now() + 12096e5);
  
  const query = {
    active: true,
    paymentError: false,
    planType: -1,
    created: { $lte: twoWeeksAgo }
  };
  
  const update = { $set: { planType: -2 }};
  
  return userCollection
    .updateMany(query, update)
    .then(res => {
      const { matchedCount, modifiedCount } = res;
      console.log(`Successfully matched ${matchedCount} and modified ${modifiedCount} items.`);
      return res;
    })
    .catch(err => console.error(`Failed to update items: ${err}`));
    
};
