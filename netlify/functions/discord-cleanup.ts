import { channels, creationRecords, discord, expiresAt, ownedChannel } from '../lib/discord';
export default async function cleanup(): Promise<void> {
  const list = await channels();
  const records = await creationRecords();
  const expired = list.filter(channel => ownedChannel(channel, records) && expiresAt(channel.id) <= Date.now());
  // Bound each run to fit scheduled execution limits; the next run continues cleanup.
  for (const channel of expired.slice(0, 2)) await discord(`/channels/${channel.id}`, 'DELETE');
}
export const config = { schedule: '*/5 * * * *' };
