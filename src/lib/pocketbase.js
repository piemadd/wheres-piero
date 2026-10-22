import PocketBase from 'pocketbase';

export const USERS_COLLECTION = 'users_wheres_piero';
export const DATA_COLLECTION = 'wheres_piero';

export const pb = new PocketBase('https://pb.amtraker.com');

// React StrictMode double-runs effects; without this the SDK cancels the first
// of two identical in-flight requests and it surfaces as an error.
pb.autoCancellation(false);

export const users = () => pb.collection(USERS_COLLECTION);
export const positions = () => pb.collection(DATA_COLLECTION);

export const currentUser = () =>
  pb.authStore.isValid && pb.authStore.record?.collectionName === USERS_COLLECTION
    ? pb.authStore.record
    : null;

const getNewestRecord = async () => {
  try {
    const res = await positions().getList(1, 1, { sort: '-created' });
    return res.items[0] ?? null;
  } catch (err) {
    // Collections without a `created` autodate field reject that sort.
    if (err.status !== 400) throw err;
    const res = await positions().getList(1, 1, { sort: '-@rowid' });
    return res.items[0] ?? null;
  }
};

const readFileField = async (record) => {
  const value = record.file;

  const token = await pb.files.getToken();
  const res = await fetch(pb.files.getURL(record, value, { token }));
  if (!res.ok) throw new Error(`Couldn't download ${value} (HTTP ${res.status})`);
  return res.json();
};

export const fetchLatest = async () => {
  const record = await getNewestRecord();
  if (!record) return { record: null, data: null };
  return { record, data: await readFileField(record) };
};
