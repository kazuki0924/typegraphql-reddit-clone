import {
	Resolver,
	Query,
	Arg,
	Mutation,
	InputType,
	Field,
	Ctx,
	UseMiddleware,
	Int,
	FieldResolver,
	Root,
	ObjectType,
} from 'type-graphql';
import { Post } from '../entities/Post';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';
import { Updoot } from '../entities/Updoot';

@InputType()
class PostInput {
	@Field()
	title: string;
	@Field()
	text: string;
}

@ObjectType()
class PaginatedPosts {
	@Field(() => [Post])
	posts: Post[];
	@Field()
	hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
	@FieldResolver(() => String)
	textSnippet(@Root() post: Post) {
		return post.text.slice(0, 50);
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuth)
	async vote(
		@Arg('postId', () => Int) postId: number,
		@Arg('value', () => Int) value: number,
		@Ctx() { req }: MyContext
	) {
		const realValue = value === -1 ? -1 : 1;
		const { userId } = req.session;
		// await Updoot.insert({
		// 	userId,
		// 	postId,
		// 	value: realValue,
		// });

		const updoot = await Updoot.findOne({ where: { postId, userId } });

		if (updoot && updoot.value !== realValue) {
			await getConnection().transaction(async tm => {
				await tm.query(
					/* sql */ `
					UPDATE updoot SET value = $1
					WHERE "postId" = $2 AND "userId" = $3;
					`,
					[userId, postId, realValue]
				);

				await tm.query(
					/* sql*/ `
				UPDATE post SET points = points + $1
				WHERE id = $2;
				`,
					[2 * realValue, postId]
				);
			});
		} else if (!updoot) {
			await getConnection().transaction(async tm => {
				await tm.query(
					/* sql */ `
				INSERT INTO updoot ("userId", "postId", "value")
				VALUES ($1, $2, $3);
				`,
					[userId, postId, realValue]
				);

				await tm.query(
					/* sql*/ `
				UPDATE post SET points = points + $1
				WHERE id = $2;
				`,
					[realValue, postId]
				);
			});
		}

		// await getConnection().transaction(async tm => {
		// 	await tm.query(
		// 		/* sql*/ `
		// 	INSERT INTO updoot ("userId", "postId", "value")
		// 	VALUES ($1, $2, $3);
		// `,
		// 		[userId, postId, realValue]
		// 	);

		// 	await tm.query(
		// 		/* sql*/ `
		// 	UPDATE post SET points = points + $1
		// 	WHERE id = $2;
		// `,
		// 		[2 * realValue, postId]
		// 	);
		// });
		// await getConnection().query(
		// 	/* sql*/ `
		// 			WITH
		// START TRANSACTION,

		// INSERT INTO updoot ("userId", "postId", "value")
		// VALUES ($1, $2, $3),
		// UPDATE post SET points = points + $3
		// WHERE id = $2,
		// COMMIT;
		// `,
		// 	[userId, postId, realValue]
		// );

		return true;
	}

	@Query(() => PaginatedPosts)
	async posts(
		@Arg('limit', () => Int) limit: number,
		@Arg('cursor', () => String, { nullable: true }) cursor: string | null
	): Promise<PaginatedPosts> {
		// 20 -> 21
		const realLimit = Math.min(50, limit);
		const realLimitPlusOne = realLimit + 1;

		const replacements: Array<string | number | Date> = [realLimitPlusOne];

		if (cursor) {
			replacements.push(new Date(parseInt(cursor)));
		}

		const posts = await getConnection().query(
			/*sql*/ `
			SELECT
			_post.*,
			JSON_BUILD_OBJECT(
				'id', _user.id,
				'username', _user.username,
				'email', _user.email,
				'createdAt', _user."createdAt",
				'updatedAt', _user."updatedAt"
			) AS creator
			FROM public.post AS _post
			INNER JOIN public.user AS _user ON _user.id = _post."creatorId"
			${cursor ? /*sql*/ `WHERE _post."createdAt" < $2` : ''}
			ORDER BY _post."createdAt" DESC
			LIMIT $1
		`,
			replacements
		);

		console.log(posts);

		// const qb = getConnection()
		// 	.getRepository(Post)
		// 	.createQueryBuilder('p')
		// 	.innerJoinAndSelect('p.creator', 'u', 'u.id = p."creatorId"')
		// 	.orderBy('p."createdAt"', 'DESC')
		// 	.take(realLimitPlusOne);

		// if (cursor) {
		// 	qb.where('p."createdAt" < :cursor', {
		// 		cursor: new Date(parseInt(cursor)),
		// 	});
		// }

		// const posts = await qb.getMany();

		return {
			posts: posts.slice(0, realLimit),
			hasMore: posts.length === realLimitPlusOne,
		};
	}

	@Query(() => Post, { nullable: true })
	post(@Arg('id') id: number): Promise<Post | undefined> {
		return Post.findOne(id);
	}

	@Mutation(() => Post)
	@UseMiddleware(isAuth)
	async createPost(
		@Arg('input') input: PostInput,
		@Ctx() { req }: MyContext
	): Promise<Post> {
		return Post.create({
			...input,
			creatorId: req.session.userId,
		}).save();
	}

	@Mutation(() => Post, { nullable: true })
	async updatePost(
		@Arg('id') id: number,
		@Arg('title', () => String, { nullable: true }) title: string
	): Promise<Post | null> {
		const post = await Post.findOne(id);
		if (!post) {
			return null;
		}
		if (typeof title !== 'undefined') {
			await Post.update({ id }, { title });
		}
		return post;
	}

	@Mutation(() => Boolean)
	async deletePost(@Arg('id') id: number): Promise<boolean> {
		await Post.delete(id);
		return true;
	}
}
