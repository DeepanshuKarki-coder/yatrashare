import { db, DatabaseClient } from '../models/db';

export interface ReviewRecord {
  id: string;
  journey_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  role_as: string;
  rating: number;
  comment: string;
  categories: string; // JSON string
  created_at: string;
}

export class ReviewRepository {
  async findById(id: string): Promise<ReviewRecord | null> {
    return db.queryOne<ReviewRecord>('SELECT * FROM reviews WHERE id = $1', [id]);
  }

  async findByJourneyAndReviewer(journeyId: string, reviewerId: string, reviewedUserId: string): Promise<ReviewRecord | null> {
    return db.queryOne<ReviewRecord>(
      'SELECT * FROM reviews WHERE journey_id = $1 AND reviewer_id = $2 AND reviewed_user_id = $3',
      [journeyId, reviewerId, reviewedUserId]
    );
  }

  async findByReviewedUserId(userId: string, limit: number = 20, offset: number = 0): Promise<{ reviews: any[]; total: number }> {
    const sql = `
      SELECT r.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.reviewed_user_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const countRes = await db.queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM reviews WHERE reviewed_user_id = $1', [userId]);
    const reviews = await db.query(sql, [userId, limit, offset]);
    return { reviews, total: countRes?.cnt || 0 };
  }

  async create(review: ReviewRecord, client?: DatabaseClient): Promise<ReviewRecord> {
    const runner = client || db;
    await runner.execute(
      `INSERT INTO reviews (id, journey_id, reviewer_id, reviewed_user_id, role_as, rating, comment, categories, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        review.id, review.journey_id, review.reviewer_id, review.reviewed_user_id,
        review.role_as, review.rating, review.comment, review.categories, review.created_at
      ]
    );

    const created = await runner.queryOne<ReviewRecord>('SELECT * FROM reviews WHERE id = $1', [review.id]);
    if (!created) throw new Error('Review creation failed');
    return created;
  }
}

export const reviewRepository = new ReviewRepository();
