import DataLoader from 'dataloader';
import { Updoot } from '../entities/Updoot';

export const createUpdootLoader = () =>
	new DataLoader<{ postId: number; userId: number }, Updoot | null>(
		async keys => {
			const record = (
				await Updoot.findByIds(keys as { postId: number; userId: number }[])
			).reduce(
				(acc, updoot) => ({
					...acc,
					[`${updoot.userId}#${updoot.postId}`]: updoot,
				}),
				{} as Record<string, Updoot>
			);

			return keys.map(({ userId, postId }) => record[`${userId}#${postId}`]);
		}
	);
