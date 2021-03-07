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
					[`${updoot.userId}#${updoot.userId}`]: updoot,
				}),
				{} as Record<string, Updoot>
			);

			return keys.map(({ userId, postId }) => record[`${userId}#${postId}`]);
		}
	);

// export const createUserLoader = () =>
// 	new DataLoader<number, User>(async userIds => {
// 		const users = await User.findByIds(userIds as number[]);

// const userIdToUser: Record<number, User> = {};

// users.forEach(user => {
// 	userIdToUser[user.id] = user;
// });

// 	return userIds.map(userId => userIdToUser[userId]);
// });
