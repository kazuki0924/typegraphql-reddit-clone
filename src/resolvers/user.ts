import argon2 from 'argon2';
import {
	Arg,
	Ctx,
	Field,
	FieldResolver,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	Root,
} from 'type-graphql';
import { getConnection } from 'typeorm';
import { v4 } from 'uuid';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { User } from '../entities/User';
import { MyContext } from '../types';
import { sendEmail } from '../utils/sendEmail';
import { validateRegister } from '../utils/validateRegister';
import { UsernamePasswordInput } from './UsernamePasswordInput';

@ObjectType()
class FieldError {
	@Field()
	field: string;
	@Field()
	message: string;
}

@ObjectType()
class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User;
}

@Resolver(User)
export class UserResolver {
	@FieldResolver(() => String)
	email(@Root() user: User, @Ctx() { req }: MyContext) {
		if (req.session.userId === user.id) {
			return user.email;
		}
		return '';
	}

	@Mutation(() => UserResponse)
	async changePassword(
		@Arg('token') token: string,
		@Arg('newPassword') newPassword: string,
		@Ctx() { redis, req }: MyContext
	): Promise<UserResponse> {
		if (newPassword.length <= 2) {
			return {
				errors: [
					{
						field: 'newPassword',
						message: 'length must be greater than 2',
					},
				],
			};
		}

		const key = FORGET_PASSWORD_PREFIX + token;
		const userId = await redis.get(key);
		if (!userId) {
			return {
				errors: [
					{
						field: 'token',
						message: 'token expired',
					},
				],
			};
		}

		const parsedUserId = parseInt(userId);
		const user = await User.findOne(parsedUserId);

		if (!user) {
			return {
				errors: [
					{
						field: 'token',
						message: 'user no longer exists',
					},
				],
			};
		}

		// user.password = await argon2.hash(newPassword);

		// await em.persistAndFlush(user);
		await User.update(
			{ id: parsedUserId },
			{ password: await argon2.hash(newPassword) }
		);

		await redis.del(key);

		// login user after change password
		req.session.userId = user.id;

		return { user };
	}

	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg('email') email: string,
		@Ctx() { redis }: MyContext
	) {
		const user = await User.findOne({ where: { email } });
		if (!user) {
			return true;
		}

		const baseUrl = 'http://localhost:3000';
		const token = v4();

		await redis.set(
			FORGET_PASSWORD_PREFIX + token,
			user.id,
			'ex',
			1000 * 60 * 60 * 24 * 3
		);

		sendEmail(
			email,
			`<a href="${baseUrl}/change-password/${token}">reset password</a>`
		);
		return true;
	}

	@Query(() => User, { nullable: true })
	me(@Ctx() { req }: MyContext) {
		if (!req.session.userId) {
			return null;
		}

		// const user = await em.findOne(User, { id: req.session.userId });
		return User.findOne(req.session.userId);
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg('options') options: UsernamePasswordInput,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const errors = validateRegister(options);
		if (errors) {
			return { errors };
		}

		const hashedPassword = await argon2.hash(options.password);
		// const user = em.create(User, {
		// 	username: options.username,
		// 	password: hashedPassword,
		// });

		let user;
		try {
			// await em.persistAndFlush(user);
			// const res = await (em as EntityManager)
			// 	.createQueryBuilder(User)
			// 	.getKnexQuery()
			// 	.insert({
			// 		username: options.username,
			// 		password: hashedPassword,
			// 		email: options.email,
			// 		created_at: new Date(),
			// 		updated_at: new Date(),
			// 	})
			// 	.returning('*');
			// user = res[0];
			const insertRes = await getConnection()
				.createQueryBuilder()
				.insert()
				.into(User)
				.values({
					username: options.username,
					password: hashedPassword,
					email: options.email,
				})
				.returning('*')
				.execute();
			user = insertRes.raw[0];
		} catch (err) {
			console.error(err);
			if (err.detail.includes('already exists')) {
				// duplicate username error
				return {
					errors: [
						{
							field: 'username',
							message: 'username already taken',
						},
					],
				};
			}
		}

		// cookie
		req.session.userId = user.id;

		return { user };
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Arg('password') password: string,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const user = await User.findOne({
			where: usernameOrEmail.includes('@')
				? { email: usernameOrEmail }
				: { username: usernameOrEmail },
		});
		if (!user)
			return {
				errors: [
					{
						field: 'usernameOrEmail',
						message: "that username doesn't exist",
					},
				],
			};

		const valid = await argon2.verify(user!.password, password);
		if (!valid)
			return {
				errors: [
					{
						field: 'password',
						message: 'incorrect password',
					},
				],
			};

		req.session!.userId = user.id;

		return { user };
	}

	@Mutation(() => Boolean)
	logout(@Ctx() { req, res }: MyContext) {
		res.clearCookie(COOKIE_NAME);
		return new Promise(resolve =>
			req.session.destroy(err => {
				if (err) {
					console.log(err);
					resolve(false);
					return;
				}

				resolve(true);
			})
		);
	}
}
