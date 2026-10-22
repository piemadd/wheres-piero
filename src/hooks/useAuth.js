import { useEffect, useState } from 'react';
import { currentUser, pb, users } from '../lib/pocketbase';

export const useAuth = () => {
  const [user, setUser] = useState(currentUser);

  useEffect(() => pb.authStore.onChange(() => setUser(currentUser())), []);

  // A stored token can be revoked server-side; confirm it once on load.
  useEffect(() => {
    if (!currentUser()) return;
    users()
      .authRefresh()
      .catch((err) => {
        if ([401, 403, 404].includes(err.status)) pb.authStore.clear();
      });
  }, []);

  return user;
};
