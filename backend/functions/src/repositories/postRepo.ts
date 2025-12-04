import {Timestamp} from "firebase-admin/firestore";
import {db} from "../config/firebase";
import {Post, PostData, PostType, PostVisibility} from "../types/post";
import {encodeCursor, decodeCursor} from "../utils/pagination";

const POSTS_COLLECTION = "posts";

export interface PostFilter {
  type?: PostType;
  authorUserId?: string;
  visibilities?: PostVisibility[];
  query?: string;
}

export class PostRepo {
  private collection = db.collection(POSTS_COLLECTION);

  async createPost(data: PostData): Promise<Post> {
    const docRef = await this.collection.add(data);
    const snapshot = await docRef.get();
    const stored = snapshot.data() as Omit<Post, "id">;
    return {id: docRef.id, ...stored};
  }

  async updatePost(id: string, data: Partial<Post>): Promise<void> {
    await this.collection.doc(id).set(
      {
        ...data,
        updatedAt: Timestamp.now(),
      },
      {merge: true}
    );
  }

  async deletePost(id: string): Promise<void> {
    await this.collection.doc(id).set(
      {
        isDeleted: true,
        updatedAt: Timestamp.now(),
      },
      {merge: true}
    );
  }

  async findById(id: string): Promise<Post | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() as Omit<Post, "id"> & {isDeleted?: boolean};
    if (data.isDeleted) return null;
    return {id: doc.id, ...data};
  }

  async listPosts(
    filter: PostFilter,
    limit: number,
    cursor?: string
  ): Promise<{posts: Post[]; nextCursor: string | null}> {
    let query: FirebaseFirestore.Query = this.collection.where("isDeleted", "==", false);

    if (filter.type) {
      query = query.where("type", "==", filter.type);
    }
    if (filter.authorUserId) {
      query = query.where("authorUserId", "==", filter.authorUserId);
    }
    if (filter.visibilities && filter.visibilities.length > 0) {
      query = query.where("visibility", "in", filter.visibilities);
    }

    query = query.orderBy("createdAt", "desc").orderBy("__name__", "desc");
    const decoded = decodeCursor(cursor);
    if (decoded && typeof decoded.val === "number") {
      query = query.startAfter(Timestamp.fromMillis(decoded.val), decoded.id);
    }

    const snapshot = await query.limit(limit).get();
    let posts = snapshot.docs.map((doc) => {
      const stored = doc.data() as Omit<Post, "id">;
      return {id: doc.id, ...stored};
    });
    if (filter.query) {
      const q = filter.query.toLowerCase();
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          (post.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    }
    const last = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor =
      last && last.exists
        ? encodeCursor(
            (last.data() as Omit<Post, "id">).createdAt.toMillis(),
            last.id
          )
        : null;
    return {posts, nextCursor};
  }
}
