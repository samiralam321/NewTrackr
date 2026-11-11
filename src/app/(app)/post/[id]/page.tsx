import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { RightSidebar } from "@/components/layout/right-sidebar"
import { PostDetailClient } from "./post-detail-client"
import { getAuthenticatedUserAndProfile } from "@/lib/auth/get-user-profile"

export const dynamic = 'force-dynamic'

export default async function PostDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, profile } = await getAuthenticatedUserAndProfile()
  if (!user) redirect('/auth')

  const supabase = await createClient()

  // Fetch target post
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!posts_user_id_fkey(id, full_name, username, avatar_url, bio, college, consistency_score, streak),
      likes(user_id),
      comments(
        *,
        profiles(id, full_name, username, avatar_url, bio, college, consistency_score, streak)
      ),
      bookmarks(user_id)
    `)
    .eq('id', id)
    .maybeSingle()

  if (error || !post) {
    notFound()
  }

  // Fetch quoted post if present
  let quotedPost = null
  const quoteTag = post.tags?.find((t: string) => t.startsWith('quote:'))
  const quotedPostId = post.quoted_post_id || (quoteTag ? quoteTag.split('quote:')[1] : null)

  if (quotedPostId) {
    const { data: qp } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(id, full_name, username, avatar_url, bio, college, consistency_score, streak)
      `)
      .eq('id', quotedPostId)
      .maybeSingle()
    quotedPost = qp || null
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-[#000000]">
      <main className="flex-1 min-w-0 max-w-[640px] xl:max-w-[690px] 2xl:max-w-[730px] h-full overflow-y-auto no-scrollbar border-r border-[#eff3f4] dark:border-[#2f3336] flex flex-col bg-white dark:bg-[#000000] shrink-0">
        <PostDetailClient 
          initialPost={{
            ...post,
            quoted_post: quotedPost,
            quoted_post_id: quotedPostId,
            user_has_liked: post.likes?.some((l: any) => l.user_id === user.id),
            user_has_bookmarked: post.bookmarks?.some((b: any) => b.user_id === user.id),
            likes_count: post.likes?.length || 0,
            comments_count: post.comments?.length || 0,
            bookmarks_count: post.bookmarks?.length || 0
          }}
          currentUserId={user.id}
          currentUserProfile={profile}
        />
      </main>
      <RightSidebar profile={profile} currentUserId={user.id} />
    </div>
  )
}
