import {
	Arg,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	Query,
	Resolver,
	UseMiddleware,
} from 'type-graphql';
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

@Resolver()
export class PostResolver {
	@Query(() => [Post])
	posts(): Promise<Post[]> {
		return Post.find();
	}

	@Query(() => Post, { nullable: true })
	post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
		return Post.findOne(id);
	}

	// @Mutation(() => Post, { nullable: true })
	// async createPost(
	// 	@Arg('title') title: string,
	// 	@Ctx() { em }: MyContext
	// ): Promise<Post | null> {
	// 	const post = em.create(Post, { title });
	// 	await em.persistAndFlush(post);
	// 	return post;
	// }

	@Mutation(() => Post, { nullable: true })
	@UseMiddleware(isAuth)
	async createPost(
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
