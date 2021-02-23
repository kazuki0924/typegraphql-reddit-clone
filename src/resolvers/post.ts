import {
	Arg,
	Ctx,
	Field,
	FieldResolver,
	InputType,
	Int,
	Mutation,
	Query,
	Resolver,
	Root,
	UseMiddleware,
} from 'type-graphql';
import { getConnection } from 'typeorm';
import { Post } from '../entities/Post';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';

@InputType()
class PostInput {
	@Field()
	title: string;

	@Field()
	text: string;
}

@Resolver(Post)
export class PostResolver {
	@FieldResolver(() => String)
	textSnippet(@Root() root: Post) {
		return root.text.slice(0, 50);
	}

	@Query(() => [Post])
	posts(
		@Arg('limit', () => Int) limit: number,
		@Arg('cursor', () => String, { nullable: true }) cursor: string | null
	): Promise<Post[]> {
		const qb = getConnection()
			.getRepository(Post)
			.createQueryBuilder('post')
			.orderBy('"createdAt"', 'DESC')
			.take(Math.min(50, limit));

		if (cursor) {
			qb.where('"createdAt" < :cursor', {
				cursor: new Date(parseInt(cursor)),
			});
		}

		return qb.getMany();
	}

	@Query(() => Post, { nullable: true })
	post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
		return Post.findOne(id);
	}

	@Mutation(() => Post, { nullable: true })
	@UseMiddleware(isAuth)
	createPost(
		@Arg('input') input: PostInput,
		@Ctx() { req }: MyContext
	): Promise<Post> {
		return Post.create({ ...input, creatorId: req.session.userId }).save();
	}

	@Mutation(() => Post, { nullable: true })
	async updatePost(
		@Arg('id') id: number,
		@Arg('title', () => String, { nullable: true }) title: string
	): Promise<Post | null> {
		// const post = await em.findOne(Post, { id });
		const post = await Post.findOne(id);
		if (!post) {
			return null;
		}
		if (typeof title !== 'undefined') {
			// post.title = title;
			// await em.persistAndFlush(post);
			await Post.update({ id }, { title });
		}
		return post;
	}

	@Mutation(() => Boolean)
	async deletePost(
		@Arg('id') id: number
		// @Ctx() { em }: MyContext
	): Promise<boolean> {
		try {
			// await em.nativeDelete(Post, { id });
			await Post.delete(id);
		} catch (err) {
			return false;
		}
		return true;
	}
}
