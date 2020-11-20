import mongoose from 'mongoose';
import fn from './database';

describe('database', () => {

  const url = 'db://mongodb';

  beforeEach(() => {
    mongoose.connect = jest.fn();
  });

  it('connects to the database', () => {
    fn(url);
    expect(mongoose.connect).toHaveBeenCalledWith(url);
  });

  it('returns a mongodb connection', () => {
    const res = fn(url);
    expect(res).toBeInstanceOf(mongoose.Connection);
  });

});