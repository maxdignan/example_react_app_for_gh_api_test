import { get } from 'https';

/**
 * Simple wrapper around internal https get.
 */
export const httpsGet = <T>(url: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    get(url, res => {
      if (res.statusCode !== 200) {
        reject(res.statusCode.toString());
      }

      let raw = '';
      res.on('data', d => (raw += d));

      res.on('end', () => {
        let data: T;
        try {
          data = JSON.parse(raw);
        } catch (err) {
          // console.log('http : error parsing data :', data);
          reject(err);
        }
        resolve(data);
      });

      res.on('error', err => reject(err.message));
    });
  });
};
