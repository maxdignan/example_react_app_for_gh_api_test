import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

export default (url: string) => {
  mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
  mongoose.connection.on('error', console.error.bind(console, 'database :'));
  mongoose.connection.once('open', () => {
    const out = process.env.DB ? '% environment database %' : url;
    console.log('database : connected to mongo at', out);
  });
  return mongoose.connection;
};
