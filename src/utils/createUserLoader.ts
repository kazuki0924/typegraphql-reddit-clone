import DataLoader from 'dataloader';
import { User } from '../entities/User';

export const createUserLoader = () =>
	new DataLoader<number, User>(async userIds => {
		const record = (await User.findByIds(userIds as number[])).reduce(
			(acc, user) => ({
				...acc,
				[user.id]: user,
			}),
			{} as Record<number, User>
		);

		return userIds.map(userId => record[userId]);
	});
